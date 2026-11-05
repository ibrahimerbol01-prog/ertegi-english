import { describe, expect, it } from "vitest";
import { asksConfidence, retryOrder } from "./quizRetry";
import { cardDirection } from "./progress";
import { QUIZ_CONFIDENCE_EVERY, SRS_PRODUCE_FROM_BOX } from "../research/params";

describe("quiz retry (I1)", () => {
  it("asks for confidence on every n-th question, starting with the first", () => {
    expect(asksConfidence(0)).toBe(true);
    expect(asksConfidence(QUIZ_CONFIDENCE_EVERY)).toBe(true);
    expect(asksConfidence(1)).toBe(1 % QUIZ_CONFIDENCE_EVERY === 0);
  });

  it("keeps only mistakes; sure-but-wrong first, then missed, then second try", () => {
    const round = [0, 1, 2, 3, 4, 5];
    const results = ["first", "second", "missed", "second", "first", "missed"] as const;
    expect(retryOrder(round, [...results], { 3: "sure", 2: "guess", 0: "sure" })).toEqual([3, 2, 5, 1]);
  });

  it("returns nothing when every answer was right first time, and skips unanswered", () => {
    expect(retryOrder([0, 1], ["first", "first"], {})).toEqual([]);
    expect(retryOrder([0, 1, 2], ["missed"], {})).toEqual([0]);
  });
});

describe("flashcard direction (I3)", () => {
  it("new and weak words are recognised (EN→KZ), stronger ones recalled (KZ→EN)", () => {
    expect(cardDirection(undefined)).toBe("en_kk");
    expect(cardDirection(SRS_PRODUCE_FROM_BOX - 1)).toBe("en_kk");
    expect(cardDirection(SRS_PRODUCE_FROM_BOX)).toBe("kk_en");
    expect(cardDirection(6)).toBe("kk_en");
  });
});
