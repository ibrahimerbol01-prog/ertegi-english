/* Placement check v1 (docs/product/profile-and-placement.md, B): 15 real words
   (3 per level A1–C1) and 5 pseudowords, "do you know this word?". The result is
   an ESTIMATE ("about A2") and a suggestion where to start reading, never a gate.
   The scoring rule is a hypothesis to check against a teacher's view. Kept on the
   device only: no event log, no new personal data. */

export const PLACEMENT_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type PlacementLevel = (typeof PLACEMENT_LEVELS)[number];
export interface PlacementItem { id: string; word: string; level: PlacementLevel | null; pos: string | null; pseudo: boolean; from_tale: boolean }
export interface PlacementResult { version: string; level: PlacementLevel | null; reliable: boolean; hits: Record<PlacementLevel, number>; falseAlarms: number; at: string }

/** A level counts when this many of its 3 words are known. */
export const PASS_PER_LEVEL = 2;
/** More "yes" to pseudowords than this: the answers are not reliable (guessing). */
export const MAX_FALSE_ALARMS = 1;

export function estimate(items: readonly PlacementItem[], yes: Record<string, boolean>, version: string, at = new Date().toISOString()): PlacementResult {
  const hits = Object.fromEntries(PLACEMENT_LEVELS.map((l) => [l, 0])) as Record<PlacementLevel, number>;
  let falseAlarms = 0;
  for (const it of items) {
    if (!yes[it.id]) continue;
    if (it.pseudo) falseAlarms++;
    else if (it.level) hits[it.level]++;
  }
  // The highest level reached step by step from A1: a gap stops the climb.
  let level: PlacementLevel | null = null;
  for (const l of PLACEMENT_LEVELS) {
    if (hits[l] >= PASS_PER_LEVEL) level = l;
    else break;
  }
  return { version, level, reliable: falseAlarms <= MAX_FALSE_ALARMS, hits, falseAlarms, at };
}

/** Where to start reading: the estimated level, A1 below it. */
export const suggestedTaleLevel = (r: PlacementResult): PlacementLevel => r.level ?? "A1";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const placementKey = (uid: string) => `ertegi_placement_${uid}`;
export type PlacementState = { done: PlacementResult } | { skipped: string } | null;

export function readPlacement(s: Store | null, uid: string): PlacementState {
  try {
    const v = JSON.parse(s?.getItem(placementKey(uid)) || "null");
    if (v?.done && typeof v.done.version === "string") return { done: v.done };
    if (typeof v?.skipped === "string") return { skipped: v.skipped };
  } catch { /* broken or blocked storage */ }
  return null;
}
export function writePlacement(s: Store | null, uid: string, state: Exclude<PlacementState, null>): void {
  try { s?.setItem(placementKey(uid), JSON.stringify(state)); } catch { /* storage blocked */ }
}
