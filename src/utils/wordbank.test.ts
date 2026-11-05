import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STORIES } from "../constants";
import { DICT } from "../dict";
import { LangContext } from "../lang";
import { lemmaAs } from "../research/lemmatize";
import { sentences } from "../research/corpus";
import { EXCLUDED_UNTIL_DELAYED_TEST, POS_GROUPS, WORDBANK_LEVELS, WORDBANK_SOURCES, cardWord, posGroup } from "../data/wordbank/config";
import { loadWordbankLevel } from "../data/wordbank";
import type { WordbankEntry } from "../data/wordbank/types";
import { buildWordbank, isExcluded, variants } from "./wordbankBuild";
import { FlashcardsScreen } from "../components/screens/WordsScreens";

/* «Сөздік қоры» (src/data/wordbank): the generated data is up to date, well
   formed, honest (examples are real sentences of our tales, no invented
   translations) and keeps the study's target words out until the delayed test. */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const csvs = Object.fromEntries(WORDBANK_SOURCES.map((s) => [s.file, read(s.file)]));
const built = buildWordbank(csvs, STORIES, lemmaAs);
const files = Object.fromEntries(WORDBANK_LEVELS.map((l) => [l, read(`src/data/wordbank/${l}.json`)]));
const data = Object.fromEntries(WORDBANK_LEVELS.map((l) => [l, JSON.parse(files[l]) as WordbankEntry[]]));
const all = WORDBANK_LEVELS.flatMap((l) => data[l]);

describe("wordbank data", () => {
  it("is up to date: run `npm run wordbank` after a change to a source, the exclusions or a tale", () => {
    for (const l of WORDBANK_LEVELS) expect(files[l], `src/data/wordbank/${l}.json`).toBe(built.files[l]);
  });

  it("has every level, about 10 000 words, A1 first in the app", () => {
    for (const l of WORDBANK_LEVELS) expect(data[l].length, l).toBeGreaterThan(500);
    expect(all.length).toBeGreaterThan(9000);
    expect(WORDBANK_LEVELS[0]).toBe("A1");
  });

  it("every entry is well formed, in the file of its level, from a known source, with empty translations", () => {
    const ids = new Set(WORDBANK_SOURCES.map((s) => s.id));
    for (const l of WORDBANK_LEVELS) {
      const keys = new Set<string>();
      for (const e of data[l]) {
        expect(Object.keys(e).sort()).toEqual(["example", "kk", "level", "pos", "ru", "source", "word"]);
        expect(e.level).toBe(l);
        expect(ids.has(e.source)).toBe(true);
        expect(WORDBANK_SOURCES.find((s) => s.id === e.source)!.levels).toContain(l);
        expect(e.word.trim()).toBe(e.word);
        expect(e.word).not.toBe("");
        // Translations come later, from a reviewed task: nothing invented here.
        expect(e.kk).toBe("");
        expect(e.ru).toBe("");
        const k = `${e.word.toLowerCase()}|${e.pos}`;
        expect(keys.has(k), `duplicate ${k}`).toBe(false);
        keys.add(k);
      }
    }
  });

  it("every word is in its source with that level and part of speech", () => {
    const rows = new Set<string>();
    for (const s of WORDBANK_SOURCES) {
      for (const line of csvs[s.file].split(/\r?\n/).slice(1)) {
        // headword may be quoted and contain commas: compare on the last two columns only where unquoted.
        rows.add(`${s.id}|${line}`);
      }
    }
    const byLine = (e: WordbankEntry) => [...rows].some((r) => r.startsWith(`${e.source}|`) && r.includes(`,${e.pos},${e.level}`) && r.toLowerCase().includes(e.word.toLowerCase()));
    // Spot check every 50th word (the full rebuild check above covers the rest).
    for (let i = 0; i < all.length; i += 50) expect(byLine(all[i]), JSON.stringify(all[i])).toBe(true);
  });

  it("every example is a real sentence of that tale at that level and contains the word form", () => {
    const tales = new Map(STORIES.map((s) => [s.id, s.levels as Record<string, string>]));
    let n = 0;
    for (const e of all) {
      if (!e.example) continue;
      n++;
      const text = tales.get(e.example.story_id)?.[e.example.level];
      expect(text, `${e.word}: ${e.example.story_id}/${e.example.level}`).toBeTruthy();
      expect(sentences(text!)).toContain(e.example.text);
      expect(new RegExp(`(^|[^A-Za-z])${e.example.form}([^A-Za-z]|$)`).test(e.example.text)).toBe(true);
    }
    expect(n).toBeGreaterThan(1000);
  });

  it("abbreviations get no example (\"a.m./am\" is not the verb \"am\")", () => {
    for (const e of all) if (e.word.includes(".")) expect(e.example).toBeNull();
  });

  it("the parts of speech of the screen cover every entry", () => {
    for (const e of all) expect(POS_GROUPS).toContain(posGroup(e.pos));
  });

  it("the levels are not precached by the PWA: they load when a learner opens a level", () => {
    expect(read("vite.config.ts")).toContain("'**/assets/{A1,A2,B1,B2,C1,C2}-*.js'");
  });

  it("each level loads as its own chunk", async () => {
    for (const l of ["A1", "C2"] as const) expect((await loadWordbankLevel(l)).length).toBe(data[l].length);
  });
});

