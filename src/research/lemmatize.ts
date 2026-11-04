/* English lemmatizer for the corpus profile (research only: imported by
   scripts/corpus-report.mjs and corpus.test.ts, never by the app). */
import wink from "wink-lemmatizer";
import type { Lemmatize } from "./corpus";

/** Verb, noun and adjective readings of a word, without the word itself. */
export const lemmatize: Lemmatize = (word) =>
  [...new Set([wink.verb(word), wink.noun(word), wink.adjective(word)])].filter((w) => w && w !== word);
