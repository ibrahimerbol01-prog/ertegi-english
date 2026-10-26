import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Archive, BookOpen, Check, ChevronRight, Clock, Copy, Flame, Link2, Plus,
  RefreshCw, RotateCcw, Trash2, Trophy, Users, Zap,
} from "lucide-react";
import { STORIES } from "../constants";
import { displayTitle } from "../utils/text";
import { localDay } from "../utils/progress";
import {
  ASSIGN_STEPS, addAssignment, cellFor, classLink, classReport, createClass, daysAway, deleteAssignment,
  dueAtEndOf, errorText, helpFlags, newClassCode, renameClass, setArchived, setMemberRemoved, studentReport,
  teacherClasses,
  type AssignStep, type Assignment, type Cell, type ClassError, type ClassReport, type ClassRow, type Member, type Result,
  type StudentReport,
} from "../utils/classes";
import { ScreenHeader, Sheet } from "./UIHelpers";
import { dueText, stepLabel, storyTitle } from "../utils/useMyClasses";

/* Teacher cabinet: classes joined by code, assignments with a due date, a
   learner × assignment grid with "who needs help" on top, and a card per
   learner. Learners appear under the nickname they chose; nothing here shows
   their email. */

type Kk = { kk: boolean };

function Notice({ error, kk, onRetry }: { error: ClassError; kk: boolean; onRetry?: () => void }) {
  return (
    <div role="alert" className="card p-4 flex items-start gap-3 border-felt/40">
      <AlertTriangle size={20} className="text-felt-deep shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-ink">{errorText(error, kk)}</p>
        {onRetry && error !== "missing" && (
          <button onClick={onRetry} className="mt-2 text-sm font-bold text-sky-deep min-h-[36px]">{kk ? "Қайталау" : "Try again"}</button>
        )}
      </div>
    </div>
  );
}

// dd.mm by hand: not every browser has Kazakh month names.
const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyButton({ text, label, done, Icon }: { text: string; label: string; done: string; Icon: typeof Copy }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const run = async () => {
    const ok = await copyText(text);
    if (timer.current) clearTimeout(timer.current);
    setState(ok ? "ok" : "fail");
    // A failed copy keeps the text on screen until the next try.
    if (ok) timer.current = setTimeout(() => setState("idle"), 2000);
  };
  return (
    <>
      <button onClick={run} className="btn btn-ghost btn-sm">
        {state === "ok" ? <Check size={15} strokeWidth={3} aria-hidden /> : <Icon size={15} aria-hidden />}
        {state === "ok" ? done : label}
      </button>
      <span role="status" className="sr-only">{state === "ok" ? done : ""}</span>
      {/* No clipboard (old browser, blocked): show the text, selected, to copy by hand. */}
      {state === "fail" && (
        <input readOnly value={text} onFocus={(e) => e.currentTarget.select()} autoFocus aria-label={label} className="field !min-h-[40px] text-[14px] basis-full" />
      )}
    </>
  );
}

