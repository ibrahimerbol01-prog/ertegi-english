import { useMemo, useState } from "react";
import { Check, Plus, Sparkles, TrendingUp, Volume2 } from "lucide-react";
import { safePlayVoice } from "../utils/voice";
import { analyseLearner, dailyWords, dayIndex, loadKnown, markKnown, wordBank, type LexWord } from "../utils/lexicon";
import type { SavedWord } from "../types";

/* Today's picks are frozen per user and day, so acting on a word never reshuffles the list. */
const todayKey = (userId?: string) => `ertegi_daily_words_${userId || "guest"}`;
function loadToday(userId: string | undefined, day: number): string[] | null {
  try {
    const raw = JSON.parse(localStorage.getItem(todayKey(userId)) || "null");
    return raw && raw.day === day ? raw.words : null;
  } catch {
    return null;
  }
}
function saveToday(userId: string | undefined, day: number, words: string[]) {
  try { localStorage.setItem(todayKey(userId), JSON.stringify({ day, words })); } catch { /* storage blocked */ }
}

function Highlight({ text, word }: { text: string; word: string }) {
  const parts = text.split(new RegExp(`\\b(${word})\\b`, "i"));
  return (
    <>
      {parts.map((p, i) => (p.toLowerCase() === word ? <b key={i} className="text-ink font-bold not-italic">{p}</b> : p))}
    </>
  );
}

/* Personal vocabulary coach: reads what the learner knows, sets their level,
   and hands out five words a day with a nudge toward the next level. */
export function WordCoach({ savedWords, progress, userId, lang, onLearn, onReward }: {
  savedWords: SavedWord[];
  progress: Set<string>;
  userId?: string;
  lang: string;
  onLearn: (word: string, translation: string) => void;
  onReward: (xp: number) => void;
}) {
  const kk = lang === "kk";
  const [known, setKnown] = useState<string[]>(() => loadKnown(userId));
  const profile = useMemo(() => analyseLearner(savedWords, known, progress), [savedWords, known, progress]);

  const [day] = useState(dayIndex);
  const [today] = useState<LexWord[]>(() => {
    const bank = new Map(wordBank().map((w) => [w.word, w]));
    const frozen = loadToday(userId, day);
    if (frozen) return frozen.map((w) => bank.get(w)).filter(Boolean) as LexWord[];
    const seen = new Set([...savedWords.map((w) => w.word), ...loadKnown(userId)]);
    const picks = dailyWords(profile, seen, userId, day);
    saveToday(userId, day, picks.map((w) => w.word));
    return picks;
  });

  const saved = new Set(savedWords.map((w) => w.word));
  const doneCount = today.filter((w) => saved.has(w.word) || known.includes(w.word)).length;
  const pct = Math.round(profile.progressToNext * 100);

  const know = (w: LexWord) => {
    markKnown(userId, w.word);
    setKnown(loadKnown(userId));
    onReward(2);
  };

  return (
    <section className="card overflow-hidden">
      {/* Level and the road to the next one */}
      <div className="bg-night text-white p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-sun">{kk ? "Jeke sózdık" : "Your word coach"}</p>
          <span className="chip h-7 text-[12px] border-0 bg-white/15 text-white">
            <TrendingUp size={14} /> {profile.level}{profile.next ? ` → ${profile.next}` : ""}
          </span>
        </div>
        <p className="font-display font-black text-2xl mt-2 leading-tight">
          {kk ? "Kúnnıñ 5 sózı" : "5 words for today"}
        </p>
        <p className="text-sm text-white/75 mt-1">
          {kk
            ? `Sen ${profile.totalKnown} sóz bılesıñ. Sózder seniñ deñgeııñe saı tañdaldy.`
            : `You know ${profile.totalKnown} words. These are picked for your level.`}
        </p>

        {profile.next && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-white/80">
              <span>{profile.level}</span>
              <span>{kk ? `${profile.next} deñgeıne ${pct}%` : `${pct}% to ${profile.next}`}</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-white/15 overflow-hidden">
              <span className="block h-full rounded-full bg-sun transition-[width] duration-700" style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
          </div>
        )}

        {/* Mastered words per level */}
        <div className="grid grid-cols-5 gap-2 mt-4" aria-label={kk ? "Deñgeı boıynşa sózder" : "Words by level"}>
          {profile.stats.map((s) => {
            const fill = Math.min(1, s.mastered / s.goal);
            const current = s.level === profile.level;
            return (
              <div key={s.level} className="text-center">
                <div className={`h-12 rounded-lg bg-white/10 relative overflow-hidden ${current ? "ring-2 ring-sun" : ""}`}>
                  <span className={`absolute bottom-0 inset-x-0 ${s.done ? "bg-jade" : "bg-sky"}`} style={{ height: `${fill * 100}%` }} />
                </div>
                <p className={`text-[11px] font-bold mt-1 ${current ? "text-sun" : "text-white/70"}`}>{s.level}</p>
                <p className="text-[10px] text-white/50">{s.mastered}/{s.goal}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's words */}
      <div className="p-4 space-y-3">
        {today.map((w) => {
          const isSaved = saved.has(w.word);
          const isKnown = known.includes(w.word);
          const stretch = w.level !== profile.level;
          return (
            <div key={w.word} className={`rounded-2xl border-2 p-4 transition-colors ${isSaved || isKnown ? "border-jade/40 bg-jade-soft/50" : "border-line bg-card"}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => safePlayVoice(w.word)} aria-label={`Play ${w.word}`} className="w-10 h-10 rounded-xl bg-sky-soft text-sky-deep flex items-center justify-center shrink-0">
                  <Volume2 size={19} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-black text-[19px] text-ink leading-none">{w.word}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2 py-0.5 ${stretch ? "bg-sun-soft text-sun-deep" : "bg-sand-2 text-ink-2"}`}>
                      {w.level}{stretch ? " · +1" : ""}
                    </span>
                  </div>
                  <p className="text-[15px] font-semibold text-sky-deep mt-1">{w.translation}</p>
                  <p className="text-sm text-ink-2 italic mt-1.5 leading-snug"><Highlight text={w.example} word={w.word} /></p>
                </div>
              </div>
              {isSaved || isKnown ? (
                <p className="text-sm font-bold text-jade-deep mt-3 flex items-center gap-1.5">
                  <Check size={16} strokeWidth={3} />
                  {isKnown ? (kk ? "Bılesıñ" : "You know it") : (kk ? "Sózdıgıñe qosyldy, qaıtalaımyz" : "Added to your reviews")}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => onLearn(w.word, w.translation)} className="btn h-11 text-sm">
                    <Plus size={16} /> {kk ? "Úırenu" : "Learn"}
                  </button>
                  <button onClick={() => know(w)} className="btn btn-ghost h-11 text-sm">
                    {kk ? "Bılemın" : "I know it"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {today.length > 0 && doneCount === today.length && (
          <p className="text-sm font-semibold text-ink-2 text-center flex items-center justify-center gap-1.5 py-1 animate-pop-in">
            <Sparkles size={15} className="text-sun-deep" /> {kk ? "Bügınge bıttı. Erteñ jaña sózder." : "Done for today. New words tomorrow."}
          </p>
        )}
      </div>
    </section>
  );
}
