import { supabase } from "../lib/supabase";
import { CONTENT_VERSION } from "../data/contentVersion";
import { RESEARCH_MODE, STUDY_ID } from "../research/mode";
import { readStudyCode, researchContext } from "../research/studyCode";
import { readAssent } from "../research/assent";

/* Learning events in the spirit of xAPI (migration 20261105000000_learning_events,
   dictionary docs/events.md). track() is synchronous and never throws: it puts
   the event in a queue on the device (localStorage, so another tab and the
   next visit see it) and returns. The queue goes to the server in batches when
   the browser is idle, when the page is hidden or closed, and when the network
   comes back. Facts only: never a text the learner wrote, only its length.

   Nothing here touches React state, so tracking never re-renders a screen.
   A guest (no signed-in learner) and a teacher are not tracked. If the table
   is not there yet (migration not applied), sending stops for this visit with
   one console.debug, and the queue stays capped at QUEUE_LIMIT. */

/** Verbs; the same list is the check in the migration and the table in docs/events.md (events.test.ts). */
export const EVENT_VERBS = [
  "session_start",
  "story_open",
  "level_complete",
  "word_tap",
  "audio_play",
  "quiz_answer",
  "quiz_complete",
  "srs_review",
  "word_save",
  "daily_words_seen",
  "daily_word_known",
  "council_vote",
  "trail_entry",
  "debate_entry",
  "shoqan_open",
  "shoqan_message",
  "pronunciation_attempt",
  "test_answer",
  "test_complete",
] as const;
export type Verb = (typeof EVENT_VERBS)[number];

type Value = string | number | boolean | null | undefined | string[];
export interface EventPayload {
  object_type?: string;
  object_id?: string | number | null;
  story_id?: string | null;
  level?: string | null;
  /** Small facts: correct, score, attempt, duration_ms, counts. No learner text. */
  result?: Record<string, Value>;
}
export interface EventRow {
  client_id: string;
  verb: Verb;
  object_type: string | null;
  object_id: string | null;
  story_id: string | null;
  level: string | null;
  result: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  occurred_at: string;
}
type SendError = { code?: string; message?: string; status?: number } | null;
export type SendResult = { error: SendError; status?: number };

export const QUEUE_LIMIT = 500;
export const BATCH_SIZE = 50;
/** Wait to gather a batch before sending; sooner once a batch is full. */
export const FLUSH_DELAY_MS = 15_000;
export const FULL_BATCH_DELAY_MS = 1_000;
export const BACKOFF_BASE_MS = 5_000;
export const BACKOFF_MAX_MS = 5 * 60_000;
/** Batches sent in one go; the rest waits for the next turn. */
const MAX_BATCHES_PER_FLUSH = 10;

export const queueKey = (userId: string) => `ertegi_events_queue_${userId}`;

type Listen = { addEventListener: (type: string, fn: () => void) => void };
export interface EventLogDeps {
  send: (rows: (EventRow & { user_id: string })[]) => PromiseLike<SendResult>;
  storage?: () => Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
  /** Runs fn when the browser is idle. */
  idle?: (fn: () => void) => void;
  context?: (userId: string) => Record<string, unknown>;
  newId?: () => string;
  debug?: (msg: string) => void;
  win?: Listen | null;
  doc?: (Listen & { visibilityState?: string }) | null;
}

export type Failure = "missing" | "data" | "retry";
/** missing: the table is not there (migration not applied); data: a row the
    table refuses (check, type); retry: network, sign-in, server trouble. */
export function classifySendError(error: SendError, status?: number): Failure {
  const code = error?.code ?? "";
  const st = error?.status ?? status ?? 0;
  if (code === "PGRST205" || code === "42P01" || code === "PGRST204" || st === 404) return "missing";
  if (code.startsWith("22") || code.startsWith("23")) return "data";
  return "retry";
}

const cut = (v: unknown, n: number): string | null => (v === undefined || v === null || v === "" ? null : String(v).slice(0, n));

function cleanResult(r: Record<string, Value> | undefined): Record<string, unknown> | null {
  if (!r) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) {
    if (v === undefined) continue;
    if (typeof v === "number") out[k] = Number.isFinite(v) ? v : null;
    else if (typeof v === "string") out[k] = v.slice(0, 80);
    else if (Array.isArray(v)) out[k] = v.slice(0, 10).map((x) => String(x).slice(0, 40));
    else out[k] = v;
  }
  if (!Object.keys(out).length) return null;
  // The server refuses 2000 bytes and more; a row that big would hold the queue back.
  return JSON.stringify(out).length > 1500 ? { truncated: true } : out;
}

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));

