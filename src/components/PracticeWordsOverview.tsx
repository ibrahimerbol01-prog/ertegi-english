import { Volume2 } from "lucide-react";
import { DICT } from "../dict";
import type { SavedWord } from "../types";
import { wordState } from "../utils/wordState";
import { safePlayVoice } from "../utils/voice";
import { WordsHeader } from "./screens/WordsScreens";

/* Practice → Words, before the review starts (redesign stage 6): a night card with the words
   due today and «Қайталауды бастау», the learner's words by state, and the list itself.
   The review is the existing FlashcardsScreen, unchanged; this screen only reads savedWords.
   States as in the reader's word sheet: mastery below MAX_MASTERY is "learning", at
   MAX_MASTERY "known". There is no "new" count: a saved word carries no date it was saved,
   so "saved today" cannot be told. Ordinary build only (KazakhTalesApp). */

export function PracticeWordsOverview({ savedWords, dueCount, lang, onStart, mode, setMode }: {
  savedWords: SavedWord[];
  dueCount: number;
  lang: "kk" | "en";
  onStart: () => void;
  mode: string;
  setMode: (m: string) => void;
}) {
  const t = DICT[lang];
  const known = savedWords.filter((w) => wordState(w) === "known").length;
  const counts = [
    { label: t.wordLearning, value: savedWords.length - known, tone: "bg-sun-soft text-word-learning" },
    { label: t.wordKnown, value: known, tone: "bg-jade-soft text-word-known" },
  ];
  // The latest saved first.
  const list = [...savedWords].reverse();

  return (
    <div className="animate-pop-in">
      <WordsHeader mode={mode} setMode={setMode} />

      <section aria-labelledby="review-today" className="bg-night text-white rounded-[24px] p-5">
        <h2 id="review-today" className="eyebrow !text-sun">{t.reviewToday}</h2>
        <p className="font-display font-black text-[44px] leading-none mt-2 tabular-nums">{dueCount}</p>
        {dueCount > 0 && (
          <button type="button" onClick={onStart} className="btn btn-ember w-full mt-5 min-h-[56px]">
            {t.startReview}
          </button>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {counts.map((c) => (
          <div key={c.label} className={`rounded-[20px] p-4 ${c.tone}`}>
            <p className="font-display font-black text-[28px] leading-none tabular-nums">{c.value}</p>
            <p className="text-[14px] font-bold mt-1.5">{c.label}</p>
          </div>
        ))}
      </div>

      <ul className="mt-5 card divide-y divide-line overflow-hidden">
        {list.map((w) => {
          const state = wordState(w);
          return (
            <li key={w.word} className="flex items-center gap-3 px-3 py-2 min-h-[64px]">
              <button
                type="button"
                onClick={() => safePlayVoice(w.word)}
                aria-label={`${t.listen}: ${w.word}`}
                className="w-12 h-12 rounded-full bg-sky-soft text-sky-ink flex items-center justify-center shrink-0"
              >
                <Volume2 size={22} aria-hidden="true" />
              </button>
              <span className="min-w-0 flex-1">
                <span lang="en" className="block font-display font-black text-[17px] text-ink truncate">{w.word}</span>
                <span lang="kk" className="block text-[15px] text-ink-2 truncate">{w.translation}</span>
              </span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-bold ${state === "known" ? "bg-jade-soft text-word-known" : "bg-sun-soft text-word-learning"}`}>
                {state === "known" ? t.wordKnown : t.wordLearning}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
