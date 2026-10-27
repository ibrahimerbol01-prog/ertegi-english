import { supabase } from "../lib/supabase";
import { daysBetween, localDay } from "./progress";

/* Classes, assignments and quiz scores for the teacher cabinet
   (migration 20261026000000_teacher_classes). Every call returns a result
   with a typed error instead of throwing, so screens can say what went wrong:
   "missing" means the migration is not applied yet. */

export type AssignStep = "A1" | "A2" | "B1" | "B2" | "C1" | "quiz";
export const ASSIGN_STEPS: AssignStep[] = ["A1", "A2", "B1", "B2", "C1", "quiz"];

export interface Assignment {
  id: string;
  story_id: string;
  step: AssignStep;
  due_at: string | null;
  note: string;
  created_at: string;
}
export interface ClassRow {
  id: string;
  name: string;
  code: string;
  archived_at: string | null;
  created_at: string;
}
export interface MyClass {
  class_id: string;
  name: string;
  nickname: string;
  // The teacher archived it: no assignments, but the learner can still leave.
  archived?: boolean;
  assignments: Assignment[];
}
export interface QuizBest { story_id: string; step: string; best: number; total: number; attempts: number; last_at: string }
export interface Member {
  user_id: string;
  nickname: string;
  joined_at: string;
  left_at: string | null;
  removed: boolean;
  xp: number;
  streak_days: number;
  last_active_date: string | null;
  words_total: number;
  words_learned: number;
  words_due: number;
  steps: { story_id: string; step: string; completed_at: string }[];
  quizzes: QuizBest[];
}
export interface ClassReport { members: Member[]; assignments: Assignment[] }
export interface StudentReport {
  steps?: { story_id: string; step: string; completed_at: string }[];
  words: { word: string; translation: string; mastery: number; next_review_at: string | null }[];
  quizzes: { story_id: string; step: string; score: number; total: number; first_try: number; created_at: string }[];
}

export type ClassError =
  | "missing" | "offline" | "not_found" | "removed" | "own_class" | "class_full"
  | "bad_name" | "bad_nickname" | "nickname_taken" | "too_many" | "denied" | "unknown";
export type Result<T> = { ok: true; data: T } | { ok: false; error: ClassError };

function toError(error: { code?: string; message?: string } | null | undefined): ClassError {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "offline";
  const msg = error?.message ?? "";
  const code = error?.code ?? "";
  // The function or table does not exist yet: the migration is not applied.
  if (code === "PGRST202" || code === "42883" || code === "42P01" || code === "PGRST205") return "missing";
  if (msg.includes("class_not_found")) return "not_found";
  if (msg.includes("removed")) return "removed";
  if (msg.includes("own_class")) return "own_class";
  if (msg.includes("class_full")) return "class_full";
  if (msg.includes("bad_name")) return "bad_name";
  if (msg.includes("bad_nickname")) return "bad_nickname";
  if (msg.includes("nickname_taken") || msg.includes("class_members_nickname_unique")) return "nickname_taken";
  if (msg.includes("too_many_classes")) return "too_many";
  if (msg.includes("not_teacher") || msg.includes("not_member") || code === "42501") return "denied";
  if (msg.toLowerCase().includes("fetch")) return "offline";
  return "unknown";
}

async function call<T>(run: () => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>): Promise<Result<T>> {
  try {
    const { data, error } = await run();
    if (error) return { ok: false, error: toError(error) };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: toError(null) === "offline" ? "offline" : "unknown" };
  }
}

export const errorText = (e: ClassError, kk: boolean): string => ({
  missing: kk ? "Сыныптар әлі қосылмаған: базаға жаңарту керек." : "Classes aren't switched on yet: the database needs an update.",
  offline: kk ? "Интернет жоқ. Байланыс болғанда қайталап көр." : "You're offline. Try again when you're connected.",
  not_found: kk ? "Мұндай код табылмады. Мұғалімнен кодты қайта сұра." : "No class has that code. Check it with your teacher.",
  removed: kk ? "Мұғалім сені бұл сыныптан шығарған. Мұғаліммен сөйлес." : "Your teacher removed you from this class. Talk to your teacher.",
  own_class: kk ? "Бұл өз сыныбың: оқушы ретінде кіре алмайсың." : "This is your own class, so you can't join it as a learner.",
  class_full: kk ? "Сыныпта орын жоқ (60 оқушы)." : "This class is full (60 learners).",
  bad_name: kk ? "Сынып атын жаз (60 әріпке дейін)." : "Give the class a name (up to 60 letters).",
  bad_nickname: kk ? "Атыңды жаз (30 әріпке дейін)." : "Type your name (up to 30 letters).",
  nickname_taken: kk ? "Сыныпта бұл ат бар. Басқа ат немесе тегіңнің бірінші әрпін қос (мысалы, Аружан С.)." : "Someone in the class already has this name. Add an initial, e.g. Aru S.",
  too_many: kk ? "Белсенді сынып көп (30). Ескісін мұрағатқа жібер." : "Too many active classes (30). Archive an old one first.",
  denied: kk ? "Бұл сыныпқа рұқсатың жоқ." : "You don't have access to this class.",
  unknown: kk ? "Бірдеңе дұрыс болмады. Қайталап көр." : "Something went wrong. Please try again.",
})[e];

