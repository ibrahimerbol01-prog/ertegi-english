import { SHOQAN_HINT_ANSWER_MIN_ATTEMPTS, SHOQAN_HINT_STEPS } from "../research/params";

/**
 * Which step of Shoqan's help ladder to ask for on a quiz question (docs §3.8, I2).
 * Each request on the same question goes one step up: 1 — point to the place in
 * the tale, 2 — a hint, 3 — an explanation with the answer. The last step needs
 * at least SHOQAN_HINT_ANSWER_MIN_ATTEMPTS wrong attempts first, so the answer
 * never comes before the learner has tried. Once the quiz has shown the answer,
 * the explanation step is given at once.
 */
export function hintStep({ asksBefore, attempts, answerShown }: { asksBefore: number; attempts: number; answerShown: boolean }): number {
  if (answerShown) return SHOQAN_HINT_STEPS;
  const cap = attempts >= SHOQAN_HINT_ANSWER_MIN_ATTEMPTS ? SHOQAN_HINT_STEPS : SHOQAN_HINT_STEPS - 1;
  return Math.max(1, Math.min(asksBefore + 1, cap));
}

/** CEFR level of the text the quiz is about, or undefined (whole-tale quiz). */
export function cefrLevel(level: string | undefined): string | undefined {
  return level && /^(A1|A2|B1|B2|C1)$/.test(level) ? level : undefined;
}
