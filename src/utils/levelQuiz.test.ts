import { describe, expect, it } from "vitest";
import { buildLevelQuiz } from "./levelQuiz";
import { STORIES } from "../constants";

const levels = STORIES.flatMap((s) => Object.entries(s.levels).map(([level, text]) => [`${s.id} ${level}`, text as string] as const));

describe("level checks built from every tale", () => {
  it.each(levels)("%s gives 4 sound questions", (_, text) => {
    const quiz = buildLevelQuiz(text);
    expect(quiz).toHaveLength(4);
    const answers = new Set<string>();
    for (const q of quiz) {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.sentence).toContain("___");
      answers.add(q.options[q.correct]);
    }
    expect(answers.size).toBe(4); // no word asked twice
  });

  it("the same level always gives the same quiz", () => {
    const text = levels[0][1];
    expect(buildLevelQuiz(text)).toEqual(buildLevelQuiz(text));
  });

  it("gives the same quiz whatever sort algorithm the JS engine uses (Chrome, Safari, Firefox)", () => {
    // A different, correct sort: insertion sort that compares in another order than V8's.
    const native = Array.prototype.sort;
    const insertion = function <T>(this: T[], cmp?: (a: T, b: T) => number) {
      const c = cmp ?? ((a: T, b: T) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0));
      for (let i = 1; i < this.length; i++) {
        const x = this[i];
        let j = i - 1;
        while (j >= 0 && c(x, this[j]) < 0) { this[j + 1] = this[j]; j--; }
        this[j + 1] = x;
      }
      return this;
    };
    const before = levels.map(([, text]) => buildLevelQuiz(text));
    Array.prototype.sort = insertion as typeof native;
    try {
      const after = levels.map(([, text]) => buildLevelQuiz(text));
      expect(after).toEqual(before);
    } finally {
      Array.prototype.sort = native;
    }
  });
});
