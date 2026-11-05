import { useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { supabase } from "../lib/supabase";
import { classifySendError, type Failure } from "./events";

/* Learner state that used to live only on the device (R3; migration
   20261106000000_learner_state, table public.learner_state): legend cards,
   proverbs, "I know it" words, council votes, Thinking Trail entries and
   drafts, debate answers.

   The device stays first: every screen keeps writing its localStorage key
   exactly as before and then calls noteChange(). That marks the item in a
   small queue on the device (localStorage, so a reload or a lost network
   does not lose it), and the queue goes to the server as one upsert after a
   short pause, when the browser is idle, when the page is hidden, and when
   the network comes back.

   On sign-in the server copy is read once and merged into the device:
   sets (cards, proverbs, known words) are joined, so nothing is lost;
   records (a vote, a debate answer, a trail, a draft) keep the newer one by
   updated_at. Items only on the device are sent up; the first sign-in after
   this update sends everything the device has (flag ertegi_state_migrated_<uid>).

   A guest (no user id) stays on localStorage only. Keys carry the user id, so
   two learners on one browser never mix. If the table is not there yet
   (migration not applied) or the server can't be reached, nothing is shown
   to the learner: the app works from localStorage as before. Screens
   re-read their state only when a merge actually changed something. */

export const KINDS = ["card", "maqal", "known_word", "council_vote", "debate", "trail", "trail_draft", "study_code", "study_assent"] as const;
export type Kind = (typeof KINDS)[number];

export interface StateRow { kind: Kind; key: string; value: unknown; updated_at: string }
type SendError = { code?: string; message?: string; status?: number } | null;
export interface PullResult { rows: StateRow[] | null; error: SendError; status?: number }
export interface PushResult { error: SendError; status?: number }
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
type Listen = { addEventListener: (type: string, fn: () => void) => void };

export const DEBOUNCE_MS = 4_000;
export const BATCH_SIZE = 200;
export const BACKOFF_BASE_MS = 5_000;
export const BACKOFF_MAX_MS = 5 * 60_000;
/** The table refuses 4096 bytes and more; such an item stays on the device. */
export const MAX_VALUE_BYTES = 4_000;

export const metaKey = (uid: string) => `ertegi_state_meta_${uid}`;
export const queueKey = (uid: string) => `ertegi_state_queue_${uid}`;
export const migratedKey = (uid: string) => `ertegi_state_migrated_${uid}`;

/* --- where each kind lives on the device (the keys the screens already use) --- */

const SETS = new Set<Kind>(["card", "maqal", "known_word"]);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function readJson(s: Store, k: string): unknown {
  try { return JSON.parse(s.getItem(k) || "null"); } catch { return null; }
}
function writeJson(s: Store, k: string, v: unknown) {
  try { s.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ }
}
function keysWithPrefix(s: Store, prefix: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k && k.startsWith(prefix)) out.push(k);
  }
  return out;
}

interface Adapter {
  /** Every item of this kind on the device: key → value. */
  read: (s: Store, uid: string) => Map<string, unknown>;
  /** Puts these items on the device; null removes one (records only). */
  write: (s: Store, uid: string, items: Map<string, unknown>) => void;
}

function listAdapter(name: string, toKey: (x: unknown) => string | null, fromKey: (k: string) => unknown): Adapter {
  const lsKey = (uid: string) => `ertegi_${name}_${uid}`;
  const list = (s: Store, uid: string) => {
    const v = readJson(s, lsKey(uid));
    return Array.isArray(v) ? v : [];
  };
  return {
    read: (s, uid) => {
      const m = new Map<string, unknown>();
      for (const x of list(s, uid)) {
        const k = toKey(x);
        if (k) m.set(k, true);
      }
      return m;
    },
    write: (s, uid, items) => {
      const all = list(s, uid);
      const have = new Set(all.map(toKey));
      for (const [k, v] of items) {
        if (v === null || have.has(k)) continue;
        const x = fromKey(k);
        if (x !== null) { all.push(x); have.add(k); }
      }
      writeJson(s, lsKey(uid), all);
    },
  };
}

function recordAdapter(name: string): Adapter {
  const lsKey = (uid: string) => `ertegi_${name}_${uid}`;
  const rec = (s: Store, uid: string) => {
    const v = readJson(s, lsKey(uid));
    return isObj(v) ? v : {};
  };
  return {
    read: (s, uid) => new Map(Object.entries(rec(s, uid))),
    write: (s, uid, items) => {
      const all = rec(s, uid);
      for (const [k, v] of items) {
        if (v === null) delete all[k];
        else all[k] = v;
      }
      writeJson(s, lsKey(uid), all);
    },
  };
}

