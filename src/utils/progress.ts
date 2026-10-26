import { supabase } from "../lib/supabase";

/* Path progress and word review schedule.
   Supabase is the source of truth once the 20261022 migration is applied;
   until then (or offline) everything still works from localStorage, and
   failed writes stay silent instead of showing the save-error toast. */

export type ProgressStep = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "quiz";
export const progressKey = (storyId: string, step: string) => `${storyId}:${step}`;

const lsKey = (userId: string, name: string) => `ertegi_${name}_${userId}`;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: Supabase still has it
  }
}

export async function loadProgress(userId: string): Promise<Set<string>> {
  const local = readLocal<string[]>(lsKey(userId, "progress"), []);
  const done = new Set(local);
  const { data, error } = await supabase.from("story_progress").select("story_id, step").eq("user_id", userId);
  if (!error && data) {
    data.forEach((r: { story_id: string; step: string }) => done.add(progressKey(r.story_id, r.step)));
    writeLocal(lsKey(userId, "progress"), [...done]);
  }
  return done;
}

export function saveProgress(userId: string, storyId: string, step: ProgressStep, all: Set<string>) {
  writeLocal(lsKey(userId, "progress"), [...all]);
  supabase
    .from("story_progress")
    .upsert({ user_id: userId, story_id: storyId, step }, { onConflict: "user_id,story_id,step" })
    .then(() => {}, () => {});
}

/* Leitner boxes: mastery 0..5, days until the next review per box. */
// Gaps that keep growing across a school year (Cepeda et al.: the best gap is a
// share of how long the word must be remembered). Box 0 is a new word.
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35, 90];
export const MAX_MASTERY = REVIEW_INTERVAL_DAYS.length - 1;

export function nextReview(mastery: number, from = new Date()): string {
  const days = REVIEW_INTERVAL_DAYS[Math.min(Math.max(mastery, 0), MAX_MASTERY)];
  return new Date(from.getTime() + days * 86400000).toISOString();
}

// A forgotten word drops one box, not to the start, and comes back tomorrow.
export function lapse(mastery: number, from = new Date()): { mastery: number; nextReviewAt: string } {
  return { mastery: Math.max(mastery - 1, 0), nextReviewAt: new Date(from.getTime() + 86400000).toISOString() };
}

// The learner's own calendar day (Kazakhstan is UTC+5, so UTC would roll over at 5 am).
export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000);

export const isDue = (nextReviewAt: string | null | undefined, now = Date.now()) =>
  !nextReviewAt || new Date(nextReviewAt).getTime() <= now;

export function loadLocalReviews(userId: string): Record<string, string> {
  return readLocal<Record<string, string>>(lsKey(userId, "reviews"), {});
}

export function saveReview(userId: string, word: string, mastery: number, nextReviewAt: string) {
  const all = loadLocalReviews(userId);
  all[word] = nextReviewAt;
  writeLocal(lsKey(userId, "reviews"), all);
  supabase
    .from("saved_words")
    .update({ mastery, next_review_at: nextReviewAt })
    .eq("user_id", userId)
    .eq("word", word)
    .then(({ error }) => {
      // Column not migrated yet: keep at least mastery in sync.
      if (error) supabase.from("saved_words").update({ mastery }).eq("user_id", userId).eq("word", word).then(() => {}, () => {});
    }, () => {});
}
