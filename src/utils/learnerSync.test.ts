import { describe, expect, it, vi } from "vitest";
import {
  BACKOFF_BASE_MS, DEBOUNCE_MS, createLearnerSync, metaKey, migratedKey, queueKey,
  type LearnerSyncDeps, type PullResult, type PushResult, type StateRow,
} from "./learnerSync";

/* The learner state sync (src/utils/learnerSync.ts) with a fake server,
   storage, clock and timers, so every path runs in node without Supabase. */

class Store {
  map = new Map<string, string>();
  get length() { return this.map.size; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  json(k: string) { return JSON.parse(this.map.get(k) ?? "null"); }
}

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const T0 = Date.parse("2026-11-04T10:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString();

/** A fake learner_state table with the server's "newer wins" trigger. */
function fakeServer() {
  const rows = new Map<string, StateRow & { user_id: string }>();
  return {
    rows,
    put(user: string, r: StateRow) {
      const k = `${user}|${r.kind}|${r.key}`;
      const old = rows.get(k);
      if (old && Date.parse(r.updated_at) < Date.parse(old.updated_at)) return;
      rows.set(k, { ...r, user_id: user });
    },
    of(user: string) { return [...rows.values()].filter((r) => r.user_id === user); },
    get(user: string, kind: string, key: string) { return rows.get(`${user}|${kind}|${key}`); },
  };
}

function setup(opts: {
  pull?: (uid: string) => PullResult | Promise<PullResult>;
  push?: (uid: string, rows: StateRow[]) => PushResult | Promise<PushResult>;
  store?: Store;
} = {}) {
  let clock = T0;
  const timers: { fn: () => void; ms: number }[] = [];
  const store = opts.store ?? new Store();
  const server = fakeServer();
  const win = new EventTarget();
  const debug = vi.fn();
  const pull = vi.fn(async (uid: string) => (opts.pull ? opts.pull(uid) : { rows: server.of(uid).map(({ user_id: _u, ...r }) => r), error: null }));
  const push = vi.fn(async (uid: string, rows: StateRow[]) => {
    if (opts.push) return opts.push(uid, rows);
    rows.forEach((r) => server.put(uid, r));
    return { error: null };
  });
  const deps: LearnerSyncDeps = {
    pull, push,
    storage: () => store,
    now: () => clock,
    setTimer: (fn, ms) => { const t = { fn, ms }; timers.push(t); return t; },
    clearTimer: (t) => { const i = timers.indexOf(t as never); if (i >= 0) timers.splice(i, 1); },
    idle: (fn) => fn(),
    debug,
    win,
    doc: null,
  };
  const sync = createLearnerSync(deps);
  const tick = (ms: number) => { clock += ms; };
  /** Runs the timers that are due, then lets the sends finish. */
  async function runTimers() {
    const due = timers.splice(0);
    due.forEach((t) => t.fn());
    for (let i = 0; i < 10; i++) await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
  }
  return { sync, store, server, pull, push, timers, debug, win, tick, runTimers, now: () => clock };
}

describe("merge on sign-in", () => {
  it("joins sets: cards, proverbs and known words from both sides stay", async () => {
    const t = setup();
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["aldar_kose"]));
    t.store.setItem(`ertegi_maqals_${A}`, JSON.stringify([3]));
    t.store.setItem(`ertegi_known_${A}`, JSON.stringify(["cunning"]));
    t.server.put(A, { kind: "card", key: "zhirenshe", value: true, updated_at: iso(T0 - 1000) });
    t.server.put(A, { kind: "maqal", key: "7", value: true, updated_at: iso(T0 - 1000) });
    t.server.put(A, { kind: "known_word", key: "brave", value: true, updated_at: iso(T0 - 1000) });
    const seen = vi.fn();
    t.sync.subscribe(seen);

    await t.sync.setUser(A);
    expect(t.store.json(`ertegi_cards_${A}`).sort()).toEqual(["aldar_kose", "zhirenshe"]);
    expect(t.store.json(`ertegi_maqals_${A}`).sort()).toEqual([3, 7]);
    expect(t.store.json(`ertegi_known_${A}`).sort()).toEqual(["brave", "cunning"]);
    expect(seen).toHaveBeenCalledTimes(1);

    await t.runTimers();
    expect(t.server.get(A, "card", "aldar_kose")?.value).toBe(true);
    expect(t.server.get(A, "maqal", "3")?.value).toBe(true);
    expect(t.server.get(A, "known_word", "cunning")?.value).toBe(true);
    expect(t.store.getItem(queueKey(A))).toBeNull();
  });

  it("records: the newer one wins on each side", async () => {
    const t = setup();
    // Device: q1 changed at T0-1h (newer), q2 at T0-3h (older than the server's).
    t.store.setItem(`ertegi_council_${A}`, JSON.stringify({ q1: { first: 1, done: true }, q2: { first: 0, done: false } }));
    t.store.setItem(metaKey(A), JSON.stringify({ "council_vote|q1": T0 - 3600_000, "council_vote|q2": T0 - 3 * 3600_000 }));
    t.server.put(A, { kind: "council_vote", key: "q1", value: { first: 2, done: false }, updated_at: iso(T0 - 2 * 3600_000) });
    t.server.put(A, { kind: "council_vote", key: "q2", value: { first: 3, done: true }, updated_at: iso(T0 - 2 * 3600_000) });

    await t.sync.setUser(A);
    const local = t.store.json(`ertegi_council_${A}`);
    expect(local.q1).toEqual({ first: 1, done: true });
    expect(local.q2).toEqual({ first: 3, done: true });
    await t.runTimers();
    expect(t.server.get(A, "council_vote", "q1")?.value).toEqual({ first: 1, done: true });
    expect(t.server.get(A, "council_vote", "q2")?.value).toEqual({ first: 3, done: true });
  });

  it("data from before the update (no time on the device) loses to the server's copy", async () => {
    const t = setup();
    t.store.setItem(`ertegi_debate_${A}_2026-11-03`, JSON.stringify({ side: "no", text: "old" }));
    t.server.put(A, { kind: "debate", key: "2026-11-03", value: { side: "yes", text: "from the phone" }, updated_at: iso(T0 - 86400_000) });
    await t.sync.setUser(A);
    expect(t.store.json(`ertegi_debate_${A}_2026-11-03`)).toEqual({ side: "yes", text: "from the phone" });
  });

  it("trail revisions from two devices both stay, in time order; a saved draft's removal syncs", async () => {
    const t = setup();
    const mine = { level: "A2", choice: "yes", claim: "laptop", at: "2026-11-02T09:00:00.000Z" };
    const theirs = { level: "A2", choice: "no", claim: "phone", at: "2026-11-01T09:00:00.000Z" };
    t.store.setItem(`ertegi_trail_${A}`, JSON.stringify({ aldar_kose: [mine] }));
    t.store.setItem(`ertegi_trail_draft_${A}_aldar_kose_A2`, JSON.stringify({ step: 2, claim: "half" }));
    t.store.setItem(metaKey(A), JSON.stringify({ "trail|aldar_kose|2026-11-02T09:00:00.000Z": T0 - 5000, "trail_draft|aldar_kose|A2": T0 - 5000 }));
    t.server.put(A, { kind: "trail", key: `aldar_kose|${theirs.at}`, value: theirs, updated_at: theirs.at });
    t.server.put(A, { kind: "trail_draft", key: "aldar_kose|A2", value: null, updated_at: iso(T0 - 1000) });

    await t.sync.setUser(A);
    expect(t.store.json(`ertegi_trail_${A}`).aldar_kose.map((x: { claim: string }) => x.claim)).toEqual(["phone", "laptop"]);
    expect(t.store.getItem(`ertegi_trail_draft_${A}_aldar_kose_A2`)).toBeNull();
    await t.runTimers();
    expect(t.server.get(A, "trail", `aldar_kose|${mine.at}`)?.value).toEqual(mine);
  });

  it("does not re-render screens when the server had nothing new", async () => {
    const t = setup();
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["aldar_kose"]));
    const seen = vi.fn();
    t.sync.subscribe(seen);
    await t.sync.setUser(A);
    expect(seen).not.toHaveBeenCalled();
    expect(t.sync.version()).toBe(0);
  });
});

