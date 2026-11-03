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
});
