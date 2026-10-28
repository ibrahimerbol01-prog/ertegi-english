import { useRef, useState } from "react";
import { STORIES } from "../constants";
import { BookOpen, Check, ChevronRight, ClipboardList, Clock, LogOut, Trophy, Users } from "lucide-react";
import {
  cleanCode, codeHasBadLetters, errorText, joinClass, leaveClass,
  type Assignment, type ClassError, type MyClass,
} from "../utils/classes";
import { dueText, refreshClasses, stepLabel, storyTitle, useMyClasses } from "../utils/useMyClasses";
import { Sheet } from "./UIHelpers";

/* The learner's side of classes: join by code, see the teacher's assignments
   on Home, leave a class from Profile. The last list from the server is kept
   on the device, so assignments still show offline. */

/* Join a class with the code from the teacher. */
export function JoinClassSheet({ open, onClose, lang, defaultName, initialCode = "", onJoined }: {
  open: boolean;
  onClose: () => void;
  lang: string;
  defaultName: string;
  initialCode?: string;
  onJoined?: (name: string) => void;
}) {
  const kk = lang === "kk";
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ClassError | null>(null);
  const [joined, setJoined] = useState<string | null>(null);

  // Each opening starts fresh with the code it was opened with.
  const [openedWith, setOpenedWith] = useState<string | null>(null);
  if (open && openedWith !== initialCode) {
    setOpenedWith(initialCode);
    setCode(cleanCode(initialCode));
    setError(null);
    setJoined(null);
  }
  if (!open && openedWith !== null) setOpenedWith(null);

  const badLetters = codeHasBadLetters(code);
  const ready = !badLetters && cleanCode(code).length === 6;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const res = await joinClass(code, defaultName);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setJoined(res.data.name);
    refreshClasses();
    onJoined?.(res.data.name);
  };

  return (
    <Sheet open={open} onClose={onClose} label={kk ? "Сыныпқа қосылу" : "Join a class"}>
      <div className="px-5 pb-5 pt-1">
        {joined ? (
          <div className="text-center py-4">
            <span className="w-16 h-16 mx-auto rounded-full bg-jade-soft text-jade-deep flex items-center justify-center">
              <Check size={32} strokeWidth={3} />
            </span>
            <h2 className="font-display font-black text-2xl text-ink mt-4">{kk ? "Сен сыныптасың!" : "You're in!"}</h2>
            <p className="text-ink-2 mt-1.5">
              {kk ? `«${joined}» сыныбы. Мұғалімнің тапсырмалары басты бетте көрінеді.` : `Class “${joined}”. Your teacher's assignments will show on Home.`}
            </p>
            <button onClick={onClose} className="btn w-full mt-6">{kk ? "Жақсы" : "Got it"}</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 className="font-display font-black text-2xl text-ink">{kk ? "Сыныпқа қосылу" : "Join a class"}</h2>
            <p className="text-[15px] text-ink-2 mt-1">{kk ? "Мұғалім берген 6 таңбалы кодты жаз." : "Type the 6-character code from your teacher."}</p>
            <label htmlFor="join-code" className="block mt-5 text-sm font-bold text-ink">{kk ? "Сынып коды" : "Class code"}</label>
            <input
              id="join-code"
              value={code}
              onChange={(e) => { setCode(cleanCode(e.target.value)); setError(null); }}
              className="field mt-1.5 font-display font-black tracking-[0.3em] uppercase text-xl"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="ABC234"
              aria-invalid={error === "not_found" || badLetters}
              aria-describedby={error ? "join-error" : badLetters ? "join-code-hint" : undefined}
            />
            {badLetters && (
              <p id="join-code-hint" className="text-[13px] text-felt-deep font-semibold mt-1.5">
                {kk ? "Кодта I, O, 0, 1 болмайды: мұғалімнен кодты тексер." : "Codes never have I, O, 0 or 1: check the code with your teacher."}
              </p>
            )}
            {error && <p id="join-error" role="alert" className="mt-4 text-[14px] font-semibold text-felt-deep">{errorText(error, kk)}</p>}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button type="button" onClick={onClose} className="btn btn-ghost">{kk ? "Артқа" : "Back"}</button>
              <button type="submit" disabled={!ready || busy} className="btn">{busy ? "…" : kk ? "Қосылу" : "Join"}</button>
            </div>
          </form>
        )}
      </div>
    </Sheet>
  );
}