describe("one-time migration", () => {
  it("sends everything the device had on the first sign-in, and sets the flag", async () => {
    const t = setup();
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["aldar_kose", "alpamys"]));
    t.store.setItem(`ertegi_council_${A}`, JSON.stringify({ q1: { first: 1 } }));
    t.store.setItem(`ertegi_debate_${A}_2026-11-02`, JSON.stringify({ side: "yes" }));
    await t.sync.setUser(A);
    expect(t.store.getItem(migratedKey(A))).toBe("1");
    await t.runTimers();
    expect(t.server.of(A).map((r) => `${r.kind}|${r.key}`).sort()).toEqual(
      ["card|aldar_kose", "card|alpamys", "council_vote|q1", "debate|2026-11-02"],
    );
    expect(t.push).toHaveBeenCalledTimes(1); // one batch
  });

  it("when the server can't be read on that first sign-in, the device data is queued anyway", async () => {
    const t = setup({ pull: () => ({ rows: null, error: { message: "Failed to fetch" }, status: 0 }) });
    t.store.setItem(`ertegi_known_${A}`, JSON.stringify(["brave"]));
    await t.sync.setUser(A);
    expect(t.store.json(queueKey(A))).toEqual(["known_word|brave"]);
    expect(t.store.getItem(migratedKey(A))).toBe("1");
    expect(t.store.json(`ertegi_known_${A}`)).toEqual(["brave"]); // nothing lost, nothing shown
  });

  it("is not repeated: the next sign-in only sends what changed", async () => {
    const t = setup();
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["aldar_kose"]));
    await t.sync.setUser(A);
    await t.runTimers();
    await t.sync.setUser(null);
    t.push.mockClear();
    await t.sync.setUser(A);
    await t.runTimers();
    expect(t.push).not.toHaveBeenCalled();
  });
});

