import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  BACKOFF_BASE_MS, BATCH_SIZE, EVENT_VERBS, FLUSH_DELAY_MS, FULL_BATCH_DELAY_MS, QUEUE_LIMIT,
  classifySendError, createEventLog, queueKey, type EventLogDeps, type SendResult,
} from "./events";

/* The event queue (src/utils/events.ts) with a fake server, clock, timers
   and window, so every path runs in node without Supabase. */

class Store {
  map = new Map<string, string>();
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
}

function setup(over: Partial<EventLogDeps> = {}, reply: (rows: { client_id: string }[]) => SendResult | Promise<SendResult> = () => ({ error: null })) {
  let clock = Date.parse("2026-11-04T10:00:00Z");
  const timers: { fn: () => void; ms: number }[] = [];
  const store = new Store();
  const sent: { client_id: string; user_id: string; verb: string }[][] = [];
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const debug = vi.fn();
  let n = 0;
  const send = vi.fn(async (rows: { client_id: string; user_id: string; verb: string }[]) => {
    sent.push(rows);
    return reply(rows);
  });
  const log = createEventLog({
    send,
    storage: () => store,
    now: () => clock,
    setTimer: (fn, ms) => { const t = { fn, ms }; timers.push(t); return t; },
    clearTimer: (t) => { const i = timers.indexOf(t as (typeof timers)[number]); if (i >= 0) timers.splice(i, 1); },
    idle: (fn) => fn(),
    newId: () => `id-${++n}`,
    context: () => ({ app_version: "test", content_version: "2026-11-04" }),
    debug,
    win,
    doc,
    ...over,
  });
  const runTimers = async () => {
    while (timers.length) timers.shift()!.fn();
    await new Promise((r) => setTimeout(r, 0));
  };
  return {
    log, store, sent, send, timers, win, doc, debug, runTimers,
    tick: (ms: number) => { clock += ms; },
    queue: (uid = "u1") => JSON.parse(store.getItem(queueKey(uid)) || "[]") as { client_id: string; verb: string; object_id: string | null; result: Record<string, unknown> | null }[],
  };
}

describe("track", () => {
  it("a guest is never tracked: nothing stored, nothing sent", async () => {
    const t = setup();
    t.log.track("word_tap", { object_id: "steppe" });
    await t.log.flush(true);
    expect(t.store.map.size).toBe(0);
    expect(t.send).not.toHaveBeenCalled();
  });

  it("queues synchronously in localStorage with its own client_id and the context", () => {
    const t = setup();
    t.log.setUser("u1");
    t.log.track("quiz_answer", { object_type: "quiz_question", object_id: 3, story_id: "aldar_kose", level: "A2", result: { correct: true, attempt: 1, duration_ms: 4200 } });
    const q = t.queue();
    expect(q.map((e) => e.verb)).toEqual(["session_start", "quiz_answer"]);
    expect(q[1]).toMatchObject({ client_id: "id-2", object_id: "3", result: { correct: true, attempt: 1, duration_ms: 4200 }, context: { app_version: "test" } });
    expect(new Set(q.map((e) => e.client_id)).size).toBe(2);
  });

  it("never throws: blocked storage, a broken context, odd values", () => {
    const t = setup({
      storage: () => { throw new Error("blocked"); },
      context: () => { throw new Error("boom"); },
    });
    t.log.setUser("u1");
    expect(() => t.log.track("word_tap", { result: { n: NaN, s: "x".repeat(500), list: Array(50).fill("w") } })).not.toThrow();
    // @ts-expect-error a verb outside the list from untyped code
    expect(() => t.log.track("nope", null)).not.toThrow();
  });

  it("keeps working in memory when localStorage is blocked", async () => {
    const t = setup({ storage: () => null });
    t.log.setUser("u1");
    t.log.track("word_tap", { object_id: "fox" });
    expect(t.log.pending()).toBe(2);
    await t.log.flush(true);
    expect(t.sent[0].map((r) => r.verb)).toEqual(["session_start", "word_tap"]);
    expect(t.log.pending()).toBe(0);
  });

  it("cuts long values and replaces an oversized result", () => {
    const t = setup();
    t.log.setUser("u1");
    t.log.track("word_tap", { object_id: "w".repeat(500), result: { a: "x".repeat(200) } });
    const many: Record<string, string> = {};
    for (let i = 0; i < 40; i++) many[`k${i}`] = "y".repeat(80);
    t.log.track("word_tap", { result: many });
    const [, a, b] = t.queue();
    expect(a.object_id).toHaveLength(200);
    expect(a.result!.a).toHaveLength(80);
    expect(b.result).toEqual({ truncated: true });
  });

  it(`keeps at most ${QUEUE_LIMIT} events: the oldest go first`, () => {
    const t = setup();
    t.log.setUser("u1");
    for (let i = 0; i < QUEUE_LIMIT + 20; i++) t.log.track("word_tap", { object_id: `w${i}` });
    const q = t.queue();
    expect(q).toHaveLength(QUEUE_LIMIT);
    expect(q[q.length - 1].object_id).toBe(`w${QUEUE_LIMIT + 19}`);
    expect(q.some((e) => e.verb === "session_start")).toBe(false);
  });

  it("one session_start per learner per page load", () => {
    const t = setup();
    t.log.setUser("u1");
    t.log.setUser(null);
    t.log.setUser("u1");
    expect(t.queue().filter((e) => e.verb === "session_start")).toHaveLength(1);
  });

  it("each learner has their own queue; after sign-out nothing is tracked", () => {
    const t = setup();
    t.log.setUser("u1");
    t.log.track("word_tap");
    t.log.setUser("u2");
    t.log.track("word_save");
    t.log.setUser(null);
    t.log.track("word_tap");
    expect(t.queue("u1").map((e) => e.verb)).toEqual(["session_start", "word_tap"]);
    expect(t.queue("u2").map((e) => e.verb)).toEqual(["session_start", "word_save"]);
  });
});

