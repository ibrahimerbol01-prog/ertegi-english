import { describe, expect, it } from "vitest";
import { STORIES } from "../constants";
import { COUNCIL } from "./council";
import { CONTENT_HASH, CONTENT_VERSION } from "./contentVersion";

// FNV-1a, 32 bit: enough to notice any change in the text.
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const content = JSON.stringify({
  stories: STORIES.map((s) => ({ id: s.id, levels: s.levels, quiz: s.quizQuestions })),
  council: COUNCIL.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, correct: q.correct })),
});

describe("content version", () => {
  it("is a date", () => expect(CONTENT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  it("changes together with the tales, quizzes and council questions", () => {
    const hash = fnv1a(content);
    expect(CONTENT_HASH, `The content changed: set CONTENT_VERSION to today's date and CONTENT_HASH to "${hash}" in src/data/contentVersion.ts`).toBe(hash);
  });
});
