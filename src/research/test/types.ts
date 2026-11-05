/* R5: the vocabulary test of the study (docs/research-design/study-design.md,
   section 5). Item sets are JSON (src/data/researchTest*.json); the real items
   are approved by the supervisor and are not in the repository yet. */

export const ITEM_FORMATS = ["recognition", "meaning", "use", "comprehension"] as const;
export type ItemFormat = (typeof ITEM_FORMATS)[number];
export const FORMS = ["A", "B"] as const;
export type Form = (typeof FORMS)[number];
export const TIMEPOINTS = ["pre", "post", "delayed"] as const;
export type Timepoint = (typeof TIMEPOINTS)[number];

export interface TestItem {
  /** Unique in the set, e.g. "A-mean-07". Goes to the event as object_id. */
  id: string;
  /** The target word (or the pseudoword); "" for a comprehension question. */
  word: string;
  format: ItemFormat;
  /** Sentence with a gap (use) or the question (comprehension); null when the word is the prompt. */
  prompt: string | null;
  /** Shown in this order: the order is part of the form. Recognition: ["yes", "no"]. */
  options: string[];
  /** One of options. */
  answer: string;
  form: Form;
  /** Sessions that include the item. */
  timepoints: Timepoint[];
  /** Recognition only: a made-up word; "yes" on it is a false alarm. */
  pseudo?: boolean;
  /** Adds "Білмеймін / I don't know" (scored 0). */
  dont_know?: boolean;
  /** The tale or text the item belongs to (comprehension; target words). */
  story_id?: string | null;
}

export interface TestSet {
  /** Changes with every edit of the items; stamped on every answer. */
  version: string;
  /** true for the example set: the screen says so, the answers are marked. */
  sample: boolean;
  note?: string;
  items: TestItem[];
}

/** One answer as kept on the device. choice null = "I don't know". */
export interface Answer { choice: string | null; correct: 0 | 1; ms: number }

export interface SessionProgress {
  form: Form;
  started_at: string;
  answers: Record<string, Answer>;
  done_at?: string;
}