describe("sending", () => {
  it(`waits ${FLUSH_DELAY_MS / 1000} s in idle time, sooner once a batch of ${BATCH_SIZE} is full`, async () => {
    const t = setup();
    t.log.setUser("u1");
    expect(t.timers.map((x) => x.ms)).toEqual([FLUSH_DELAY_MS]);
    expect(t.send).not.toHaveBeenCalled();
    for (let i = 0; i < BATCH_SIZE; i++) t.log.track("word_tap");
    expect(t.timers.map((x) => x.ms)).toEqual([FULL_BATCH_DELAY_MS]);
    await t.runTimers();
    expect(t.send).toHaveBeenCalled();
  });

  it(`sends in batches of ${BATCH_SIZE} with the learner's id, then empties the queue`, async () => {
    const t = setup();
    t.log.setUser("u1");
    for (let i = 0; i < 119; i++) t.log.track("word_tap", { object_id: `w${i}` });
    await t.log.flush(true);
    expect(t.sent.map((b) => b.length)).toEqual([50, 50, 20]);
    expect(t.sent.flat().every((r) => r.user_id === "u1")).toBe(true);
    expect(new Set(t.sent.flat().map((r) => r.client_id)).size).toBe(120);
    expect(t.store.getItem(queueKey("u1"))).toBeNull();
  });

  it("a lost reply resends the same client_ids, so the server stores each event once", async () => {
    let fail = true;
    const t = setup({}, () => {
      if (fail) throw new TypeError("Failed to fetch");
      return { error: null };
    });
    t.log.setUser("u1");
    t.log.track("word_tap");
    await t.log.flush(true);
    expect(t.log.pending()).toBe(2);
    fail = false;
    await t.log.flush(true);
    expect(t.sent[1].map((r) => r.client_id)).toEqual(t.sent[0].map((r) => r.client_id));
    expect(t.log.pending()).toBe(0);
  });

  it("backs off after network errors and starts over when the network is back", async () => {
    const t = setup({}, () => ({ error: { message: "Failed to fetch" } }));
    t.log.setUser("u1");
    await t.log.flush();
    expect(t.send).toHaveBeenCalledTimes(1);
    expect(t.log.status().retryAt).toBe(Date.parse("2026-11-04T10:00:00Z") + BACKOFF_BASE_MS);
    // The next turn waits out the pause; too early, nothing is sent.
    expect(t.timers.map((x) => x.ms)).toEqual([BACKOFF_BASE_MS]);
    await t.log.flush();
    expect(t.send).toHaveBeenCalledTimes(1);
    t.tick(BACKOFF_BASE_MS);
    await t.log.flush();
    expect(t.send).toHaveBeenCalledTimes(2);
    expect(t.log.status().failures).toBe(2);
    expect(t.log.status().retryAt - Date.parse("2026-11-04T10:00:05Z")).toBe(BACKOFF_BASE_MS * 2);
    // Network back: try at once.
    t.win.dispatchEvent(new Event("online"));
    await new Promise((r) => setTimeout(r, 0));
    expect(t.send).toHaveBeenCalledTimes(3);
    expect(t.log.pending()).toBe(1);
  });

  it.each([
    [{ error: { code: "PGRST205", message: "Could not find the table 'public.learning_events'" } }],
    [{ error: { code: "42P01", message: "relation does not exist" } }],
    [{ error: { message: "Not Found" }, status: 404 }],
  ])("no table on the server (%j): sending stops quietly for the visit", async (reply) => {
    const t = setup({}, () => reply);
    t.log.setUser("u1");
    await t.log.flush(true);
    await t.log.flush(true);
    t.win.dispatchEvent(new Event("pagehide"));
    expect(t.send).toHaveBeenCalledTimes(1);
    expect(t.debug).toHaveBeenCalledTimes(1);
    expect(t.log.status().disabled).toBe(true);
    // The queue stays capped and nothing is scheduled.
    t.timers.length = 0;
    for (let i = 0; i < QUEUE_LIMIT + 50; i++) t.log.track("word_tap");
    expect(t.log.pending()).toBe(QUEUE_LIMIT);
    expect(t.timers).toHaveLength(0);
  });

  it("a row the table refuses is dropped alone; the rest go through", async () => {
    const t = setup({}, (rows) =>
      rows.length > 1 || rows[0].client_id === "id-2" ? { error: { code: "23514", message: "check violation" } } : { error: null });
    t.log.setUser("u1");
    t.log.track("word_tap");
    t.log.track("word_tap");
    await t.log.flush(true);
    expect(t.sent.map((b) => b.length)).toEqual([3, 1, 1, 1]);
    expect(t.log.pending()).toBe(0);
  });

  it("sends when the page is hidden or closed", async () => {
    const t = setup();
    t.log.setUser("u1");
    t.win.dispatchEvent(new Event("pagehide"));
    await new Promise((r) => setTimeout(r, 0));
    expect(t.send).toHaveBeenCalledTimes(1);
    t.log.track("word_tap");
    t.doc.visibilityState = "hidden";
    t.doc.dispatchEvent(new Event("visibilitychange"));
    await new Promise((r) => setTimeout(r, 0));
    expect(t.send).toHaveBeenCalledTimes(2);
    expect(t.log.pending()).toBe(0);
  });

  it("classifies server answers", () => {
    expect(classifySendError({ code: "PGRST205" })).toBe("missing");
    expect(classifySendError({ message: "x" }, 404)).toBe("missing");
    expect(classifySendError({ code: "23505" })).toBe("data");
    expect(classifySendError({ code: "22P02" })).toBe("data");
    expect(classifySendError({ code: "PGRST301" }, 401)).toBe("retry");
    expect(classifySendError({ message: "Failed to fetch" })).toBe("retry");
  });
});

