import { describe, expect, it } from "vitest";
import { STORIES } from "../constants";
import { LEGENDS, PASS, RARITY } from "./legends";
import { BATAS, DEFAULT_BATA, MAQALS, OYU, STORY_HISTORY, TURKIC_WORDS, maqalOfDay, oyuForStory } from "./culture";
import { CLAIMS, splitSentences } from "./trailClaims";

/* Content that had no checks (test audit, 05.11.2026): legend cards, proverbs,
   blessings, tale history and the thinking-trail claims. Shape and internal
   consistency only; whether the culture is right is for a person to check. */

const storyIds = STORIES.map((s) => s.id);
const cyr = /[Ѐ-ӿ]/;
const latinWord = /[A-Za-z]{2,}/;

describe("legend cards (LegendCards.tsx)", () => {
  it("ids are unique; rarity and ornament are known; Kazakh name in Cyrillic", () => {
    expect(new Set(LEGENDS.map((l) => l.id)).size).toBe(LEGENDS.length);
    for (const l of LEGENDS) {
      expect(Object.keys(RARITY)).toContain(l.rarity);
      expect(["qoshqar", "shanyraq", "tumar"]).toContain(l.ornament);
      expect(l.kk, l.id).toMatch(cyr);
      expect(l.fact.kk, l.id).toMatch(cyr);
      expect(l.fact.en.trim(), l.id).not.toBe("");
    }
  });

  it("six questions per card, and a card can be won (PASS ≤ 6)", () => {
    for (const l of LEGENDS) expect(l.qs.length, l.id).toBe(6);
    expect(PASS).toBeGreaterThan(0);
    expect(PASS).toBeLessThanOrEqual(6);
  });

  it("every answer index points at an option, and options are distinct", () => {
    for (const l of LEGENDS) for (const q of l.qs) {
      if (q.kind === "tf") { expect(typeof q.a).toBe("boolean"); continue; }
      expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${l.id}: ${q.s}`).toBe(true);
      expect(new Set(q.options).size, `${l.id}: ${q.s}`).toBe(q.options.length);
    }
  });

  it("the answer of a gap line is a word the learner hears in the scene (the line itself may retell it)", () => {
    for (const l of LEGENDS) for (const q of l.qs) {
      if (q.kind !== "gap") continue;
      expect(q.s, l.id).toContain("___");
      const answer = q.options[q.answer];
      expect(new RegExp(`\\b${answer}\\b`, "i").test(l.scene), `${l.id}: "${answer}" in the scene`).toBe(true);
    }
  });
});

describe("proverbs, blessings, ornaments (culture.ts)", () => {
  it("every proverb has Kazakh in Cyrillic, a literal and a real English proverb", () => {
    for (const m of MAQALS) {
      expect(m.kk).toMatch(cyr);
      expect(m.kk).not.toMatch(latinWord);
      expect(m.literal.trim()).not.toBe("");
      expect(m.english.trim()).not.toBe("");
    }
    expect(new Set(MAQALS.map((m) => m.kk)).size).toBe(MAQALS.length);
  });

  it("the proverb of the day has three different options with the right one among them, on every day", () => {
    for (let day = 0; day < MAQALS.length * 3; day++) {
      const q = maqalOfDay(day);
      expect(new Set(q.options).size, `day ${day}`).toBe(3);
      expect(q.options[q.correct]).toBe(q.maqal.english);
    }
  });

  it("every tale has a blessing and a history in both languages; no entry for a tale that does not exist", () => {
    for (const rec of [BATAS, STORY_HISTORY]) {
      for (const id of storyIds) {
        expect(rec[id], id).toBeTruthy();
        expect(rec[id].kk, id).toMatch(cyr);
        expect(rec[id].en.trim(), id).not.toBe("");
      }
      for (const id of Object.keys(rec)) expect(storyIds, id).toContain(id);
    }
    expect(DEFAULT_BATA.kk).toMatch(cyr);
  });

  it("ornaments and Turkic words are complete", () => {
    expect(OYU.map((o) => o.id)).toEqual(["qoshqar", "shanyraq", "tumar"]);
    for (let i = 0; i < 10; i++) expect(OYU).toContain(oyuForStory(i));
    for (const w of TURKIC_WORDS) {
      expect(w.kk).toMatch(cyr);
      expect(w.note.kk).toMatch(cyr);
      expect(w.en.trim()).not.toBe("");
    }
  });
});

describe("thinking trail (trailClaims.ts)", () => {
  it("every tale has a claim question in both languages, and only tales that exist", () => {
    expect(Object.keys(CLAIMS).sort()).toEqual([...storyIds].sort());
    for (const c of Object.values(CLAIMS)) {
      expect(c.kk).toMatch(cyr);
      expect(c.en.trim().endsWith("?")).toBe(true);
    }
  });

  it("splits a level's text into sentences that rebuild it (evidence ids stay stable)", () => {
    for (const s of STORIES) for (const level of Object.values(s.levels)) {
      const parts = splitSentences(level);
      expect(parts.length).toBeGreaterThan(1);
      expect(parts.every((p) => p.length > 0)).toBe(true);
      expect(parts.join(" ").replace(/\s+/g, " ")).toBe(level.trim().replace(/\s+/g, " "));
    }
  });
});
