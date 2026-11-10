import { describe, expect, it } from "vitest";
import { topTappedWords, MIN_LEARNERS } from "./classTopWords";

const w = (word: string, learners: number, taps = 5, misses = 0) => ({ word, learners, taps, misses });

describe("topTappedWords", () => {
  it("keeps tapped words with at least three learners, most learners first, five at most", () => {
    const out = topTappedWords([w("coat", 4), w("horse", 7), w("clever", 3), w("idea", 2), w("rich", 9), w("road", 5), w("warm", 6), w("trick", 8)]);
    expect(out).toEqual([
      { word: "rich", learners: 9 }, { word: "trick", learners: 8 }, { word: "horse", learners: 7 },
      { word: "warm", learners: 6 }, { word: "road", learners: 5 },
    ]);
  });
  it("never shows a word fewer than three learners are behind (no single learner can be read off)", () => {
    expect(MIN_LEARNERS).toBe(3);
    expect(topTappedWords([w("alone", 1), w("pair", 2)])).toEqual([]);
  });
  it("leaves out words only forgotten in review, never tapped", () => {
    expect(topTappedWords([w("forgot", 6, 0, 9), w("tapped", 3, 1)])).toEqual([{ word: "tapped", learners: 3 }]);
  });
  it("breaks ties by taps, then by word", () => {
    expect(topTappedWords([w("b", 4, 2), w("a", 4, 2), w("c", 4, 9)]).map((x) => x.word)).toEqual(["c", "a", "b"]);
  });
});