// Codes are typed by hand: keep only the letters a code can have.
// Cyrillic letters that look Latin (a Kazakh keyboard types К, Т, М, А…).
const LOOKALIKE: Record<string, string> = { "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "Р": "P", "С": "C", "Т": "T", "Х": "X", "У": "Y" };
const CODE = /^[A-HJ-NP-Z2-9]{6}$/;

/* A code as people actually type or paste it: "kt7-m2q", "КТ7М2Q" on a
   Kazakh keyboard, "Code: KT7M2Q", or the whole join link. */
export function cleanCode(s: string): string {
  let t = s.toUpperCase().replace(/[АВЕКМНРСТХУ]/g, (c) => LOOKALIKE[c]);
  const fromLink = t.match(/CLASS=([A-Z0-9-]+)/);
  if (fromLink) t = fromLink[1];
  const words = t.split(/[^A-Z0-9]+/).filter((w) => CODE.test(w));
  if (words.length) return words[words.length - 1];
  return t.replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
// Letters a code never has: I, O, 0 and 1 are left out so they can't be confused.
export const codeHasBadLetters = (code: string) => /[IO01]/.test(code);
export const classLink = (code: string) => `${window.location.origin}/?class=${code}`;

/* --- learner --- */
export const myClasses = () => call<MyClass[]>(() => supabase.rpc("my_classes"));
// Invisible characters and odd spaces would let two learners look like one name.
export const cleanNick = (nickname: string) =>
  nickname.replace(/[\u00a0\u2000-\u200a\u202f\u205f\u3000]/g, " ").replace(/\u034f/g, "").replace(/[\u00ad\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\u3164\ufeff]/g, "").replace(/\s+/g, " ").trim();
export const joinClass = (code: string, nickname: string) =>
  call<{ class_id: string; name: string }>(() => supabase.rpc("join_class", { p_code: cleanCode(code), p_nickname: cleanNick(nickname) }));
export const leaveClass = (classId: string) => call<null>(() => supabase.rpc("leave_class", { p_class: classId }));

/* --- teacher --- */
export const teacherClasses = () =>
  call<ClassRow[]>(() => supabase.from("classes").select("id, name, code, archived_at, created_at").order("created_at", { ascending: true }));
export const createClass = (name: string) => call<ClassRow>(() => supabase.rpc("create_class", { p_name: name.trim() }));
// An update the server filtered out still answers 204: ask for the row back to be sure.
async function updateClass(id: string, patch: { name?: string; archived_at?: string | null }): Promise<Result<null>> {
  const res = await call<{ id: string }[]>(() => supabase.from("classes").update(patch).eq("id", id).select("id"));
  if (!res.ok) return res;
  return res.data?.length ? { ok: true, data: null } : { ok: false, error: "denied" };
}
export const renameClass = (id: string, name: string) => updateClass(id, { name: name.trim() });
export const setArchived = (id: string, archived: boolean) =>
  updateClass(id, { archived_at: archived ? new Date().toISOString() : null });
export const newClassCode = (id: string) => call<string>(() => supabase.rpc("new_class_code", { p_class: id }));
export const classReport = (id: string) => call<ClassReport>(() => supabase.rpc("class_report", { p_class: id }));
export const studentReport = (classId: string, userId: string) =>
  call<StudentReport>(() => supabase.rpc("student_report", { p_class: classId, p_user: userId }));
export const setMemberRemoved = (classId: string, userId: string, removed: boolean) =>
  call<null>(() => supabase.rpc("set_member_removed", { p_class: classId, p_user: userId, p_removed: removed }));
export const addAssignment = (classId: string, a: { story_id: string; step: AssignStep; due_at: string | null; note: string }) =>
  call<null>(() => supabase.from("assignments").insert({ class_id: classId, ...a }));
export const deleteAssignment = (id: string) => call<null>(() => supabase.from("assignments").delete().eq("id", id));

/* --- status of one assignment for one learner --- */
export type Status = "done" | "late" | "overdue" | "open";
export interface Cell { status: Status; score: number | null; at: string | null }

// A due date is the end of the chosen day, in the teacher's own time zone.
export function dueAtEndOf(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).toISOString();
}
export const dayOf = (iso: string) => localDay(new Date(iso));

export const PASS = 0.6;

export function cellFor(m: Pick<Member, "steps" | "quizzes">, a: Assignment, now = new Date()): Cell {
  const step = m.steps.find((s) => s.story_id === a.story_id && s.step === a.step);
  const quiz = m.quizzes.find((q) => q.story_id === a.story_id && q.step === a.step);
  const score = quiz ? Math.round(quiz.best * 100) : null;
  const due = a.due_at ? new Date(a.due_at) : null;
  // Done means the level's quiz was passed; an older mark with a failed quiz still counts as open.
  if (step && (!quiz || quiz.best >= PASS)) {
    const late = !!due && new Date(step.completed_at) > due;
    return { status: late ? "late" : "done", score, at: step.completed_at };
  }
  return { status: due && now > due ? "overdue" : "open", score, at: quiz?.last_at ?? null };
}

// Days since the learner last did anything; null = never.
export function daysAway(lastActive: string | null): number | null {
  if (!lastActive) return null;
  return Math.max(0, daysBetween(lastActive, localDay()));
}

export interface HelpFlag { kind: "away" | "low" | "overdue"; detail: number }
// Who needs the teacher first: away a week, a low quiz score, or work past its date.
export function helpFlags(m: Member, assignments: Assignment[]): HelpFlag[] {
  const flags: HelpFlag[] = [];
  const away = daysAway(m.last_active_date);
  if (away === null || away >= 7) flags.push({ kind: "away", detail: away ?? -1 });
  // The same level given twice is still one problem, not two.
  const seen = new Set<string>();
  const unique = assignments.filter((a) => {
    const k = `${a.story_id}:${a.step}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const cells = unique.map((a) => cellFor(m, a));
  const low = cells.filter((c) => c.score !== null && c.score < 60).length;
  if (low) flags.push({ kind: "low", detail: low });
  const overdue = cells.filter((c) => c.status === "overdue").length;
  if (overdue) flags.push({ kind: "overdue", detail: overdue });
  return flags;
}

/* --- quiz scores: queued on the device until the server has them --- */
const outboxKey = (userId: string) => `ertegi_quiz_outbox_${userId}`;
type QuizRow = { client_id?: string; story_id: string; step: string; score: number; total: number; first_try: number; created_at: string };

function readOutbox(userId: string): QuizRow[] {
  try {
    const v = JSON.parse(localStorage.getItem(outboxKey(userId)) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeOutbox(userId: string, rows: QuizRow[]) {
  try {
    if (rows.length) localStorage.setItem(outboxKey(userId), JSON.stringify(rows.slice(-100)));
    else localStorage.removeItem(outboxKey(userId));
  } catch { /* storage blocked */ }
}

let flushing = false;
let again = false;
export async function flushQuizResults(userId: string) {
  // A score saved while a send is running goes out right after it.
  if (flushing) { again = true; return; }
  let rows = readOutbox(userId);
  if (!rows.length) return;
  flushing = true;
  try {
    // Older rows had no id: give them one and keep it, so a resend after a
    // lost answer is recognised as the same score.
    if (rows.some((r) => !r.client_id)) {
      rows = rows.map((r) => (r.client_id ? r : { ...r, client_id: newId() }));
      writeOutbox(userId, rows);
    }
    const send = (batch: QuizRow[]) => supabase.from("quiz_results").upsert(
      batch.map((r) => ({ ...r, user_id: userId })),
      { onConflict: "user_id,client_id", ignoreDuplicates: true },
    );
    const handled = new Set<string>();
    const { error } = await send(rows);
    if (!error) rows.forEach((r) => handled.add(r.client_id!));
    // One row the table can't take must not hold back or sink the rest: send
    // them one by one and drop only the refused ones. Any other error stops,
    // keeping the unsent rows for later.
    if (error?.code?.startsWith("23")) {
      for (const r of rows) {
        const res = await send([r]);
        if (res.error && !res.error.code?.startsWith("23")) break;
        handled.add(r.client_id!);
      }
    }
    // Drop exactly the rows handled, by id: another tab may have changed the
    // queue meanwhile. A missing table keeps the queue for after the migration.
    if (handled.size) writeOutbox(userId, readOutbox(userId).filter((r) => !r.client_id || !handled.has(r.client_id)));
  } catch { /* offline: try again later */ } finally {
    flushing = false;
    if (again) { again = false; void flushQuizResults(userId); }
  }
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));

export function saveQuizResult(userId: string, storyId: string, step: string, score: number, total: number, firstTry: number) {
  if (!total) return;
  writeOutbox(userId, [...readOutbox(userId), {
    client_id: newId(), story_id: storyId, step, score: Math.min(score, total), total, first_try: Math.min(firstTry, total), created_at: new Date().toISOString(),
  }]);
  void flushQuizResults(userId);
}

/* --- a class link opened before signing in --- */
const PENDING = "ertegi_pending_class";
export function capturePendingClass() {
  try {
    const url = new URL(window.location.href);
    const code = cleanCode(url.searchParams.get("class") || "");
    if (code.length === 6) localStorage.setItem(PENDING, code);
    if (url.searchParams.has("class")) {
      url.searchParams.delete("class");
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
    }
  } catch { /* storage blocked */ }
}
// Kept until the learner joins or closes the window, so a reload doesn't lose it.
export function peekPendingClass(): string | null {
  try {
    return localStorage.getItem(PENDING);
  } catch {
    return null;
  }
}
export function clearPendingClass() {
  try { localStorage.removeItem(PENDING); } catch { /* storage blocked */ }
}
