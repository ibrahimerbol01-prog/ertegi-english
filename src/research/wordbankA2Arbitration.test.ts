import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsv } from "./corpus";
import type { WordbankEntry } from "../data/wordbank/types";
import { pairKey } from "../utils/wordbankTranslations";

/* Task 10: blind arbitration of the 242 disputed A2 translations
   (research/wordbank-translations/a2-arbitration.csv, method in a2-arbitration-method.md).
   Format as a1-arbitration.csv; every decision has an open dictionary source. */

const root = join(__dirname, "..", "..");
const [header, ...rows] = parseCsv(readFileSync(join(root, "research/wordbank-translations/a2-arbitration.csv"), "utf8"));
const H = Object.fromEntries(header.map((h, i) => [h, i]));
const get = (r: string[], k: string) => (r[H[k]] ?? "").trim();
const a2 = JSON.parse(readFileSync(join(root, "src/data/wordbank/A2.json"), "utf8")) as WordbankEntry[];
const CHOICES = ["v1", "v2", "both", "human"];

describe("A2 arbitration", () => {
  it("has the columns of a1-arbitration.csv and 242 rows with unique ids", () => {
    expect(header).toEqual(["id", "headword", "pos", "kk_choice", "kk_final", "ru_choice", "ru_final", "source_url", "comment"]);
    expect(rows.length).toBe(242);
    expect(new Set(rows.map((r) => get(r, "id"))).size).toBe(242);
  });

  it("every pair is an A2 word of the wordbank", () => {
    const keys = new Set(a2.map((e) => pairKey(e.word, e.pos)));
    const missing = rows.filter((r) => !keys.has(pairKey(get(r, "headword"), get(r, "pos")))).map((r) => `${get(r, "headword")}|${get(r, "pos")}`);
    expect(missing).toEqual([]);
  });

  it("a choice is v1, v2, both or human; a decided language has a final text, human has none", () => {
    for (const r of rows) for (const lang of ["kk", "ru"]) {
      const c = get(r, `${lang}_choice`), f = get(r, `${lang}_final`);
      expect(CHOICES, `${get(r, "id")} ${lang}`).toContain(c);
      if (c === "human") expect(f, `${get(r, "id")} ${lang}`).toBe("");
      else expect(f, `${get(r, "id")} ${lang}`).not.toBe("");
    }
  });

  it("every decision names an open dictionary source; a row left to a person explains why", () => {
    for (const r of rows) {
      const decided = get(r, "kk_choice") !== "human" || get(r, "ru_choice") !== "human";
      const url = get(r, "source_url");
      if (decided) expect(url, get(r, "id")).toMatch(/^https:\/\/(en\.wiktionary\.org|glosbe\.com)\//);
      for (const u of url.split(" ").filter(Boolean)) expect(u).toMatch(/^https:\/\/(en\.wiktionary\.org|glosbe\.com)\//);
      expect(get(r, "comment"), get(r, "id")).not.toBe("");
    }
  });
});
