import { describe, expect, it } from "vitest";
import { cefrLevel, hintStep } from "./hintLadder";
import { SHOQAN_HINT_STEPS } from "../research/params";

describe("hintStep", () => {
  it("goes one step up with each request after an attempt", () => {
    expect(hintStep({ asksBefore: 0, attempts: 1, answerShown: false })).toBe(1);
    expect(hintStep({ asksBefore: 1, attempts: 1, answerShown: false })).toBe(2);
    expect(hintStep({ asksBefore: 2, attempts: 1, answerShown: false })).toBe(3);
    expect(hintStep({ asksBefore: 9, attempts: 1, answerShown: false })).toBe(SHOQAN_HINT_STEPS);
  });

  it("never reaches the answer step before the learner has tried", () => {
    expect(hintStep({ asksBefore: 0, attempts: 0, answerShown: false })).toBe(1);
    expect(hintStep({ asksBefore: 5, attempts: 0, answerShown: false })).toBe(SHOQAN_HINT_STEPS - 1);
  });

  it("explains at once when the quiz has already shown the answer", () => {
    expect(hintStep({ asksBefore: 0, attempts: 2, answerShown: true })).toBe(SHOQAN_HINT_STEPS);
  });
});

describe("cefrLevel", () => {
  it("passes a CEFR level and drops anything else", () => {
    expect(cefrLevel("B2")).toBe("B2");
    expect(cefrLevel("quiz")).toBeUndefined();
    expect(cefrLevel(undefined)).toBeUndefined();
  });
});
