// node scripts/shoqan-eval-build.mjs: build research/shoqan-eval/ladder.jsonl, the
// help-ladder part of the evaluation set for Shoqan and any model that replaces him
// (research/shoqan-eval/README.md). Extraction only: the questions, options and
// answers are the app's own quizzes; the anchor sentence is found in the tale text
// by the same code the app uses (src/utils/evidence.ts, src/utils/levelQuiz.ts).
// Nothing is written by hand here. Run after a change to a tale or a quiz;
// research/shoqan-eval/ladder.test.ts fails until you do.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = async (p) => (await runnerImport(resolve(root, p), { root, configFile: false, logLevel: "error" })).module;

const { STORIES } = await load("src/constants.ts");
const { buildLevelQuiz } = await load("src/utils/levelQuiz.ts");
const { findEvidence } = await load("src/utils/evidence.ts");
const { HINT_STEPS } = await load("api/shoqan.js");

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

/* Rule checks for each step of the ladder, from the system prompt in api/shoqan.js
   (HELP LADDER and buildSystemPrompt). They say what a reply must and must not do;
   they are not model answers. */
function rules(options, correct) {
  const answer = options[correct];
  const all = options.map((o) => `"${o}"`).join(", ");
  return {
    step1_must: {
      must: ["points to the place in the tale where the answer is (the anchor sentence or its episode)"],
      must_not: [
        `names or quotes the right option "${answer}"`,
        `names, rules out or ranks any option (${all})`,
        "says which option is right or wrong",
        "quotes the anchor sentence word for word where it gives the answer away (in a gap question it holds the missing word)",
      ],
    },
    step2_must: {
      must: ["narrows the choice: says which option(s) the text cannot support, or explains the key word of the question"],
      must_not: [`names or quotes the right option "${answer}" as the answer`, "says which option is right"],
    },
    step3_must: {
      must: [`gives the right answer "${answer}"`, "explains why it is right, from the tale"],
      must_not: ["gives a different option as right"],
    },
  };
}

/** The level whose text has the sentence word for word, or null. */
const levelOf = (story, sentence) => (sentence ? LEVELS.find((l) => story.levels[l].includes(sentence)) ?? null : null);

const rows = [];
for (const story of STORIES) {
  // 1. The whole-tale quiz (written by the authors), evidence from every level, as in the app.
  story.quizQuestions.forEach((q, i) => {
    const found = findEvidence(q, LEVELS.map((l) => story.levels[l]));
    const level = levelOf(story, found);
    rows.push({
      id: `${story.id}:quiz:${i + 1}`,
      story_id: story.id,
      story_title: story.title,
      quiz: "tale",
      level: "quiz",
      type: q.type,
      question: q.q ?? null,
      sentence: q.sentence ?? null,
      options: q.options,
      correct: q.correct,
      answer: q.options[q.correct],
      anchor: level ? found : null,
      anchor_level: level,
      ...rules(q.options, q.correct),
    });
  });
  // 2. The gap quiz of each level (built from that level's text, as in the app).
  for (const l of LEVELS) {
    buildLevelQuiz(story.levels[l]).forEach((q, i) => {
      const found = findEvidence(q, [story.levels[l]]);
      rows.push({
        id: `${story.id}:${l}:${i + 1}`,
        story_id: story.id,
        story_title: story.title,
        quiz: "level",
        level: l,
        type: q.type,
        question: null,
        sentence: q.sentence,
        options: q.options,
        correct: q.correct,
        answer: q.options[q.correct],
        anchor: story.levels[l].includes(found) ? found : null,
        anchor_level: story.levels[l].includes(found) ? l : null,
        ...rules(q.options, q.correct),
      });
    });
  }
}

// A question without an anchor in the text cannot be graded on step 1, and an anchor is never
// made up here: it is left out and listed (README.md).
const missing = rows.filter((r) => !r.anchor);
const kept = rows.filter((r) => r.anchor);
writeFileSync(resolve(root, "research/shoqan-eval/ladder.jsonl"), kept.map((r) => JSON.stringify(r)).join("\n") + "\n");

const by = (f) => kept.reduce((m, r) => ({ ...m, [f(r)]: (m[f(r)] ?? 0) + 1 }), {});
console.log(`ladder.jsonl: ${kept.length} questions (${missing.length} left out without an anchor), help steps ${HINT_STEPS}`);
console.log("by quiz:", by((r) => r.quiz));
console.log("by level:", by((r) => r.level));
console.log("by tale:", by((r) => r.story_id));
console.log("left out, no anchor found in the text:", missing.map((r) => r.id).join(" ") || "none");
