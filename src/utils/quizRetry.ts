import { QUIZ_CONFIDENCE_EVERY } from "../research/params";

/* I1: which questions ask "how sure are you?" and in what order the
   questions with a mistake come back at the end of a quiz.
   docs/research-evidence.md §3.5. */

export type Confidence = "sure" | "guess" | "unsure";
export type QuizResult = "first" | "second" | "missed";

/** Question index (in the full quiz) that asks for confidence: 0, n, 2n… */
export const asksConfidence = (index: number) => index % QUIZ_CONFIDENCE_EVERY === 0;

/** Questions to retry: every one not right on the first try. "Sure but
 *  wrong" comes first (hypercorrection), then the missed ones, then those
 *  right on the second try; the quiz order is kept inside each group. */
export function retryOrder(round: number[], results: QuizResult[], confidence: Record<number, Confidence | undefined>): number[] {
  const rank = (i: number) => (confidence[round[i]] === "sure" ? 0 : results[i] === "missed" ? 1 : 2);
  return round
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => results[i] && results[i] !== "first")
    .sort((a, b) => rank(a.i) - rank(b.i) || a.i - b.i)
    .map(({ q }) => q);
}
