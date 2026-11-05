import type { WordbankLevel } from "./config";

/** A sentence of our own tales where the word occurs (the form as written there). */
export interface WordbankExample { text: string; story_id: string; level: string; form: string }

export interface WordbankEntry {
  /** Headword as the source writes it, e.g. "a.m./A.M./am/AM". */
  word: string;
  /** Part of speech as the source writes it (noun, verb, adjective, adverb, …). */
  pos: string;
  level: WordbankLevel;
  /** Source id from config.ts (cefrj, octanove). */
  source: string;
  example: WordbankExample | null;
  /** Translations: empty until a reviewed translation task fills them (research/wordbank-translations). */
  kk: string;
  ru: string;
  /** Where kk/ru come from, when the level has translations: see src/utils/wordbankTranslations.ts. */
  tr?: TrStatus;
}

/** agreed: two machine translations agreed; ai-reviewed: a model chose with a source;
 *  human: a person checked; needs-review: not shown yet. */
export type TrStatus = "agreed" | "ai-reviewed" | "human" | "needs-review";
