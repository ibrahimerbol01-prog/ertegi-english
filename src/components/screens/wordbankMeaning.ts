import { glossKey } from "../../utils/gloss";
import { WORD_TRANSLATIONS } from "../../constants";
import { cardWord } from "../../data/wordbank/config";
import type { WordbankEntry } from "../../data/wordbank/types";

/** What the wordbank shows as the meaning of a word, and whether it can go on a card. */
export interface Meaning {
  /** Kazakh meaning: the side of the card, as in the reader's glossary. Empty: none yet. */
  kk: string;
  ru: string;
  /** Machine translation (two models agreed, or a model chose with a source): marked on screen. */
  auto: boolean;
  /** Waiting for a person: no meaning shown, no card. */
  reviewing: boolean;
}

export function wordbankMeaning(e: WordbankEntry): Meaning {
  if (e.tr === "needs-review") return { kk: "", ru: "", auto: false, reviewing: true };
  if (e.tr === "agreed" || e.tr === "ai-reviewed" || e.tr === "human") {
    return { kk: e.kk, ru: e.ru, auto: e.tr !== "human", reviewing: false };
  }
  // A level without translations yet: the app's own glossary of the tales, if it has the word.
  const key = glossKey(cardWord(e.word), WORD_TRANSLATIONS);
  return { kk: key ? WORD_TRANSLATIONS[key] : "", ru: "", auto: false, reviewing: false };
}

/** How many words of a level (all parts of speech) are already in the learner's flashcards.
 *  Counted by the card word, so "colour/color" counts once it is saved as "colour". */
export function levelProgress(words: readonly WordbankEntry[], saved: ReadonlySet<string>): { inCards: number; total: number } {
  const all = new Set(words.map((e) => cardWord(e.word).toLowerCase()));
  let inCards = 0;
  for (const w of all) if (saved.has(w)) inCards++;
  return { inCards, total: all.size };
}