/* Home: the teacher's open assignments, nearest due date first. */
export function AssignmentsCard({ lang, userId, progress, onStartRead, onStartQuiz }: {
  lang: string;
  userId: string;
  progress: Set<string>;
  onStartRead: (storyId: string, level?: string) => void;
  onStartQuiz: (storyId: string) => void;
}) {
  const kk = lang === "kk";
  const { classes } = useMyClasses(userId);
  const [showAll, setShowAll] = useState(false);
  const open_ = (classes ?? []).filter((c) => !c.archived);
  if (open_.length === 0) return null;

  // An assignment on a tale this version of the app doesn't have is left out.
  const known = (id: string) => STORIES.some((s: { id: string }) => s.id === id);
  const items = open_.flatMap((c) => c.assignments.filter((a) => known(a.story_id)).map((a) => ({ a, cls: c.name, done: progress.has(`${a.story_id}:${a.step}`) })));
  const dueSort = (x: Assignment) => (x.due_at ? new Date(x.due_at).getTime() : Infinity);
  items.sort((x, y) => Number(x.done) - Number(y.done) || dueSort(x.a) - dueSort(y.a));
  const open = items.filter((i) => !i.done).length;
  const shown = showAll ? items : items.slice(0, 4);
  const multi = open_.length > 1;

  const start = (a: Assignment) => (a.step === "quiz" ? onStartQuiz(a.story_id) : onStartRead(a.story_id, a.step));

  return (
    <section className="card p-5" aria-labelledby="assignments-title">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-sky-soft text-sky-deep flex items-center justify-center shrink-0">
          <ClipboardList size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-sky-deep">{multi ? (kk ? "Сыныптар" : "Classes") : open_[0].name}</p>
          <h2 id="assignments-title" className="font-display font-extrabold text-ink text-[17px] leading-snug">
            {items.length === 0
              ? (kk ? "Әзірге тапсырма жоқ" : "No assignments yet")
              : open === 0
                ? (kk ? "Барлық тапсырма орындалды!" : "All assignments done!")
                : (kk ? `Тапсырмалар: ${open}` : `Assignments: ${open} to do`)}
          </h2>
        </div>
      </div>
      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {shown.map(({ a, cls, done }) => {
            const overdue = !done && !!a.due_at && new Date(a.due_at) < new Date();
            return (
              <li key={a.id}>
                <button
                  onClick={() => start(a)}
                  className={`w-full text-left flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 ${done ? "border-line bg-sand/60" : overdue ? "border-felt/40 bg-felt-soft/50" : "border-line bg-card hover:bg-sand/60"}`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-jade-soft text-jade-deep" : a.step === "quiz" ? "bg-sun-soft text-[#8A5A00]" : "bg-sky-soft text-sky-deep"}`}>
                    {done ? <Check size={18} strokeWidth={3} /> : a.step === "quiz" ? <Trophy size={18} /> : <BookOpen size={18} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block font-bold text-[15px] truncate ${done ? "text-ink-2 line-through decoration-2" : "text-ink"}`}>
                      {storyTitle(a.story_id)}
                    </span>
                    <span className={`flex flex-wrap items-center gap-x-1.5 text-[13px] ${overdue ? "text-felt-deep font-semibold" : "text-ink-2"}`}>
                      <b className="font-bold whitespace-nowrap">{stepLabel(a.step, kk)}</b>
                      {done
                        ? <span className="whitespace-nowrap">· {kk ? "орындалды" : "done"}</span>
                        : <span className="inline-flex items-center gap-1 whitespace-nowrap">· <Clock size={13} aria-hidden /> {dueText(a.due_at, kk)}</span>}
                    </span>
                    {multi && <span className="block text-[12px] text-ink-2 truncate">{cls}</span>}
                    {a.note && !done && <span className="block text-[13px] text-ink-2 mt-0.5 line-clamp-2">«{a.note}»</span>}
                  </span>
                  {!done && <ChevronRight size={20} className="text-ink-3 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {items.length > 4 && (
        <button onClick={() => setShowAll((v) => !v)} className="mt-3 text-sm font-bold text-sky-deep min-h-[36px]">
          {showAll ? (kk ? "Жасыру" : "Show less") : (kk ? `Барлығы (${items.length})` : `Show all (${items.length})`)}
        </button>
      )}
    </section>
  );
}

/* Profile: my classes, join another, leave one. */
export function MyClassesSection({ lang, userId, defaultName }: { lang: string; userId: string; defaultName: string }) {
  const kk = lang === "kk";
  const { classes, error } = useMyClasses(userId);
  const [joinOpen, setJoinOpen] = useState(false);
  const [leaving, setLeaving] = useState<MyClass | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaveError, setLeaveError] = useState<ClassError | null>(null);
  const joinBtn = useRef<HTMLButtonElement>(null);

  const confirmLeave = async () => {
    if (!leaving || busy) return;
    setBusy(true);
    const res = await leaveClass(leaving.class_id);
    setBusy(false);
    if (!res.ok) { setLeaveError(res.error); return; }
    setLeaving(null);
    refreshClasses();
  };

  return (
    <div>
      <h2 className="font-display font-black text-xl text-ink mb-3">{(classes?.length ?? 0) > 1 ? (kk ? "Менің сыныптарым" : "My classes") : (kk ? "Менің сыныбым" : "My class")}</h2>
      <div className="card overflow-hidden divide-y divide-line">
        {(classes ?? []).map((c) => (
          <div key={c.class_id} className="flex items-center gap-3 px-4 min-h-[60px]">
            <span className="w-8 h-8 rounded-lg bg-sky-soft text-sky-deep flex items-center justify-center shrink-0"><Users size={16} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[16px] text-ink truncate">{c.name}</span>
              <span className="block text-[13px] text-ink-2 truncate">{kk ? "Атың" : "Your name"}: {c.nickname}{c.archived ? (kk ? " · мұрағатта" : " · archived") : ""}</span>
            </span>
            <button onClick={() => { setLeaveError(null); setLeaving(c); }} className="btn btn-ghost btn-sm !text-felt-deep">
              <LogOut size={15} aria-hidden /> {kk ? "Сыныптан шығу" : "Leave"}
            </button>
          </div>
        ))}
        <button ref={joinBtn} onClick={() => setJoinOpen(true)} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60">
          <span className="w-8 h-8 rounded-lg bg-sky-deep flex items-center justify-center text-white font-black" aria-hidden>+</span>
          <span className="flex-1 text-[16px] text-ink">{kk ? "Сыныпқа кодпен қосылу" : "Join a class with a code"}</span>
          <ChevronRight size={18} className="text-ink-3" />
        </button>
      </div>
      {error === "missing" && <p className="text-[13px] text-ink-2 mt-2">{errorText("missing", kk)}</p>}

      <JoinClassSheet
        open={joinOpen}
        onClose={() => { setJoinOpen(false); setTimeout(() => joinBtn.current?.focus(), 0); }}
        lang={lang}
        defaultName={defaultName}
      />

      <Sheet open={!!leaving} onClose={() => setLeaving(null)} label={kk ? "Сыныптан шығу" : "Leave class"}>
        {leaving && (
          <div className="px-5 pb-5 pt-1">
            <h2 className="font-display font-black text-2xl text-ink">{kk ? "Сыныптан шығасың ба?" : "Leave this class?"}</h2>
            <p className="text-ink-2 mt-1.5">
              {kk
                ? `«${leaving.name}». Сенің прогресің сақталады, бірақ мұғалім оны енді көрмейді. Қайта қосылу үшін код керек.`
                : `“${leaving.name}”. Your progress stays, but your teacher won't see it any more. You'll need the code to come back.`}
            </p>
            {leaveError && <p role="alert" className="mt-3 text-[14px] font-semibold text-felt-deep">{errorText(leaveError, kk)}</p>}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setLeaving(null)} className="btn btn-ghost">{kk ? "Артқа" : "Back"}</button>
              <button onClick={confirmLeave} disabled={busy} className="btn btn-felt">{kk ? "Шығу" : "Leave"}</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
