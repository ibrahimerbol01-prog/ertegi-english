import type { HardWord } from "./classWork";

/* "Сынып жиі басқан сөздер" (redesign stage 8): the words a class tapped most, from the
   totals class_events_summary already returns (hard_words: up to 10 words). Totals only:
   a word shows only when at least MIN_LEARNERS learners are behind it, so no single learner
   can be read off the list. Note: the RPC's `learners` counts learners who tapped the word
   OR forgot it in review; a tap-only count and the threshold on the server are asked of the
   owner in the stage 8 PR. */

export const MIN_LEARNERS = 3;
export const TOP_WORDS = 5;

export function topTappedWords(words: HardWord[]): { word: string; learners: number }[] {
  return words
    .filter((w) => w.taps > 0 && w.learners >= MIN_LEARNERS)
    .sort((a, b) => b.learners - a.learners || b.taps - a.taps || a.word.localeCompare(b.word))
    .slice(0, TOP_WORDS)
    .map((w) => ({ word: w.word, learners: w.learners }));
}
