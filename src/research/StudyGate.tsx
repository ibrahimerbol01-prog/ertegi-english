import { useState, type FormEvent, type ReactNode } from "react";
import { useLearnerState, noteChange } from "../utils/learnerSync";
import { normalizeStudyCode, readStudyCode, writeStudyCode } from "./studyCode";
import type { Lang } from "../lang";

const store = () => (typeof localStorage === "undefined" ? null : localStorage);

/* R4: in the research build a learner types the participant code once, after
   the usual sign-in. The code is kept in learner_state (kind study_code), so
   it follows the learner to another device, and goes into the context of
   every event (utils/events.ts). The app opens only after that. */
export function StudyGate({ userId, lang, children }: { userId: string; lang: Lang; children: ReactNode }) {
  const [code, setCode] = useLearnerState(() => readStudyCode(store(), userId));
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const kk = lang === "kk";
  if (code) return <>{children}</>;

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