export function createEventLog(deps: EventLogDeps) {
  const now = deps.now ?? Date.now;
  const setTimer = deps.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((t: unknown) => clearTimeout(t as ReturnType<typeof setTimeout>));
  const idle = deps.idle ?? ((fn: () => void) => setTimeout(fn, 1));
  const newId = deps.newId ?? randomId;
  const debug = deps.debug ?? (() => {});

  let uid: string | null = null;
  // Used only when localStorage is blocked: the queue then lives as long as the page.
  const memory = new Map<string, EventRow[]>();
  let timer: unknown = null;
  let timerAt = 0;
  let flushing = false;
  let disabled = false;
  let failures = 0;
  let retryAt = 0;
  let listening = false;
  const started = new Set<string>();

  const store = () => {
    try { return deps.storage ? deps.storage() : null; } catch { return null; }
  };
  function read(user: string): EventRow[] {
    const s = store();
    if (s) {
      try {
        const v = JSON.parse(s.getItem(queueKey(user)) || "[]");
        return Array.isArray(v) ? v : [];
      } catch { /* blocked or broken: fall back to memory */ }
    }
    return memory.get(user) ?? [];
  }
  function write(user: string, rows: EventRow[]) {
    const kept = rows.length > QUEUE_LIMIT ? rows.slice(-QUEUE_LIMIT) : rows;
    memory.set(user, kept);
    const s = store();
    if (!s) return;
    try {
      if (kept.length) s.setItem(queueKey(user), JSON.stringify(kept));
      else s.removeItem(queueKey(user));
    } catch { /* storage full or blocked: memory keeps it for this visit */ }
  }

  function schedule(delay: number) {
    if (!uid || disabled) return;
    const wait = Math.max(delay, retryAt - now(), 0);
    // A turn already set for sooner stays; a later one is brought forward (a full batch).
    if (timer !== null) {
      if (timerAt <= now() + wait) return;
      clearTimer(timer);
    }
    timerAt = now() + wait;
    timer = setTimer(() => {
      timer = null;
      idle(() => { void flush(); });
    }, wait);
  }

  async function flush(force = false): Promise<void> {
    const user = uid;
    if (!user || disabled || flushing) return;
    if (!force && now() < retryAt) { schedule(0); return; }
    flushing = true;
    try {
      for (let n = 0; n < MAX_BATCHES_PER_FLUSH; n++) {
        const batch = read(user).slice(0, BATCH_SIZE);
        if (!batch.length) break;
        const done = new Set<string>();
        let res: SendResult;
        try {
          res = await deps.send(batch.map((r) => ({ ...r, user_id: user })));
        } catch (e) {
          res = { error: { message: e instanceof Error ? e.message : String(e) } };
        }
        let failure: Failure | null = res.error ? classifySendError(res.error, res.status) : null;
        if (!failure) batch.forEach((r) => done.add(r.client_id));
        if (failure === "data") {
          // One row the table refuses must not hold back the rest: send one
          // by one and drop only the refused ones.
          failure = null;
          for (const r of batch) {
            let one: SendResult;
            try { one = await deps.send([{ ...r, user_id: user }]); } catch { one = { error: { message: "network" } }; }
            const f = one.error ? classifySendError(one.error, one.status) : null;
            if (f && f !== "data") { failure = f; break; }
            done.add(r.client_id);
          }
        }
        // Remove exactly what was handled: another tab may have changed the queue meanwhile.
        if (done.size) write(user, read(user).filter((r) => !done.has(r.client_id)));
        if (failure === "missing") {
          disabled = true;
          debug("[events] learning_events is not on the server yet; events stay on this device");
          return;
        }
        if (failure === "retry") {
          failures += 1;
          retryAt = now() + Math.min(BACKOFF_BASE_MS * 2 ** (failures - 1), BACKOFF_MAX_MS);
          return;
        }
        failures = 0;
        retryAt = 0;
        if (uid !== user) return;
      }
    } finally {
      flushing = false;
      if (uid && !disabled && read(uid).length) schedule(failures ? 0 : FLUSH_DELAY_MS);
    }
  }

  const sendNow = () => { void flush(true); };
  function listen() {
    if (listening) return;
    listening = true;
    try {
      deps.win?.addEventListener("online", () => { failures = 0; retryAt = 0; sendNow(); });
      deps.win?.addEventListener("pagehide", sendNow);
      deps.doc?.addEventListener("visibilitychange", () => { if (deps.doc?.visibilityState === "hidden") sendNow(); });
    } catch { /* no window (tests, server) */ }
  }

  function track(verb: Verb, payload: EventPayload = {}): void {
    try {
      const user = uid;
      if (!user) return;
      const row: EventRow = {
        client_id: newId(),
        verb,
        object_type: cut(payload.object_type, 40),
        object_id: cut(payload.object_id, 200),
        story_id: cut(payload.story_id, 80),
        level: cut(payload.level, 10),
        result: cleanResult(payload.result),
        context: deps.context ? deps.context(user) : null,
        occurred_at: new Date(now()).toISOString(),
      };
      const rows = read(user);
      rows.push(row);
      write(user, rows);
      schedule(rows.length >= BATCH_SIZE ? FULL_BATCH_DELAY_MS : FLUSH_DELAY_MS);
    } catch { /* tracking must never break the app */ }
  }

  /** The signed-in learner, or null for a guest, a teacher, or after sign-out. */
  function setUser(next: string | null) {
    if (next === uid) return;
    if (timer !== null) { clearTimer(timer); timer = null; }
    uid = next;
    failures = 0;
    retryAt = 0;
    if (!next) { memory.clear(); return; }
    listen();
    // One session_start per learner per page load (React's dev double mount included).
    if (!started.has(next)) { started.add(next); track("session_start"); }
    else if (read(next).length) schedule(FLUSH_DELAY_MS);
  }

  return {
    track,
    setUser,
    flush,
    /** For tests: queue length and state. */
    pending: () => (uid ? read(uid).length : 0),
    status: () => ({ uid, disabled, failures, retryAt, scheduled: timer !== null, flushing }),
  };
}

