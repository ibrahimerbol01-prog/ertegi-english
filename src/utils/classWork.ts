import { supabase } from "../lib/supabase";
import { localDay } from "./progress";
import { call, cellFor, daysAway, type ClassReport, type Member, type Result } from "./classes";

/* R8, the teacher panel: a learner's thinking work, the class's last 30 days
   and the class as a CSV file (migrations 20261107000000_teacher_panel and
   20261105000000_learning_events). Imported by Teacher.tsx only, so none of
   it lands in the first screen's bundle (classes.ts is there). */

export interface DebateWork {
  week_start: string; // the day of the answer
  side: "yes" | "no" | null;
  text: string;
  reply_text: string;
  words_used: string[];
  updated_at: string;
}
export interface TrailWork {
  tale_id: string;
  cefr_level: string;
  claim_choice: "yes" | "no" | "partly";
  claim_text: string;
  evidence_ids: number[];
  wonder_text: string;
  revision: number;
  created_at: string;
}
export interface CouncilWork {
  question_id: string;
  round: 1 | 2;
  choice: number;
  confidence: 0 | 1 | 2 | null;
  reason: string | null;
  approved: boolean;
  created_at: string;
}
/** Only what the learner did after joining this class. */
export interface StudentWork { joined_at?: string; debates: DebateWork[]; trails: TrailWork[]; council: CouncilWork[] }
export const studentWork = (classId: string, userId: string) =>
  call<StudentWork>(() => supabase.rpc("student_work", { p_class: classId, p_user: userId }));
// "not_found": the vote is gone (or older than the membership); other errors as everywhere in classes.ts.
export async function setReasonApproved(classId: string, userId: string, questionId: string, approved: boolean): Promise<Result<null>> {
  let answer: { data: unknown; error: { code?: string; message?: string } | null };
  try {
    answer = await supabase.rpc("set_council_reason_approved", { p_class: classId, p_user: userId, p_question: questionId, p_approved: approved });
  } catch (e) {
    return call<null>(() => Promise.reject(e));
  }
  if (answer.error?.message === "not_found" || answer.error?.code === "P0002") return { ok: false, error: "not_found" };
  return call<null>(() => Promise.resolve(answer));
}

export interface EventsMember {
  user_id: string;
  nickname: string;
  events: number;
  by_verb: Record<string, number>;
  active_days: number;
  last_at: string | null;
}
export interface HardWord { word: string; taps: number; misses: number; learners: number }
/** question is the index of the question in the quiz the learner saw (QuizScreens: round[pos]). */
export interface HardQuestion { story_id: string | null; level: string | null; question: string; wrong: number; answers: number; learners: number }
/** Totals only, for learners in the class now, since they joined, the last 30 days. */
export interface ClassEvents { since: string; members: EventsMember[]; hard_words: HardWord[]; hard_questions: HardQuestion[] }
export const classEvents = (classId: string) => call<ClassEvents>(() => supabase.rpc("class_events_summary", { p_class: classId }));

// The streak as the learner sees it: it ends after a day without practice.
export function liveStreak(m: Pick<Member, "streak_days" | "last_active_date">): number {
  const away = daysAway(m.last_active_date);
  return away !== null && away <= 1 ? m.streak_days : 0;
}

/* --- the class as a spreadsheet (CSV) --- */

// A cell Excel or Sheets would run as a formula (=, +, -, @, and tab or CR
// that some readers strip first) gets an apostrophe in front, so it stays text.
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per learner in the class now: activity in the last 30 days (from
 *  class_events_summary, empty while it is not there), progress, words, and
 *  the best quiz score in % for each assigned tale and level (empty if none).
 *  Comma-separated, CRLF lines, with a BOM so Excel reads it as UTF-8.
 *  Nicknames only: nothing the class page does not already show. */
export function classSummaryCsv(
  report: ClassReport,
  events: ClassEvents | null,
  lang: string,
  titleOf: (storyId: string) => string = (id) => id,
): string {
  const kk = lang === "kk";
  // The same tale and level given twice is one column; oldest first, as a gradebook reads.
  const seen = new Set<string>();
  const tasks = [...report.assignments]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .filter((a) => {
      const k = `${a.story_id}:${a.step}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  const byUser = new Map((events?.members ?? []).map((e) => [e.user_id, e]));
  const head = [
    kk ? "Оқушы" : "Learner",
    kk ? "Белсенді күн (30 күн)" : "Active days (30 days)",
    kk ? "Соңғы әрекет" : "Last action",
    kk ? "Әрекет саны (30 күн)" : "Actions (30 days)",
    "XP",
    kk ? "Күн қатары" : "Streak",
    kk ? "Сақтаған сөз" : "Words saved",
    kk ? "Үйренген сөз" : "Words learned",
    kk ? "Қайталауға" : "Words due",
    ...tasks.map((a) => `${titleOf(a.story_id)} ${a.step === "quiz" ? (kk ? "Сынақ" : "Quiz") : a.step} %`),
  ];
  const rows = report.members
    .filter((m) => !m.left_at && !m.removed)
    .sort((a, b) => a.nickname.localeCompare(b.nickname))
    .map((m) => {
      const e = byUser.get(m.user_id);
      // The last logged action; the profile's last active day before the log existed.
      const last = e?.last_at ? localDay(new Date(e.last_at)) : (m.last_active_date ?? "");
      return [
        m.nickname,
        e ? e.active_days : "",
        last,
        e ? e.events : "",
        m.xp,
        liveStreak(m),
        m.words_total,
        m.words_learned,
        m.words_due,
        ...tasks.map((a) => cellFor(m, a).score ?? ""),
      ];
    });
  return "\uFEFF" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

// ertegi-<class>-<day>.csv with only letters, digits and dashes (Cyrillic kept).
export function csvFileName(className: string, day = localDay()): string {
  const name = className.normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return `ertegi-${name || "class"}-${day}.csv`;
}