describe("guest and other users", () => {
  it("a guest stays on localStorage only", async () => {
    const t = setup();
    t.store.setItem("ertegi_cards_guest", JSON.stringify(["aldar_kose"]));
    t.sync.noteChange(undefined, "card", "aldar_kose");
    await t.sync.setUser(null);
    await t.runTimers();
    expect(t.pull).not.toHaveBeenCalled();
    expect(t.push).not.toHaveBeenCalled();
    expect([...t.store.map.keys()]).toEqual(["ertegi_cards_guest"]);
  });

  it("two learners on one browser never mix", async () => {
    const t = setup();
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["aldar_kose"]));
    t.store.setItem(`ertegi_cards_${B}`, JSON.stringify(["alpamys"]));
    t.server.put(B, { kind: "card", key: "zhirenshe", value: true, updated_at: iso(T0) });
    await t.sync.setUser(A);
    await t.runTimers();
    await t.sync.setUser(B);
    await t.runTimers();
    expect(t.store.json(`ertegi_cards_${A}`)).toEqual(["aldar_kose"]);
    expect(t.store.json(`ertegi_cards_${B}`).sort()).toEqual(["alpamys", "zhirenshe"]);
    expect(t.server.of(A).map((r) => r.key)).toEqual(["aldar_kose"]);
    expect(t.server.of(B).map((r) => r.key).sort()).toEqual(["alpamys", "zhirenshe"]);
  });

  it("a pull that returns after a switch to another learner is ignored", async () => {
    let release: (r: PullResult) => void = () => {};
    const t = setup({ pull: (uid) => (uid === A ? new Promise((r) => { release = r; }) : { rows: [], error: null }) });
    const first = t.sync.setUser(A);
    await t.sync.setUser(B);
    release({ rows: [{ kind: "card", key: "aldar_kose", value: true, updated_at: iso(T0) }], error: null });
    await first;
    expect(t.store.getItem(`ertegi_cards_${A}`)).toBeNull();
    expect(t.store.getItem(`ertegi_cards_${B}`)).toBeNull();
  });
});

describe("no table on the server", () => {
  it.each([
    [{ code: "PGRST205", message: "Could not find the table 'public.learner_state'" }, 404],
    [{ code: "42P01", message: "relation does not exist" }, 400],
    [{ message: "Not Found" }, 404],
  ])("works from localStorage as before (%o)", async (error, status) => {
    const t = setup({ pull: () => ({ rows: null, error, status }) });
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["aldar_kose"]));
    await t.sync.setUser(A);
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["aldar_kose", "alpamys"]));
    t.sync.noteChange(A, "card", "alpamys");
    t.tick(DEBOUNCE_MS);
    await t.runTimers();
    expect(t.push).not.toHaveBeenCalled();
    expect(t.sync.status().disabled).toBe(true);
    expect(t.debug).toHaveBeenCalledTimes(1);
    expect(t.store.json(`ertegi_cards_${A}`)).toEqual(["aldar_kose", "alpamys"]);
    // Not marked as migrated: the data goes up once the migration is applied.
    expect(t.store.getItem(migratedKey(A))).toBeNull();
  });

  it("stops sending when the upsert finds no table, and keeps the queue", async () => {
    const t = setup({ push: () => ({ error: { code: "PGRST205" }, status: 404 }) });
    await t.sync.setUser(A);
    t.store.setItem(`ertegi_known_${A}`, JSON.stringify(["brave"]));
    t.sync.noteChange(A, "known_word", "brave");
    await t.runTimers();
    expect(t.sync.status().disabled).toBe(true);
    expect(t.store.json(queueKey(A))).toEqual(["known_word|brave"]);
  });
});

