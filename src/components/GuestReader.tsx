import { useEffect, useRef, useState } from "react";
import { Plus, Volume2 } from "lucide-react";
import { safePlayVoice } from "../utils/voice";
import { ScreenHeader, Sheet } from "./UIHelpers";
import { STORIES } from "../constants";
import { displayTitle } from "../utils/text";
import { TapWords } from "./TapWords";
import { lookUp, bare, paragraphsOf } from "../utils/tapText";
import type { DICT } from "../dict";

/* "Тіркелусіз оқып көру" (redesign stage 7): the first A1 tale before sign-in.
   A guest has no session, so nothing here reaches Supabase or the learning_events log
   (track() drops events without a learner, and this screen does not call it anyway).
   Progress lives in memory only. It is a small reader of its own on purpose: the full
   ReaderScreen also opens the Thinking Trail and Shoqan, which need an account.
   Never shown in the research build (App.tsx). */

const STORY = STORIES[0];
export function GuestReader({ t, lang, onBack, onCreateAccount }: {
  t: (typeof DICT)["kk"];
  lang: "kk" | "en";
  onBack: () => void;
  onCreateAccount: () => void;
}) {
  const paragraphs = paragraphsOf(STORY.levels.A1 as string);
  const [active, setActive] = useState<{ p: number; i: number; word: string } | null>(null);
  const [askSignup, setAskSignup] = useState(false);
  const asked = useRef(false);
  const firstRef = useRef<HTMLDivElement | null>(null);

  const offerSignup = () => {
    if (asked.current) return;
    asked.current = true;
    setActive(null);
    setAskSignup(true);
  };

  // Once the first paragraph has scrolled up out of view (read, and the learner moved on),
  // offer to save the progress, once. Paragraphs merely visible on a tall screen do not count.
  useEffect(() => {
    const el = firstRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => !e.isIntersecting && e.boundingClientRect.bottom <= (e.rootBounds?.top ?? 0))) {
        io.disconnect();
        offerSignup();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const meaning = active ? lookUp(active.word) : undefined;

  return (
    <main className="min-h-dvh w-full bg-sand">
      <div className="mx-auto w-full max-w-[680px] px-5 pt-[max(env(safe-area-inset-top),16px)] pb-24">
        <ScreenHeader
          onBack={onBack}
          backLabel="Ertegi English"
          eyebrow={`A1 · ${lang === "kk" ? STORY.sceneLabelKk : STORY.sceneLabel}`}
          title={displayTitle(STORY.title)}
        />
        <p className="text-[15px] text-ink-2 mb-5">{t.tapWordHint}</p>
        <article lang="en" className="card p-5 md:p-7 space-y-5">
          {paragraphs.map((text, p) => (
            <div key={p} ref={p === 0 ? firstRef : undefined}>
              <TapWords
                text={text}
                active={active?.p === p ? active.i : null}
                onTap={(word, i) => setActive({ p, i, word })}
                className="text-[20px] leading-[1.8] text-ink"
              />
            </div>
          ))}
        </article>
      </div>

      <Sheet open={!!active} onClose={() => setActive(null)} label={active ? bare(active.word) : ""}>
        {active && (
          <div className="p-6 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p lang="en" className="font-display font-black text-[26px] text-ink">{bare(active.word)}</p>
                <p lang="kk" className="text-[17px] text-ink-2 mt-1">{meaning ?? "—"}</p>
              </div>
              <button type="button" onClick={() => safePlayVoice(bare(active.word))} aria-label={t.listen} className="w-12 h-12 rounded-full bg-sky-soft text-sky-ink flex items-center justify-center shrink-0">
                <Volume2 size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button type="button" onClick={() => setActive(null)} className="btn btn-ghost">{t.closeBuklet}</button>
              <button type="button" onClick={() => { asked.current = false; offerSignup(); }} className="btn btn-jade">
                <Plus size={18} strokeWidth={3} aria-hidden="true" /> {t.myWords}
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={askSignup} onClose={() => setAskSignup(false)} label={t.guestSaveTitle}>
        <div className="p-6 pt-4">
          <h2 className="font-display font-black text-[22px] text-ink">{t.guestSaveTitle}</h2>
          <div className="flex flex-col gap-3 mt-6">
            <button type="button" onClick={onCreateAccount} className="btn btn-ember min-h-[56px]">{t.createAccount}</button>
            <button type="button" onClick={() => setAskSignup(false)} className="btn btn-ghost">{t.later}</button>
          </div>
        </div>
      </Sheet>
    </main>
  );
}
