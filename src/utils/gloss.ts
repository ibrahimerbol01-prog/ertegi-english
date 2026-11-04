import { foldAccents } from "./text";

/* Keys tried in the glossary when a learner taps a word in the reader: the
   word as written ("didn't"), then without a possessive ("man's" -> "man"),
   then letters only. The reader and the corpus profile (src/research/corpus.ts)
   share this, so "translation coverage" in docs/corpus.md is exactly what a
   learner sees. */
export function glossKeys(word: string): string[] {
  const withApostrophe = foldAccents(word).toLowerCase().replace(/[’]/g, "'").replace(/[^a-z']/g, "").replace(/^'+|'+$/g, "");
  return [withApostrophe, withApostrophe.replace(/'s$/, ""), withApostrophe.replace(/[^a-z]/g, "")];
}

/** The glossary key that has a translation, or null. */
export function glossKey(word: string, glossary: Record<string, string>): string | null {
  return glossKeys(word).find((k) => k && glossary[k]) ?? null;
}
