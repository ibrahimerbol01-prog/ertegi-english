import { useState, useEffect, useRef } from "react";
import { ArrowRight, Volume2, RotateCcw, Trophy, Check, X, Lock, MessageCircle } from "lucide-react";
import { ScreenHeader } from "../UIHelpers";
import { displayTitle } from "../../utils/text";
import { safePlayVoice, stopVoice } from "../../utils/voice";
import { LEVEL_DETAILS } from "../../constants";
import { RESEARCH_MODE } from "../../research/mode";
import { APP_STORIES as STORIES } from "../../research/stories";
import { StoryCover } from "../StoryCover";
import { buildLevelQuiz } from "../../utils/levelQuiz";
import { findEvidence } from "../../utils/evidence";
import { QUIZ_LEVEL_UNLOCK_SHARE, QUIZ_MAX_TRIES, QUIZ_PASS_SHARE, QUIZ_XP_FIRST_TRY, QUIZ_XP_SECOND_TRY } from "../../research/params";
import { asksConfidence, retryOrder, type Confidence, type QuizResult } from "../../utils/quizRetry";
import { useTr } from "./shared";
import { cefrLevel, hintStep } from "../../utils/hintLadder";
import type { ShoqanOpenDetail } from "../ShoqanChat";
import { track } from "../../utils/events";

/* --- 6a. QUIZ SETUP --- */
// Pick the text and its level first; the quiz starts after "Бастау".
export function QuizSetup({ storyId, level, onChange, onStart, progress, lang, t }: {
  storyId: string;
  level: string | null;
  onChange: (storyId: string, level: string | null) => void;
  onStart: () => void;
  progress: Set<string>;
  lang: string;
  t: Record<string, string>;
}) {
  const kk = lang === "kk";
  // A level check is taken after reading it, so only levels already passed
  // (or the one the learner just came from in the reader) can be picked here.
  const [entry] = useState(() => ({ storyId, level }));
  const canPick = (sid: string, lvl: string | null) =>
    lvl === null || progress.has(`${sid}:${lvl}`) || (sid === entry.storyId && lvl === entry.level);
  const modes = [
    { id: null, label: kk ? "Бүкіл ертегі" : "Whole tale" },
    ...LEVEL_DETAILS.map((l) => ({ id: l.id as string | null, label: l.id })),
  ];
  const story = STORIES.find((s) => s.id === storyId) || STORIES[0];
  const count = level ? buildLevelQuiz(story.levels[level as keyof typeof story.levels]).length : story.quizQuestions.length;

  return (
    <div className="animate-pop-in">
      <ScreenHeader eyebrow={kk ? "Сынаққа дайындал" : "Get ready"} title={t.quizTitle} />

      <p className="eyebrow mb-2">{kk ? "1. Мәтінді таңда" : "1. Choose a text"}</p>
      <div className="space-y-2">
        {STORIES.map((s) => {
          const active = s.id === storyId;
          const done = progress.has(`${s.id}:quiz`);
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id, canPick(s.id, level) ? level : null)}
              aria-pressed={active}
              className={`tile w-full text-left p-3 flex items-center gap-3 ${active ? "tile-selected" : "text-ink"}`}
            >
              <StoryCover id={s.id} className={`w-11 h-11 rounded-xl shrink-0 ${active ? "" : "opacity-80"}`} />
              <span className="flex-1 min-w-0">
                <span className="block font-display font-extrabold text-[15px] leading-snug">{displayTitle(s.title)}</span>
              </span>
              {done && <Check size={20} strokeWidth={3} className="text-jade shrink-0" />}
            </button>
          );
        })}
      </div>

      <p className="eyebrow mt-6 mb-2">{kk ? "2. Деңгейді таңда" : "2. Choose the level"}</p>
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => {
          const active = m.id === level;
          const done = m.id ? progress.has(`${storyId}:${m.id}`) : false;
          const open = canPick(storyId, m.id);
          return (
            <button
              key={m.label}
              onClick={() => open && onChange(storyId, m.id)}
              disabled={!open}
              aria-pressed={active}
              title={open ? undefined : (kk ? "Алдымен осы деңгейді оқы: сынағы мәтіннің соңында" : "Read this level first: its check is at the end of the text")}
              className={`tile h-11 px-4 text-sm font-bold flex items-center gap-1.5 ${active ? "tile-selected" : open ? "text-ink" : "text-ink-3 opacity-60"}`}
            >
              {!open && <Lock size={13} />}
              {m.label}
              {done && <Check size={14} strokeWidth={3} className="text-jade" />}
            </button>
          );
        })}
      </div>

      <div className="card p-4 mt-6 grid grid-cols-3 text-center">
        <div><p className="font-display font-black text-xl text-ink">{count}</p><p className="text-xs text-ink-2">{kk ? "сұрақ" : "questions"}</p></div>
        <div className="border-x-2 border-line"><p className="font-display font-black text-xl text-ink">2</p><p className="text-xs text-ink-2">{kk ? "мүмкіндік" : "tries each"}</p></div>
        <div><p className="font-display font-black text-xl text-ink"><RotateCcw size={20} className="inline -mt-1" aria-hidden /></p><p className="text-xs text-ink-2">{kk ? "қате қайталанады" : "mistakes return"}</p></div>
      </div>
      <p className="text-[13px] text-ink-2 mt-3 leading-relaxed">
        {kk ? "Уақыт шектеулі емес. Қателессең, ертегідегі сөйлемді көрсетіп, тағы бір мүмкіндік береміз." : "No time limit. If you get one wrong, we show you the line in the tale and give you another try."}
        {" "}{kk ? "Қате кеткен сұрақтар соңында қайта шығады. Деңгей сынақты соңына дейін өткенде есептеледі." : "Questions you miss come back at the end. The level counts once you finish the quiz."}
      </p>

      <button onClick={onStart} className="btn w-full mt-6">
        {kk ? "Бастау" : "Start"} <ArrowRight size={20} />
      </button>
    </div>
  );
}

