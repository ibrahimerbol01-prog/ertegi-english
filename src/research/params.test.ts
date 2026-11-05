import { describe, expect, it } from "vitest";
import * as P from "./params";
import { RESEARCH_PARAMS, type EvidenceStrength } from "./params.meta";
import { WEEKS } from "../data/weekWords";
import evidenceDoc from "../../docs/research-evidence.md?raw";
import shoqanApi from "../../api/shoqan.js?raw";
import teacherPanelSql from "../../supabase/migrations/20261107000000_teacher_panel.sql?raw";
import paramsSource from "./params.ts?raw";

// Source of every app file (tests excluded), to check what imports what.
const appSources = import.meta.glob<string>(["../**/*.ts", "../**/*.tsx", "!../**/*.test.ts", "!./params.meta.ts"], {
  query: "?raw", import: "default", eager: true,
});
const STRENGTHS: EvidenceStrength[] = ["strong", "medium", "weak", "design"];
const names = Object.keys(P) as (keyof typeof P)[];

describe("learning parameters: metadata", () => {
  it("every parameter has a metadata entry, and there are no extra entries", () => {
    expect(Object.keys(RESEARCH_PARAMS).sort()).toEqual([...names].sort());
  });

  it.each(names)("%s has a source, an evidence strength, a docs section and a user", (name) => {
    const m = RESEARCH_PARAMS[name];
    expect(m.source.trim()).not.toBe("");
    expect(STRENGTHS).toContain(m.evidence);
    expect(m.doc.trim()).not.toBe("");
    expect(m.usedIn.trim()).not.toBe("");
  });

  it.each(names)("%s: the value in the metadata equals the one in params.ts", (name) => {
    expect(RESEARCH_PARAMS[name].value).toEqual(P[name]);
  });

  it("a parameter without a study says so: design means no study as the main source", () => {
    for (const name of names) {
      const m = RESEARCH_PARAMS[name];
      if (m.evidence === "design") expect(m.source).toMatch(/Проектное решение|Отчёт/);
    }
  });

  it("every docs section named in the metadata exists in docs/research-evidence.md", () => {
    const doc = evidenceDoc;
    const sections = new Set(names.flatMap((n) => RESEARCH_PARAMS[n].doc.split(",").map((s) => s.trim())));
    for (const s of sections) {
      const heading = s.includes(".") ? `### ${s}. ` : `## ${s}. `;
      expect(doc, `section ${s}`).toContain(heading);
    }
  });

  it("every parameter is listed in docs/research-evidence.md", () => {
    const doc = evidenceDoc;
    for (const name of names) expect(doc, name).toContain(`\`${name}\``);
  });
});

describe("learning parameters: values make sense", () => {
  it("Leitner intervals start at 0 for a new word and keep growing", () => {
    const d = P.REVIEW_INTERVAL_DAYS;
    expect(d[0]).toBe(0);
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeGreaterThan(d[i - 1]);
  });

  it("a forgotten word drops at least one box and comes back within the shortest gap", () => {
    expect(P.LAPSE_BOX_DROP).toBeGreaterThanOrEqual(1);
    expect(P.LAPSE_RETRY_DAYS).toBeLessThanOrEqual(P.REVIEW_INTERVAL_DAYS[1]);
  });

  it("Council thresholds: 0 < low < high < 1", () => {
    expect(P.COUNCIL_LOW_SHARE).toBeGreaterThan(0);
    expect(P.COUNCIL_LOW_SHARE).toBeLessThan(P.COUNCIL_HIGH_SHARE);
    expect(P.COUNCIL_HIGH_SHARE).toBeLessThan(1);
  });

  it("quiz pass mark: the share and the percent agree; 5 of 7 and 3 of 4 pass", () => {
    expect(P.QUIZ_PASS_SHARE * 100).toBe(P.QUIZ_PASS_PERCENT);
    expect(Math.ceil(7 * P.QUIZ_PASS_SHARE)).toBe(5);
    expect(Math.ceil(P.LEVEL_QUIZ_QUESTIONS * P.QUIZ_PASS_SHARE)).toBe(3);
  });

  it("a second try earns less than the first, never nothing", () => {
    expect(P.QUIZ_XP_SECOND_TRY).toBeGreaterThan(0);
    expect(P.QUIZ_XP_SECOND_TRY).toBeLessThan(P.QUIZ_XP_FIRST_TRY);
    expect(P.QUIZ_MAX_TRIES).toBeGreaterThanOrEqual(1);
  });

  it("every week in the data has the number of words the parameter says", () => {
    expect(WEEKS.length).toBeGreaterThan(0);
    for (const w of WEEKS) expect(w.words).toHaveLength(P.WEEK_WORDS_PER_WEEK);
    expect(P.DEBATE_MIN_WEEK_WORDS).toBeLessThanOrEqual(P.WEEK_WORDS_PER_WEEK);
  });

  it("five words of the day: own level plus next level", () => {
    expect(P.DAILY_WORDS_AT_LEVEL + P.DAILY_WORDS_STRETCH).toBe(5);
    expect(P.WORD_MASTERED_BOX).toBeLessThan(P.REVIEW_INTERVAL_DAYS.length);
    expect(P.LEVEL_TARGET_SHARE).toBeGreaterThan(0);
    expect(P.LEVEL_TARGET_SHARE).toBeLessThanOrEqual(1);
  });

  it("reading speeds are sorted and include normal speed", () => {
    for (const speeds of [P.READ_SPEEDS, P.SCENE_SPEEDS]) {
      expect(speeds).toContain(1);
      expect([...speeds]).toEqual([...speeds].sort((a, b) => a - b));
    }
  });

  it("Shoqan's daily limits match the server (api/shoqan.js)", () => {
    const m = shoqanApi.match(/DAILY_LIMIT\s*=\s*\{\s*chat:\s*(\d+),\s*tool:\s*(\d+)\s*\}/);
    expect(m, "DAILY_LIMIT in api/shoqan.js").not.toBeNull();
    expect(Number(m![1])).toBe(P.SHOQAN_DAILY_CHAT_LIMIT);
    expect(Number(m![2])).toBe(P.SHOQAN_DAILY_TOOL_LIMIT);
  });

  it("Shoqan's hint ladder has the same number of steps on the server (api/shoqan.js)", () => {
    const m = shoqanApi.match(/export const HINT_STEPS\s*=\s*(\d+);/);
    expect(m, "HINT_STEPS in api/shoqan.js").not.toBeNull();
    expect(Number(m![1])).toBe(P.SHOQAN_HINT_STEPS);
    expect(P.SHOQAN_HINT_ANSWER_MIN_ATTEMPTS).toBeGreaterThanOrEqual(1);
  });

  it("council_stats switches to class numbers at COUNCIL_MIN_VOTES (migration 20261107000000)", () => {
    const m = teacherPanelSql.match(/min_votes constant int := (\d+);/);
    expect(m, "min_votes in council_stats").not.toBeNull();
    expect(Number(m![1])).toBe(P.COUNCIL_MIN_VOTES);
  });
});

describe("learning parameters: bundle", () => {
  // The metadata is long text; app code must not pull it into the bundle.
  it("params.ts imports nothing, and no app file imports params.meta", () => {
    expect(paramsSource).not.toMatch(/^\s*import\s/m);
    const files = Object.keys(appSources);
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) expect(appSources[f], f).not.toMatch(/(from|import\()\s*["'][^"']*params\.meta/);
  });
});
