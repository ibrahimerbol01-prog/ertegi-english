import type { SavedWord } from "../types";
import { MAX_MASTERY } from "./progress";

/** A saved word's state, as in the reader's word sheet: below MAX_MASTERY it is still being
 *  learned, at MAX_MASTERY it is known (redesign stage 6). */
export function wordState(w: SavedWord): "learning" | "known" {
  return (w.mastery ?? 0) >= MAX_MASTERY ? "known" : "learning";
}
