/* English lemmatizer for the corpus profile (research only: imported by
   scripts/corpus-report.mjs and corpus.test.ts, never by the app). */
import wink from "wink-lemmatizer";
import type { Lemmatize } from "./corpus";

/* wink cuts -ed/-ing off a verb whose base ends in -e and returns a shorter
   word that WordNet also knows as a verb: "hated" -> "hat", "hoped" -> "hop",
   "riding" -> "rid", "stared" -> "star". In English spelling a one-syllable
   base ending in one vowel and one consonant doubles the consonant ("hopped",
   "ridding", "starred"), so a single consonant there means the base ends in -e. */
const E_DROPPED = /^([^aeiou]*[aeiou][b-df-hj-np-tv-z])(?:ed|ing)$/;

/** Verb, noun and adjective readings of a word, without the word itself. */
export const lemmatize: Lemmatize = (word) => {
  const stem = E_DROPPED.exec(word)?.[1];
  const verb = wink.verb(word);
  return [...new Set([stem && verb === stem ? `${stem}e` : verb, wink.noun(word), wink.adjective(word)])]
    .filter((w) => w && w !== word);
};
