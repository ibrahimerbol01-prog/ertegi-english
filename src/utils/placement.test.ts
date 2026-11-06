import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import placementFile from "../data/placement.json";
import { EXCLUDED_UNTIL_DELAYED_TEST, WORDBANK_LEVELS } from "../data/wordbank/config";
import type { WordbankEntry } from "../data/wordbank/types";
import { estimate, PLACEMENT_LEVELS, readPlacement, suggestedTaleLevel, writePlacement, type PlacementItem } from "./placement";

/* Placement check v1 (Task 12 B): items only from our wordbank, never a study
   target word or pseudoword; the scoring rule; storage on the device. */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const FILE = placementFile as { version: string; sample: boolean; items: PlacementItem[] };
const levelWords = Object.fromEntries(WORDBANK_LEVELS.map((l) => [l, new Set((JSON.parse(read(`src/data/wordbank/${l}.json`)) as WordbankEntry[]).flatMap((e) => e.word.toLowerCase().split("/").map((w) => w.trim())))]));
const studyPseudo = [
  ...(JSON.parse(read("docs/research-design/test-items-draft.json")).items as { word: string; pseudo?: boolean }[]),
  ...(JSON.parse(read("src/data/researchTest.sample.json")).items as { word: string; pseudo?: boolean }[]),
].filter((i) => i.pseudo).map((i) => i.word.toLowerCase());

describe("placement items", () => {
  it("20 items: 3 real words per level A1–C1 and 5 pseudowords, unique, still a draft", () => {
    expect(FILE.items).toHaveLength(20);
    expect(new Set(FILE.items.map((i) => i.id)).size).toBe(20);
    expect(new Set(FILE.items.map((i) => i.word)).size).toBe(20);
    for (const l of PLACEMENT_LEVELS) expect(FILE.items.filter((i) => i.level === l && !i.pseudo)).toHaveLength(3);
    expect(FILE.items.filter((i) => i.pseudo)).toHaveLength(5);
    expect(FILE.sample).toBe(true);
  });

  it("every real word is in our wordbank at its level and not at any lower level", () => {
    for (const it of FILE.items.filter((i) => !i.pseudo)) {
      expect(levelWords[it.level!].has(it.word), `${it.word} at ${it.level}`).toBe(true);
      for (const lower of WORDBANK_LEVELS.slice(0, WORDBANK_LEVELS.indexOf(it.level!))) expect(levelWords[lower].has(it.word), `${it.word} also at ${lower}`).toBe(false);
    }
  });

  it("no target word of the study and none of its pseudowords", () => {
    for (const it of FILE.items) {
      expect(EXCLUDED_UNTIL_DELAYED_TEST).not.toContain(it.word);
      expect(studyPseudo).not.toContain(it.word);
    }
  });

  it("pseudowords are in no level of the wordbank", () => {
    for (const it of FILE.items.filter((i) => i.pseudo)) for (const l of WORDBANK_LEVELS) expect(levelWords[l].has(it.word), `${it.word} in ${l}`).toBe(false);
  });
});

describe("estimate", () => {
  const items = FILE.items;
  const yesTo = (pred: (i: PlacementItem) => boolean) => Object.fromEntries(items.map((i) => [i.id, pred(i)]));
  const upTo = (n: number) => (i: PlacementItem) => !i.pseudo && PLACEMENT_LEVELS.indexOf(i.level!) < n;

  it("climbs level by level: all words up to B1 known gives B1", () => {
    const r = estimate(items, yesTo(upTo(3)), FILE.version, "2026-11-06T00:00:00Z");
    expect(r.level).toBe("B1");
    expect(r.reliable).toBe(true);
    expect(suggestedTaleLevel(r)).toBe("B1");
  });

  it("2 of 3 words is enough for a level; a gap stops the climb even if higher words are known", () => {
    const a1 = items.filter((i) => i.level === "A1").map((i) => i.id);
    const known = yesTo((i) => !i.pseudo && i.level !== "A2");
    known[a1[0]] = false; // A1: 2 of 3
    expect(estimate(items, known, FILE.version).level).toBe("A1");
  });

  it("nothing known: no level, start at A1", () => {
    const r = estimate(items, {}, FILE.version);
    expect(r.level).toBeNull();
    expect(suggestedTaleLevel(r)).toBe("A1");
  });

  it("yes to more than one pseudoword marks the result as not reliable", () => {
    const r = estimate(items, yesTo(() => true), FILE.version);
    expect(r.level).toBe("C1");
    expect(r.falseAlarms).toBe(5);
    expect(r.reliable).toBe(false);
  });
});

describe("storage on the device", () => {
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
  let s: ReturnType<typeof mem>;
  beforeEach(() => { s = mem(); });

  it("keeps a result or a skip per learner, and survives broken storage", () => {
    expect(readPlacement(s, "u1")).toBeNull();
    const done = estimate(FILE.items, {}, FILE.version, "2026-11-06T00:00:00Z");
    writePlacement(s, "u1", { done });
    expect(readPlacement(s, "u1")).toEqual({ done });
    writePlacement(s, "u2", { skipped: "2026-11-06T00:00:00Z" });
    expect(readPlacement(s, "u2")).toEqual({ skipped: "2026-11-06T00:00:00Z" });
    s.setItem("ertegi_placement_u3", "{broken");
    expect(readPlacement(s, "u3")).toBeNull();
  });
});
