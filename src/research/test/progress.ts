import type { Answer, Form, SessionProgress, Timepoint } from "./types";

/* The test is kept on the device answer by answer (localStorage), before the
   answer event is queued for the server (utils/events.ts keeps its own queue
   and resends after a lost connection). A reload or a closed tab resumes at
   the first unanswered item; a finished session is closed for good. */

type Store = Pick<Storage, "getItem" | "setItem">;
export const testKey = (uid: string) => `ertegi_research_test_${uid}`;
/** One record per set version and moment, so the sample set never closes a real session. */
export const sessionId = (version: string, tp: Timepoint) => `${version}|${tp}`;

export function loadAll(s: Store | null, uid: string): Record<string, SessionProgress> {
  try {
    const v = JSON.parse(s?.getItem(testKey(uid)) || "null");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch { return {}; }
}
function saveAll(s: Store | null, uid: string, all: Record<string, SessionProgress>): boolean {
  try { s?.setItem(testKey(uid), JSON.stringify(all)); return !!s; } catch { return false; }
}

export function loadSession(s: Store | null, uid: string, version: string, tp: Timepoint): SessionProgress | null {
  return loadAll(s, uid)[sessionId(version, tp)] ?? null;
}

/** Starts a session, or returns the one already started (its form stays). */
export function startSession(s: Store | null, uid: string, version: string, tp: Timepoint, form: Form, now = new Date()): SessionProgress {
  const all = loadAll(s, uid);
  const id = sessionId(version, tp);
  if (!all[id]) { all[id] = { form, started_at: now.toISOString(), answers: {} }; saveAll(s, uid, all); }
  return all[id];
}

/** Keeps the first answer to an item; a second one (two tabs) is ignored. Returns false if it was ignored. */
export function recordAnswer(s: Store | null, uid: string, version: string, tp: Timepoint, itemId: string, a: Answer): boolean {
  const all = loadAll(s, uid);
  const p = all[sessionId(version, tp)];
  if (!p || p.done_at || p.answers[itemId]) return false;
  p.answers[itemId] = a;
  saveAll(s, uid, all);
  return true;
}

export function finishSession(s: Store | null, uid: string, version: string, tp: Timepoint, now = new Date()): boolean {
  const all = loadAll(s, uid);
  const p = all[sessionId(version, tp)];
  if (!p || p.done_at) return false;
  p.done_at = now.toISOString();
  saveAll(s, uid, all);
  return true;
}
