import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { WordbankEntry } from "../data/wordbank/types";
import { matchesQuery } from "../components/screens/wordbankMeaning";

/* Search in «Сөздік қоры» (WordbankScreen.tsx): English headword from the start of a
   word, or the shown Kazakh / Russian meaning; needs-review words have no meaning to match. */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const e = (word: string, extra: Partial<WordbankEntry> = {}): WordbankEntry =>
  ({ word, pos: "noun", level: "A1", source: "cefrj", example: null, kk: "", ru: "", ...extra });

describe("wordbank search", () => {
  it("an empty query matches everything", () => {
    expect(matchesQuery(e("apple"), "")).toBe(true);
    expect(matchesQuery(e("apple"), "   ")).toBe(true);
  });

  it("matches the English word from its start, any spelling of the headword, any case", () => {
    expect(matchesQuery(e("apple"), "app")).toBe(true);
    expect(matchesQuery(e("apple"), "APP")).toBe(true);
    expect(matchesQuery(e("pineapple"), "app")).toBe(false);
    expect(matchesQuery(e("color/colour"), "colou")).toBe(true);
    expect(matchesQuery(e("ice cream"), "cream")).toBe(true);
    expect(matchesQuery(e("cafe/café"), "cafe")).toBe(true);
  });

  it("matches the shown Kazakh and Russian meaning anywhere, ё as е", () => {
    const apple = e("apple", { kk: "алма", ru: "яблоко", tr: "agreed" });
    expect(matchesQuery(apple, "алма")).toBe(true);
    expect(matchesQuery(apple, "Яблок")).toBe(true);
    expect(matchesQuery(e("hedgehog", { kk: "кірпі", ru: "ёж", tr: "human" }), "еж")).toBe(true);
  });

  it("a word still under review has no meaning to match, only its English form", () => {
    const watch = e("watch", { tr: "needs-review" });
    expect(matchesQuery(watch, "сағат")).toBe(false);
    expect(matchesQuery(watch, "wat")).toBe(true);
  });

  it("finds real A1 words: both parts of speech of \"watch\", and a word by its Kazakh meaning", () => {
    const a1 = JSON.parse(read("src/data/wordbank/A1.json")) as WordbankEntry[];
    expect(a1.filter((x) => matchesQuery(x, "watch")).map((x) => `${x.word}|${x.pos}`)).toEqual(expect.arrayContaining(["watch|noun", "watch|verb"]));
    const shown = a1.find((x) => x.tr === "agreed" && x.kk)!;
    expect(a1.filter((x) => matchesQuery(x, shown.kk))).toContainEqual(shown);
  });

  it("the screen searches every part of speech of the level and still leaves out the study's target words", () => {
    const src = read("src/components/screens/WordbankScreen.tsx");
    expect(src).toContain("!excluded.has(cardWord(e.word).toLowerCase()) && (searching ? matchesQuery(e, query) : posGroup(e.pos) === group)");
    expect(src).toContain('type="search"');
  });
});
