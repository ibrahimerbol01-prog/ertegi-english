import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RESEARCH_MODE, STUDY_ID } from "./mode";
import { APP_STORIES, STUDY_STORY_IDS, studyStories } from "./stories";
import { STORIES } from "../constants";
import { researchContext, dammDigit, makeStudyCode, normalizeStudyCode, readStudyCode, sequenceOf, studyCodeKey, writeStudyCode } from "./studyCode";
import { KINDS } from "../utils/learnerSync";
// @ts-expect-error plain JS script without types
import { makeCodes, codeOf } from "../../scripts/study-codes.mjs";

const root = join(__dirname, "..", "..");
const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe("research mode (R4)", () => {
  it("is off in the ordinary build and the tests", () => {
    expect(RESEARCH_MODE).toBe(false);
    expect(STUDY_ID).toBe("");
    expect(APP_STORIES).toBe(STORIES);
  });
  it("keeps the five study tales in study order", () => {
    expect(studyStories(STORIES).map((s) => s.id)).toEqual([...STUDY_STORY_IDS]);
    expect(STUDY_STORY_IDS).toEqual(["er_tostik", "tazsha_bala", "ayaz_bi", "asan_kaigy", "alpamys"]);
  });
  it("marks events with the study and the participant code", () => {
    expect(researchContext("stage0", "ERT-5724")).toEqual({ research: true, study_id: "stage0", study_code: "ERT-5724" });
    expect(researchContext("", null)).toEqual({ research: true, study_id: "unset" });
  });
  it("the define in vite.config.ts makes the flag a build-time literal", () => {
    const cfg = readFileSync(join(root, "vite.config.ts"), "utf8");
    expect(cfg).toContain("'import.meta.env.VITE_RESEARCH_MODE'");
    expect(cfg).toContain("'import.meta.env.VITE_STUDY_ID'");
    expect(cfg).toContain("__ERTEGI_RESEARCH__: JSON.stringify(research)");
  });
});

describe("participant codes", () => {
  it("Damm check digit (572 → 4)", () => {
    expect(dammDigit("572")).toBe(4);
    expect(dammDigit("5724")).toBe(0);
    expect(makeStudyCode(572)).toBe("ERT-5724");
    expect(makeStudyCode(7)).toBe(`ERT-007${dammDigit("007")}`);
  });
  it("accepts the ways a learner types it", () => {
    for (const s of ["ERT-5724", "ert 5724", "ERT5724", "5724", " ЕРТ-5724 ", "ERT–5724"]) expect(normalizeStudyCode(s)).toBe("ERT-5724");
  });
  it("refuses a typo, swapped digits and junk", () => {
    for (const s of ["ERT-5723", "ERT-7524", "ERT-5742", "ERT-572", "ERT-57245", "Aigerim", ""]) expect(normalizeStudyCode(s)).toBeNull();
    // Every single-digit error of every code is caught.
    for (let n = 0; n < 1000; n += 37) {
      const c = makeStudyCode(n).slice(4);
      for (let pos = 0; pos < 4; pos++) for (let d = 0; d < 10; d++) {
        if (String(d) === c[pos]) continue;
        expect(normalizeStudyCode(c.slice(0, pos) + d + c.slice(pos + 1))).toBeNull();
      }
    }
  });
  it("sequence from the number: even AB, odd BA", () => {
    expect(sequenceOf("ERT-5724")).toBe("AB");
    expect(sequenceOf(makeStudyCode(573))).toBe("BA");
  });
  it("is kept per learner and refuses a broken value", () => {
    const s = mem();
    expect(readStudyCode(s, "u1")).toBeNull();
    writeStudyCode(s, "u1", "ERT-5724", "2026-11-05T09:00:00.000Z");
    expect(JSON.parse(s.m.get(studyCodeKey("u1"))!)).toEqual({ code: { code: "ERT-5724", at: "2026-11-05T09:00:00.000Z" } });
    expect(readStudyCode(s, "u1")).toBe("ERT-5724");
    expect(readStudyCode(s, "u2")).toBeNull();
    s.setItem(studyCodeKey("u3"), '{"code":{"code":"ERT-5723"}}');
    expect(readStudyCode(s, "u3")).toBeNull();
    s.setItem(studyCodeKey("u4"), "{broken");
    expect(readStudyCode(s, "u4")).toBeNull();
    expect(readStudyCode(null, "u1")).toBeNull();
  });
  it("the script makes the same codes, unique and balanced", () => {
    expect(codeOf(572)).toBe("ERT-5724");
    const rows = makeCodes(40) as { code: string; sequence: string }[];
    expect(new Set(rows.map((r) => r.code)).size).toBe(40);
    for (const r of rows) {
      expect(normalizeStudyCode(r.code)).toBe(r.code);
      expect(sequenceOf(r.code)).toBe(r.sequence);
    }
    expect(rows.filter((r) => r.sequence === "AB").length).toBe(20);
  });
  it("learner_state kinds in the code = the check in the newest migration", () => {
    const sql = readFileSync(join(root, "supabase", "migrations", "20261109000000_study_code.sql"), "utf8").replace(/--.*$/gm, "");
    const m = sql.match(/learner_state_kind_check check \(kind in \(([\s\S]*?)\)\);/);
    expect(m).not.toBeNull();
    expect([...m![1].matchAll(/'(\w+)'/g)].map((x) => x[1]).sort()).toEqual([...KINDS].sort());
  });
});
