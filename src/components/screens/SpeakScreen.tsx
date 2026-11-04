import { useState, useRef, useEffect } from "react";
import { Volume2, RotateCcw, X, Mic, MicOff } from "lucide-react";
import { ScreenHeader } from "../UIHelpers";
import { foldAccents } from "../../utils/text";
import { safePlayVoice } from "../../utils/voice";
import { STORIES, LEVEL_DETAILS } from "../../constants";
import { supabase } from "../../lib/supabase";
import { apiUrl } from "../../lib/api";
import { useTr } from "./shared";
import { SPEAK_XP_BASE, SPEAK_XP_MIN_SCORE, SPEAK_XP_RANGE } from "../../research/params";
import { track } from "../../utils/events";

/* Score ring for pronunciation results. */
function ScoreRing({ value, size = 120 }: { value: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "var(--color-jade)" : value >= 60 ? "var(--color-sun)" : "var(--color-felt)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-sand-2)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display font-black text-3xl text-ink">{value}</span>
    </div>
  );
}

/* --- 7. SPEAK SCREEN --- */
// Practice phrases: every sentence from every story, grouped by level.
// Higher levels allow longer sentences, since their texts use them.
const SPEAK_LEVELS = LEVEL_DETAILS.map((l) => l.id);
const SPEAK_MAX_WORDS: Record<string, number> = { A1: 16, A2: 18, B1: 24, B2: 32, C1: 40 };
const SPEAK_PHRASES: Record<string, string[]> = Object.fromEntries(
  SPEAK_LEVELS.map((lvl) => [
    lvl,
    STORIES.flatMap((s) => (s.levels[lvl as keyof typeof s.levels] as string).match(/[^.!?]+[.!?]/g) ?? [])
      .map((x: string) => x.trim())
      .filter((x: string) => !/["“”]/.test(x) && x.split(/\s+/).length >= 4 && x.split(/\s+/).length <= (SPEAK_MAX_WORDS[lvl] ?? 24)),
  ])
);

// Share of the target's words the learner actually said. Below half, they read
// something else, and a pronunciation score would only mislead.
const speechWords = (s: string) => foldAccents(s).toLowerCase().replace(/’/g, "'").match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
function matchShare(target: string, said: string) {
  const heard = new Set(speechWords(said));
  const wanted = speechWords(target);
  return wanted.length ? wanted.filter((w) => heard.has(w)).length / wanted.length : 0;
}

export function SpeakScreen({ onReward, t }: {
  onReward: (xp: number) => void;
  t: Record<string, string>;
}) {
  const tr = useTr();
  const [recording, setRecording] = useState(false);
  const [scores, setScores] = useState<{
    accuracy: number;
    fluency: number;
    completeness: number;
    pronunciation: number;
  } | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [wordScores, setWordScores] = useState<{ word: string; score: number; error: string }[]>([]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [misread, setMisread] = useState(false);
  const recognizerRef = useRef<{ stopContinuousRecognitionAsync?: () => void; close?: () => void } | null>(null);

  const [speakLevel, setSpeakLevel] = useState("A2");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrases = SPEAK_PHRASES[speakLevel];
  const targetPhrase = phrases[phraseIndex % phrases.length];
  const changePhrase = (level: string, index: number) => {
    setSpeakLevel(level);
    setPhraseIndex(index);
    setScores(null);
    setTranscript("");
    setWordScores([]);
    setSpeechError(null);
    setMisread(false);
  };

  const toggleRecord = async () => {
    if (recording) {
      try {
        recognizerRef.current?.stopContinuousRecognitionAsync?.();
      } catch {
        // ignore
      }
      return;
    }

    setSpeechError(null);
    setMisread(false);
    setScores(null);
    setTranscript("");
    setWordScores([]);

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const tokenRes = await fetch(apiUrl("/api/azure-token"), {
        headers: { Authorization: `Bearer ${s?.access_token ?? ""}` },
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData?.error || "Couldn't reach the pronunciation service.");

      // Loaded lazily so the ~2MB SDK only downloads once someone actually
      // opens this screen, not as part of the app's main bundle.
      const SpeechSDK = await import("microsoft-cognitiveservices-speech-sdk");

      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(tokenData.token, tokenData.region);
      speechConfig.speechRecognitionLanguage = "en-US";

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

      const pronunciationConfig = new SpeechSDK.PronunciationAssessmentConfig(
        targetPhrase,
        SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
        SpeechSDK.PronunciationAssessmentGranularity.Word,
        true
      );

      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      pronunciationConfig.applyTo(recognizer);
      recognizerRef.current = recognizer;
      setRecording(true);

      recognizer.recognizeOnceAsync(
        (result: { reason: number; text: string }) => {
          setRecording(false);
          if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const assessment = SpeechSDK.PronunciationAssessmentResult.fromResult(result as Parameters<typeof SpeechSDK.PronunciationAssessmentResult.fromResult>[0]);
            setTranscript(result.text);
            const phrase = { object_type: "phrase", object_id: `${speakLevel}:${phraseIndex % phrases.length}`, level: speakLevel };
            if (matchShare(targetPhrase, result.text) < 0.5 || assessment.completenessScore < 40) {
              // What was heard is never logged, only that it was not the phrase.
              track("pronunciation_attempt", { ...phrase, result: { misread: true } });
              setMisread(true);
              recognizer.close();
              return;
            }
            // Per-word accuracy, so the learner sees exactly which words to fix.
            const words = (assessment.detailResult?.Words ?? []) as { Word: string; PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string } }[];
            setWordScores(words.map((w) => ({
              word: w.Word,
              score: Math.round(w.PronunciationAssessment?.AccuracyScore ?? 0),
              error: w.PronunciationAssessment?.ErrorType ?? "None",
            })));
            const next = {
              accuracy: Math.round(assessment.accuracyScore),
              fluency: Math.round(assessment.fluencyScore),
              completeness: Math.round(assessment.completenessScore),
              pronunciation: Math.round(assessment.pronunciationScore),
            };
            setScores(next);
            track("pronunciation_attempt", {
              ...phrase,
              result: { score: next.pronunciation, accuracy: next.accuracy, fluency: next.fluency, completeness: next.completeness, words: words.length, weak_words: words.filter((w) => (w.PronunciationAssessment?.AccuracyScore ?? 0) < 60).length },
            });
            if (next.pronunciation >= SPEAK_XP_MIN_SCORE) onReward(Math.round(SPEAK_XP_BASE + (next.pronunciation / 100) * SPEAK_XP_RANGE));
          } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
            setSpeechError(tr("Естілмеді. Микрофонға жақынырақ, қаттырақ сөйлеп көр.", "Didn't catch that — try speaking a bit louder and closer to the mic."));
          } else {
            setSpeechError(tr("Сөйлеуді тану кезінде қате шықты. Қайта байқап көр.", "Something went wrong with speech recognition. Please try again."));
          }
          recognizer.close();
        },
        () => {
          setRecording(false);
          setSpeechError(tr("Дыбыс қызметіне қосылу мүмкін болмады. Қайта байқап көр.", "Something went wrong reaching the speech service. Please try again."));
          recognizer.close();
        }
      );
    } catch (err: unknown) {
      setRecording(false);
      setSpeechError((err instanceof Error ? err.message : null) || tr("Жаттығу басталмады: микрофонға рұқсатты тексер.", "Couldn't start pronunciation practice — check your microphone permissions."));
    }
  };

  useEffect(() => {
    return () => {
      try {
        recognizerRef.current?.close?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const overallScore = scores?.pronunciation ?? null;

  const feedbackMessage =
    overallScore === null
      ? ""
      : overallScore >= 90
      ? t.greatIntonation
      : overallScore >= 70
      ? tr("Жақсы, үлгіге жақын. Тағы тыңдап, қайта айтып көр.", "Good — close to the target. Listen again and try once more.")
      : tr("Жаттыға бер: динамикті басып тыңда да, үлгіге жақындатып айт.", "Keep practicing — tap the speaker to hear it again, then try to match it closely.");

  return (
    <div className="animate-pop-in">
      <ScreenHeader eyebrow={tr("Айтылым", "Pronunciation")} title={t.speakTitle} />

      <div className="segmented mb-4" role="group" aria-label={tr("Деңгей", "Level")}>
        {SPEAK_LEVELS.map((lvl) => (
          <button key={lvl} aria-pressed={speakLevel === lvl} disabled={recording} onClick={() => changePhrase(lvl, 0)}>
            {lvl}
          </button>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{t.speakSubtitle}</p>
          <span className="text-xs font-bold text-ink-3 whitespace-nowrap shrink-0">{(phraseIndex % phrases.length) + 1} / {phrases.length}</span>
        </div>
        <div className="flex items-start gap-4 mt-3">
          <p className="flex-1 font-display font-extrabold text-[22px] leading-snug text-ink">“{targetPhrase}”</p>
          <button onClick={() => safePlayVoice(targetPhrase)} aria-label={tr("Тыңдау", "Listen")} className="w-12 h-12 rounded-full bg-sky-soft text-sky flex items-center justify-center shrink-0">
            <Volume2 size={22} />
          </button>
        </div>
        <button onClick={() => changePhrase(speakLevel, phraseIndex + 1)} disabled={recording} className="btn btn-ghost btn-sm w-full mt-5">
          <RotateCcw size={16} /> {t.nextPhrase}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-10">
        <div className="relative">
          {recording && <span className="absolute inset-0 rounded-full bg-felt/30 animate-ping" />}
          <button
            onClick={toggleRecord}
            aria-label={recording ? tr("Жазуды тоқтату", "Stop recording") : tr("Жазуды бастау", "Start recording")}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center text-white transition-transform active:translate-y-[5px] ${
              recording
                ? "bg-felt shadow-[0_7px_0_var(--color-felt-deep)] active:shadow-[0_2px_0_var(--color-felt-deep)]"
                : "bg-sky shadow-[0_7px_0_var(--color-sky-deep)] active:shadow-[0_2px_0_var(--color-sky-deep)]"
            }`}
          >
            {recording ? <MicOff size={44} /> : <Mic size={44} />}
          </button>
        </div>
        <span className="mt-5 text-[15px] font-semibold text-ink-2">{recording ? t.recording : t.pressMic}</span>
      </div>

      {speechError && (
        <div className="rounded-2xl bg-felt-soft text-felt-deep p-4 text-sm font-medium text-center animate-pop-in">
          {speechError}
        </div>
      )}

      {misread && (
        <div className="card p-6 text-center animate-pop-in">
          <span className="mx-auto w-14 h-14 rounded-full bg-felt-soft text-felt flex items-center justify-center">
            <X size={28} strokeWidth={3} />
          </span>
          <p className="font-display font-black text-xl text-felt-deep mt-3">{tr("Сөйлем дұрыс оқылмады", "That's not the sentence")}</p>
          <p className="text-[15px] text-ink-2 mt-1">{tr("Жоғарыдағы сөйлемге қарап, қайта оқып көр.", "Look at the sentence above and read it again.")}</p>
          {transcript && <p className="text-sm text-ink-3 italic mt-3">{tr("Естілгені", "We heard")}: “{transcript}”</p>}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => safePlayVoice(targetPhrase)} className="btn btn-ghost btn-sm"><Volume2 size={16} /> {tr("Тыңдау", "Listen")}</button>
            <button onClick={toggleRecord} className="btn btn-felt btn-sm"><Mic size={16} /> {tr("Қайталау", "Try again")}</button>
          </div>
        </div>
      )}

      {scores !== null && (
        <div className="card p-6 animate-pop-in">
          <div className="flex items-center gap-5">
            <ScoreRing value={scores.pronunciation} />
            <div className="flex-1 space-y-3">
              {[
                { label: tr("Дәлдік", "Accuracy"), v: scores.accuracy },
                { label: tr("Еркіндік", "Fluency"), v: scores.fluency },
                { label: tr("Толықтық", "Completeness"), v: scores.completeness },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm"><span className="text-ink-2">{m.label}</span><b className="text-ink">{m.v}</b></div>
                  <div className="track h-2 mt-1"><span style={{ width: `${m.v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          {wordScores.length > 0 && (
            <div className="mt-5">
              <p className="eyebrow mb-2">{tr("Сөзбе-сөз · тыңдау үшін бас", "Word by word · tap to hear")}</p>
              <div className="flex flex-wrap gap-2">
                {wordScores.map((w, i) => {
                  const missed = w.error === "Omission";
                  const cls = missed
                    ? "bg-felt-soft text-felt-deep line-through"
                    : w.score >= 80 ? "bg-jade-soft text-jade-deep" : w.score >= 60 ? "bg-sun-soft text-ink" : "bg-felt-soft text-felt-deep";
                  return (
                    <button key={i} onClick={() => safePlayVoice(w.word)} className={`h-9 px-3 rounded-xl font-semibold text-[15px] flex items-center gap-1.5 ${cls}`}>
                      {w.word}
                      <span className="text-xs font-bold opacity-70">{missed ? "—" : w.score}</span>
                    </button>
                  );
                })}
              </div>
              {wordScores.some((w) => w.score < 60 || w.error === "Omission") && (
                <p className="text-sm text-ink-2 mt-3">{tr("Қызыл сөздерді пысықта: тыңда да, сөйлемді қайта жаз.", "Red words need work: listen, then record the phrase again.")}</p>
              )}
            </div>
          )}
          {transcript && <p className="text-sm text-ink-2 italic mt-5">You said: “{transcript}”</p>}
          <p className="text-[15px] text-ink mt-2">{feedbackMessage}</p>
        </div>
      )}
    </div>
  );
}
