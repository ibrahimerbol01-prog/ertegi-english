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
