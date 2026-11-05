import { useRef, useState } from "react";
import { ScreenHeader } from "../../components/UIHelpers";
import { flushEvents, track } from "../../utils/events";
import { readStudyCode, sequenceOf } from "../studyCode";
import { formFor, nextIndex, scoreAnswer, sessionItems, summarize } from "./engine";
import { finishSession, loadSession, recordAnswer, startSession } from "./progress";
import { TEST_SET } from "./testSet";
import { TIMEPOINTS, type Answer, type SessionProgress, type TestItem, type Timepoint } from "./types";
import type { Lang } from "../../lang";

/* R5: the vocabulary test of the research build. No XP, no hints, no timer,
   no right/wrong after an answer, no going back. Every answer is kept on the
   device first and then logged (test_answer); the end is test_complete. */

const store = () => (typeof localStorage === "undefined" ? null : localStorage);
const MAX_MS = 30 * 60_000;
/** Read only in event handlers. */
const clock = () => Date.now();

const TP_LABEL: Record<Timepoint, [string, string]> = {
  pre: ["Алдын ала тест", "Pre-test"],
  post: ["Кейінгі тест", "Post-test"],
  delayed: ["Кешіктірілген тест", "Delayed test"],
};

export default function TestScreen({ userId, lang }: { userId: string; lang: Lang }) {
  const kk = lang === "kk";
  const tr = (k: string, e: string) => (kk ? k : e);
  const set = TEST_SET.set;
  const code = readStudyCode(store(), userId);
  const [tp, setTp] = useState<Timepoint | null>(null);
  const [session, setSession] = useState<SessionProgress | null>(null);
  const [started, setStarted] = useState(false);
  const shownAt = useRef(0);

  if (!set || !code) {
    return (
      <div className="animate-pop-in">
        <ScreenHeader eyebrow={tr("Зерттеу", "Study")} title={tr("Тест", "Test")} />
        <p className="card p-4 text-[15px] text-ink-2">{tr("Тест әлі дайын емес. Мұғалімге айт.", "The test is not ready yet. Tell your teacher.")}</p>
      </div>
    );
  }

  const header = (
    <>
      <ScreenHeader eyebrow={`${tr("Зерттеу", "Study")} · ${code}`} title={tp ? tr(...TP_LABEL[tp]) : tr("Тест", "Test")} />
      {set.sample && (
        <p role="note" className="card p-3 mb-4 text-sm font-bold text-felt">
          {tr("ҮЛГІ: бұл нағыз тест емес, тек пішімдердің мысалы.", "SAMPLE: this is not the real test, only examples of the formats.")}
        </p>
      )}
    </>
  );

  const baseOf = (t: Timepoint, p: SessionProgress) => ({ form: p.form, timepoint: t, set_version: set.version, sample: set.sample });
  /** Closes the session once and logs the summary. */
  function complete(t: Timepoint, p: SessionProgress) {
    if (!finishSession(store(), userId, set!.version, t) && p.done_at) return;
    const ms = clock() - Date.parse(p.started_at);
    track("test_complete", {
      object_type: "test", object_id: `${set!.version}|${t}`,
      result: { ...baseOf(t, p), ...summarize(sessionItems(set!, p.form, t), p.answers), duration_ms: Math.min(ms, 24 * 3600_000) },
    });
    void flushEvents();
    p.done_at = new Date().toISOString();
  }

  // 1. Which session: the teacher says which one to take.
  if (!tp || !session) {
    return (
      <div className="animate-pop-in">
        {header}
        <p className="text-[15px] text-ink-2 -mt-2 mb-4">{tr("Мұғалім қай тестті тапсыру керегін айтады.", "Your teacher will tell you which test to take.")}</p>
        <div className="card overflow-hidden divide-y divide-line">
          {TIMEPOINTS.map((t) => {
            const p = loadSession(store(), userId, set.version, t);
            const items = sessionItems(set, p?.form ?? formFor(sequenceOf(code), t), t);
            const status = p?.done_at ? tr("Аяқталды", "Done") : p ? tr("Жалғастыру", "Continue") : tr("Бастау", "Start");
            return (
              <button
                key={t}
                disabled={!!p?.done_at || !items.length}
                onClick={() => {
                  const s = startSession(store(), userId, set.version, t, formFor(sequenceOf(code), t));
                  // All answered but not closed (the tab closed at the last answer): close it now.
                  if (nextIndex(sessionItems(set, s.form, t), s.answers) < 0) complete(t, s);
                  shownAt.current = clock();
                  setTp(t); setSession(s); setStarted(Object.keys(s.answers).length > 0);
                }}
                className="w-full flex items-center justify-between gap-4 p-4 text-left disabled:opacity-60"
              >
                <span className="font-display font-extrabold text-[17px]">{tr(...TP_LABEL[t])}</span>
                <span className="text-sm text-ink-2">{status}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const items = sessionItems(set, session.form, tp);
  const idx = nextIndex(items, session.answers);
  const base = baseOf(tp, session);

  // 3. All answered: no score on screen.
  if (idx < 0 || session.done_at) {
    return (
      <div className="animate-pop-in">
        {header}
        <div className="card p-6 text-center space-y-2">
          <p className="font-display font-extrabold text-[20px]">{tr("Рақмет! Тест аяқталды.", "Thank you! The test is finished.")}</p>
          <p className="text-[15px] text-ink-2">{tr("Жауаптар сақталды. Тест бағаға әсер етпейді.", "Your answers are saved. The test does not affect your grades.")}</p>
        </div>
        <button onClick={() => { setTp(null); setSession(null); setStarted(false); }} className="btn btn-ghost w-full mt-4">{tr("Артқа", "Back")}</button>
      </div>
    );
  }

  // 2a. Instructions before the first item.
  if (!started) {
    return (
      <div className="animate-pop-in">
        {header}
        <div className="card p-5 space-y-2 text-[15px] text-ink-2">
          <p>{tr("Бұл тест бағаға әсер етпейді. Кеңес те, уақыт шегі де жоқ.", "This test does not affect your grades. There are no hints and no time limit.")}</p>
          <p>{tr("Әр сұраққа бір жауап таңда. Артқа қайту жоқ. Білмесең, «Білмеймін» таңда.", "Choose one answer for each question. You cannot go back. If you don't know, choose \"I don't know\".")}</p>
          <p>{tr("Жауаптар құрылғыда сақталады: интернет үзілсе де, тест сол жерден жалғасады.", "Answers are kept on this device: if the internet drops, the test goes on from the same place.")}</p>
        </div>
        <button onClick={() => { shownAt.current = clock(); setStarted(true); }} className="btn btn-sun w-full mt-4">{tr("Бастау", "Start")}</button>
      </div>
    );
  }

  // 2b. One item.
  const item = items[idx];
  const answer = (choice: string | null) => {
    if (session.answers[item.id]) return;
    const ms = Math.min(clock() - shownAt.current, MAX_MS);
    const a: Answer = { choice, correct: scoreAnswer(item, choice), ms };
    // Already answered in another tab or by a double tap: take what the device has, log nothing.
    if (!recordAnswer(store(), userId, set.version, tp, item.id, a)) {
      const saved = loadSession(store(), userId, set.version, tp);
      if (saved?.answers[item.id]) { setSession(saved); return; }
    }
    track("test_answer", {
      object_type: "test_item", object_id: item.id, story_id: item.story_id ?? null,
      result: { ...base, format: item.format, word: item.word || undefined, pseudo: item.pseudo || undefined, position: idx + 1, choice: choice ?? "dont_know", correct: a.correct, duration_ms: ms },
    });
    shownAt.current = clock();
    const next: SessionProgress = { ...session, answers: { ...session.answers, [item.id]: a } };
    if (nextIndex(items, next.answers) < 0) complete(tp, next);
    setSession(next);
  };

  return (
    <div className="animate-pop-in">
      {header}
      <p className="text-sm text-ink-2 mb-3" aria-live="polite">{idx + 1} / {items.length}</p>
      <div className="card p-5">
        <ItemView item={item} kk={kk} />
        <div className="grid gap-2 mt-5">
          {item.options.map((o) => (
            <button key={o} onClick={() => answer(o)} className="btn btn-ghost w-full justify-start text-left">
              {item.format === "recognition" ? (o === "yes" ? tr("Иә", "Yes") : tr("Жоқ", "No")) : o}
            </button>
          ))}
          {item.dont_know && (
            <button onClick={() => answer(null)} className="btn btn-ghost w-full justify-start text-left text-ink-2">{tr("Білмеймін", "I don't know")}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemView({ item, kk }: { item: TestItem; kk: boolean }) {
  const ask = {
    recognition: kk ? "Бұл сөзді бұрын кездестірдің бе?" : "Have you seen this word before?",
    meaning: kk ? "Сөздің мағынасын таңда." : "Choose the meaning of the word.",
    use: kk ? "Бос орынға келетін сөзді таңда." : "Choose the word for the gap.",
    comprehension: kk ? "Мәтін бойынша сұрақ." : "A question about the text.",
  }[item.format];
  return (
    <div>
      <p className="eyebrow mb-2">{ask}</p>
      {(item.format === "recognition" || item.format === "meaning") && <p lang="en" className="font-display font-extrabold text-[28px]">{item.word}</p>}
      {item.prompt && <p lang="en" className="text-[18px] font-semibold leading-relaxed">{item.prompt}</p>}
    </div>
  );
}
