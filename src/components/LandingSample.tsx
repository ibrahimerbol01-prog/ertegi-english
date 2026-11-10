import { useState } from "react";
import { Volume2 } from "lucide-react";
import { safePlayVoice } from "../utils/voice";
import { TapWords } from "./TapWords";
import { lookUp, bare } from "../utils/tapText";
import type { DICT } from "../dict";

/* The landing's live "tap a word" card (redesign stage 7): meanings from the real glossary. */
export default function TapSample({ t }: { t: (typeof DICT)["kk"] }) {
  const [active, setActive] = useState<{ i: number; word: string } | null>(null);
  const meaning = active ? lookUp(active.word) : undefined;
  return (
    <section aria-labelledby="try-now" className="bg-card rounded-[24px] p-5 md:p-6 shadow-[var(--elev-2)]">
      <h2 id="try-now" className="eyebrow !text-ember-ink">{t.tryNowLabel}</h2>
      <TapWords
        text={t.landingSample}
        active={active?.i ?? null}
        onTap={(word, i) => setActive({ i, word })}
        className="mt-3 text-[20px] leading-[1.8] text-ink"
      />
      <div aria-live="polite" className="mt-3 min-h-[52px] rounded-2xl bg-sand-2 px-4 py-2 flex items-center text-[17px] text-ink">
        {active ? (
          <span className="flex items-center justify-between gap-3">
            <span><span lang="en" className="font-display font-black">{bare(active.word)}</span>{" — "}<span lang="kk">{meaning ?? "—"}</span></span>
            <button type="button" onClick={() => safePlayVoice(bare(active.word))} aria-label={t.listen} className="w-11 h-11 rounded-full bg-sky-soft text-sky-ink flex items-center justify-center shrink-0">
              <Volume2 size={20} aria-hidden="true" />
            </button>
          </span>
        ) : (
          <span className="text-ink-2 text-[15px]">{t.tapWordHint}</span>
        )}
      </div>
    </section>
  );
}
