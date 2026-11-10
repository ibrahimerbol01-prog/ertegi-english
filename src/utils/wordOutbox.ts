import { supabase } from "../lib/supabase";

/* Words saved without network (docs/error-states.md, finding 2): queued on the device until
   the server has them, the same way as quiz scores (classes.ts, flushQuizResults). The
   upsert keeps a word already on the server as it is (mastery, review date), so sending a
   word twice is harmless. */

export type PendingWord = { word: string; translation: string };
const outboxKey = (userId: string) => `ertegi_word_outbox_${userId}`;

export function pendingWords(userId: string): PendingWord[] {
  try {
    const v = JSON.parse(localStorage.getItem(outboxKey(userId)) || "[]");
    return Array.isArray(v) ? v.filter((w) => w && typeof w.word === "string" && typeof w.translation === "string") : [];
  } catch {
    return [];
  }
}
function write(userId: string, rows: PendingWord[]) {
  try {
    if (rows.length) localStorage.setItem(outboxKey(userId), JSON.stringify(rows.slice(-500)));
    else localStorage.removeItem(outboxKey(userId));
  } catch { /* storage blocked: the word lives in memory for this visit */ }
}

export function queueWord(userId: string, w: PendingWord) {
  const rows = pendingWords(userId);
  if (!rows.some((r) => r.word === w.word)) write(userId, [...rows, w]);
}

export type FlushResult = {
  /** Words the server did not have before (for XP that waits for the server). */
  added: string[];
  /** Words the table refused (constraint): dropped from the queue, not sent again. */
  refused: string[];
  /** Words still waiting (no network or a server error). */
  left: number;
  /** Sends in a row that left words waiting; back to 0 once a send gets through. */
  failedInARow: number;
};

/** After this many failed sends in a row the learner is told (the old toast, as before #129). */
export const WARN_AFTER_FAILURES = 3;

let flushing: Promise<FlushResult> | null = null;
let failures = 0;

export function flushWords(userId: string): Promise<FlushResult> {
  // One send at a time; a word queued meanwhile goes out with the next call.
  if (flushing) return flushing.then(() => flushWords(userId));
  flushing = run(userId).finally(() => { flushing = null; });
  return flushing;
}

async function run(userId: string): Promise<FlushResult> {
  const rows = pendingWords(userId);
  const out: FlushResult = { added: [], refused: [], left: rows.length, failedInARow: failures };
  if (!rows.length) { failures = 0; out.failedInARow = 0; return out; }
  const send = (batch: PendingWord[]) => supabase
    .from("saved_words")
    .upsert(batch.map((r) => ({ user_id: userId, word: r.word, translation: r.translation, mastery: 0 })), { onConflict: "user_id,word", ignoreDuplicates: true })
    .select("word");
  const handled = new Set<string>();
  try {
    const res = await send(rows);
    if (!res.error) {
      rows.forEach((r) => handled.add(r.word));
      out.added.push(...(res.data ?? []).map((d: { word: string }) => d.word));
    } else if (res.error.code?.startsWith("23")) {
      // One word the table can't take must not hold back the rest: one by one.
      for (const r of rows) {
        const one = await send([r]);
        if (one.error && !one.error.code?.startsWith("23")) break;
        handled.add(r.word);
        if (one.error) out.refused.push(r.word);
        else out.added.push(...(one.data ?? []).map((d: { word: string }) => d.word));
      }
    }
  } catch { /* offline: try again later */ }
  // Drop exactly the words handled: another tab may have queued more meanwhile.
  if (handled.size) write(userId, pendingWords(userId).filter((r) => !handled.has(r.word)));
  out.left = pendingWords(userId).length;
  failures = handled.size ? 0 : failures + 1;
  out.failedInARow = failures;
  return out;
}
