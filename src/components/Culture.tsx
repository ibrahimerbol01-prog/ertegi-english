import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import { IconScroll } from "./Icons";
import { QoshqarMuyiz, Shanyraq, Tumar, KilimStrip } from "./Ornaments";
import { safePlayVoice } from "../utils/voice";
import { CloseButton } from "./UIHelpers";
import { useDialogFocus } from "../utils/useDialogFocus";
import { useEscape } from "../utils/useEscape";
import { STORIES } from "../constants";
import { displayTitle } from "../utils/text";
import {
  MAQALS, maqalOfDay, dayNumber, BATAS, DEFAULT_BATA, oyuForStory, STORY_HISTORY, TURKIC_WORDS,
} from "../data/culture";

type Lang = "kk" | "en";
const pick = (lang: string) => (lang === "kk" ? "kk" : "en") as Lang;

/* --- Proverb collection, kept per user in localStorage --- */
const maqalKey = (userId?: string) => `ertegi_maqals_${userId || "guest"}`;
export function loadMaqals(userId?: string): number[] {
  try {
    const raw = localStorage.getItem(maqalKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveMaqal(userId: string | undefined, index: number) {
  const all = new Set(loadMaqals(userId));
  all.add(index);
  try { localStorage.setItem(maqalKey(userId), JSON.stringify([...all])); } catch { /* storage full or blocked */ }
}

const ORNAMENTS = {
  qoshqar: (cls: string) => <QoshqarMuyiz className={cls} strokeWidth={4} />,
  shanyraq: (cls: string) => <Shanyraq className={cls} strokeWidth={4} />,
  tumar: (cls: string) => <Tumar className={cls} strokeWidth={2.6} />,
};

/* Maqal of the day: a Kazakh proverb, pick its English twin. */
export function MaqalCard({ lang, userId, onReward }: { lang: string; userId?: string; onReward: (xp: number) => void }) {
  // Starts on today's proverb; "next" walks on to proverbs not yet collected.
  const [day, setDay] = useState(() => dayNumber());
  const { index, maqal, options, correct } = maqalOfDay(day);
  const [picked, setPicked] = useState<number | null>(() => (loadMaqals(userId).includes(index) ? correct : null));
  const solved = picked === correct;
  const l = pick(lang);
  const collected = loadMaqals(userId);
  const titleRef = useRef<HTMLParagraphElement>(null);

  const nextDay = (() => {
    for (let k = 1; k <= MAQALS.length; k++) {
      if (!collected.includes((day + k) % MAQALS.length)) return day + k;
    }
    return null;
  })();

  const goNext = () => {
    if (nextDay === null) return;
    setDay(nextDay);
    setPicked(null);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const choose = (i: number) => {
    if (solved) return;
    setPicked(i);
    if (i === correct) {
      saveMaqal(userId, index);
      onReward(5);
      safePlayVoice(maqal.english);
    }
  };

  return (
    <section className="card overflow-hidden">
      <KilimStrip className="h-2 w-full" />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow text-felt">{l === "kk" ? "Күннің мақалы" : "Proverb of the day"}</p>
          <span className="text-xs font-bold text-ink-3">{collected.length}/{MAQALS.length}</span>
        </div>
        <p ref={titleRef} tabIndex={-1} className="font-display font-black text-[21px] leading-snug text-ink mt-2 outline-none">{maqal.kk}</p>
        <p className="text-sm text-ink-2 mt-1 italic">“{maqal.literal}”</p>

        <p className="text-sm font-bold text-ink mt-4">
          {l === "kk" ? "Ағылшынша қалай айтылады?" : "How do the English say it?"}
        </p>
        <div className="grid gap-2 mt-2">
          {options.map((opt, i) => {
            const state = solved && i === correct ? "tile-correct" : !solved && picked === i ? "tile-wrong animate-answer-wrong" : "";
            return (
              <button
                key={opt}
                onClick={() => choose(i)}
                disabled={solved}
                className={`tile text-left px-4 py-3 text-[15px] font-semibold text-ink flex items-center justify-between gap-3 ${state}`}
              >
                {opt}
                {solved && i === correct && <Check size={18} strokeWidth={3} className="shrink-0" />}
              </button>
            );
          })}
        </div>
        {solved && (
          <p className="text-sm text-jade-deep font-semibold mt-3 animate-pop-in">
            {l === "kk" ? "Дұрыс! Мақал жинаққа қосылды · +5 XP" : "Right! Added to your proverb collection · +5 XP"}
          </p>
        )}
        {solved && nextDay !== null && (
          <button
            type="button"
            onClick={goNext}
            className="btn btn-ghost btn-sm mt-3 w-full"
          >
            {l === "kk" ? "Келесі мақал" : "Next proverb"}
            <ArrowRight size={18} strokeWidth={2.6} />
          </button>
        )}
        {solved && nextDay === null && (
          <p className="text-sm text-ink-2 font-semibold mt-2">
            {l === "kk" ? `Барлық ${MAQALS.length} мақал жиналды!` : `All ${MAQALS.length} proverbs collected!`}
          </p>
        )}
      </div>
    </section>
  );
}

/* Bata: an elder's blessing when a whole tale is finished, plus its ornament. */
export function BataModal({ storyId, lang, onClose }: { storyId: string | null; lang: string; onClose: () => void }) {
  useEscape(!!storyId, onClose);
  const boxRef = useDialogFocus<HTMLDivElement>(!!storyId);
  if (!storyId) return null;
  const storyIndex = Math.max(0, STORIES.findIndex((s) => s.id === storyId));
  const story = STORIES[storyIndex];
  const bata = BATAS[storyId] || DEFAULT_BATA;
  const oyu = oyuForStory(storyIndex);
  const l = pick(lang);

  return createPortal(
    <div className="fixed inset-0 z-[72] bg-ink/45 backdrop-blur-sm flex items-center justify-center p-5 animate-pop-in" role="dialog" aria-modal="true" aria-label={l === "kk" ? "Бата" : "Blessing"} onClick={onClose}>
      <div ref={boxRef} className="relative w-full max-w-[380px] card overflow-hidden text-center animate-rank-pop outline-none" onClick={(e) => e.stopPropagation()}>
        <KilimStrip className="h-2.5 w-full" />
        <CloseButton onClick={onClose} className="absolute top-5 right-4" />
        <div className="p-7">
          <span className="mx-auto w-24 h-24 rounded-full bg-sun-soft border-4 border-sun flex items-center justify-center text-sun-deep">
            {ORNAMENTS[oyu.id]("w-14 h-14")}
          </span>
          <p className="eyebrow text-sun-deep mt-5">{l === "kk" ? "Ертегі аяқталды" : "Tale complete"}</p>
          <h3 className="font-display font-black text-xl text-ink mt-1 leading-snug">{displayTitle(story.title)}</h3>

          <div className="mt-5 rounded-2xl bg-sand-2 p-4 text-left">
            <p className="eyebrow">{l === "kk" ? "Шоқанның батасы" : "Shoqan's blessing"}</p>
            <p className="font-display font-extrabold text-[17px] text-ink leading-snug mt-1.5">{bata.kk}</p>
            <p className="text-sm text-ink-2 mt-1.5">{bata.en}</p>
          </div>

          <p className="text-sm text-ink-2 mt-4">
            <span className="inline-flex items-center gap-1.5 font-bold text-ink">
              <Sparkles size={15} className="text-sun-deep" />
              {l === "kk" ? `Жаңа ою: ${oyu.name.kk}` : `New ornament: ${oyu.name.en}`}
            </span>
            <span className="block mt-0.5">{oyu.meaning[l]}</span>
          </p>
          <button onClick={onClose} className="btn btn-sun w-full mt-6">{l === "kk" ? "Әумин" : "Amen"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* The learner's kilim: one ornament per finished tale. */
export function OyuKilim({ progress, lang, maqalCount }: { progress: Set<string>; lang: string; maqalCount: number }) {
  const l = pick(lang);
  const earned = STORIES.filter((s) => progress.has(`${s.id}:quiz`)).length;
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <p className="font-display font-extrabold text-ink text-[17px]">{l === "kk" ? "Менің кілемім" : "My kilim"}</p>
        <span className="text-sm font-bold text-ink-3">{earned}/{STORIES.length}</span>
      </div>
      <p className="text-sm text-ink-2 mt-1">
        {l === "kk" ? "Әр ертегі үшін бір ою. Ертегіні аяқтап, батасын ал." : "One ornament for every tale. Finish a tale to earn its blessing."}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
        {STORIES.map((s, i) => {
          const oyu = oyuForStory(i);
          const has = progress.has(`${s.id}:quiz`);
          return (
            <div key={s.id} className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 ${has ? "bg-sun-soft border-sun text-sun-deep" : "bg-sand-2 border-line text-ink-2"}`}>
              {has ? ORNAMENTS[oyu.id]("w-10 h-10") : (
                // A faint outline of the ornament still to be earned, with a lock on it.
                <span className="relative">
                  <span className="block text-line-2">{ORNAMENTS[oyu.id]("w-10 h-10")}</span>
                  <span className="absolute -right-1.5 -bottom-1 w-5 h-5 rounded-full bg-ink-2 text-white flex items-center justify-center ring-2 ring-sand-2">
                    <Lock size={11} strokeWidth={3} aria-hidden="true" />
                  </span>
                </span>
              )}
              <span className="text-[11px] font-bold text-center px-1 leading-tight">{has ? oyu.name[l] : `${l === "kk" ? "Ертегі" : "Tale"} ${i + 1}`}</span>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-ink-2 mt-4">
        {l === "kk" ? `Жиналған мақалдар: ${maqalCount}/${MAQALS.length}` : `Proverbs collected: ${maqalCount}/${MAQALS.length}`}
      </p>
    </section>
  );
}

/* Historical background for a tale, shown at the top of the reader. */
export function StoryHistory({ storyId, lang }: { storyId: string; lang: string }) {
  const note = STORY_HISTORY[storyId];
  if (!note) return null;
  const l = pick(lang);
  return (
    <div className="rounded-2xl bg-night text-white p-4 flex gap-3">
      <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <IconScroll size={30} />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-sun">{l === "kk" ? "Тарихи дерек" : "History"}</p>
        <p className="text-sm leading-relaxed text-white/90 mt-1">{note[l]}</p>
      </div>
    </div>
  );
}

/* English words that came from Turkic languages. */
export function TurkicWords({ lang }: { lang: string }) {
  const l = pick(lang);
  return (
    <section className="card p-5">
      <p className="eyebrow text-sky-deep">{l === "kk" ? "Түбірлес сөздер" : "Words with Kazakh roots"}</p>
      <p className="text-sm text-ink-2 mt-1">
        {l === "kk" ? "Бұл ағылшын сөздері түркі тілдерінен келген." : "These English words came from Turkic languages."}
      </p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {TURKIC_WORDS.map((w) => (
          <button key={w.en} onClick={() => safePlayVoice(w.en)} className="tile p-3 text-left">
            <p className="font-display font-black text-lg text-ink">{w.en}</p>
            <p className="text-sm font-semibold text-sky-deep">{w.kk}</p>
            <p className="text-xs text-ink-2 mt-1 leading-snug">{w.note[l]}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
