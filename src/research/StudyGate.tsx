import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useLearnerState, noteChange } from "../utils/learnerSync";
import { setEventsUser } from "../utils/events";
import { normalizeStudyCode, readStudyCode, writeStudyCode } from "./studyCode";
import { assentStatus, readAssent, writeAssent, type AssentFile } from "./assent";
import assentJson from "../data/studyAssent.json";
import type { Lang } from "../lang";

const store = () => (typeof localStorage === "undefined" ? null : localStorage);

const ASSENT = assentJson as unknown as AssentFile;

/* R4: in the research build a learner types the participant code once, after
   the usual sign-in. The code is kept in learner_state (kind study_code), so
   it follows the learner to another device, and goes into the context of
   every event (utils/events.ts).
   R9: then the learner reads the assent text and answers yes or no (kind
   study_assent). Only "yes" to the current text opens the app and switches
   the learning log on: until then, and after a "no", nothing is logged. */
export function StudyGate({ userId, lang, children }: { userId: string; lang: Lang; children: ReactNode }) {
  const [code, setCode] = useLearnerState(() => readStudyCode(store(), userId));
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const kk = lang === "kk";
  if (code) return <AssentStep userId={userId} lang={lang}>{children}</AssentStep>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const c = normalizeStudyCode(input);
    if (!c) { setError(true); return; }
    const s = store();
    if (s) writeStudyCode(s, userId, c);
    noteChange(userId, "study_code", "code");
    setCode(c);
  };

  return (
    <div className="min-h-dvh w-full bg-sand font-body text-ink flex items-center justify-center p-4">
      <form onSubmit={submit} className="card p-6 w-full max-w-[420px] space-y-4">
        <p className="eyebrow">{kk ? "Зерттеу" : "Study"}</p>
        <h1 className="font-display font-extrabold text-[22px] leading-snug">{kk ? "Қатысушы коды" : "Participant code"}</h1>
        <p className="text-[15px] text-ink-2">
          {kk ? "Зерттеушінің берген кодын жаз, мысалы ERT-1234. Код бір рет енгізіледі." : "Type the code the researcher gave you, for example ERT-1234. You enter it once."}
        </p>
        <label className="block">
          <span className="sr-only">{kk ? "Қатысушы коды" : "Participant code"}</span>
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text"
            placeholder="ERT-0000"
            aria-invalid={error}
            aria-describedby={error ? "study-code-error" : undefined}
            className="w-full h-12 px-4 rounded-2xl border-2 border-line bg-card text-[18px] font-bold tracking-widest"
          />
        </label>
        {error && (
          <p id="study-code-error" role="alert" className="text-sm text-felt">
            {kk ? "Код дұрыс емес. Әр санды тексер немесе мұғалімнен сұра." : "This code is not valid. Check each digit or ask your teacher."}
          </p>
        )}
        <button type="submit" className="btn btn-sun w-full">{kk ? "Жалғастыру" : "Continue"}</button>
      </form>
    </div>
  );
}

/* Events are on only while the app is open behind the gate. */
function EventsOn({ userId, children }: { userId: string; children: ReactNode }) {
  useEffect(() => {
    setEventsUser(userId);
    return () => setEventsUser(null);
  }, [userId]);
  return <>{children}</>;
}

function AssentStep({ userId, lang, children }: { userId: string; lang: Lang; children: ReactNode }) {
  const [assent, setAssent] = useLearnerState(() => readAssent(store(), userId));
  const [text, setText] = useState<"kk" | "ru">(lang === "kk" ? "kk" : "ru");
  const [understood, setUnderstood] = useState(false);
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [changing, setChanging] = useState(false);
  const status = assentStatus(assent, ASSENT.version);
  if (status === "yes") return <EventsOn userId={userId}>{children}</EventsOn>;

  const t = ASSENT.texts[text];
  const frame = (body: ReactNode) => (
    <div className="min-h-dvh w-full bg-sand font-body text-ink flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-[520px] space-y-4">{body}</div>
    </div>
  );
  const save = (answer: "yes" | "no") => {
    const s = store();
    const a = { version: ASSENT.version, answer, at: new Date().toISOString(), sample: ASSENT.sample };
    if (s) writeAssent(s, userId, a);
    noteChange(userId, "study_assent", "assent");
    setAssent(a);
  };
  const toggle = (
    <div className="flex gap-2" role="group" aria-label="Тіл / Язык">
      {(["kk", "ru"] as const).map((l) => (
        <button key={l} type="button" onClick={() => setText(l)} aria-pressed={text === l}
          className={`px-3 h-9 rounded-xl border-2 text-sm font-bold ${text === l ? "border-sky bg-sky/10" : "border-line"}`}>
          {l === "kk" ? "ҚАЗ" : "РУС"}
        </button>
      ))}
    </div>
  );

  if (status === "no" && !changing) {
    return frame(<>
      <div className="flex justify-between items-center"><p className="eyebrow">{ASSENT.sample ? "ҮЛГІ / ОБРАЗЕЦ" : text === "kk" ? "Зерттеу" : "Исследование"}</p>{toggle}</div>
      <h1 className="font-display font-extrabold text-[22px] leading-snug">{t.declinedTitle}</h1>
      <p className="text-[15px] text-ink-2">{t.declinedBody}</p>
      <button type="button" className="btn w-full" onClick={() => { setChanging(true); setChoice(null); setUnderstood(false); }}>{t.change}</button>
    </>);
  }

  return frame(<>
    <div className="flex justify-between items-center"><p className="eyebrow">{ASSENT.sample ? "ҮЛГІ / ОБРАЗЕЦ" : text === "kk" ? "Зерттеу" : "Исследование"}</p>{toggle}</div>
    {ASSENT.sample && <p role="note" className="text-sm font-bold text-felt">ҮЛГІ: бұл нағыз келісім мәтіні емес. / ОБРАЗЕЦ: это не настоящий текст согласия.</p>}
    <h1 className="font-display font-extrabold text-[22px] leading-snug">{t.title}</h1>
    <ul className="list-disc pl-5 space-y-2 text-[15px] text-ink-2">{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
    <label className="flex gap-3 items-start text-[15px]">
      <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
      <span>{t.understood}</span>
    </label>
    <fieldset className="space-y-2">
      <legend className="sr-only">{t.title}</legend>
      {([["yes", t.agree], ["no", t.decline]] as const).map(([v, label]) => (
        <label key={v} className="flex gap-3 items-start text-[15px]">
          <input type="radio" name="assent" value={v} checked={choice === v} onChange={() => setChoice(v)} className="mt-1 h-5 w-5 shrink-0" />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
    <button type="button" className="btn btn-sun w-full" disabled={!understood || !choice} onClick={() => { if (choice) { save(choice); setChanging(false); } }}>{t.proceed}</button>
  </>);
}