/* --- the app's own log --- */

// Vercel sets the commit at build time; package.json gives the version (vite.config.ts).
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";

let classCache: { uid: string; at: number; id: string | null } | null = null;
/** The class id, when the learner is in exactly one class (the cached list
 *  from useMyClasses). Also used by the Steppe council for class numbers. */
export function classIdOf(userId: string): string | null {
  const t = Date.now();
  if (classCache && classCache.uid === userId && t - classCache.at < 60_000) return classCache.id;
  let id: string | null = null;
  try {
    const list = JSON.parse(localStorage.getItem(`ertegi_my_classes_${userId}`) || "null");
    if (Array.isArray(list) && list.length === 1 && typeof list[0]?.class_id === "string") id = list[0].class_id;
  } catch { /* storage blocked */ }
  classCache = { uid: userId, at: t, id };
  return id;
}

const hasWindow = typeof window !== "undefined";
const log = createEventLog({
  send: (rows) => supabase.from("learning_events").upsert(rows, { onConflict: "user_id,client_id", ignoreDuplicates: true }),
  storage: () => (typeof localStorage === "undefined" ? null : localStorage),
  idle: (fn) => {
    if (hasWindow && "requestIdleCallback" in window) window.requestIdleCallback(() => fn(), { timeout: 5000 });
    else setTimeout(fn, 1);
  },
  context: (userId) => {
    const ctx: Record<string, unknown> = { app_version: APP_VERSION, content_version: CONTENT_VERSION };
    const lang = typeof document !== "undefined" ? document.documentElement.lang : "";
    if (lang) ctx.lang = lang;
    const classId = classIdOf(userId);
    if (classId) ctx.class_id = classId;
    // R4: the research build marks every event with the study and the participant code.
    if (RESEARCH_MODE) {
      const st = typeof localStorage === "undefined" ? null : localStorage;
      Object.assign(ctx, researchContext(STUDY_ID, readStudyCode(st, userId), readAssent(st, userId)?.version));
    }
    return ctx;
  },
  debug: (msg) => console.debug(msg),
  win: hasWindow ? window : null,
  doc: typeof document !== "undefined" ? document : null,
});

/** Records one learning event. Synchronous, never throws, never re-renders. */
export const track = log.track;
/** Called by the app with the learner's id; null for guests, teachers and on sign-out. */
export const setEventsUser = log.setUser;
export const flushEvents = () => log.flush(true);
