import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STORIES } from "../../src/constants";
import { buildLevelQuiz } from "../../src/utils/levelQuiz";

/* The evaluation set for Shoqan (README.md here): valid JSONL, unique ids,
   every anchor really is in the tale, and the set matches today's quizzes
   (run `node scripts/shoqan-eval-build.mjs` after a change). */

const here = __dirname;
const jsonl = (f: string) => readFileSync(join(here, f), "utf8").split("\n").filter((l) => l.trim());
const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
type Rules = { must: string[]; must_not: string[] };
interface Row {
  id: string; story_id: string; story_title: string; quiz: "tale" | "level"; level: string; type: string;
  question: string | null; sentence: string | null; options: string[]; correct: number; answer: string;
  anchor: string; anchor_level: (typeof LEVELS)[number];
  step1_must: Rules; step2_must: Rules; step3_must: Rules;
}

const lines = jsonl("ladder.jsonl");
const rows = lines.map((l) => JSON.parse(l) as Row);
const story = (id: string) => STORIES.find((s) => s.id === id)!;
const excluded = [...readFileSync(join(here, "README.md"), "utf8").matchAll(/\b([a-z_]+:quiz:\d+)\b/g)].map((m) => m[1]);

describe("shoqan-eval: ladder.jsonl", () => {
  it("every line is valid JSON with all fields", () => {
    expect(rows.length).toBeGreaterThan(100);
    for (const r of rows) {
      for (const k of ["id", "story_id", "story_title", "quiz", "level", "type", "options", "correct", "answer", "anchor", "anchor_level", "step1_must", "step2_must", "step3_must"]) {
        expect(r, `${r.id} has ${k}`).toHaveProperty(k);
      }
      expect(Array.isArray(r.options) && r.options.length >= 2).toBe(true);
      expect(Number.isInteger(r.correct) && r.correct >= 0 && r.correct < r.options.length).toBe(true);
      expect(r.answer).toBe(r.options[r.correct]);
      for (const s of [r.step1_must, r.step2_must, r.step3_must]) {
        expect(s.must.length).toBeGreaterThan(0);
        expect(s.must_not.length).toBeGreaterThan(0);
      }
      // Steps 1–2 forbid the answer, step 3 requires it.
      expect(r.step1_must.must_not.join(" ")).toContain(r.answer);
      expect(r.step3_must.must.join(" ")).toContain(r.answer);
    }
  });

  it("ids are unique", () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it("every anchor occurs word for word in the text of the tale at its level", () => {
    for (const r of rows) {
      expect(r.anchor.trim().length, r.id).toBeGreaterThan(0);
      expect(story(r.story_id).levels[r.anchor_level], r.id).toContain(r.anchor);
    }
  });

  it("a gap question's anchor is its own sentence with the gap filled", () => {
    for (const r of rows.filter((x) => x.sentence?.includes("___"))) expect(r.anchor, r.id).toBe(r.sentence!.replace("___", r.answer));
  });

  it("matches today's quizzes: the tale quiz from constants.ts, the level quizzes from buildLevelQuiz", () => {
    for (const s of STORIES) {
      s.quizQuestions.forEach((q, i) => {
        const id = `${s.id}:quiz:${i + 1}`;
        const r = rows.find((x) => x.id === id);
        // Either in the set, or listed in README.md as left out (no anchor found).
        expect(!!r !== excluded.includes(id), `${id}: in the set or in the README list, not both`).toBe(true);
        if (r) expect([r.question, r.options, r.correct]).toEqual([q.q ?? null, q.options, q.correct]);
      });
      for (const l of LEVELS) {
        buildLevelQuiz(s.levels[l]).forEach((q, i) => {
          const r = rows.find((x) => x.id === `${s.id}:${l}:${i + 1}`);
          expect(r, `${s.id}:${l}:${i + 1}`).toBeTruthy();
          expect([r!.sentence, r!.options, r!.correct]).toEqual([q.sentence, q.options, q.correct]);
        });
      }
    }
    expect(rows.filter((r) => r.quiz === "tale").length + excluded.length).toBe(STORIES.reduce((n, s) => n + s.quizQuestions.length, 0));
  });
});

describe("shoqan-eval: offtopic.jsonl", () => {
  const off = jsonl("offtopic.jsonl").map((l) => JSON.parse(l) as { id: string; draft: boolean; lang: string; category: string; prompt: string; expected: string; must: string[]; must_not: string[] });

  it("has 30 draft requests with unique ids and all fields", () => {
    expect(off.length).toBe(30);
    expect(new Set(off.map((o) => o.id)).size).toBe(30);
    for (const o of off) {
      expect(o.draft).toBe(true);
      expect(["kk", "ru", "en"]).toContain(o.lang);
      expect(["other_subject_homework", "off_topic", "rule_bypass", "personal"]).toContain(o.category);
      expect(["polite_refusal_redirect", "ladder_kept", "support_and_adult"]).toContain(o.expected);
      expect(o.prompt.trim()).not.toBe("");
      expect(o.must.length).toBeGreaterThan(0);
      expect(o.must_not.length).toBeGreaterThan(0);
    }
  });

  it("covers every language and category", () => {
    expect(new Set(off.map((o) => o.lang))).toEqual(new Set(["kk", "ru", "en"]));
    expect(new Set(off.map((o) => o.category)).size).toBe(4);
  });
});