/* One list of verbs in three places: the code, the check in the migration,
   and the dictionary in docs/events.md. */
describe("verbs agree everywhere", () => {
  const root = join(__dirname, "..", "..");
  // The newest migration that sets the verb check (20261105000000 made it, later ones widen it).
  const migDir = join(root, "supabase", "migrations");
  const verbCheck = /verb\s+text\s+not null check \(verb in \(([\s\S]*?)\)\)|learning_events_verb_check check \(verb in \(([\s\S]*?)\)\)/;
  const migration = readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort()
    .map((f) => readFileSync(join(migDir, f), "utf8")).filter((t) => verbCheck.test(t)).pop() ?? "";
  const doc = readFileSync(join(root, "docs", "events.md"), "utf8");
  const code = [...EVENT_VERBS].sort();

  it("migration check = EVENT_VERBS", () => {
    const check = migration.match(verbCheck);
    expect(check, "verb check in the migration").not.toBeNull();
    const sqlVerbs = [...(check![1] ?? check![2]).matchAll(/'(\w+)'/g)].map((m) => m[1]).sort();
    expect(sqlVerbs).toEqual(code);
  });

  it("docs/events.md has one table row per verb", () => {
    const table = doc.split("## Словарь событий")[1]?.split("\n## ")[0] ?? "";
    const docVerbs = [...table.matchAll(/^\| `(\w+)` \|/gm)].map((m) => m[1]).sort();
    expect(docVerbs).toEqual(code);
  });

  it("every verb is tracked somewhere in the app, and only listed verbs are", () => {
    const srcDir = join(root, "src");
    const files: string[] = [];
    const walk = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name) && !e.name.includes(".test.")) files.push(p);
      }
    };
    walk(srcDir);
    const used = new Set<string>();
    for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/\btrack\("(\w+)"/g)) used.add(m[1]);
    expect([...used].sort()).toEqual(code);
  });
});
