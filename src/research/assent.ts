/* R9: the learner's assent in the research build (docs/research-build.md).
   After the participant code the learner reads the assent text and answers
   yes or no. The answer is one record in learner_state (kind study_assent),
   so it follows the learner to another device. A "no" keeps the app closed
   and nothing is logged; a "yes" opens it. When the text changes (a new
   version) the learner is asked again.
   This is the learner's assent only: the parent's consent is on paper before
   the code is handed out (ethics-consent-package.md). No imports, so
   events.ts can read the version without pulling anything in. */

type Store = Pick<Storage, "getItem" | "setItem">;
export interface Assent { version: string; answer: "yes" | "no"; at: string; sample: boolean }
export type AssentStatus = "yes" | "no" | "ask";

/** Same shape as the other learner_state records: { assent: { version, answer, at, sample } }. */
export const assentKey = (uid: string) => `ertegi_study_assent_${uid}`;

export function readAssent(s: Store | null | undefined, uid: string): Assent | null {
  try {
    const v = JSON.parse(s?.getItem(assentKey(uid)) || "null")?.assent;
    if (!v || typeof v !== "object") return null;
    if ((v.answer !== "yes" && v.answer !== "no") || typeof v.version !== "string" || !v.version) return null;
    return { version: v.version, answer: v.answer, at: typeof v.at === "string" ? v.at : "", sample: v.sample === true };
  } catch { return null; }
}

export function writeAssent(s: Store, uid: string, a: Assent): void {
  try { s.setItem(assentKey(uid), JSON.stringify({ assent: a })); } catch { /* storage blocked */ }
}

/** "yes"/"no" only for the current text version; an answer to an older text means ask again. */
export function assentStatus(a: Assent | null, currentVersion: string): AssentStatus {
  if (!a || a.version !== currentVersion) return "ask";
  return a.answer;
}

/** Text of the assent screen (src/data/studyAssent.json): one block per language. */
export interface AssentText {
  title: string;
  points: string[];
  understood: string;
  agree: string;
  decline: string;
  proceed: string;
  declinedTitle: string;
  declinedBody: string;
  change: string;
}
export interface AssentFile { version: string; sample: boolean; note?: string; texts: { kk: AssentText; ru: AssentText } }

export function validateAssentFile(f: unknown): string[] {
  const errs: string[] = [];
  const x = f as Partial<AssentFile> | null;
  if (!x || typeof x !== "object") return ["not an object"];
  if (typeof x.version !== "string" || !x.version || x.version.length > 40) errs.push("version");
  if (typeof x.sample !== "boolean") errs.push("sample must be true or false");
  for (const lang of ["kk", "ru"] as const) {
    const t = x.texts?.[lang];
    if (!t) { errs.push(`texts.${lang} missing`); continue; }
    if (!t.title) errs.push(`${lang}: title`);
    if (!Array.isArray(t.points) || t.points.length < 5) errs.push(`${lang}: points`);
    for (const k of ["understood", "agree", "decline", "proceed", "declinedTitle", "declinedBody", "change"] as const) if (!t[k]) errs.push(`${lang}: ${k}`);
  }
  return errs;
}
