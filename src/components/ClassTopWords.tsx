import { DICT } from "../dict";
import type { HardWord } from "../utils/classWork";
import { topTappedWords, MIN_LEARNERS } from "../utils/classTopWords";

/* Teacher's class activity: "Сынып жиі басқан сөздер" (redesign stage 8). A night card with
   the top five tapped words, each with how many learners tapped it and a bar. Totals only. */
export function ClassTopWords({ words, kk }: { words: HardWord[]; kk: boolean }) {
  const t = DICT[kk ? "kk" : "en"];
  const top = topTappedWords(words);
  const max = Math.max(MIN_LEARNERS, ...top.map((w) => w.learners));
  return (
    <section aria-labelledby="class-top-words" className="bg-night text-white rounded-[22px] p-5">
      <h2 id="class-top-words" className="font-display font-black text-[20px]">{t.classTopWordsTitle}</h2>
      {top.length === 0 ? (
        <p className="mt-3 text-[15px] text-white/85">{t.noDataYet}</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {top.map((w) => (
            <li key={w.word}>
              <span className="flex items-baseline justify-between gap-3">
                <span lang="en" className="font-display font-black text-[17px] [overflow-wrap:anywhere]">{w.word}</span>
                <span className="text-[15px] text-white/85 tabular-nums shrink-0">{w.learners} {t.learnersUnit}</span>
              </span>
              <span className="mt-1.5 block h-2 rounded-full bg-white/15" aria-hidden="true">
                <span className="block h-2 rounded-full bg-sun" style={{ width: `${Math.round((w.learners / max) * 100)}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-[13px] text-white/75">{t.classTopWordsNote}</p>
    </section>
  );
}
