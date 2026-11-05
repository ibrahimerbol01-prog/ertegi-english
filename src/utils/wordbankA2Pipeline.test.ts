import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STORIES } from "../constants";
import { lemmaAs } from "../research/lemmatize";
import { WORDBANK_LEVELS, WORDBANK_SOURCES, WORDBANK_TRANSLATION_FILES } from "../data/wordbank/config";
import type { WordbankEntry } from "../data/wordbank/types";
import { buildWordbank } from "./wordbankBuild";

/* The A2 translation pipeline, ready before its files exist: the same build and
   apply step as A1 (src/utils/wordbankTranslations.ts), run here on TEST DATA
   (the CSV text below is made up for the test, it is not a translation). The
   real A2.json is not changed until research/wordbank-translations/a2-*.csv arrive. */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const csvs = Object.fromEntries(WORDBANK_SOURCES.map((s) => [s.file, read(s.file)]));
const a2 = JSON.parse(read("src/data/wordbank/A2.json")) as WordbankEntry[];
// Four real A2 pairs to hang the test data on.
const [w1, w2, w3, w4] = a2.filter((e) => /^[a-z]+$/.test(e.word)).slice(0, 4);
const AGREED = `headword,pos,kk,ru\n${w1.word},${w1.pos},TEST-kk-1,TEST-ru-1\n${w2.word},${w2.pos},TEST-kk-2,TEST-ru-2\n`;
const REVIEW = "headword,pos,kk_claude,kk_gemini,ru_claude,ru_gemini,причина,kk_final,ru_final,reviewer\n" +
  `${w3.word},${w3.pos},x,y,x,y,kk расходится,,,\n${w4.word},${w4.pos},x,y,x,y,kk расходится,TEST-kk-4,TEST-ru-4,teacher\n`;
const ARBITRATION = "id,headword,pos,kk_choice,kk_final,ru_choice,ru_final,source_url\n" +
  `1,${w2.word},${w2.pos},claude,TEST-kk-2b,claude,TEST-ru-2b,https://example.org/${w2.word}\n`;

describe("A2 translation pipeline (test data)", () => {
  it("the config has A2 files named like A1's", () => {
    for (const l of ["A1", "A2"] as const) {
      const f = WORDBANK_TRANSLATION_FILES[l]!;
      const p = l.toLowerCase();
      expect(f).toEqual({
        agreed: `research/wordbank-translations/${p}-agreed.csv`,
        review: `research/wordbank-translations/${p}-review.csv`,
        arbitration: `research/wordbank-translations/${p}-arbitration.csv`,
      });
    }
  });

  it("agreed, ai-reviewed, human and needs-review land on A2 exactly as on A1", () => {
    const { levels } = buildWordbank(csvs, STORIES, lemmaAs, WORDBANK_SOURCES, { A2: { agreed: AGREED, review: REVIEW, arbitration: ARBITRATION } });
    const get = (w: WordbankEntry) => levels.A2.find((e) => e.word === w.word && e.pos === w.pos)!;
    expect(get(w1)).toMatchObject({ kk: "TEST-kk-1", ru: "TEST-ru-1", tr: "agreed" });
    expect(get(w2)).toMatchObject({ kk: "TEST-kk-2b", ru: "TEST-ru-2b", tr: "ai-reviewed" });
    expect(get(w3)).toMatchObject({ kk: "", ru: "", tr: "needs-review" });
    expect(get(w4)).toMatchObject({ kk: "TEST-kk-4", ru: "TEST-ru-4", tr: "human" });
    // Words outside the files keep no status, and the other levels are not touched.
    expect(levels.A2.filter((e) => e.tr).length).toBe(4);
    for (const l of WORDBANK_LEVELS.filter((x) => x !== "A2")) expect(levels[l].some((e) => e.tr)).toBe(false);
  });

  it("a pair in the A2 files that is not an A2 word stops the build", () => {
    expect(() => buildWordbank(csvs, STORIES, lemmaAs, WORDBANK_SOURCES, { A2: { agreed: "headword,pos,kk,ru\nnot-a-word,noun,x,y\n" } })).toThrow(/no wordbank entry/);
  });

  it("a level with no translation files yet is left unchanged", () => {
    const plain = buildWordbank(csvs, STORIES, lemmaAs, WORDBANK_SOURCES, {}).files.A2;
    const empty = buildWordbank(csvs, STORIES, lemmaAs, WORDBANK_SOURCES, { A2: {} }).files.A2;
    expect(empty).toBe(plain);
  });

  it("the real A2.json has no translations while the a2-*.csv files do not exist", () => {
    const anyFile = Object.values(WORDBANK_TRANSLATION_FILES.A2!).some((p) => existsSync(join(root, p)));
    if (anyFile) return; // the files arrived: wordbank.test.ts checks A2.json against them
    expect(a2.every((e) => e.tr === undefined && e.kk === "" && e.ru === "")).toBe(true);
  });
});
