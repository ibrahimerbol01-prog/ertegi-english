import { FORMS, ITEM_FORMATS, TIMEPOINTS, type Answer, type Form, type TestItem, type TestSet, type Timepoint } from "./types";
import type { FormSequence } from "../studyCode";

/** Checks a set loaded from JSON; returns the problems (empty = fine). */
export function validateTestSet(raw: unknown): string[] {
  const errs: string[] = [];
  const set = raw as Partial<TestSet> | null;
  if (!set || typeof set !== "object") return ["not an object"];
  if (typeof set.version !== "string" || !set.version) errs.push("version missing");
  if (typeof set.sample !== "boolean") errs.push("sample must be true or false");
  if (!Array.isArray(set.items) || !set.items.length) return [...errs, "no items"];
  const ids = new Set<string>();
  set.items.forEach((it, n) => {
    const at = `item ${n} (${it?.id ?? "?"})`;
    if (!it || typeof it.id !== "string" || !it.id) { errs.push(`${at}: id`); return; }
    if (ids.has(it.id)) errs.push(`${at}: duplicate id`);
    ids.add(it.id);
    if (typeof it.word !== "string") errs.push(`${at}: word`);
    if (!ITEM_FORMATS.includes(it.format)) errs.push(`${at}: format`);
    if (!FORMS.includes(it.form)) errs.push(`${at}: form`);
    if (!Array.isArray(it.timepoints) || !it.timepoints.length || it.timepoints.some((t) => !TIMEPOINTS.includes(t))) errs.push(`${at}: timepoints`);
    if (!Array.isArray(it.options) || it.options.length < 2 || new Set(it.options).size !== it.options.length) errs.push(`${at}: options`);
    else if (!it.options.includes(it.answer)) errs.push(`${at}: answer is not one of the options`);
    if (it.format === "recognition" && (it.options?.join() !== "yes,no" || it.answer !== (it.pseudo ? "no" : "yes"))) errs.push(`${at}: recognition is yes/no, "no" only for a pseudoword`);
    if (it.format !== "comprehension" && !it.word) errs.push(`${at}: word is empty`);
    if ((it.format === "use" || it.format === "comprehension") && !it.prompt) errs.push(`${at}: prompt missing`);
  });
  return errs;
}

/** The items of one session, in the order of the file. */
export const sessionItems = (set: TestSet, form: Form, tp: Timepoint): TestItem[] =>
  set.items.filter((it) => it.form === form && it.timepoints.includes(tp));

/** Counterbalanced forms (study-design 5.3): AB = A → B → A, BA = B → A → B. */
export function formFor(seq: FormSequence, tp: Timepoint): Form {
  const first: Form = seq === "AB" ? "A" : "B";
  return tp === "post" ? (first === "A" ? "B" : "A") : first;
}

export const scoreAnswer = (item: TestItem, choice: string | null): 0 | 1 => (choice !== null && choice === item.answer ? 1 : 0);

/** The first item without an answer (resume after a reload or a lost connection); -1 when all are answered. */
export const nextIndex = (items: TestItem[], answers: Record<string, Answer>): number => items.findIndex((it) => !answers[it.id]);

export interface Summary {
  answered: number;
  total: number;
  meaning: number; meaning_n: number;
  use: number; use_n: number;
  comprehension: number; comprehension_n: number;
  /** Recognition: "yes" on real words, "yes" on pseudowords. */
  rec_hits: number; rec_real: number; rec_false_alarms: number; rec_pseudo: number;
  /** More than 30 % false alarms: the learner is flagged (study-design 5.4). */
  rec_flag: boolean;
}

export function summarize(items: TestItem[], answers: Record<string, Answer>): Summary {
  const s: Summary = { answered: 0, total: items.length, meaning: 0, meaning_n: 0, use: 0, use_n: 0, comprehension: 0, comprehension_n: 0, rec_hits: 0, rec_real: 0, rec_false_alarms: 0, rec_pseudo: 0, rec_flag: false };
  for (const it of items) {
    const a = answers[it.id];
    if (a) s.answered += 1;
    if (it.format === "recognition") {
      if (it.pseudo) { s.rec_pseudo += 1; if (a?.choice === "yes") s.rec_false_alarms += 1; }
      else { s.rec_real += 1; if (a?.choice === "yes") s.rec_hits += 1; }
      continue;
    }
    s[`${it.format}_n`] += 1;
    if (a) s[it.format] += a.correct;
  }
  s.rec_flag = s.rec_pseudo > 0 && s.rec_false_alarms / s.rec_pseudo > 0.3;
  return s;
}