/* --- class list --- */
export function TeacherScreen({ lang, onBack }: { lang: string; onBack?: () => void }) {
  const kk = lang === "kk";
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [error, setError] = useState<ClassError | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<ClassError | null>(null);
  // Opening or leaving a class swaps the whole screen: move focus to its title.
  const firstView = useRef(true);
  useEffect(() => {
    if (firstView.current) { firstView.current = false; return; }
    window.scrollTo({ top: 0 });
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [openId]);
  const [showArchived, setShowArchived] = useState(false);

  const [attempt, setAttempt] = useState(0);
  const load = () => setAttempt((n) => n + 1);
  useEffect(() => {
    let live = true;
    teacherClasses().then((res) => {
      if (!live) return;
      if (res.ok) {
        setClasses(res.data ?? []);
        setError(null);
      } else setError(res.error);
    });
    return () => { live = false; };
  }, [attempt]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setCreateError(null);
    const res = await createClass(name);
    setBusy(false);
    if (!res.ok) { setCreateError(res.error); return; }
    setName("");
    setClasses((prev) => [...(prev ?? []), res.data]);
    setOpenId(res.data.id);
  };

  const open = classes?.find((c) => c.id === openId) ?? null;
  if (open) {
    return (
      <ClassView
        key={open.id}
        cls={open}
        kk={kk}
        onBack={() => setOpenId(null)}
        onChange={(next) => setClasses((prev) => (prev ?? []).map((c) => (c.id === next.id ? next : c)))}
      />
    );
  }

  const active = (classes ?? []).filter((c) => !c.archived_at);
  const archived = (classes ?? []).filter((c) => c.archived_at);

  return (
    <div className="space-y-6 animate-pop-in">
      <ScreenHeader
        eyebrow={kk ? "Мұғалімге" : "For teachers"}
        title={kk ? "Мұғалім кабинеті" : "Teacher cabinet"}
        onBack={onBack}
        backLabel={kk ? "Профиль" : "Profile"}
      />

      {error && <Notice error={error} kk={kk} onRetry={load} />}
      {!classes && !error && <div role="status" className="card p-6 text-center text-ink-2">{kk ? "Жүктеліп жатыр…" : "Loading…"}</div>}

      {classes && classes.length === 0 && !error && (
        <div className="card p-5">
          <h2 className="font-display font-extrabold text-ink text-[17px]">{kk ? "Бірінші сыныпты аш" : "Start your first class"}</h2>
          <ol className="mt-3 space-y-2 text-[15px] text-ink-2 list-decimal pl-5">
            <li>{kk ? "Сынып ашасың: әр сыныптың өз коды бар." : "Create a class: each class gets its own code."}</li>
            <li>{kk ? "Оқушылар кодпен немесе сілтемемен қосылады, email керек емес." : "Learners join with the code or a link, no email needed."}</li>
            <li>{kk ? "Тапсырма бересің, кім орындағанын және ұпайын көресің." : "Give assignments and see who did them and their scores."}</li>
          </ol>
        </div>
      )}

      {active.length > 0 && (
        <ul className="space-y-3">
          {active.map((c) => (
            <li key={c.id}>
              <button onClick={() => setOpenId(c.id)} className="card w-full text-left p-4 flex items-center gap-4 hover:bg-sand/40">
                <span className="w-12 h-12 rounded-2xl bg-sky-soft text-sky-deep flex items-center justify-center shrink-0"><Users size={24} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-display font-extrabold text-ink text-[17px] truncate">{c.name}</span>
                  <span className="block text-sm text-ink-2">{kk ? "Код" : "Code"}: <b className="font-display tracking-[0.15em] text-ink">{c.code}</b></span>
                </span>
                <ChevronRight size={22} className="text-ink-3 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {classes && error !== "missing" && (
        <form onSubmit={create} className="card p-5" noValidate>
          <label htmlFor="new-class" className="font-display font-extrabold text-ink text-[17px] block">{kk ? "Жаңа сынып" : "New class"}</label>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <input
              id="new-class"
              value={name}
              onChange={(e) => { setName(e.target.value.slice(0, 60)); setCreateError(null); }}
              placeholder={kk ? "Мысалы: 7А, кешкі топ" : "e.g. Year 7, evening group"}
              className="field flex-1"
              maxLength={60}
              autoComplete="off"
            />
            <button type="submit" disabled={!name.trim() || busy} className="btn sm:w-auto"><Plus size={18} /> {kk ? "Ашу" : "Create"}</button>
          </div>
          {createError && <p role="alert" className="mt-3 text-[14px] font-semibold text-felt-deep">{errorText(createError, kk)}</p>}
        </form>
      )}

      {archived.length > 0 && (
        <div>
          <button onClick={() => setShowArchived((v) => !v)} aria-expanded={showArchived} className="text-sm font-bold text-sky-deep min-h-[40px] flex items-center gap-1.5">
            <Archive size={16} /> {kk ? `Мұрағат (${archived.length})` : `Archive (${archived.length})`}
          </button>
          {showArchived && (
            <ul className="card overflow-hidden divide-y divide-line mt-2">
              {archived.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 min-h-[56px]">
                  <span className="flex-1 min-w-0 text-[16px] text-ink-2 truncate">{c.name}</span>
                  <button onClick={() => setOpenId(c.id)} className="btn btn-ghost btn-sm">{kk ? "Ашу" : "Open"}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* --- one class --- */
type Tab = "progress" | "tasks" | "settings";

function ClassView({ cls, kk, onBack, onChange }: { cls: ClassRow; kk: boolean; onBack: () => void; onChange: (c: ClassRow) => void }) {
  const [tab, setTab] = useState<Tab>("progress");
  const [report, setReport] = useState<ClassReport | null>(null);
  const [error, setError] = useState<ClassError | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [student, setStudent] = useState<Member | null>(null);

  const [attempt, setAttempt] = useState(0);
  const load = () => { setLoading(true); setAttempt((n) => n + 1); };
  useEffect(() => {
    let live = true;
    classReport(cls.id).then((res) => {
      if (!live) return;
      setLoading(false);
      if (res.ok) { setReport(res.data); setError(null); setLoadedAt(new Date()); } else setError(res.error);
    });
    return () => { live = false; };
  }, [cls.id, attempt]);

  const archived = !!cls.archived_at;
  const members = (report?.members ?? []).filter((m) => !m.left_at);
  const gone = (report?.members ?? []).filter((m) => m.left_at);

  return (
    <div className="space-y-5 animate-pop-in">
      <ScreenHeader
        eyebrow={archived ? (kk ? "Мұрағатта" : "Archived") : (kk ? "Сынып" : "Class")}
        title={cls.name}
        onBack={onBack}
        backLabel={kk ? "Сыныптар" : "Classes"}
        trailing={
          <button onClick={load} disabled={loading} aria-label={kk ? "Жаңарту" : "Refresh"} className="w-11 h-11 rounded-full bg-card border-2 border-line text-sky-deep flex items-center justify-center shrink-0">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />

      {!archived && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[150px]">
            <p className="eyebrow">{kk ? "Қосылу коды" : "Join code"}</p>
            <p className="font-display font-black text-3xl tracking-[0.2em] text-ink">{cls.code}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={cls.code} label={kk ? "Код" : "Code"} done={kk ? "Көшірілді" : "Copied"} Icon={Copy} />
            <CopyButton text={classLink(cls.code)} label={kk ? "Сілтеме" : "Link"} done={kk ? "Көшірілді" : "Copied"} Icon={Link2} />
          </div>
        </div>
      )}

      <div className="segmented" role="group" aria-label={kk ? "Сынып бөлімдері" : "Class sections"}>
        {([
          ["progress", kk ? "Прогресс" : "Progress"],
          ["tasks", kk ? "Тапсырмалар" : "Assignments"],
          ["settings", kk ? "Баптау" : "Settings"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {error && <Notice error={error} kk={kk} onRetry={load} />}
      {!report && !error && <div role="status" className="card p-6 text-center text-ink-2">{kk ? "Жүктеліп жатыр…" : "Loading…"}</div>}

      {report && tab === "progress" && (
        <ProgressTab kk={kk} cls={cls} members={members} goneCount={gone.length} assignments={report.assignments} onOpen={setStudent} onGoTasks={() => setTab("tasks")} />
      )}
      {report && tab === "tasks" && (
        <TasksTab kk={kk} classId={cls.id} archived={archived} members={members} assignments={report.assignments} onChanged={load} />
      )}
      {tab === "settings" && (
        <SettingsTab kk={kk} cls={cls} gone={gone} onChange={onChange} onChanged={load} onArchived={onBack} />
      )}

      {loadedAt && (
        <p className="text-[12px] text-ink-2 text-center">
          {kk ? "Жаңартылды" : "Updated"} {loadedAt.toLocaleTimeString(kk ? "kk-KZ" : "en-GB", { hour: "2-digit", minute: "2-digit" })}.{" "}
          {kk ? "Оқушы интернетсіз жұмыс істесе, нәтижесі желіге қосылғанда келеді." : "Work done offline arrives once the learner is back online."}
        </p>
      )}

      <StudentSheet kk={kk} classId={cls.id} member={student} assignments={report?.assignments ?? []} onClose={() => setStudent(null)} onRemoved={() => { setStudent(null); void load(); }} />
    </div>
  );
}

const awayText = (days: number | null, kk: boolean) =>
  days === null ? (kk ? "әлі бастамаған" : "not started yet")
    : days === 0 ? (kk ? "бүгін" : "today")
    : days === 1 ? (kk ? "кеше" : "yesterday")
    : kk ? `${days} күн бұрын` : `${days} days ago`;

function CellBadge({ cell, kk }: { cell: Cell } & Kk) {
  const score = cell.score !== null ? `${cell.score}%` : "";
  const map = {
    done: { cls: cell.score !== null && cell.score < 60 ? "bg-sun-soft text-[#8A5A00]" : "bg-jade-soft text-[#0F6E4B]", text: score || "✓", sr: kk ? "орындады" : "done" },
    late: { cls: "bg-sun-soft text-[#8A5A00]", text: score || "✓", sr: kk ? "кеш орындады" : "done late" },
    overdue: { cls: "bg-felt-soft text-felt-deep", text: "!", sr: kk ? "мерзімі өтті" : "overdue" },
    // Tried but not passed yet: the score shows, in red.
    open: cell.score !== null
      ? { cls: "bg-felt-soft text-felt-deep", text: score, sr: kk ? "әлі өтпеді" : "not passed yet" }
      : { cls: "bg-sand-2 text-ink-2", text: "—", sr: kk ? "әлі жоқ" : "not yet" },
  }[cell.status];
  return (
    <span className={`inline-flex items-center justify-center gap-0.5 min-w-[48px] h-8 px-2 rounded-lg text-[13px] font-bold ${map.cls}`}>
      {cell.status === "late" && <Clock size={12} aria-hidden />}
      <span aria-hidden>{map.text}</span>
      <span className="sr-only">{map.sr}{score ? `, ${score}` : ""}</span>
    </span>
  );
}

function ProgressTab({ kk, cls, members, goneCount, assignments, onOpen, onGoTasks }: {
  kk: boolean; cls: ClassRow; members: Member[]; goneCount: number; assignments: Assignment[];
  onOpen: (m: Member) => void; onGoTasks: () => void;
}) {
  if (members.length === 0) {
    return (
      <div className="card p-5">
        <h2 className="font-display font-extrabold text-ink text-[17px]">
          {goneCount > 0 ? (kk ? "Қазір сыныпта оқушы жоқ" : "No learners in the class now") : (kk ? "Сыныпта әлі оқушы жоқ" : "No learners yet")}
        </h2>
        {goneCount > 0 && (
          <p className="text-[15px] text-ink-2 mt-1.5">{kk ? `Шыққандар (${goneCount}) «Баптау» бөлімінде.` : `Those who left (${goneCount}) are listed in Settings.`}</p>
        )}
        <p className="text-[15px] text-ink-2 mt-1.5">
          {cls.archived_at
            ? (kk ? "Мұрағаттағы сыныпқа қосылуға болмайды." : "Nobody can join an archived class.")
            : (kk ? `Оқушыларға ${cls.code} кодын немесе сілтемені жібер. Олар «Профиль → Сыныпқа кодпен қосылу» арқылы кіреді.` : `Send learners the code ${cls.code} or the link. They join from Profile → Join a class with a code.`)}
        </p>
      </div>
    );
  }

  const shown = assignments.slice(0, 12); // newest first
  // Away longest first, then low scores, then late work. An archived class needs no chasing.
  const weight = (flags: { kind: string; detail: number }[]) =>
    flags.reduce((sum, f) => sum + (f.kind === "away" ? 100 + (f.detail < 0 ? 0 : f.detail) : f.kind === "low" ? 10 * f.detail : f.detail), 0);
  const help = cls.archived_at ? [] : members
    .map((m) => ({ m, flags: helpFlags(m, assignments) }))
    .filter((x) => x.flags.length > 0)
    .sort((a, b) => weight(b.flags) - weight(a.flags));

  const flagText = (f: { kind: string; detail: number }) =>
    f.kind === "away" ? (f.detail < 0 ? (kk ? "әлі бастамаған" : "not started yet") : (kk ? `${f.detail} күн кірмеген` : `away ${f.detail} days`))
      : f.kind === "low" ? (kk ? `төмен ұпай: ${f.detail}` : `low score: ${f.detail}`)
      : (kk ? `мерзімі өтті: ${f.detail}` : `overdue: ${f.detail}`);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { v: members.length, l: kk ? "оқушы" : "learners" },
          { v: members.filter((m) => daysAway(m.last_active_date) !== null && (daysAway(m.last_active_date) ?? 99) < 7).length, l: kk ? "осы аптада белсенді" : "active this week" },
          { v: help.length, l: kk ? "көмек керек" : "need help" },
        ].map((s) => (
          <div key={s.l} className="tile p-3 text-center">
            <p className="font-display font-black text-2xl text-ink leading-none">{s.v}</p>
            <p className="text-[12px] text-ink-2 mt-1 leading-tight">{s.l}</p>
          </div>
        ))}
      </div>

      {help.length > 0 && (
        <section className="card p-4" aria-labelledby="help-title">
          <h2 id="help-title" className="font-display font-extrabold text-ink text-[16px] flex items-center gap-2">
            <AlertTriangle size={18} className="text-felt-deep" /> {kk ? "Кімге көмек керек" : "Who needs help"}
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {help.slice(0, 8).map(({ m, flags }) => (
              <li key={m.user_id}>
                <button onClick={() => onOpen(m)} className="w-full text-left flex items-center gap-3 py-2.5 min-h-[48px]">
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-ink truncate">{m.nickname}</span>
                    <span className="block text-[13px] text-felt-deep font-semibold">{flags.map(flagText).join(" · ")}</span>
                  </span>
                  <ChevronRight size={18} className="text-ink-3 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {assignments.length === 0 && (
        <div className="card p-4 flex items-center gap-3">
          <p className="flex-1 text-[15px] text-ink-2">{kk ? "Тапсырма берсең, мұнда кім орындағаны көрінеді." : "Give an assignment to see here who has done it."}</p>
          <button onClick={onGoTasks} className="btn btn-sm"><Plus size={16} /> {kk ? "Тапсырма" : "Assign"}</button>
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Focusable, so the columns on the right can be scrolled to with the arrow keys. */}
        <div className="relative overflow-x-auto" role="region" tabIndex={0} aria-labelledby="grid-caption">
          <table className="w-full text-left border-collapse min-w-[360px]">
            <caption id="grid-caption" className="sr-only">{kk ? "Оқушылар мен тапсырмалар" : "Learners and assignments"}</caption>
            <thead>
              <tr className="border-b-2 border-line">
                <th scope="col" className="sticky left-0 z-[1] bg-card px-4 py-3 text-[13px] font-bold text-ink-2">{kk ? "Оқушы" : "Learner"}</th>
                <th scope="col" className="px-2 py-3 text-[13px] font-bold text-ink-2 whitespace-nowrap">{kk ? "Соңғы рет" : "Last seen"}</th>
                {shown.map((a) => (
                  <th key={a.id} scope="col" className="px-2 py-3 text-[12px] font-bold text-ink-2 min-w-[72px]" title={`${storyTitle(a.story_id)} · ${stepLabel(a.step, kk)}`}>
                    <span className="block truncate max-w-[88px]">{storyTitle(a.story_id)}</span>
                    <span className="block text-ink-3 font-semibold">{a.step === "quiz" ? (kk ? "Сынақ" : "Quiz") : a.step}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const away = daysAway(m.last_active_date);
                return (
                  <tr key={m.user_id} className="border-b border-line last:border-0">
                    <th scope="row" className="sticky left-0 z-[1] bg-card px-4 py-2">
                      <button onClick={() => onOpen(m)} title={m.nickname} className="font-bold text-sky-deep text-[15px] text-left min-h-[40px] max-w-[140px] truncate block">{m.nickname}</button>
                    </th>
                    <td className={`px-2 py-2 text-[13px] whitespace-nowrap ${away === null || away >= 7 ? "text-felt-deep font-semibold" : "text-ink-2"}`}>{awayText(away, kk)}</td>
                    {shown.map((a) => (
                      <td key={a.id} className="px-2 py-2"><CellBadge cell={cellFor(m, a)} kk={kk} /></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {assignments.length > shown.length && (
          <p className="px-4 py-2 text-[12px] text-ink-2 border-t border-line">{kk ? `Соңғы ${shown.length} тапсырма көрсетілді.` : `Showing the latest ${shown.length} assignments.`}</p>
        )}
      </div>
      <p className="text-[12px] text-ink-2 flex flex-wrap gap-x-4 gap-y-1">
        <span><b className="text-[#0F6E4B]">80%</b> {kk ? "орындады, ұпайы" : "done, score"}</span>
        <span><b className="text-[#8A5A00]">⏱</b> {kk ? "кеш орындады" : "done late"}</span>
        <span><b className="text-felt-deep">!</b> {kk ? "мерзімі өтті" : "overdue"}</span>
        <span><b className="text-felt-deep">40%</b> {kk ? "тапсырды, бірақ өтпеді" : "tried, not passed"}</span>
        <span><b>—</b> {kk ? "әлі жоқ" : "not yet"}</span>
      </p>
    </div>
  );
}

function TasksTab({ kk, classId, archived, members, assignments, onChanged }: {
  kk: boolean; classId: string; archived: boolean; members: Member[]; assignments: Assignment[]; onChanged: () => void;
}) {
  const weekAhead = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return localDay(d);
  };
  const [storyId, setStoryId] = useState<string>(STORIES[0].id);
  const [step, setStep] = useState<AssignStep>("A1");
  const [due, setDue] = useState<string>(weekAhead);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ClassError | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const today = localDay();
  const duplicate = assignments.some((a) => a.story_id === storyId && a.step === step);
  const dueBad = !!due && due < today;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || dueBad) return;
    setBusy(true);
    setError(null);
    const res = await addAssignment(classId, { story_id: storyId, step, due_at: due ? dueAtEndOf(due) : null, note: note.trim().slice(0, 200) });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onChanged();
  };

  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<ClassError | null>(null);
  const remove = async (id: string) => {
    if (removing) return;
    setRemoving(true);
    setRemoveError(null);
    const res = await deleteAssignment(id);
    setRemoving(false);
    if (!res.ok) { setRemoveError(res.error); return; }
    setConfirmId(null);
    onChanged();
  };

  return (
    <div className="space-y-5">
      {archived ? (
        <p className="card p-4 text-[15px] text-ink-2">{kk ? "Мұрағаттағы сыныпқа жаңа тапсырма беруге болмайды." : "You can't add assignments to an archived class."}</p>
      ) : (
        <form onSubmit={submit} className="card p-5 space-y-4" noValidate>
          <h2 className="font-display font-extrabold text-ink text-[17px]">{kk ? "Жаңа тапсырма" : "New assignment"}</h2>
          <label className="block">
            <span className="text-sm font-bold text-ink">{kk ? "Ертегі" : "Tale"}</span>
            <select value={storyId} onChange={(e) => setStoryId(e.target.value)} className="field mt-1.5">
              {STORIES.map((s: { id: string; title: string }) => <option key={s.id} value={s.id}>{displayTitle(s.title)}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-bold text-ink">{kk ? "Не істеу керек" : "What to do"}</legend>
            <div className="segmented mt-1.5" role="group">
              {ASSIGN_STEPS.map((s) => (
                <button type="button" key={s} aria-pressed={step === s} onClick={() => setStep(s)}>{s === "quiz" ? (kk ? "Сынақ" : "Quiz") : s}</button>
              ))}
            </div>
            <span className="block text-[13px] text-ink-2 mt-1.5">
              {step === "quiz"
                ? (kk ? "Бүкіл ертегі бойынша қорытынды сынақ." : "The final quiz on the whole tale.")
                : (kk ? `${step} деңгейін оқып, қысқа сынақтан өту.` : `Read level ${step} and pass its short check.`)}
            </span>
          </fieldset>
          <label className="block">
            <span className="text-sm font-bold text-ink">{kk ? "Мерзімі" : "Due date"}</span>
            <input type="date" value={due} min={today} onChange={(e) => setDue(e.target.value)} className="field mt-1.5" aria-invalid={dueBad} />
            {dueBad && <span role="alert" className="block text-[13px] text-felt-deep font-semibold mt-1">{kk ? "Өткен күнді таңдауға болмайды." : "Pick today or a later day."}</span>}
          </label>
          <label className="block">
            <span className="text-sm font-bold text-ink">{kk ? "Түсініктеме (міндетті емес)" : "Note (optional)"}</span>
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} maxLength={200} className="field mt-1.5" placeholder={kk ? "Мысалы: жаңа сөздерді дәптерге жаз" : "e.g. write the new words in your notebook"} />
          </label>
          {duplicate && <p className="text-[13px] text-[#8A5A00] font-semibold">{kk ? "Бұл тапсырма бұрын да берілген. Қайта беруге болады." : "You've given this one before. You can give it again."}</p>}
          {error && <p role="alert" className="text-[14px] font-semibold text-felt-deep">{errorText(error, kk)}</p>}
          <button type="submit" disabled={busy || dueBad} className="btn w-full">
            {saved ? <><Check size={18} strokeWidth={3} aria-hidden /> {kk ? "Берілді" : "Assigned"}</> : <><Plus size={18} aria-hidden /> {kk ? "Тапсырма беру" : "Assign"}</>}
          </button>
          <span role="status" className="sr-only">{saved ? (kk ? "Тапсырма берілді" : "Assignment added") : ""}</span>
        </form>
      )}

      {assignments.length > 0 && (
        <ul className="card overflow-hidden divide-y divide-line">
          {assignments.map((a) => {
            const doneCount = members.filter((m) => { const s = cellFor(m, a).status; return s === "done" || s === "late"; }).length;
            const confirming = confirmId === a.id;
            return (
              <li key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.step === "quiz" ? "bg-sun-soft text-[#8A5A00]" : "bg-sky-soft text-sky-deep"}`}>
                    {a.step === "quiz" ? <Trophy size={18} /> : <BookOpen size={18} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0"><span className="shrink-0 px-1.5 rounded-md bg-sand-2 text-[12px] font-bold text-ink-2">{a.step === "quiz" ? (kk ? "Сынақ" : "Quiz") : a.step}</span><span className="font-bold text-ink text-[15px] truncate">{storyTitle(a.story_id)}</span></span>
                    <span className="block text-[13px] text-ink-2">{dueText(a.due_at, kk)} · {kk ? `${doneCount}/${members.length} орындады` : `${doneCount}/${members.length} done`}</span>
                    {a.note && <span className="block text-[13px] text-ink-2 truncate">«{a.note}»</span>}
                  </span>
                  {!confirming && (
                    <button onClick={() => { setConfirmId(a.id); setRemoveError(null); }} aria-label={kk ? "Тапсырманы өшіру" : "Delete assignment"} className="w-10 h-10 rounded-full text-ink-2 hover:bg-sand-2 flex items-center justify-center shrink-0">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                {confirming && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[14px] text-ink flex-1 min-w-[160px]">{kk ? "Өшіресің бе? Оқушылардың прогресі сақталады." : "Delete it? Learners keep their progress."}</span>
                    <button onClick={() => { setConfirmId(null); setRemoveError(null); }} className="btn btn-ghost btn-sm">{kk ? "Артқа" : "Back"}</button>
                    <button onClick={() => remove(a.id)} disabled={removing} className="btn btn-felt btn-sm">{kk ? "Өшіру" : "Delete"}</button>
                    {removeError && <p role="alert" className="basis-full text-[14px] font-semibold text-felt-deep">{errorText(removeError, kk)}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SettingsTab({ kk, cls, gone, onChange, onChanged, onArchived }: {
  kk: boolean; cls: ClassRow; gone: Member[];
  onChange: (c: ClassRow) => void; onChanged: () => void; onArchived: () => void;
}) {
  const [name, setName] = useState(cls.name);
  const [error, setError] = useState<ClassError | null>(null);
  const [savedName, setSavedName] = useState(false);
  const [confirm, setConfirm] = useState<"code" | "archive" | null>(null);
  // One request at a time: a double tap must not make two codes.
  const [busy, setBusy] = useState(false);
  const archived = !!cls.archived_at;
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const act = async <T,>(run: () => Promise<Result<T>>): Promise<T | undefined> => {
    if (busy) return undefined;
    setBusy(true);
    setError(null);
    const res = await run();
    setBusy(false);
    setConfirm(null);
    if (!res.ok) { setError(res.error); return undefined; }
    return res.data;
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = name.trim();
    if (!next || next === cls.name) return;
    if ((await act(() => renameClass(cls.id, next))) === undefined) return;
    onChange({ ...cls, name: next });
    setSavedName(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedName(false), 2000);
  };
  const regenerate = async () => {
    const code = await act(() => newClassCode(cls.id));
    if (code) onChange({ ...cls, code });
  };
  const toggleArchive = async () => {
    if ((await act(() => setArchived(cls.id, !archived))) === undefined) return;
    onChange({ ...cls, archived_at: archived ? null : new Date().toISOString() });
    if (!archived) onArchived();
  };
  const restore = async (m: Member) => {
    if ((await act(() => setMemberRemoved(cls.id, m.user_id, false))) === undefined) return;
    onChanged();
  };

  return (
    <div className="space-y-5">
      {error && <Notice error={error} kk={kk} />}
      <form onSubmit={saveName} className="card p-5" noValidate>
        <label htmlFor="class-name" className="text-sm font-bold text-ink">{kk ? "Сынып аты" : "Class name"}</label>
        <div className="flex gap-3 mt-1.5">
          <input id="class-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} maxLength={60} className="field flex-1" />
          <button type="submit" disabled={busy || !name.trim() || name.trim() === cls.name} className="btn btn-sm !min-h-[50px]">
            {savedName ? <><Check size={18} strokeWidth={3} aria-hidden /> {kk ? "Сақталды" : "Saved"}</> : (kk ? "Сақтау" : "Save")}
          </button>
        </div>
      </form>

      {!archived && (
        <div className="card p-5">
          <p className="text-sm font-bold text-ink">{kk ? "Жаңа код" : "New code"}</p>
          <p className="text-[14px] text-ink-2 mt-1">{kk ? "Код бөтен адамдарға тарап кетсе. Ескі код істемей қалады, сыныптағылар қала береді." : "If the code got around. The old code stops working; learners already in stay."}</p>
          {confirm === "code" ? (
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConfirm(null)} className="btn btn-ghost btn-sm">{kk ? "Артқа" : "Back"}</button>
              <button onClick={regenerate} disabled={busy} className="btn btn-sm">{kk ? "Иә, жаңа код" : "Yes, new code"}</button>
            </div>
          ) : (
            <button onClick={() => setConfirm("code")} className="btn btn-ghost btn-sm mt-3"><RotateCcw size={15} /> {kk ? "Жаңа код жасау" : "Make a new code"}</button>
          )}
        </div>
      )}

      {gone.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-bold text-ink">{kk ? "Сыныптан шыққандар" : "Left the class"}</p>
          <ul className="mt-2 divide-y divide-line">
            {gone.map((m) => (
              <li key={m.user_id} className="flex items-center gap-3 py-2 min-h-[48px]">
                <span className="flex-1 min-w-0 truncate text-ink">{m.nickname}</span>
                <span className="text-[13px] text-ink-2">{m.removed ? (kk ? "мұғалім шығарды" : "removed") : (kk ? "шықты, кодпен қайта кіре алады" : "left, can rejoin with the code")}</span>
                {m.removed && <button onClick={() => restore(m)} disabled={busy} className="btn btn-ghost btn-sm">{kk ? "Қайта кіруге рұқсат" : "Allow back"}</button>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-5">
        <p className="text-sm font-bold text-ink">{archived ? (kk ? "Мұрағаттан шығару" : "Restore class") : (kk ? "Мұрағатқа жіберу" : "Archive class")}</p>
        <p className="text-[14px] text-ink-2 mt-1">
          {archived
            ? (kk ? "Сынып қайта ашылады, оқушылар тапсырмаларды қайта көреді." : "The class opens again and learners see its assignments.")
            : (kk ? "Оқу жылы немесе курс аяқталса. Ешнәрсе өшпейді, кез келген уақытта қайтаруға болады." : "When the course ends. Nothing is deleted and you can restore it any time.")}
        </p>
        {confirm === "archive" ? (
          <div className="flex gap-2 mt-3">
            <button onClick={() => setConfirm(null)} className="btn btn-ghost btn-sm">{kk ? "Артқа" : "Back"}</button>
            <button onClick={toggleArchive} disabled={busy} className="btn btn-felt btn-sm">{kk ? "Иә, мұрағатқа" : "Yes, archive"}</button>
          </div>
        ) : (
          <button onClick={() => (archived ? toggleArchive() : setConfirm("archive"))} disabled={busy} className="btn btn-ghost btn-sm mt-3">
            <Archive size={15} /> {archived ? (kk ? "Қайта ашу" : "Restore") : (kk ? "Мұрағатқа" : "Archive")}
          </button>
        )}
      </div>
    </div>
  );
}

/* --- one learner --- */
function StudentSheet({ kk, classId, member, assignments, onClose, onRemoved }: {
  kk: boolean; classId: string; member: Member | null; assignments: Assignment[];
  onClose: () => void; onRemoved: () => void;
}) {
  const [detail, setDetail] = useState<StudentReport | null>(null);
  const [error, setError] = useState<ClassError | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<ClassError | null>(null);
  const [shownFor, setShownFor] = useState<string | null>(null);

  // A new learner opens with a clean sheet.
  const id = member?.user_id ?? null;
  if (id !== shownFor) {
    setShownFor(id);
    setDetail(null);
    setError(null);
    setConfirm(false);
    setRemoveError(null);
  }

  useEffect(() => {
    if (!id) return;
    let live = true;
    studentReport(classId, id).then((res) => {
      if (!live) return;
      if (res.ok) setDetail(res.data); else setError(res.error);
    });
    return () => { live = false; };
  }, [classId, id]);

  const remove = async () => {
    if (!member || removing) return;
    setRemoving(true);
    setRemoveError(null);
    const res = await setMemberRemoved(classId, member.user_id, true);
    setRemoving(false);
    // Shown by the button, where the teacher is looking on a phone.
    if (!res.ok) { setRemoveError(res.error); return; }
    onRemoved();
  };

  const m = member;
  const away = m ? daysAway(m.last_active_date) : null;
  const streak = m && away !== null && away <= 1 ? m.streak_days : 0;
  const weak = (detail?.words ?? []).filter((w) => w.mastery <= 1).slice(0, 12);
  const tales = m ? STORIES.map((s: { id: string; title: string }) => ({
    title: displayTitle(s.title),
    // Every tale comes with the learner's report; the class report has only the assigned ones.
    steps: ["A1", "A2", "B1", "B2", "C1", "quiz"].filter((st) => (detail?.steps ?? m.steps).some((x) => x.story_id === s.id && x.step === st)),
  })).filter((t) => t.steps.length > 0) : [];

  return (
    <Sheet open={!!m} onClose={onClose} label={m ? m.nickname : ""}>
      {m && (
        <div className="px-5 pb-5 pt-1 space-y-5">
          <div>
            <h2 className="font-display font-black text-2xl text-ink [overflow-wrap:anywhere]">{m.nickname}</h2>
            <p className="text-[14px] text-ink-2">{kk ? "Соңғы рет" : "Last seen"}: {awayText(away, kk)}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { Icon: Flame, v: streak, l: kk ? "күн қатарынан" : "day streak" },
              { Icon: Zap, v: m.xp, l: "XP" },
              { Icon: BookOpen, v: `${m.words_learned}/${m.words_total}`, l: kk ? "сөз үйренді" : "words learned" },
            ].map(({ Icon, v, l }) => (
              <div key={l} className="tile p-3 text-center">
                <Icon size={18} className="mx-auto text-ink-2" aria-hidden />
                <p className="font-display font-black text-xl text-ink leading-none mt-1">{v}</p>
                <p className="text-[12px] text-ink-2 mt-1 leading-tight">{l}</p>
              </div>
            ))}
          </div>

          {assignments.length > 0 && (
            <div>
              <h3 className="font-display font-extrabold text-ink">{kk ? "Тапсырмалар" : "Assignments"}</h3>
              <ul className="mt-2 space-y-1.5">
                {assignments.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 text-[14px]">
                    <span className="flex-1 min-w-0 flex items-center gap-1.5"><span className="shrink-0 px-1.5 rounded-md bg-sand-2 text-[12px] font-bold text-ink-2">{a.step === "quiz" ? (kk ? "Сынақ" : "Quiz") : a.step}</span><span className="truncate text-ink">{storyTitle(a.story_id)}</span></span>
                    <CellBadge cell={cellFor(m, a)} kk={kk} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-display font-extrabold text-ink">{kk ? "Оқыған ертегілері" : "Tales read"}</h3>
            {tales.length === 0
              ? <p className="text-[14px] text-ink-2 mt-1">{kk ? "Әлі ертегі оқымаған." : "No tales yet."}</p>
              : (
                <ul className="mt-2 space-y-1.5">
                  {tales.map((t) => (
                    <li key={t.title} className="text-[14px] text-ink"><b>{t.title}</b>: <span className="text-ink-2">{t.steps.map((s) => (s === "quiz" ? (kk ? "сынақ" : "quiz") : s)).join(", ")}</span></li>
                  ))}
                </ul>
              )}
          </div>

          {error && <Notice error={error} kk={kk} />}
          {!detail && !error && <p role="status" className="text-[14px] text-ink-2">{kk ? "Жүктеліп жатыр…" : "Loading…"}</p>}

          {detail && (
            <>
              <div>
                <h3 className="font-display font-extrabold text-ink">{kk ? "Әлі үйренілмеген сөздер" : "Words still to learn"}</h3>
                {weak.length === 0
                  ? <p className="text-[14px] text-ink-2 mt-1">{kk ? "Жоқ. Жарайды!" : "None. Nice!"}</p>
                  : (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {weak.map((w) => (
                        <li key={w.word} className="px-2.5 h-8 rounded-full bg-sand-2 text-[13px] text-ink flex items-center">{w.word} <span className="text-ink-2 ml-1">· {w.translation}</span></li>
                      ))}
                    </ul>
                  )}
                <p className="text-[12px] text-ink-2 mt-1.5">{kk ? `Қайталауға дайын: ${m.words_due}` : `Due for review: ${m.words_due}`}</p>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-ink">{kk ? "Соңғы сынақтар" : "Recent quizzes"}</h3>
                {detail.quizzes.length === 0
                  ? <p className="text-[14px] text-ink-2 mt-1">{kk ? "Әлі сынақ тапсырмаған." : "No quizzes yet."}</p>
                  : (
                    <ul className="mt-2 space-y-1.5">
                      {detail.quizzes.slice(0, 8).map((q, i) => {
                        const pct = Math.round((q.score / q.total) * 100);
                        return (
                          <li key={i} className="flex items-center gap-3 text-[14px]">
                            <span className="flex-1 min-w-0 flex items-center gap-1.5"><span className="shrink-0 px-1.5 rounded-md bg-sand-2 text-[12px] font-bold text-ink-2">{q.step === "quiz" ? (kk ? "Сынақ" : "Quiz") : q.step}</span><span className="truncate text-ink">{storyTitle(q.story_id)}</span></span>
                            <span className="text-ink-2 text-[12px]">{shortDate(q.created_at)}</span>
                            <span className={`font-bold ${pct >= 60 ? "text-[#0F6E4B]" : "text-felt-deep"}`}>{q.score}/{q.total}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
              </div>
            </>
          )}

          <div className="pt-1">
            {confirm ? (
              <div className="rounded-2xl bg-felt-soft/60 p-4">
                <p className="text-[14px] text-ink">
                  {kk ? `${m.nickname} сыныптан шығады, сен оның прогресін енді көрмейсің. Прогресі өзінде қалады. Баптау бөлімінде қайта кіруге рұқсат бере аласың.` : `${m.nickname} leaves the class and you won't see their progress any more. It stays theirs. In Settings you can allow them back.`}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => { setConfirm(false); setRemoveError(null); }} className="btn btn-ghost btn-sm">{kk ? "Артқа" : "Back"}</button>
                  <button onClick={remove} disabled={removing} className="btn btn-felt btn-sm">{kk ? "Шығару" : "Remove"}</button>
                </div>
                {removeError && <p role="alert" className="text-[14px] font-semibold text-felt-deep mt-2">{errorText(removeError, kk)}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onClose} className="btn btn-ghost btn-sm">{kk ? "Жабу" : "Close"}</button>
                <button onClick={() => setConfirm(true)} className="btn btn-ghost btn-sm !text-felt-deep">{kk ? "Сыныптан шығару" : "Remove from class"}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
