import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv } from "./corpus";

/* Task 6: an independent Kazakh and Russian translation of every A1 word of
   CEFR-J 1.5 (research/wordbank-translations/a1-claude.csv), to be compared
   with a second translation and checked by a person before any use. */

const root = join(__dirname, "..", "..");
const [header, ...rows] = parseCsv(readFileSync(join(root, "research/wordbank-translations/a1-claude.csv"), "utf8"));
const [srcHeader, ...srcRows] = parseCsv(readFileSync(join(root, "research/cefr/cefrj-vocabulary-profile-1.5.csv"), "utf8"));
const col = (h: string) => srcHeader.indexOf(h);
const a1 = srcRows.filter((r) => r[col("CEFR")] === "A1").map((r) => `${r[col("headword")]}|${r[col("pos")]}`);

describe("A1 translation (Claude)", () => {
  it("has the columns headword, pos, kk, ru, note and five fields in every row", () => {
    expect(header).toEqual(["headword", "pos", "kk", "ru", "note"]);
    for (const r of rows) expect(r.length, r.join(",")).toBe(5);
  });

  it("has every A1 word of CEFR-J 1.5 exactly once (word + part of speech), and nothing else", () => {
    const keys = rows.map((r) => `${r[0]}|${r[1]}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual([...a1].sort());
    expect(keys.length).toBe(1164);
  });

  it("has no empty kk or ru", () => {
    for (const r of rows) {
      expect(r[2].trim(), `kk of ${r[0]}`).not.toBe("");
      expect(r[3].trim(), `ru of ${r[0]}`).not.toBe("");
    }
  });

  it("kk is Cyrillic: Cyrillic letters, no Latin except abbreviations such as CD or DVD", () => {
    for (const r of rows) {
      expect(r[2], `kk of ${r[0]}`).toMatch(/[Ѐ-ӿ]/);
      expect(r[2].replace(/\b[A-Z]{2,}\b/g, ""), `kk of ${r[0]}`).not.toMatch(/[A-Za-z]/);
    }
  });

  it("ru is Cyrillic too", () => {
    for (const r of rows) expect(r[3], `ru of ${r[0]}`).toMatch(/[Ѐ-ӿ]/);
  });
});