/** One localStorage key per item: ertegi_<name>_<uid>_<suffix>. */
function perKeyAdapter(name: string, toSuffix: (key: string) => string | null, fromSuffix: (suffix: string) => string | null): Adapter {
  const prefix = (uid: string) => `ertegi_${name}_${uid}_`;
  return {
    read: (s, uid) => {
      const m = new Map<string, unknown>();
      for (const lk of keysWithPrefix(s, prefix(uid))) {
        const key = fromSuffix(lk.slice(prefix(uid).length));
        const v = readJson(s, lk);
        if (key && isObj(v)) m.set(key, v);
      }
      return m;
    },
    write: (s, uid, items) => {
      for (const [k, v] of items) {
        const suffix = toSuffix(k);
        if (!suffix) continue;
        try {
          if (v === null) s.removeItem(prefix(uid) + suffix);
          else s.setItem(prefix(uid) + suffix, JSON.stringify(v));
        } catch { /* storage full or blocked */ }
      }
    },
  };
}

/* Thinking Trail: ertegi_trail_<uid> is { tale: Trail[] }. Each revision is
   one item keyed "<tale>|<at>", so revisions made on two devices both stay. */
const trailAdapter: Adapter = {
  read: (s, uid) => {
    const m = new Map<string, unknown>();
    const all = readJson(s, `ertegi_trail_${uid}`);
    if (!isObj(all)) return m;
    for (const [tale, list] of Object.entries(all)) {
      if (!Array.isArray(list)) continue;
      for (const t of list) if (isObj(t) && typeof t.at === "string") m.set(`${tale}|${t.at}`, t);
    }
    return m;
  },
  write: (s, uid, items) => {
    const raw = readJson(s, `ertegi_trail_${uid}`);
    const all: Record<string, Record<string, unknown>[]> = isObj(raw) ? (raw as Record<string, Record<string, unknown>[]>) : {};
    for (const [k, v] of items) {
      const cut = k.lastIndexOf("|");
      if (cut <= 0) continue;
      const tale = k.slice(0, cut);
      const at = k.slice(cut + 1);
      const list = (Array.isArray(all[tale]) ? all[tale] : []).filter((t) => !(isObj(t) && t.at === at));
      if (isObj(v)) list.push(v);
      list.sort((a, b) => String(a.at).localeCompare(String(b.at)));
      if (list.length) all[tale] = list;
      else delete all[tale];
    }
    writeJson(s, `ertegi_trail_${uid}`, all);
  },
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const ADAPTERS: Record<Kind, Adapter> = {
  card: listAdapter("cards", (x) => (typeof x === "string" && x ? x : null), (k) => k),
  maqal: listAdapter(
    "maqals",
    (x) => (typeof x === "number" && Number.isInteger(x) ? String(x) : null),
    (k) => (/^\d+$/.test(k) ? Number(k) : null),
  ),
  known_word: listAdapter("known", (x) => (typeof x === "string" && x ? x : null), (k) => k),
  council_vote: recordAdapter("council"),
  // ertegi_study_code_<uid> = { code: { code, at } } (research build, src/research/studyCode.ts)
  study_code: recordAdapter("study_code"),
  // ertegi_study_assent_<uid> = { assent: { version, answer, at, sample } } (research build, src/research/assent.ts)
  study_assent: recordAdapter("study_assent"),
  trail: trailAdapter,
  // ertegi_debate_<uid>_<day>
  debate: perKeyAdapter("debate", (k) => (DAY.test(k) ? k : null), (sfx) => (DAY.test(sfx) ? sfx : null)),
  // ertegi_trail_draft_<uid>_<tale>_<level>; the tale id has underscores, the level does not.
  trail_draft: perKeyAdapter(
    "trail_draft",
    (k) => {
      const cut = k.lastIndexOf("|");
      return cut > 0 ? `${k.slice(0, cut)}_${k.slice(cut + 1)}` : null;
    },
    (sfx) => {
      const cut = sfx.lastIndexOf("_");
      return cut > 0 ? `${sfx.slice(0, cut)}|${sfx.slice(cut + 1)}` : null;
    },
  ),
};

/* --- the sync engine (no React, no Supabase: tested in node) --- */

export interface LearnerSyncDeps {
  /** All of the learner's rows (the app pages through them). */
  pull: (uid: string) => PromiseLike<PullResult>;
  /** Upserts on (user_id, kind, key). */
  push: (uid: string, rows: StateRow[]) => PromiseLike<PushResult>;
  storage?: () => Store | null;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
  idle?: (fn: () => void) => void;
  debug?: (msg: string) => void;
  win?: Listen | null;
  doc?: (Listen & { visibilityState?: string }) | null;
}

const id = (kind: Kind, key: string) => `${kind}|${key}`;
function splitId(s: string): [Kind, string] | null {
  const cut = s.indexOf("|");
  const kind = s.slice(0, cut) as Kind;
  return cut > 0 && (KINDS as readonly string[]).includes(kind) ? [kind, s.slice(cut + 1)] : null;
}
const bytes = (v: unknown) => {
  const t = JSON.stringify(v) ?? "null";
  return typeof TextEncoder === "undefined" ? t.length * 2 : new TextEncoder().encode(t).length;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function createLearnerSync(deps: LearnerSyncDeps) {
  const now = deps.now ?? Date.now;
  const setTimer = deps.setTimer ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? ((t: unknown) => clearTimeout(t as ReturnType<typeof setTimeout>));
  const idle = deps.idle ?? ((fn: () => void) => setTimeout(fn, 1));
  const debug = deps.debug ?? (() => {});

  let uid: string | null = null;
  let timer: unknown = null;
  let flushing = false;
  let disabled = false;
  let failures = 0;
  let retryAt = 0;
  let listening = false;
  let version = 0;
  let generation = 0;
  const subscribers = new Set<() => void>();

  const store = (): Store | null => {
    try { return deps.storage ? deps.storage() : null; } catch { return null; }
  };
  const readMeta = (s: Store, user: string): Record<string, number> => {
    const v = readJson(s, metaKey(user));
    return isObj(v) ? (v as Record<string, number>) : {};
  };
  const readQueue = (s: Store, user: string): string[] => {
    const v = readJson(s, queueKey(user));
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  };
  const writeQueue = (s: Store, user: string, q: string[]) => {
    try {
      if (q.length) s.setItem(queueKey(user), JSON.stringify(q));
      else s.removeItem(queueKey(user));
    } catch { /* storage blocked */ }
  };

  function schedule(delay: number) {
    if (!uid || disabled) return;
    if (timer !== null) clearTimer(timer);
    const wait = Math.max(delay, retryAt - now(), 0);
    timer = setTimer(() => {
      timer = null;
      idle(() => { void flush(); });
    }, wait);
  }

  /** The learner changed an item on the device (already written to localStorage). Never throws. */
  function noteChange(user: string | undefined | null, kind: Kind, key: string) {
    try {
      if (!user) return; // guest: device only
      const s = store();
      if (!s) return;
      const k = id(kind, key);
      if (!SETS.has(kind)) {
        const meta = readMeta(s, user);
        // Strictly increasing, so a change in the same millisecond as a sent one still counts as new.
        meta[k] = Math.max(now(), (meta[k] ?? 0) + 1);
        writeJson(s, metaKey(user), meta);
      }
      const q = readQueue(s, user);
      if (!q.includes(k)) { q.push(k); writeQueue(s, user, q); }
      if (user === uid) schedule(DEBOUNCE_MS);
    } catch { /* sync must never break the app */ }
  }

  async function flush(force = false): Promise<void> {
    const user = uid;
    const s = store();
    if (!user || !s || disabled || flushing) return;
    if (!force && now() < retryAt) { schedule(0); return; }
    flushing = true;
    try {
      const queue = readQueue(s, user);
      if (!queue.length) return;
      const meta = readMeta(s, user);
      const local = new Map<Kind, Map<string, unknown>>();
      const valueOf = (kind: Kind, key: string) => {
        if (!local.has(kind)) local.set(kind, ADAPTERS[kind].read(s, user));
        return local.get(kind)!.get(key);
      };
      const rows: { qid: string; ts: number | undefined; row: StateRow }[] = [];
      const drop = new Set<string>();
      for (const qid of queue) {
        const parts = splitId(qid);
        if (!parts) { drop.add(qid); continue; }
        const [kind, key] = parts;
        const v = valueOf(kind, key);
        if (SETS.has(kind) && v === undefined) { drop.add(qid); continue; }
        const value = v === undefined ? null : v;
        if (bytes(value) >= MAX_VALUE_BYTES || key.length > 200) {
          debug(`[learnerSync] ${qid} is too big for the server; it stays on this device`);
          drop.add(qid);
          continue;
        }
        const ts = SETS.has(kind) ? undefined : meta[qid];
        rows.push({ qid, ts, row: { kind, key, value, updated_at: new Date(ts ?? now()).toISOString() } });
      }
      let failure: Failure | null = null;
      for (let i = 0; i < rows.length && !failure; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        let res: PushResult;
        try { res = await deps.push(user, batch.map((r) => r.row)); } catch (e) { res = { error: { message: e instanceof Error ? e.message : String(e) } }; }
        failure = res.error ? classifySendError(res.error, res.status) : null;
        if (failure === "data") {
          // One refused row must not hold back the rest.
          failure = null;
          for (const r of batch) {
            let one: PushResult;
            try { one = await deps.push(user, [r.row]); } catch { one = { error: { message: "network" } }; }
            const f = one.error ? classifySendError(one.error, one.status) : null;
            if (f && f !== "data") { failure = f; break; }
            drop.add(r.qid);
            if (f === "data") debug(`[learnerSync] the server refused ${r.qid}`);
          }
        } else if (!failure) {
          batch.forEach((r) => drop.add(r.qid));
        }
      }
      // Remove what was sent, unless it changed again while the request was out.
      const metaNow = readMeta(s, user);
      writeQueue(s, user, readQueue(s, user).filter((q) => !drop.has(q) || metaNow[q] !== meta[q]));
      if (failure === "missing") {
        disabled = true;
        debug("[learnerSync] learner_state is not on the server yet; progress stays on this device");
        return;
      }
      if (failure === "retry") {
        failures += 1;
        retryAt = now() + Math.min(BACKOFF_BASE_MS * 2 ** (failures - 1), BACKOFF_MAX_MS);
        return;
      }
      failures = 0;
      retryAt = 0;
    } finally {
      flushing = false;
      if (uid && !disabled && s && readQueue(s, uid).length) schedule(failures ? 0 : DEBOUNCE_MS);
    }
  }

  /** Merges the server rows into the device. Returns true when the device changed. */
  function merge(s: Store, user: string, rows: StateRow[]): boolean {
    const meta = readMeta(s, user);
    const queue = new Set(readQueue(s, user));
    const server = new Map<Kind, Map<string, StateRow>>();
    for (const r of rows) {
      if (!(KINDS as readonly string[]).includes(r.kind) || typeof r.key !== "string") continue;
      if (!server.has(r.kind)) server.set(r.kind, new Map());
      server.get(r.kind)!.set(r.key, r);
    }
    let changed = false;
    let metaChanged = false;
    for (const kind of KINDS) {
      const adapter = ADAPTERS[kind];
      const local = adapter.read(s, user);
      const remote = server.get(kind) ?? new Map<string, StateRow>();
      const apply = new Map<string, unknown>();
      if (SETS.has(kind)) {
        // Union: what the server has comes down, what only the device has goes up.
        for (const [k, r] of remote) if (r.value !== null && !local.has(k)) apply.set(k, true);
        for (const k of local.keys()) if (!remote.has(k)) queue.add(id(kind, k));
      } else {
        for (const k of new Set([...local.keys(), ...remote.keys()])) {
          const qid = id(kind, k);
          const r = remote.get(k);
          const serverTs = r ? Date.parse(r.updated_at) || 0 : -1;
          const localTs = local.has(k) || meta[qid] !== undefined ? meta[qid] ?? 0 : -1;
          if (serverTs > localTs) {
            // The server's copy is newer (or the device's has no time: from before R3).
            const value = r!.value ?? null;
            if (!same(local.get(k) ?? null, value)) apply.set(k, value);
            meta[qid] = serverTs;
            metaChanged = true;
            queue.delete(qid);
          } else if (localTs > serverTs) {
            // The device's copy is newer, or the server does not have it yet.
            if (meta[qid] === undefined) { meta[qid] = now(); metaChanged = true; }
            queue.add(qid);
          }
        }
      }
      if (apply.size) {
        adapter.write(s, user, apply);
        changed = true;
      }
    }
    if (metaChanged) writeJson(s, metaKey(user), meta);
    writeQueue(s, user, [...queue]);
    return changed;
  }

  /** First sign-in after the update and the server could not be read: send all the device has.
      A record from before R3 has no time; it goes up with time 0, so (as in merge()) it never
      overwrites a newer copy another device already sent: the server trigger keeps the newer row. */
  function enqueueAll(s: Store, user: string) {
    const meta = readMeta(s, user);
    const queue = new Set(readQueue(s, user));
    for (const kind of KINDS) {
      for (const k of ADAPTERS[kind].read(s, user).keys()) {
        const qid = id(kind, k);
        if (!SETS.has(kind) && meta[qid] === undefined) meta[qid] = 0;
        queue.add(qid);
      }
    }
    writeJson(s, metaKey(user), meta);
    writeQueue(s, user, [...queue]);
  }

  function listen() {
    if (listening) return;
    listening = true;
    const sendNow = () => { void flush(true); };
    try {
      deps.win?.addEventListener("online", () => { failures = 0; retryAt = 0; sendNow(); });
      deps.win?.addEventListener("pagehide", sendNow);
      deps.doc?.addEventListener("visibilitychange", () => { if (deps.doc?.visibilityState === "hidden") sendNow(); });
    } catch { /* no window (tests, server) */ }
  }

  function bump() {
    version += 1;
    subscribers.forEach((fn) => { try { fn(); } catch { /* a listener must not stop the others */ } });
  }

  /** The signed-in user, or null for a guest / after sign-out. Reads and merges the server copy once. */
  async function setUser(next: string | null): Promise<void> {
    if (next === uid) return;
    if (timer !== null) { clearTimer(timer); timer = null; }
    uid = next;
    const mine = ++generation;
    disabled = false;
    failures = 0;
    retryAt = 0;
    if (!next) return;
    const s = store();
    if (!s) return;
    listen();
    let res: PullResult;
    try { res = await deps.pull(next); } catch (e) { res = { rows: null, error: { message: e instanceof Error ? e.message : String(e) } }; }
    if (mine !== generation) return; // signed out or switched meanwhile
    try {
      if (res.error || !res.rows) {
        const f = classifySendError(res.error, res.status);
        if (f === "missing") {
          disabled = true;
          debug("[learnerSync] learner_state is not on the server yet; progress stays on this device");
          return;
        }
        // Offline or a server hiccup: the device keeps working; its data goes up later.
        if (s.getItem(migratedKey(next)) !== "1") enqueueAll(s, next);
      } else if (merge(s, next, res.rows)) {
        bump();
      }
      s.setItem(migratedKey(next), "1");
    } catch { /* storage blocked: device-only, as before */ }
    if (readQueue(s, next).length) schedule(0);
  }

  return {
    setUser,
    noteChange,
    flush,
    subscribe: (fn: () => void) => { subscribers.add(fn); return () => { subscribers.delete(fn); }; },
    version: () => version,
    /** For tests. */
    status: () => ({ uid, disabled, failures, retryAt, scheduled: timer !== null, flushing }),
  };
}

/* --- the app's instance --- */

const PAGE = 1000;
const hasWindow = typeof window !== "undefined";
const sync = createLearnerSync({
  pull: async (uid) => {
    const rows: StateRow[] = [];
    for (let from = 0; from < 50 * PAGE; from += PAGE) {
      const { data, error, status } = await supabase
        .from("learner_state")
        .select("kind, key, value, updated_at")
        .eq("user_id", uid)
        .order("kind")
        .order("key")
        .range(from, from + PAGE - 1);
      if (error) return { rows: null, error, status };
      rows.push(...((data ?? []) as StateRow[]));
      if (!data || data.length < PAGE) break;
    }
    return { rows, error: null };
  },
  push: (uid, rows) =>
    supabase.from("learner_state").upsert(rows.map((r) => ({ ...r, user_id: uid })), { onConflict: "user_id,kind,key" }),
  storage: () => (typeof localStorage === "undefined" ? null : localStorage),
  idle: (fn) => {
    if (hasWindow && "requestIdleCallback" in window) window.requestIdleCallback(() => fn(), { timeout: 5000 });
    else setTimeout(fn, 1);
  },
  debug: (msg) => console.debug(msg),
  win: hasWindow ? window : null,
  doc: typeof document !== "undefined" ? document : null,
});

/** Records that an item changed on the device. Synchronous, never throws, never re-renders. */
export const noteChange = sync.noteChange;
/** Signed-in user or null. */
export const setSyncUser = (uid: string | null) => { void sync.setUser(uid); };

/** Bumps only when a sign-in merge changed what is on the device. */
export function useLearnerVersion(): number {
  return useSyncExternalStore(sync.subscribe, sync.version, sync.version);
}

/** useState that re-reads from the device after a merge brought new data. */
export function useLearnerState<T>(load: () => T): [T, Dispatch<SetStateAction<T>>] {
  const ver = useLearnerVersion();
  const [state, setState] = useState(load);
  const [seen, setSeen] = useState(ver);
  if (seen !== ver) {
    setSeen(ver);
    setState(load());
  }
  return [state, setState];
}
