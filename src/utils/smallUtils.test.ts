import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORIES } from "../constants";
import { glossKey, glossKeys } from "./gloss";
import { findEvidence } from "./evidence";

/* Small modules that had no tests (test audit, 05.11.2026): the reader's
   glossary lookup, the "where is it in the text" evidence after a wrong quiz
   answer, and the proverb collection in localStorage. */

vi.mock("./learnerSync", () => ({ noteChange: vi.fn() }));
const { loadMaqals, saveMaqal } = await import("./maqals");
const { noteChange } = await import("./learnerSync");

describe("glossary lookup (gloss.ts)", () => {
  it("tries the word as written, without a possessive, then letters only", () => {
    expect(glossKeys("Didn't")).toEqual(["didn't", "didn't", "didnt"]);
    expect(glossKeys("man's")).toEqual(["man's", "man", "mans"]);
    expect(glossKeys("Köse,")).toEqual(["kose", "kose", "kose"]);
    expect(glossKeys("“horse”")).toEqual(["horse", "horse", "horse"]);
  });

  it("returns the first key the glossary has, or null", () => {
    const g = { man: "адам", kose: "көсе", "didn't": "істемеді" };
    expect(glossKey("man's", g)).toBe("man");
    expect(glossKey("Köse", g)).toBe("kose");
    expect(glossKey("didn’t", g)).toBe("didn't");
    expect(glossKey("wolf", g)).toBeNull();
    expect(glossKey("...", g)).toBeNull();
  });
});

describe("quiz evidence (evidence.ts)", () => {
  const text = "Aldar Köse is poor. He has an old coat with many holes. The rich man has a warm fur coat. The rich man wants the magic coat.";

  it("a gap question is its own evidence: the sentence with the gap filled", () => {
    expect(findEvidence({ sentence: "He has an old ___ with many holes.", options: ["hat", "coat"], correct: 1 }, [text])).toBe("He has an old coat with many holes.");
  });

  it("finds the sentence that supports the right answer, not one that only shares a word", () => {
    expect(findEvidence({ q: "What does the rich man have?", options: ["A warm fur coat", "A horse"], correct: 0 }, [text])).toBe("The rich man has a warm fur coat.");
  });

  it("gives nothing for a NOT question or a weak match", () => {
    expect(findEvidence({ q: "What does Aldar NOT have?", options: ["A fur coat", "A coat"], correct: 0 }, [text])).toBeNull();
    expect(findEvidence({ q: "Where does the story happen?", options: ["In the city", "In space"], correct: 0 }, [text])).toBeNull();
  });

  it("works on the real tales: every evidence found is a sentence of that tale", () => {
    let found = 0;
    for (const s of STORIES) {
      const texts = Object.values(s.levels);
      for (const q of s.quizQuestions) {
        const e = findEvidence(q, texts);
        if (!e || q.sentence?.includes("___")) continue;
        found++;
        expect(texts.some((t) => t.includes(e)), `${s.id}: ${e}`).toBe(true);
      }
    }
    expect(found).toBeGreaterThan(10);
  });
});

describe("proverb collection (maqals.ts)", () => {
  beforeEach(() => { localStorage.clear(); vi.mocked(noteChange).mockClear(); });

  it("saves per user, once per proverb, and notes the change for sync", () => {
    saveMaqal("u1", 3);
    saveMaqal("u1", 3);
    saveMaqal("u1", 7);
    expect(loadMaqals("u1").sort()).toEqual([3, 7]);
    expect(loadMaqals("u2")).toEqual([]);
    expect(noteChange).toHaveBeenCalledWith("u1", "maqal", "3");
  });

  it("a guest has their own key; broken storage gives an empty list", () => {
    saveMaqal(undefined, 1);
    expect(loadMaqals()).toEqual([1]);
    localStorage.setItem("ertegi_maqals_u3", "{broken");
    expect(loadMaqals("u3")).toEqual([]);
    localStorage.setItem("ertegi_maqals_u4", JSON.stringify([1, "x", null, 2]));
    expect(loadMaqals("u4")).toEqual([1, 2]);
  });
});
