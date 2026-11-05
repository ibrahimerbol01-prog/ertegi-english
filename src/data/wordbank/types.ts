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
  /** Translations: empty until a reviewed translation task fills them. */
  kk: string;
  ru: string;
}
