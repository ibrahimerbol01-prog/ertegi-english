import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORDBANK_LEVELS, type WordbankLevel } from "./config";
import type { WordbankEntry } from "./types";

/* Validator of the generated level lists (A1–C2). It guards the data against
   new mistakes of the kind found by hand (docs/research-design/a1-pos-issues.md,
   pos-issues-a2-c1.md). Known mistakes come from the source lists
   (research/cefr) and wait for the owner's decision, so they are listed here
   explicitly: a new one fails the test, a fixed one must be removed from the list. */

const root = join(__dirname, "..", "..", "..");
const data = Object.fromEntries(
  WORDBANK_LEVELS.map((l) => [l, JSON.parse(readFileSync(join(root, `src/data/wordbank/${l}.json`), "utf8")) as WordbankEntry[]]),
) as Record<WordbankLevel, WordbankEntry[]>;
const all = WORDBANK_LEVELS.flatMap((l) => data[l]);
const key = (e: WordbankEntry) => `${e.level}:${e.word}:${e.pos}`;

/** Parts of speech as the sources write them. */
const KNOWN_POS = new Set([
  "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "determiner", "conjunction", "number",
  "modal auxiliary", "be-verb", "do-verb", "have-verb", "infinitive-to", "interjection",
]);
/** Source rows with an empty or misspelt part of speech (octanove C1/C2 CSV). */
const KNOWN_BAD_POS = new Set(["C1:batter:", "C2:remonstrate:vern"]);

/** Bound morphemes that are not words on their own. */
const AFFIXES = new Set([
  "anti", "cyber", "eco", "hyper", "ism", "ity", "ize", "ise", "ment", "micro", "multi", "nano", "neo",
  "ness", "pseudo", "semi", "tion", "ultra",
]);
const KNOWN_AFFIX_ENTRIES = new Set(["B1:anti:adjective", "B1:eco:noun", "B1:ness:noun", "B2:micro:noun", "B2:nano:noun"]);

/** Words whose one example is shared by several parts of speech (the example
 *  index matches the form, not the part of speech). Counts may only go down. */
const MAX_SHARED_EXAMPLES: Record<WordbankLevel, number> = { A1: 62, A2: 20, B1: 16, B2: 10, C1: 0, C2: 0 };

describe("wordbank validator (A1–C2)", () => {
  it("every part of speech is a known one, apart from the listed source mistakes", () => {
    const bad = all.filter((e) => !KNOWN_POS.has(e.pos)).map(key);
    expect(bad.sort()).toEqual([...KNOWN_BAD_POS].sort());
  });

  it("no word with the same part of speech twice, within a level or across levels", () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const e of all) {
      const k = `${e.word.toLowerCase()}:${e.pos}`;
      if (seen.has(k)) dup.push(`${seen.get(k)} & ${e.level}:${k}`);
      else seen.set(k, `${e.level}`);
    }
    expect(dup).toEqual([]);
  });

  it("no affix as a headword, apart from the listed ones", () => {
    const hits = all.filter((e) => AFFIXES.has(e.word.toLowerCase())).map(key);
    expect(hits.sort()).toEqual([...KNOWN_AFFIX_ENTRIES].sort());
  });

  it("shared examples across parts of speech do not grow", () => {
    for (const level of WORDBANK_LEVELS) {
      const pos = new Map<string, Set<string>>();
      for (const e of data[level]) {
        if (!e.example) continue;
        const k = `${e.word}\u0000${e.example.text}`;
        pos.set(k, (pos.get(k) ?? new Set()).add(e.pos));
      }
      const shared = new Set([...pos].filter(([, p]) => p.size > 1).map(([k]) => k.split("\u0000")[0]));
      expect(shared.size, `${level}: ${[...shared].join(", ")}`).toBeLessThanOrEqual(MAX_SHARED_EXAMPLES[level]);
    }
  });

  it("the known-mistake lists contain no stale entries", () => {
    const keys = new Set(all.map(key));
    for (const k of [...KNOWN_BAD_POS, ...KNOWN_AFFIX_ENTRIES]) expect(keys.has(k), k).toBe(true);
  });
});
