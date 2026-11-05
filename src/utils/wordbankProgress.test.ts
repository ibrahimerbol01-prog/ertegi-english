import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { WordbankEntry } from "../data/wordbank/types";
import { EXCLUDED_UNTIL_DELAYED_TEST, cardWord } from "../data/wordbank/config";
import { levelProgress } from "../components/screens/wordbankMeaning";

/* «Сөздік қоры»: the share of a level's words already in the learner's flashcards. */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const e = (word: string, pos = "noun"): WordbankEntry => ({ word, pos, level: "A1", source: "cefrj", example: null, kk: "", ru: "" });

describe("level progress", () => {
  it("counts saved card words over the level's words", () => {
    expect(levelProgress([e("apple"), e("horse"), e("cat")], new Set(["horse"]))).toEqual({ inCards: 1, total: 3 });
    expect(levelProgress([e("apple"), e("horse")], new Set())).toEqual({ inCards: 0, total: 2 });
  });

  it("a word with two parts of speech counts once, and a saved word from another level does not count", () => {
    expect(levelProgress([e("watch", "noun"), e("watch", "verb"), e("cat")], new Set(["watch", "steppe"]))).toEqual({ inCards: 1, total: 2 });
  });

  it("uses the card word of a headword with several spellings", () => {
    expect(levelProgress([e("color/colour")], new Set(["color"]))).toEqual({ inCards: 1, total: 1 });
  });

  it("on real A1 data the total is the level's distinct card words without the study's target words", () => {
    const a1 = (JSON.parse(read("src/data/wordbank/A1.json")) as WordbankEntry[]).filter((x) => !EXCLUDED_UNTIL_DELAYED_TEST.includes(cardWord(x.word).toLowerCase()));
    const p = levelProgress(a1, new Set(["cat", "horse"]));
    expect(p.inCards).toBe(2);
    expect(p.total).toBe(new Set(a1.map((x) => cardWord(x.word).toLowerCase())).size);
    expect(p.total).toBeGreaterThan(1000);
  });

  it("the screen counts the same words as its list (target words left out) and shows inCards / total", () => {
    const src = read("src/components/screens/WordbankScreen.tsx");
    expect(src).toContain("levelProgress(data.words.filter((e) => !excluded.has(cardWord(e.word).toLowerCase())), saved)");
    expect(src).toContain("{progress.inCards} / {progress.total}");
  });
});
