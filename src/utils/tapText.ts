import { WORD_TRANSLATIONS } from "../constants";
import { glossKey } from "./gloss";

/* Helpers for text read before sign-in (landing sample, guest reader; redesign stage 7). */

/** The meaning from the app's own glossary (the reader's WORD_TRANSLATIONS), if any. */
export const lookUp = (word: string) => {
  const key = glossKey(word, WORD_TRANSLATIONS);
  return key ? WORD_TRANSLATIONS[key] : undefined;
};

/** The word as shown in the meaning line: no surrounding punctuation. */
export const bare = (word: string) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/** Text split into words (with their index among words) and the spaces between them. */
export function tokens(text: string): { text: string; word: number | null }[] {
  let n = 0;
  return text.split(/(\s+)/).filter((p) => p !== "").map((p) => (/^\s+$/.test(p) ? { text: p, word: null } : { text: p, word: n++ }));
}

/** A tale cut into short paragraphs of a few sentences each. */
export function paragraphsOf(text: string, perParagraph = 4): string[] {
  const sentences = text.trim().split(/(?<=[.!?]["”]?)\s+/);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) out.push(sentences.slice(i, i + perParagraph).join(" "));
  return out;
}
