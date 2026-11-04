/* Corpus profile (R6): the 35 tale texts (7 tales × 5 levels) described as a
   research object. For every text: length, sentence length, lexical diversity,
   the share of words at each level of an external vocabulary scale (CEFR-J
   Wordlist 1.5 for A1–B2, Octanove Vocabulary Profile for C1–C2), the level
   at which the text reaches 95 % and 98 % coverage, how many tapped words the
   reader can translate, new words against the lower levels of the same tale,
   and draft target words for a teacher to review.

   Pure functions: the vocabulary lists and the lemmatizer are passed in, so
   none of this reaches the app bundle. scripts/corpus-report.mjs writes
   docs/corpus-profile.json, the table in docs/corpus.md and
   src/data/corpusMeta.ts; corpus.test.ts rebuilds all three and fails when
   they are out of date. Method and limits: docs/corpus.md. */

import { foldAccents } from "../utils/text";
import { glossKey } from "../utils/gloss";
import {
  CORPUS_COVERAGE_ADEQUATE, CORPUS_COVERAGE_OPTIMAL, CORPUS_MATTR_WINDOW,
  CORPUS_TARGETS_PER_LEVEL, CORPUS_TARGET_MIN_REPEATS,
} from "./params";

export const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Cefr = (typeof CEFR)[number];
/** Levels the app labels its texts with. */
export const LABELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Label = (typeof LABELS)[number];
/** Above C2 means the text never reaches the threshold within the lists. */
export type Estimate = Cefr | "above C2";

export interface LexEntry { level: Cefr; content: boolean }
export type Lexicon = Map<string, LexEntry>;
/** Possible dictionary forms of a lowercase word, most likely first ("ran" -> ["run"]). */
export type Lemmatize = (word: string) => string[];

export interface StoryInput { id: string; levels: Record<string, string> }

/* Parts of speech that can be a target word. Adverbs only when they end in
   -ly: the lists tag "that", "back" or "down" as adverbs too. */
const CONTENT_POS = new Set(["noun", "verb", "adjective"]);
/* Content words that are too general to be a target word. */
const NOT_TARGET = new Set(["be", "have", "do", "get", "go", "say", "make", "very", "so", "too", "also", "then", "there", "here", "now", "not", "just", "even", "only", "still", "thing", "like", "that"]);

/* ---------- vocabulary lists ---------- */

