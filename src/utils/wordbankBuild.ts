/* Builds the wordbank data files (src/data/wordbank/A1.json … C2.json) from
   the sources in src/data/wordbank/config.ts and the app's own tales. Shared
   by scripts/wordbank-build.mjs (writes the files) and wordbank.test.ts
   (checks they are up to date). Build time only: the app never imports this. */
import { foldAccents } from "./text";
import { baseForm, parseCsv, sentences } from "../research/corpus";
import {
  EXCLUDED_UNTIL_DELAYED_TEST, WORDBANK_LEVELS, WORDBANK_SOURCES,
  type WordbankLevel, type WordbankSource,
} from "../data/wordbank/config";
import type { WordbankEntry, WordbankExample } from "../data/wordbank/types";

const TALE_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
interface Tale { id: string; levels: Record<(typeof TALE_LEVELS)[number], string> }

const WORD = /[A-Za-z]+(?:'[A-Za-z]+)*/g;
const rank = (l: WordbankLevel) => WORDBANK_LEVELS.indexOf(l);
const isLevel = (s: string): s is WordbankLevel => (WORDBANK_LEVELS as readonly string[]).includes(s);

/** Single-word spellings of a headword ("a.m./A.M./am/AM" → am; "ice cream" → none). */
export function variants(headword: string): string[] {
  return [...new Set(headword.split("/").map((v) => foldAccents(v).toLowerCase().trim()).filter((v) => /^[a-z]+(?:'[a-z]+)?$/.test(v)))];
}

const INFLECTED_POS = ["verb", "noun", "adjective"] as const;
type InflectedPos = (typeof INFLECTED_POS)[number];
/** The reading of a running word as one part of speech ("walked" as a verb → "walk"). */
export type LemmaAs = (pos: InflectedPos, word: string) => string;

/** First sentence of the tales with the word: easiest level first, tales in app order.
 *  The exact form wins over an inflected one ("walk" before "walked"); an
 *  inflected form counts only as the entry's own part of speech, so the noun
 *  "watch" does not get "he watched". The exact form cannot tell the part of
 *  speech apart. Abbreviations ("a.m./am") get no example: "am" is also a verb. */
export function exampleIndex(tales: readonly Tale[], lemmaAs: LemmaAs) {
  const exact = new Map<string, WordbankExample>();
  const inflected = Object.fromEntries(INFLECTED_POS.map((p) => [p, new Map<string, WordbankExample>()])) as Record<InflectedPos, Map<string, WordbankExample>>;
  for (const level of TALE_LEVELS) {
    for (const tale of tales) {
      for (const s of sentences(tale.levels[level] ?? "")) {
        const clean = foldAccents(s).replace(/[’]/g, "'");
        for (const m of clean.matchAll(WORD)) {
          const form = m[0];
          const lower = baseForm(form.toLowerCase());
          const ex = { text: s, story_id: tale.id, level, form };
          if (!exact.has(lower)) exact.set(lower, ex);
          for (const p of INFLECTED_POS) {
            const lemma = lemmaAs(p, lower);
            if (lemma && lemma !== lower && !inflected[p].has(lemma)) inflected[p].set(lemma, ex);
          }
        }
      }
    }
  }
  return (word: string, pos: string): WordbankExample | null => {
    if (word.includes(".")) return null;
    for (const v of variants(word)) { const e = exact.get(v); if (e) return e; }
    if ((INFLECTED_POS as readonly string[]).includes(pos)) {
      for (const v of variants(word)) { const e = inflected[pos as InflectedPos].get(v); if (e) return e; }
    }
    return null;
  };
}

export const isExcluded = (headword: string) => {
  const ex = new Set(EXCLUDED_UNTIL_DELAYED_TEST);
  return variants(headword).some((v) => ex.has(v)) || ex.has(headword.toLowerCase().trim());
};

/** csvs: file path → CSV text for every source in config. */
export function buildWordbank(csvs: Record<string, string>, tales: readonly Tale[], lemmaAs: LemmaAs, sources: readonly WordbankSource[] = WORDBANK_SOURCES) {
  const byKey = new Map<string, WordbankEntry>();
  let excluded = 0;
  for (const src of sources) {
    const csv = csvs[src.file];
    if (csv === undefined) throw new Error(`wordbank: no CSV for ${src.file}`);
    const [header, ...rows] = parseCsv(csv);
    const hw = header.indexOf("headword"), pos = header.indexOf("pos"), lv = header.indexOf("CEFR");
    if (hw < 0 || pos < 0 || lv < 0) throw new Error(`wordbank: ${src.file} needs headword, pos and CEFR columns`);
    for (const r of rows) {
      const word = (r[hw] ?? "").trim();
      const level = (r[lv] ?? "").trim().toUpperCase();
      if (!word || !isLevel(level) || !src.levels.includes(level)) continue;
      if (isExcluded(word)) { excluded++; continue; }
      const p = (r[pos] ?? "").trim().toLowerCase();
      const key = `${word.toLowerCase()}|${p}`;
      const old = byKey.get(key);
      if (old && rank(old.level) <= rank(level)) continue;
      byKey.set(key, { word, pos: p, level, source: src.id, example: null, kk: "", ru: "" });
    }
  }
  const example = exampleIndex(tales, lemmaAs);
  const levels = Object.fromEntries(WORDBANK_LEVELS.map((l) => [l, [] as WordbankEntry[]])) as Record<WordbankLevel, WordbankEntry[]>;
  for (const e of byKey.values()) levels[e.level].push({ ...e, example: example(e.word, e.pos) });
  for (const l of WORDBANK_LEVELS) levels[l].sort((a, b) => a.word.localeCompare(b.word, "en") || a.pos.localeCompare(b.pos, "en"));
  const files = Object.fromEntries(WORDBANK_LEVELS.map((l) => [l, fileText(levels[l])])) as Record<WordbankLevel, string>;
  return { levels, files, excluded };
}

/** One entry per line, so a change in the sources shows as a readable diff. */
export const fileText = (entries: readonly WordbankEntry[]) =>
  `[\n${entries.map((e) => JSON.stringify(e)).join(",\n")}\n]\n`;