describe("offline queue and batching", () => {
  it("waits for a pause, then sends the changes in one upsert", async () => {
    const t = setup();
    await t.sync.setUser(A);
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["a", "b"]));
    t.sync.noteChange(A, "card", "a");
    t.sync.noteChange(A, "card", "b");
    t.sync.noteChange(A, "card", "b");
    expect(t.timers.map((x) => x.ms)).toEqual([DEBOUNCE_MS]);
    expect(t.push).not.toHaveBeenCalled();
    await t.runTimers();
    expect(t.push).toHaveBeenCalledTimes(1);
    expect(t.push.mock.calls[0][1].map((r: StateRow) => r.key)).toEqual(["a", "b"]);
  });

  it("offline: keeps the queue on the device, backs off, sends when the network is back", async () => {
    let online = false;
    const t = setup({
      push: () => (online ? { error: null } : { error: { message: "TypeError: Failed to fetch" }, status: 0 }),
    });
    await t.sync.setUser(A);
    t.store.setItem(`ertegi_council_${A}`, JSON.stringify({ q1: { first: 2 } }));
    t.sync.noteChange(A, "council_vote", "q1");
    await t.runTimers();
    expect(t.push).toHaveBeenCalledTimes(1);
    expect(t.store.json(queueKey(A))).toEqual(["council_vote|q1"]);
    expect(t.sync.status().failures).toBe(1);
    expect(t.sync.status().retryAt).toBe(t.now() + BACKOFF_BASE_MS);

    // A reload while offline: the queue is still on the device.
    const again = setup({ store: t.store, push: () => ({ error: null }) });
    online = true;
    await again.sync.setUser(A);
    await again.runTimers();
    expect(again.push).toHaveBeenCalled();
    expect(again.store.getItem(queueKey(A))).toBeNull();

    // The 'online' event sends at once.
    t.win.dispatchEvent(new Event("online"));
    await t.runTimers();
    expect(t.store.getItem(queueKey(A))).toBeNull();
  });

  it("a change made while a send is out stays queued", async () => {
    let release: (r: PushResult) => void = () => {};
    const t = setup({ push: () => new Promise((r) => { release = r; }) });
    await t.sync.setUser(A);
    t.store.setItem(`ertegi_council_${A}`, JSON.stringify({ q1: { first: 1 } }));
    t.sync.noteChange(A, "council_vote", "q1");
    const sending = t.sync.flush(true);
    await Promise.resolve();
    t.store.setItem(`ertegi_council_${A}`, JSON.stringify({ q1: { first: 2 } }));
    t.sync.noteChange(A, "council_vote", "q1");
    release({ error: null });
    await sending;
    expect(t.store.json(queueKey(A))).toEqual(["council_vote|q1"]);
  });

  it("an item too big for the server stays on the device and leaves the queue", async () => {
    const t = setup();
    await t.sync.setUser(A);
    t.store.setItem(`ertegi_debate_${A}_2026-11-04`, JSON.stringify({ text: "ә".repeat(3000) }));
    t.sync.noteChange(A, "debate", "2026-11-04");
    await t.runTimers();
    expect(t.push).not.toHaveBeenCalled();
    expect(t.store.getItem(queueKey(A))).toBeNull();
    expect(t.store.getItem(`ertegi_debate_${A}_2026-11-04`)).not.toBeNull();
  });

  it("a row the server refuses is dropped, the others still go", async () => {
    const t = setup({
      push: (_uid, rows) => (rows.some((r) => r.key === "bad") ? { error: { code: "23514" }, status: 400 } : { error: null }),
    });
    await t.sync.setUser(A);
    t.store.setItem(`ertegi_cards_${A}`, JSON.stringify(["ok", "bad"]));
    t.sync.noteChange(A, "card", "ok");
    t.sync.noteChange(A, "card", "bad");
    await t.runTimers();
    expect(t.push).toHaveBeenCalledTimes(3);
    expect(t.store.getItem(queueKey(A))).toBeNull();
  });

  it("sends a removed draft as null", async () => {
    const t = setup();
    await t.sync.setUser(A);
    t.store.setItem(`ertegi_trail_draft_${A}_er_tostik_B1`, JSON.stringify({ step: 1 }));
    t.sync.noteChange(A, "trail_draft", "er_tostik|B1");
    await t.runTimers();
    expect(t.server.get(A, "trail_draft", "er_tostik|B1")?.value).toEqual({ step: 1 });
    t.tick(1000);
    t.store.removeItem(`ertegi_trail_draft_${A}_er_tostik_B1`);
    t.sync.noteChange(A, "trail_draft", "er_tostik|B1");
    await t.runTimers();
    expect(t.server.get(A, "trail_draft", "er_tostik|B1")?.value).toBeNull();
  });
});