/* --- 6. QUIZ SCREEN --- */
// No timer and no hearts: a wrong answer sends the learner back to the tale
// for one more try, and only then shows the right answer with its sentence.
type QuizQuestion = { type?: string; q?: string; sentence?: string; options: string[]; correct: number };

export function QuizScreen({ onReward, t, onQuizFinish, questions, storyTitle, onExit, sourceTexts = [], eventInfo }: {
  /** Tale and level ("quiz" for the whole tale) for the learning events. */
  eventInfo?: { story_id: string; level: string };
  onExit?: () => void;
  onReward: (xp: number) => void;
  t: Record<string, string>;
  onQuizFinish?: (correct: number, total: number, firstTry: number) => void;
  questions: QuizQuestion[];
  storyTitle?: string;
  sourceTexts?: string[];
}) {
  const tr = useTr();
  // The questions of this round, as indexes into `questions`. A practice round
  // holds only the ones missed, earns no XP and doesn't count as a quiz.
  const [round, setRound] = useState(() => questions.map((_, i) => i));
  const [practice, setPractice] = useState(false);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [status, setStatus] = useState<"answering" | "correct" | "revealed">("answering");
  const [results, setResults] = useState<QuizResult[]>([]);
  const [finished, setFinished] = useState(false);
  // How sure the learner was, by question index (asked on some questions, main round only).
  const [conf, setConf] = useState<Record<number, Confidence>>({});
  // Score of the main round, kept while the retry round runs; it is what counts.
  const [main, setMain] = useState<{ correct: number; firstTry: number; total: number } | null>(null);
  const [autoRetry, setAutoRetry] = useState(false);
  // How many times Shoqan's help was asked on the current question (help ladder, §3.8).
  const [asks, setAsks] = useState(0);

  const question = questions[round[pos]];
  const answer = question?.options[question.correct] ?? "";
  const isGap = !!question?.sentence?.includes("___");
  // With two options, one wrong pick leaves nothing to choose, so reveal at once.
  const maxTries = Math.min(QUIZ_MAX_TRIES, (question?.options.length ?? 2) - 1);
  const evidence = question ? findEvidence(question, sourceTexts) : null;
  // A gap sentence read aloud carries the missing word, so it is the hint for gaps.
  const fullSentence = isGap ? (question.sentence || "").replace("___", answer) : null;
  const done = status !== "answering";
  const askConf = !practice && wrongPicks.length === 0 && asksConfidence(round[pos]);
  const myConf = conf[round[pos]];
  const needConf = askConf && !myConf;
  // "Неге?": the line from the tale that holds the answer, shown after every answer.
  const why = fullSentence || evidence;
  // When the current question appeared, for duration_ms in the learning events.
  const shownAt = useRef(0);
  useEffect(() => { shownAt.current = Date.now(); }, [pos, round]);

  useEffect(() => () => stopVoice(), []);

  const handleCheck = () => {
    if (selected === null || done || needConf) return;
    stopVoice();
    track("quiz_answer", {
      object_type: "quiz_question", object_id: round[pos], story_id: eventInfo?.story_id, level: eventInfo?.level,
      result: {
        correct: selected === question.correct, attempt: wrongPicks.length + 1, choice: selected,
        duration_ms: Date.now() - shownAt.current, practice,
        // The hint seen before this answer: the sentence to listen to (gaps) or the line from the tale.
        hint: wrongPicks.length === 0 ? "none" : isGap ? "sentence" : evidence ? "evidence" : "reread",
        type: question.type ?? (isGap ? "gap" : "choice"),
        confidence: myConf ?? null,
      },
    });
    if (selected === question.correct) {
      const firstTry = wrongPicks.length === 0;
      if (!practice) onReward(firstTry ? QUIZ_XP_FIRST_TRY : QUIZ_XP_SECOND_TRY);
      setResults((r) => [...r, firstTry ? "first" : "second"]);
      setStatus("correct");
      return;
    }
    const picks = [...wrongPicks, selected];
    setWrongPicks(picks);
    setSelected(null);
    if (picks.length >= maxTries) {
      setResults((r) => [...r, "missed"]);
      setStatus("revealed");
    }
  };

  const startRound = (indexes: number[], isPractice: boolean) => {
    stopVoice();
    setRound(indexes);
    setPractice(isPractice);
    setPos(0);
    setSelected(null);
    setWrongPicks([]);
    setAsks(0);
    setStatus("answering");
    setResults([]);
    setFinished(false);
    if (!isPractice) { setConf({}); setMain(null); }
    setAutoRetry(false);
  };

  const correct = results.filter((r) => r !== "missed").length;
  const firstTry = results.filter((r) => r === "first").length;

  const handleNext = () => {
    stopVoice();
    if (pos + 1 >= round.length) {
      track("quiz_complete", {
        object_type: "quiz", object_id: eventInfo ? `${eventInfo.story_id}:${eventInfo.level}` : null,
        story_id: eventInfo?.story_id, level: eventInfo?.level,
        result: { score: correct, total: round.length, first_try: firstTry, practice, retry: autoRetry },
      });
      if (!practice) {
        setMain({ correct, firstTry, total: round.length });
        onQuizFinish?.(correct, round.length, firstTry);
        // Mistakes come back at once, "sure but wrong" first (I1).
        const again = retryOrder(round, results, conf);
        if (again.length) {
          startRound(again, true);
          setAutoRetry(true);
          return;
        }
      }
      setFinished(true);
      return;
    }
    setPos(pos + 1);
    setSelected(null);
    setWrongPicks([]);
    setAsks(0);
    setStatus("answering");
  };

  // Keyboard: 1–4 pick an option, Enter checks or moves on.
  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (document.querySelector("[role=dialog]")) return;
      const n = Number(e.key) - 1;
      if (!done && n >= 0 && n < question.options.length && !wrongPicks.includes(n)) {
        setSelected(n);
        // Let the next Enter check the answer, not press whatever button had focus.
        (document.activeElement as HTMLElement | null)?.blur();
      }
      else if (e.key === "Enter" && !(el instanceof HTMLButtonElement)) {
        if (done) handleNext();
        else handleCheck();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Each request on the same question goes one step up the ladder; the draft
  // never carries the answer before the quiz has shown it.
  const askShoqan = () => {
    const task = question.sentence || question.q || "";
    const mine = wrongPicks.length ? ` I chose "${question.options[wrongPicks[wrongPicks.length - 1]]}".` : "";
    const level = cefrLevel(eventInfo?.level);
    const step = hintStep({ asksBefore: asks, attempts: wrongPicks.length, answerShown: done });
    const inKazakh = level ? "" : tr(" Answer in Kazakh, in Cyrillic script.", "");
    const draft = done
      ? `Why is "${answer}" the right answer here: "${task}"?${mine} Explain simply, comparing with Kazakh.${inKazakh}`
      : `Help me with this quiz question, without telling me the answer yet: "${task}" Options: ${question.options.filter((_, i) => !wrongPicks.includes(i)).join(" / ")}.${mine}${inKazakh}`;
    setAsks((n) => n + 1);
    window.dispatchEvent(new CustomEvent<ShoqanOpenDetail>("shoqan:open", { detail: { draft, hintStep: step, level } }));
  };

  if (!question && !finished) {
    return (
      <div className="card p-8 text-center animate-pop-in">
        <p className="font-display font-black text-xl text-ink">{tr("Бұл мәтінге сұрақ әлі жоқ", "No questions for this text yet")}</p>
        {onExit && <button onClick={onExit} className="btn w-full mt-6">{tr("Сынақтарға оралу", "Back to quizzes")}</button>}
      </div>
    );
  }

  if (finished) {
    // After a retry round the main round's score is shown: it is the one that counts.
    const shown = main ?? { correct, firstTry, total: round.length };
    const total = shown.total;
    const passed = shown.correct >= Math.ceil(total * QUIZ_PASS_SHARE);
    const counted = shown.correct >= Math.ceil(total * QUIZ_LEVEL_UNLOCK_SHARE);
    const afterQuiz = !!main;
    const toPractice = round.filter((_, i) => results[i] !== "first");
    return (
      <div className="animate-pop-in">
        <div className="text-center pt-6">
          <span className={`mx-auto w-28 h-28 rounded-full flex items-center justify-center ${passed ? "bg-sun shadow-[0_6px_0_var(--color-sun-deep)]" : "bg-sand-3 shadow-[0_6px_0_var(--color-line-2)]"}`}>
            <Trophy className={passed ? "text-ink" : "text-ink-3"} size={52} />
          </span>
          <h2 className="large-title mt-6">
            {!afterQuiz ? tr("Жаттығу аяқталды", "Practice done") : !counted ? tr("Аз қалды", "Almost there") : passed ? tr("Сабақ аяқталды!", "Lesson complete!") : tr("Сынақ өтті", "Quiz done")}
          </h2>
          <p className="text-[15px] text-ink-2 mt-2 max-w-[320px] mx-auto">
            {!afterQuiz
              ? tr("Қате кеткен сұрақтарды тағы бір рет өттің.", "You went over the questions you missed once more.")
              : !counted
                ? tr(`Деңгей үшін ${Math.ceil(total * QUIZ_LEVEL_UNLOCK_SHARE)} дұрыс жауап керек. Ертегіні қайта оқып, тағы байқап көр.`, `The level needs ${Math.ceil(total * QUIZ_LEVEL_UNLOCK_SHARE)} right answers. Re-read the story and try again.`)
                : passed
                  ? tr("Керемет! Ертегіні жақсы түсіндің.", "Great comprehension! You understood the story well.")
                  : tr("Деңгей есептелді. Қателерді қайталадың. Ертегіні қайта оқысаң, нәтиже жақсарады.", "The level counts, and you went over your mistakes. Re-read the tale to do even better.")}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-7">
          {[
            { label: tr("Дұрыс", "Correct"), value: `${shown.correct}/${total}`, color: "border-sky text-sky-deep", head: "bg-sky-deep text-white" },
            { label: tr("Бірден", "First try"), value: `${shown.firstTry}/${total}`, color: "border-jade text-jade-deep", head: "bg-[#15805A] text-white" },
            { label: "XP", value: !afterQuiz ? "—" : `+${shown.firstTry * QUIZ_XP_FIRST_TRY + (shown.correct - shown.firstTry) * QUIZ_XP_SECOND_TRY}`, color: "border-sun-deep text-ink", head: "bg-sun-deep text-ink" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border-2 overflow-hidden ${s.color}`}>
              <p className={`${s.head} text-xs font-bold uppercase tracking-[0.06em] py-1 text-center truncate px-1`}>{s.label}</p>
              <p className="font-display font-black text-xl text-center py-3 bg-card">{s.value}</p>
            </div>
          ))}
        </div>
        {toPractice.length > 0 && !afterQuiz && (
          <button onClick={() => startRound(toPractice, true)} className="btn w-full mt-7">
            <RotateCcw size={18} /> {tr(`Қателерді қайталау (${toPractice.length})`, `Practise mistakes (${toPractice.length})`)}
          </button>
        )}
        <button onClick={() => startRound(questions.map((_, i) => i), false)} className={`btn w-full ${toPractice.length && !afterQuiz ? "btn-ghost mt-3" : "mt-7"}`}>
          {tr("Басынан бастау", "Start again")}
        </button>
        {onExit && <button onClick={onExit} className="btn btn-ghost w-full mt-3">{tr("Сынақтарға оралу", "Back to quizzes")}</button>}
      </div>
    );
  }

  const blank = status === "answering" ? (selected !== null ? question.options[selected] : " ") : answer;

  return (
    <div className="animate-pop-in">
      {/* Exit + progress */}
      <div className="flex items-center gap-4 pt-2">
        {onExit && (
          <button onClick={onExit} aria-label={tr("Сынақтан шығу", "Leave quiz")} className="w-9 h-9 -ml-1 rounded-full text-ink-3 hover:bg-sand-2 flex items-center justify-center shrink-0">
            <X size={22} strokeWidth={2.6} />
          </button>
        )}
        <div className="track flex-1"><span style={{ width: `${((pos + (done ? 1 : 0)) / round.length) * 100}%` }} /></div>
        <span className="text-sm font-bold text-ink-2 tabular-nums shrink-0">{pos + 1}/{round.length}</span>
      </div>

      <div className="flex items-center justify-between gap-3 mt-5">
        <p className="eyebrow truncate">{storyTitle ? displayTitle(storyTitle) : t.quizTitle}</p>
        {practice && <span className="chip h-7 text-[13px] text-ink-2 shrink-0"><RotateCcw size={13} /> {autoRetry ? tr("Қайталау", "Retry") : tr("Жаттығу", "Practice")}</span>}
      </div>
      {autoRetry && pos === 0 && status === "answering" && wrongPicks.length === 0 && (
        <div className="mt-3 rounded-2xl bg-sky-soft p-3 flex items-center gap-3" role="status">
          <p className="text-[14px] text-ink leading-snug flex-1">{tr("Деңгей есептелді. Енді қате кеткен сұрақтарды тағы бір рет көр: осылай есте жақсы қалады. XP берілмейді.", "The level counts. Now go over the questions you missed once more: that helps you remember. No XP here.")}</p>
          <button onClick={() => setFinished(true)} className="h-9 px-3 rounded-full bg-card text-ink text-sm font-bold shrink-0">{tr("Өткізу", "Skip")}</button>
        </div>
      )}

      <div className="mt-3 mb-6">
        {isGap ? (
          <>
            <h2 className="font-display font-black text-[22px] text-ink">{tr("Бос орынды толтыр", "Fill in the blank")}</h2>
            <p lang="en" className="text-[18px] text-ink leading-relaxed mt-3">
              {(question.sentence || "").split("___")[0]}
              <span className={`inline-block min-w-[72px] border-b-[3px] mx-1 text-center font-bold ${done ? (status === "correct" ? "border-jade text-jade-deep" : "border-felt text-felt-deep") : "border-sky text-sky-deep"}`}>
                {blank}
              </span>
              {(question.sentence || "").split("___")[1]}
            </p>
          </>
        ) : (
          <h2 lang="en" className="font-display font-black text-[22px] leading-snug text-ink">{question.q}</h2>
        )}
      </div>

      <div lang="en" className="space-y-3">
        {question.options.map((opt: string, idx: number) => {
          const ruledOut = wrongPicks.includes(idx);
          let state = "text-ink hover:border-sky/40";
          let anim = "";
          if (selected === idx) state = "tile-selected";
          if (ruledOut) {
            state = "tile-wrong opacity-70";
            if (!done && idx === wrongPicks[wrongPicks.length - 1]) anim = "animate-answer-wrong";
          }
          if (done) {
            if (idx === question.correct) { state = "tile-correct"; anim = "animate-answer-correct"; }
            else if (!ruledOut) state = "text-ink-3";
          }
          return (
            <button
              key={idx}
              disabled={done || ruledOut}
              onClick={() => setSelected(idx)}
              aria-pressed={selected === idx}
              className={`tile w-full text-left p-3.5 flex items-center gap-3.5 ${state} ${anim}`}
            >
              <span className="w-8 h-8 rounded-lg border-2 border-current/25 flex items-center justify-center font-display font-black text-sm shrink-0 opacity-70">
                {idx + 1}
              </span>
              <span className={`flex-1 text-[16px] font-semibold ${ruledOut ? "line-through decoration-2" : ""}`}>{opt}</span>
              {done && idx === question.correct && <Check size={20} strokeWidth={3} className="text-jade" />}
              {ruledOut && <X size={20} strokeWidth={3} className="text-felt" />}
            </button>
          );
        })}
      </div>

      {/* One more try: point back to the tale without naming the answer. */}
      {!done && wrongPicks.length > 0 && (
        <div className="mt-6 rounded-[24px] p-5 bg-sun-soft animate-pop-in" aria-live="polite">
          <p className="font-display font-black text-lg text-ink">{tr("Қате. Тағы бір мүмкіндік бар", "Not quite. You have one more try")}</p>
          {isGap ? (
            <>
              <p className="text-[15px] text-ink-2 mt-1">{tr("Сөйлемді тыңдап, жетіспейтін сөзді тап.", "Listen to the sentence and catch the missing word.")}</p>
              <button onClick={() => safePlayVoice(fullSentence || "")} className="btn btn-ghost btn-sm mt-3"><Volume2 size={16} /> {tr("Сөйлемді тыңдау", "Listen to the sentence")}</button>
            </>
          ) : evidence ? (
            <>
              <p className="text-[15px] text-ink-2 mt-1">{tr("Ертегіде осылай делінген:", "Here is what the tale says:")}</p>
              <blockquote className="mt-2 border-l-4 border-sun-deep pl-3 text-[16px] text-ink leading-relaxed italic">{evidence}</blockquote>
              <button onClick={() => safePlayVoice(evidence)} className="btn btn-ghost btn-sm mt-3"><Volume2 size={16} /> {tr("Тыңдау", "Listen")}</button>
            </>
          ) : (
            <p className="text-[15px] text-ink-2 mt-1">{tr("Ертегіні есіңе түсір: кім, не істеді, неге? Қалған нұсқалардан таңда.", "Think back to the tale: who did what, and why? Pick from the options left.")}</p>
          )}
        </div>
      )}

      {/* How sure? Asked on some questions before checking (I1, hypercorrection). */}
      {askConf && !done && (
        <div className="mt-5">
          <p id="conf-label" className="text-[14px] font-bold text-ink-2 mb-2">{tr("Қаншалықты сенімдісің?", "How sure are you?")}</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="conf-label">
            {([["sure", tr("Сенімдімін", "I'm sure")], ["guess", tr("Шамамен", "I think so")], ["unsure", tr("Білмеймін", "I don't know")]] as [Confidence, string][]).map(([c, label]) => (
              <button key={c} onClick={() => setConf((m) => ({ ...m, [round[pos]]: c }))} aria-pressed={myConf === c}
                className={`tile min-h-11 px-1 text-[13px] font-bold leading-tight ${myConf === c ? "tile-selected" : "text-ink"}`}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {!done ? (
        <>
          <button onClick={handleCheck} disabled={selected === null || needConf} className="btn w-full mt-7">
            {t.checkAnswer}
          </button>
          {/* R4: no Shoqan in the research build. */}
          {!RESEARCH_MODE && (
            <button onClick={askShoqan} className="btn btn-ghost btn-sm w-full mt-2">
              <MessageCircle size={15} /> {asks ? tr("Шоқаннан тағы көмек сұра", "Ask Shoqan for more help") : tr("Шоқаннан көмек сұра", "Ask Shoqan for help")}
            </button>
          )}
        </>
      ) : (
        <div className={`mt-7 rounded-[24px] p-5 animate-pop-in ${status === "correct" ? "bg-jade-soft" : "bg-felt-soft"}`} aria-live="polite">
          <div className="flex items-start gap-3">
            <span className={`w-11 h-11 rounded-full bg-card flex items-center justify-center shrink-0 ${status === "correct" ? "text-jade" : "text-felt"}`}>
              {status === "correct" ? <Check size={24} strokeWidth={3.5} /> : <X size={24} strokeWidth={3.5} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-display font-black text-xl ${status === "correct" ? "text-jade-deep" : "text-felt-deep"}`}>
                {status === "correct"
                  ? (wrongPicks.length ? tr("Дұрыс, екінші әрекетпен!", "Right, on the second try!") : t.correctMsg)
                  : tr("Дұрыс жауап:", "The right answer:")}
              </p>
              {status === "revealed" && <p className="text-[15px] text-felt-deep font-semibold">{answer}</p>}
              {!practice && (
                <p className="text-sm font-bold text-ink-2 mt-0.5">
                  {status === "correct" ? `+${wrongPicks.length ? QUIZ_XP_SECOND_TRY : QUIZ_XP_FIRST_TRY} XP` : myConf === "sure"
                    ? tr("Сенімді едің: бұл сұрақ соңында бірінші болып қайта шығады", "You were sure: this one comes back first at the end")
                    : tr("Бұл сұрақ сынақ соңында қайта шығады", "This one comes back at the end of the quiz")}
                </p>
              )}
            </div>
          </div>
          {why ? (
            <div className="mt-3 rounded-2xl bg-card p-3">
              <p className="text-[13px] font-bold text-ink-2">{tr("Неге? Ертегіде былай делінген:", "Why? Here is what the tale says:")}</p>
              <p lang="en" className="text-[15px] text-ink leading-relaxed italic mt-1">{why}</p>
              <button onClick={() => safePlayVoice(why)} className="mt-2 h-8 px-3 rounded-full bg-sand-2 text-ink text-sm font-bold inline-flex items-center gap-1.5">
                <Volume2 size={15} /> {tr("Тыңдау", "Listen")}
              </button>
            </div>
          ) : status === "revealed" && (
            <p className="mt-3 text-[14px] text-ink-2">{RESEARCH_MODE
              ? tr("Ертегіде бұл жер табылмады.", "We couldn't find this place in the tale.")
              : tr("Ертегіде бұл жер табылмады. Шоқаннан неге екенін сұрап көр.", "We couldn't find this place in the tale. Ask Shoqan why.")}</p>
          )}
          {!RESEARCH_MODE && status === "revealed" && (
            <button onClick={askShoqan} className="mt-3 h-8 px-3 rounded-full bg-card text-felt-deep text-sm font-bold inline-flex items-center gap-1.5">
              <MessageCircle size={15} /> {tr("Неге? Шоқаннан сұра", "Why? Ask Shoqan")}
            </button>
          )}
          <button onClick={handleNext} className={`btn w-full mt-4 ${status === "correct" ? "btn-jade" : "btn-felt"}`}>
            {pos + 1 >= round.length ? tr("Нәтижені көру", "See results") : tr("Жалғастыру", "Continue")}
          </button>
        </div>
      )}
    </div>
  );
}
