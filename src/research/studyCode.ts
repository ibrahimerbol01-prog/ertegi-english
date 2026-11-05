/* Participant codes for the research build (R4, docs/research-evidence.md 9.2).
   The researcher hands each learner a code ERT-NNNC: three digits and a Damm
   check digit, so one mistyped digit or two swapped neighbours are refused
   instead of turning into another participant's code. Codes come from
   scripts/study-codes.mjs, which also writes the allocation list.
   Proposal for the supervisor: an even number NNN takes forms A → B → A
   (pre → post → delayed), an odd one B → A → B.
   No imports: events.ts reads the code without pulling anything in. */

const DAMM = "0317598642709215486342068713591750983426612304597836742095815869720134894536201794386172052581436790";

/** Damm check digit of a string of digits. */
export function dammDigit(digits: string): number {
  let i = 0;
  for (const ch of digits) i = Number(DAMM[i * 10 + Number(ch)]);
  return i;
}

/** ERT-NNNC for a number 0..999. */
export function makeStudyCode(n: number): string {
  const base = String(Math.trunc(n)).padStart(3, "0");
  return `ERT-${base}${dammDigit(base)}`;
}

/** "ert 1234", "ERT1234", "1234", "ЕРТ-1234" → "ERT-1234"; null if it is not a valid code. */
export function normalizeStudyCode(input: string): string | null {
  const s = input.trim().toUpperCase().replace(/[\s_–—-]+/g, "").replace(/^(ERT|ЕРТ)/, "");
  if (!/^\d{4}$/.test(s) || dammDigit(s) !== 0) return null;
  return `ERT-${s}`;
}

export type FormSequence = "AB" | "BA";
/** AB: A at pre and delayed, B at post. BA: the other way round. */
export function sequenceOf(code: string): FormSequence {
  const n = Number(code.replace(/\D/g, "").slice(0, 3));
  return n % 2 === 0 ? "AB" : "BA";
}

type Store = Pick<Storage, "getItem" | "setItem">;
/** Same shape as the other learner_state records: { code: { code, at } }. */
export const studyCodeKey = (uid: string) => `ertegi_study_code_${uid}`;

export function readStudyCode(s: Store | null | undefined, uid: string): string | null {
  try {
    const v = JSON.parse(s?.getItem(studyCodeKey(uid)) || "null")?.code?.code;
    return typeof v === "string" && normalizeStudyCode(v) === v ? v : null;
  } catch { return null; }
}

export function writeStudyCode(s: Store, uid: string, code: string, at = new Date().toISOString()): void {
  try { s.setItem(studyCodeKey(uid), JSON.stringify({ code: { code, at } })); } catch { /* storage blocked */ }
}

/** What the research build adds to the context of every event. */
export function researchContext(studyId: string, studyCode: string | null): Record<string, unknown> {
  const ctx: Record<string, unknown> = { research: true, study_id: studyId || "unset" };
  if (studyCode) ctx.study_code = studyCode;
  return ctx;
}
