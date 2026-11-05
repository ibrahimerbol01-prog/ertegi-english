import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateTestSet, sessionItems } from "./engine";
import type { TestSet } from "./types";

// The draft item bank for approval (docs/research-design/test-items-draft.json) must always be a valid test set,
// stay marked as a sample until approved, and keep the two forms parallel (same target words, study-design 5.3).
const path = "docs/research-design/test-items-draft.json";
describe.skipIf(!existsSync(path))("draft test item bank", () => {
  const set = JSON.parse(readFileSync(path, "utf8")) as TestSet;
  it("passes the format validation", () => expect(validateTestSet(set)).toEqual([]));
  it("is still a sample until the supervisor approves it", () => expect(set.sample).toBe(true));
  it("has the same target words in both forms and every format", () => {
    for (const format of ["recognition", "meaning", "use"] as const) {
      const words = (f: "A" | "B") => sessionItems(set, f, "pre").filter((i) => i.format === format && !i.pseudo).map((i) => i.word).sort();
      expect(words("A")).toEqual(words("B"));
    }
  });
  it("never repeats a pseudoword across forms", () => {
    const ps = (f: "A" | "B") => set.items.filter((i) => i.form === f && i.pseudo).map((i) => i.word);
    expect(ps("A").filter((w) => ps("B").includes(w))).toEqual([]);
  });
});