describe("wordbank keeps the study's target words out until the delayed test", () => {
  const testFiles = [
    "docs/research-design/test-items-draft.json",
    ...readdirSync(join(root, "src", "data")).filter((f) => /^researchTest.*\.json$/.test(f)).map((f) => `src/data/${f}`),
  ];
  const targets = new Set(testFiles.flatMap((f) =>
    (JSON.parse(read(f)) as { items: { word?: string; pseudo?: boolean }[] }).items.filter((i) => i.word && !i.pseudo).map((i) => i.word!.toLowerCase())));

  it("the exclusion list in config.ts has every real target word of the test files", () => {
    expect(testFiles.length).toBeGreaterThanOrEqual(2);
    expect(targets.size).toBeGreaterThan(0);
    const missing = [...targets].filter((w) => !EXCLUDED_UNTIL_DELAYED_TEST.includes(w));
    expect(missing, `add to EXCLUDED_UNTIL_DELAYED_TEST: ${missing.join(", ")}`).toEqual([]);
  });

  it("no target word is in any level file, under any spelling", () => {
    const found = all.filter((e) => variants(e.word).some((v) => targets.has(v)) || targets.has(cardWord(e.word).toLowerCase()));
    expect(found.map((e) => `${e.level} ${e.word}`)).toEqual([]);
    expect(built.excluded).toBeGreaterThanOrEqual(targets.size);
    expect(isExcluded("Prison")).toBe(true);
    expect(isExcluded("horse")).toBe(false);
  });

  it("the screen filters them out too, if a later source brings one back", () => {
    const src = read("src/components/screens/WordbankScreen.tsx");
    expect(src).toMatch(/!excluded\.has\(cardWord\(e\.word\)\.toLowerCase\(\)\)/);
  });
});

describe("wordbank on the ordinary site", () => {
  it("the words tab offers the wordbank next to flashcards and matching", () => {
    for (const lang of ["kk", "en"] as const) {
      const h = renderToStaticMarkup(createElement(LangContext.Provider, { value: lang },
        createElement(FlashcardsScreen, { savedWords: [], onReview: () => {}, lang, mode: "cards", setMode: () => {} })));
      expect(h).toContain(`>${DICT[lang].wbTab}</button>`);
    }
  });

  it("shows the attribution of every source under the list", () => {
    const src = read("src/components/screens/WordbankScreen.tsx");
    expect(src).toContain("WORDBANK_SOURCES.map");
    for (const s of WORDBANK_SOURCES) expect(s.attribution.length).toBeGreaterThan(20);
    expect(WORDBANK_SOURCES.map((s) => s.licence).join(" ")).toContain("CC BY-SA 4.0");
  });
});