/** Minimal CSV reader: commas, double-quoted fields, "" inside quotes. */
export function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (quoted) {
      if (c === '"' && csv[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && csv[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

const isCefr = (s: string): s is Cefr => (CEFR as readonly string[]).includes(s);
const rank = (l: Cefr) => CEFR.indexOf(l);

/** One lexicon from profile CSVs with columns headword, pos, CEFR. A headword
 *  like "a.m./A.M./am/AM" gives each variant; multi-word entries are skipped.
 *  A word listed at several levels (by part of speech) keeps the lowest. */
export function buildLexicon(csvs: string[]): Lexicon {
  const lex: Lexicon = new Map();
  for (const csv of csvs) {
    const [header, ...rows] = parseCsv(csv);
    const hw = header.indexOf("headword"), pos = header.indexOf("pos"), lv = header.indexOf("CEFR");
    if (hw < 0 || pos < 0 || lv < 0) throw new Error("profile CSV needs headword, pos and CEFR columns");
    for (const r of rows) {
      const level = (r[lv] ?? "").trim().toUpperCase();
      if (!isCefr(level)) continue;
      const p = (r[pos] ?? "").trim().toLowerCase();
      const content = CONTENT_POS.has(p) || (p === "adverb" && /ly$/.test(r[hw] ?? ""));
      for (const variant of (r[hw] ?? "").split("/")) {
        const key = foldAccents(variant).toLowerCase().trim();
        if (!/^[a-z]+(?:'[a-z]+)?$/.test(key)) continue;
        const old = lex.get(key);
        lex.set(key, {
          level: old && rank(old.level) < rank(level) ? old.level : level,
          content: (old?.content ?? false) || content,
        });
      }
    }
  }
  return lex;
}

/* ---------- words and sentences ---------- */

export interface Token { raw: string; lower: string; sentenceStart: boolean }

const WORD = /[A-Za-z]+(?:'[A-Za-z]+)*/g;

/** Sentences as the level-spec checker splits them: after . ! ? and closing quotes. */
export function sentences(text: string): string[] {
  return text.trim().split(/(?<=[.!?])["”’)]*\s+/).filter((s) => /[A-Za-z]/.test(foldAccents(s)));
}

/** Running words; hyphenated words count as two, contractions as one. */
export function tokens(text: string): Token[] {
  const out: Token[] = [];
  for (const s of sentences(text)) {
    const clean = foldAccents(s).replace(/[’]/g, "'");
    let first = true;
    for (const m of clean.matchAll(WORD)) {
      // A word that opens a quotation ("Thank you!") also starts a sentence.
      const before = clean.slice(0, m.index).trimEnd();
      const start = first || /["“:]$/.test(before);
      out.push({ raw: m[0], lower: m[0].toLowerCase(), sentenceStart: start });
      first = false;
    }
  }
  return out;
}

/** The base of a contraction or possessive: "didn't" -> "did", "man's" -> "man". */
export function baseForm(lower: string): string {
  if (lower === "can't" || lower === "cannot") return "can";
  if (lower === "won't") return "will";
  if (lower === "shan't") return "shall";
  return lower.replace(/n't$/, "").replace(/'(s|re|ll|ve|d|m)$/, "").replace(/'$/, "");
}

/** Proper names: written with a capital everywhere in the corpus and
 *  capitalised inside a sentence at least once. A word seen only at the start
 *  of sentences ("According to…") stays an ordinary word. "I" is not a name. */
export function findNames(texts: string[]): Set<string> {
  const lowerSeen = new Set<string>(), capital = new Set<string>(), midCapital = new Set<string>();
  for (const t of texts) {
    for (const tok of tokens(t)) {
      const key = baseForm(tok.lower);
      if (/^[a-z]/.test(tok.raw)) lowerSeen.add(key);
      else { capital.add(key); if (!tok.sentenceStart) midCapital.add(key); }
    }
  }
  const names = new Set<string>();
  for (const w of capital) {
    if (w.length < 2 || lowerSeen.has(w)) continue;
    if (midCapital.has(w)) names.add(w);
  }
  return names;
}

export interface WordInfo { lemma: string; entry?: LexEntry }

/* Suffix rules tried only when neither the word nor the lemmatizer's forms
   are on the lists ("others" -> "other", "auls" -> "aul"). */
function suffixForms(w: string): string[] {
  const out: string[] = [];
  const add = (x: string) => { if (x.length > 2) out.push(x); };
  if (w.endsWith("ies")) add(`${w.slice(0, -3)}y`);
  if (w.endsWith("es")) add(w.slice(0, -2));
  if (w.endsWith("s")) add(w.slice(0, -1));
  if (w.endsWith("ied")) add(`${w.slice(0, -3)}y`);
  if (w.endsWith("ed")) { add(w.slice(0, -2)); add(w.slice(0, -1)); }
  if (w.endsWith("ing")) { add(w.slice(0, -3)); add(`${w.slice(0, -3)}e`); }
  // Not after a double s: "hissing" is hiss, not "his".
  if (/([b-df-hj-np-rtv-z])\1(ed|ing)$/.test(w)) add(w.replace(/([b-df-hj-np-rtv-z])\1(ed|ing)$/, "$1"));
  if (w.endsWith("ily")) add(`${w.slice(0, -3)}y`);
  if (w.endsWith("ly")) add(w.slice(0, -2));
  return out;
}

/** The dictionary form of a word and its entry in the lists, if any. Of all
 *  forms found ("saw": the noun saw, B2, and the verb see, A1) the lowest
 *  level wins: a learner who knows "see" can read "saw". */
export function lookup(lower: string, lex: Lexicon, lemmatize: Lemmatize): WordInfo {
  const base = baseForm(lower);
  const pick = (forms: string[]) => {
    let best: WordInfo | null = null;
    for (const f of forms) {
      const entry = lex.get(f);
      if (entry && (!best?.entry || rank(entry.level) < rank(best.entry.level))) best = { lemma: f, entry };
    }
    return best;
  };
  const lemmas = lemmatize(base);
  return pick([lower, base, ...lemmas]) ?? pick(suffixForms(base)) ?? { lemma: lemmas[0] ?? base };
}

/** Moving-average type-token ratio; plain TTR when the text is shorter than the window. */
export function mattr(words: string[], window = CORPUS_MATTR_WINDOW): number {
  if (!words.length) return 0;
  if (words.length <= window) return new Set(words).size / words.length;
  let sum = 0;
  const counts = new Map<string, number>();
  for (let i = 0; i < window; i++) counts.set(words[i], (counts.get(words[i]) ?? 0) + 1);
  sum += counts.size / window;
  for (let i = window; i < words.length; i++) {
    const out = words[i - window];
    const n = counts.get(out)! - 1;
    if (n) counts.set(out, n); else counts.delete(out);
    counts.set(words[i], (counts.get(words[i]) ?? 0) + 1);
    sum += counts.size / window;
  }
  return sum / (words.length - window + 1);
}

/* ---------- one text ---------- */

export interface WordCount { lemma: string; count: number }
export interface LevelledWord extends WordCount { level: Cefr }

export interface TextProfile {
  story: string;
  label: Label;
  words: number;
  sentences: number;
  meanSentence: number;
  maxSentence: number;
  lemmaTypes: number;
  mattr: number;
  /** Running words (names excluded) at each list level, and off the lists. */
  levelTokens: Record<Cefr | "offList", number>;
  nameTokens: number;
  /** Cumulative share of running words (names excluded) known up to each level. */
  coverage: Record<Cefr, number>;
  estimatedAdequate: Estimate;
  estimatedOptimal: Estimate;
  /** 95 % estimate if words off the lists (khan, steppe, yurt…) count as known: an upper bound. */
  estimatedAdequateOffListKnown: Estimate;
  /** Share of tappable words the reader translates (names included). The
   *  reader splits the text at spaces, so "worn-out" is one tap, not two. */
  glossCoverage: number;
  glossMissing: string[];
  /** Lemmas not in the lower levels of the same tale; null at A1. */
  newLemmas: number | null;
  aboveLabel: LevelledWord[];
  offList: WordCount[];
  targetCandidates: LevelledWord[];
}

const round = (x: number, d = 3) => Math.round(x * 10 ** d) / 10 ** d;
const byCount = (a: WordCount, b: WordCount) => b.count - a.count || a.lemma.localeCompare(b.lemma);

export interface ProfileContext {
  lex: Lexicon;
  lemmatize: Lemmatize;
  names: Set<string>;
  glossary: Record<string, string>;
}

/** Lemmas of a text, names excluded. */
export function lemmaSet(text: string, ctx: Pick<ProfileContext, "lex" | "lemmatize" | "names">): Set<string> {
  const out = new Set<string>();
  for (const t of tokens(text)) {
    if (ctx.names.has(baseForm(t.lower))) continue;
    out.add(lookup(t.lower, ctx.lex, ctx.lemmatize).lemma);
  }
  return out;
}

export function profileText(story: string, label: Label, text: string, lower: Set<string> | null, ctx: ProfileContext): TextProfile {
  const toks = tokens(text);
  const sents = sentences(text).map((s) => (foldAccents(s).match(WORD) ?? []).length).filter(Boolean);
  const levelTokens = Object.fromEntries([...CEFR, "offList"].map((k) => [k, 0])) as Record<Cefr | "offList", number>;
  const lemmas: string[] = [];
  const counts = new Map<string, { count: number; entry?: LexEntry }>();
  // Translation coverage over the words the reader makes tappable (ReaderScreen splits at spaces).
  const taps = text.split(/\s+/).filter((w) => /[A-Za-z]/.test(foldAccents(w)));
  const glossMissing = new Set<string>();
  let glossed = 0;
  for (const w of taps) if (glossKey(w, ctx.glossary)) glossed++; else glossMissing.add(foldAccents(w).toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, ""));
  let nameTokens = 0;

  for (const t of toks) {
    if (ctx.names.has(baseForm(t.lower))) { nameTokens++; continue; }
    const info = lookup(t.lower, ctx.lex, ctx.lemmatize);
    lemmas.push(info.lemma);
    if (info.entry) levelTokens[info.entry.level]++; else levelTokens.offList++;
    const c = counts.get(info.lemma) ?? { count: 0, entry: info.entry };
    c.count++;
    counts.set(info.lemma, c);
  }

  const known = lemmas.length;
  let cum = 0;
  const coverage = {} as Record<Cefr, number>;
  for (const l of CEFR) { cum += levelTokens[l]; coverage[l] = known ? round(cum / known) : 0; }
  const estimate = (threshold: number): Estimate => CEFR.find((l) => coverage[l] >= threshold) ?? "above C2";
  const offShare = known ? levelTokens.offList / known : 0;
  const lenient = CEFR.find((l) => coverage[l] + offShare >= CORPUS_COVERAGE_ADEQUATE) ?? "above C2";

  const entries = [...counts.entries()].map(([lemma, c]) => ({ lemma, count: c.count, entry: c.entry }));
  const labelRank = rank(label);
  const aboveLabel = entries
    .filter((e) => e.entry && rank(e.entry.level) > labelRank)
    .map((e) => ({ lemma: e.lemma, count: e.count, level: e.entry!.level }))
    .sort((a, b) => rank(b.level) - rank(a.level) || byCount(a, b));
  const offList = entries.filter((e) => !e.entry).map(({ lemma, count }) => ({ lemma, count })).sort(byCount);

  const minRepeats = CORPUS_TARGET_MIN_REPEATS[label];
  // Draft targets: content words at the text's level or one below, repeated
  // enough times. A text with too few of them gets a short list on purpose.
  const near = (l: Cefr) => rank(l) === labelRank || rank(l) === labelRank - 1;
  const targetCandidates = entries
    .filter((e) => e.entry?.content && !NOT_TARGET.has(e.lemma) && near(e.entry.level) && e.count >= minRepeats && e.lemma.length > 2)
    .map((e) => ({ lemma: e.lemma, count: e.count, level: e.entry!.level }))
    .sort((a, b) => rank(b.level) - rank(a.level) || byCount(a, b))
    .slice(0, CORPUS_TARGETS_PER_LEVEL[label]);

  return {
    story, label,
    words: toks.length,
    sentences: sents.length,
    meanSentence: round(toks.length / Math.max(1, sents.length), 1),
    maxSentence: Math.max(0, ...sents),
    lemmaTypes: counts.size,
    mattr: round(mattr(lemmas)),
    levelTokens, nameTokens, coverage,
    estimatedAdequate: estimate(CORPUS_COVERAGE_ADEQUATE),
    estimatedOptimal: estimate(CORPUS_COVERAGE_OPTIMAL),
    estimatedAdequateOffListKnown: lenient,
    glossCoverage: taps.length ? round(glossed / taps.length) : 0,
    glossMissing: [...glossMissing].sort(),
    newLemmas: lower ? [...counts.keys()].filter((l) => !lower.has(l)).length : null,
    aboveLabel, offList, targetCandidates,
  };
}

/* ---------- the whole corpus ---------- */

export interface LabelSummary {
  label: Label;
  texts: number;
  wordsMean: number; wordsMin: number; wordsMax: number;
  meanSentence: number;
  mattr: number;
  coverageAtLabel: number;
  glossCoverage: number;
  /** How many texts reach 95 % coverage at, below or above their label. */
  adequateBelow: number; adequateAt: number; adequateAbove: number;
}

export interface CorpusReport {
  generator: string;
  contentVersion: string;
  contentHash: string;
  sources: string[];
  thresholds: { adequate: number; optimal: number; mattrWindow: number };
  names: string[];
  texts: TextProfile[];
  summary: LabelSummary[];
}

export const SOURCES = [
  "The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies (via openlanguageprofiles/olp-en-cefrj). Free for research and commercial use with citation.",
  "Octanove Vocabulary Profile C1/C2, version 1.0. Octanove Labs (via openlanguageprofiles/olp-en-cefrj). CC BY-SA 4.0.",
  "wink-lemmatizer 3.0.4 (WordNet-based, MIT).",
];

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function buildReport(
  stories: StoryInput[],
  input: { lex: Lexicon; lemmatize: Lemmatize; glossary: Record<string, string>; contentVersion: string; contentHash: string },
): CorpusReport {
  const allTexts = stories.flatMap((s) => LABELS.map((l) => s.levels[l] ?? ""));
  const names = findNames(allTexts);
  const ctx: ProfileContext = { lex: input.lex, lemmatize: input.lemmatize, names, glossary: input.glossary };
  const texts: TextProfile[] = [];
  for (const s of stories) {
    const lower = new Set<string>();
    LABELS.forEach((label, i) => {
      const text = s.levels[label] ?? "";
      texts.push(profileText(s.id, label, text, i ? new Set(lower) : null, ctx));
      for (const l of lemmaSet(text, ctx)) lower.add(l);
    });
  }
  const summary = LABELS.map((label): LabelSummary => {
    const ts = texts.filter((t) => t.label === label);
    const r = rank(label);
    const est = ts.map((t) => (t.estimatedAdequate === "above C2" ? CEFR.length : rank(t.estimatedAdequate)));
    return {
      label, texts: ts.length,
      wordsMean: round(mean(ts.map((t) => t.words)), 1),
      wordsMin: Math.min(...ts.map((t) => t.words)), wordsMax: Math.max(...ts.map((t) => t.words)),
      meanSentence: round(mean(ts.map((t) => t.meanSentence)), 1),
      mattr: round(mean(ts.map((t) => t.mattr))),
      coverageAtLabel: round(mean(ts.map((t) => t.coverage[label]))),
      glossCoverage: round(mean(ts.map((t) => t.glossCoverage))),
      adequateBelow: est.filter((e) => e < r).length,
      adequateAt: est.filter((e) => e === r).length,
      adequateAbove: est.filter((e) => e > r).length,
    };
  });
  return {
    generator: "src/research/corpus.ts via scripts/corpus-report.mjs (npm run corpus)",
    contentVersion: input.contentVersion,
    contentHash: input.contentHash,
    sources: SOURCES,
    thresholds: { adequate: CORPUS_COVERAGE_ADEQUATE, optimal: CORPUS_COVERAGE_OPTIMAL, mattrWindow: CORPUS_MATTR_WINDOW },
    names: [...names].sort(),
    texts, summary,
  };
}

/* ---------- outputs ---------- */

const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;
const num = (x: number) => String(x).replace(".", ",");

export const TABLE_BEGIN = "<!-- corpus:begin (generated by npm run corpus, do not edit) -->";
export const TABLE_END = "<!-- corpus:end -->";

/** The generated part of docs/corpus.md. */
export function reportMarkdown(r: CorpusReport): string {
  const lines: string[] = [];
  lines.push(`Версия контента: ${r.contentVersion} (хеш ${r.contentHash}). Имена собственные, исключённые из профиля: ${r.names.join(", ")}.`, "");
  lines.push("### Сводка по уровням", "");
  lines.push("| Метка | Текстов | Слов (среднее, мин–макс) | Слов в предложении | MATTR | Покрытие до своего уровня | Покрытие переводом | 95 % ниже / на / выше метки |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const s of r.summary) {
    lines.push(`| ${s.label} | ${s.texts} | ${num(s.wordsMean)} (${s.wordsMin}–${s.wordsMax}) | ${num(s.meanSentence)} | ${num(s.mattr)} | ${pct(s.coverageAtLabel)} | ${pct(s.glossCoverage)} | ${s.adequateBelow} / ${s.adequateAt} / ${s.adequateAbove} |`);
  }
  lines.push("", "### Каждый текст", "");
  lines.push("| Сказка | Метка | Слов | Предл. | Ср. длина | Макс. | MATTR | До метки | Вне списков | 95 % | 95 %* | 98 % | Перевод | Новых лемм | Черновик целевых слов |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const t of r.texts) {
    const off = t.levelTokens.offList / Math.max(1, t.words - t.nameTokens);
    lines.push(`| ${t.story} | ${t.label} | ${t.words} | ${t.sentences} | ${num(t.meanSentence)} | ${t.maxSentence} | ${num(t.mattr)} | ${pct(t.coverage[t.label])} | ${pct(off)} | ${t.estimatedAdequate} | ${t.estimatedAdequateOffListKnown} | ${t.estimatedOptimal} | ${pct(t.glossCoverage)} | ${t.newLemmas ?? "—"} | ${t.targetCandidates.map((c) => c.lemma).join(", ") || "—"} |`);
  }
  lines.push("", "\\* 95 %, если слова вне списков (khan, steppe, yurt и т. п.) считать известными: верхняя граница.");
  return lines.join("\n");
}

/** Replaces the generated part between the markers. */
export function spliceMarkdown(doc: string, generated: string): string {
  const a = doc.indexOf(TABLE_BEGIN), b = doc.indexOf(TABLE_END);
  if (a < 0 || b < a) throw new Error("docs/corpus.md: markers not found");
  return `${doc.slice(0, a + TABLE_BEGIN.length)}\n\n${generated}\n\n${doc.slice(b)}`;
}

/** src/data/corpusMeta.ts: the two numbers the level picker shows. */
export function metaSource(r: CorpusReport): string {
  const byStory = new Map<string, string[]>();
  for (const t of r.texts) {
    const row = byStory.get(t.story) ?? [];
    row.push(`${t.label}: { words: ${t.words}, newWords: ${t.newLemmas ?? "null"} }`);
    byStory.set(t.story, row);
  }
  const body = [...byStory.entries()].map(([id, rows]) => `  ${id}: { ${rows.join(", ")} },`).join("\n");
  return `/* Generated by npm run corpus (src/research/corpus.ts). Do not edit:
   src/research/corpus.test.ts fails when this is out of date.
   words: running words in the text; newWords: words (lemmas, names excluded)
   not in the lower levels of the same tale, null at A1. docs/corpus.md. */

export interface LevelMeta { words: number; newWords: number | null }

export const CORPUS_META: Record<string, Record<string, LevelMeta>> = {
${body}
};
`;
}

/** The JSON written to docs/corpus-profile.json. */
export const reportJson = (r: CorpusReport) => `${JSON.stringify(r, null, 2)}\n`;
