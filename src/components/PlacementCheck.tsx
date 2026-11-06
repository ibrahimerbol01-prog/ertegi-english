import { useState } from "react";
import { DICT } from "../dict";
import placementFile from "../data/placement.json";
import { estimate, readPlacement, suggestedTaleLevel, writePlacement, type PlacementItem, type PlacementLevel, type PlacementResult } from "../utils/placement";

/* Placement check v1 (ordinary site only; the research build swaps this file for
   PlacementCheck.off.tsx in vite.config.ts). "home": offered once to a new
   learner, can be skipped; "profile": always there, to take it again.
   The result suggests a level to start reading; it never locks anything. */

const FILE = placementFile as { version: string; items: PlacementItem[] };
const store = () => (typeof localStorage === "undefined" ? null : localStorage);

export default function PlacementCheck({ userId, lang, place, onRead }: {
  userId: string;
  lang: string;
  place: "home" | "profile";
  onRead: (level: PlacementLevel) => void;
}) {
  const t = DICT[lang];
  const [state, setState] = useState(() => readPlacement(store(), userId));
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [yes, setYes] = useState<Record<string, boolean>>({});

  const start = () => { setI(0); setYes({}); setRunning(true); };
  const skip = () => { const s = { skipped: new Date().toISOString() }; writePlacement(store(), userId, s); setState(s); };
  const answer = (known: boolean) => {
    const item = FILE.items[i];
    const next = { ...yes, [item.id]: known };
    if (i + 1 < FILE.items.length) { setYes(next); setI(i + 1); return; }
    const done: PlacementResult = estimate(FILE.items, next, FILE.version);
    writePlacement(store(), userId, { done });
    setState({ done });
    setRunning(false);
  };

  if (running) {
    const item = FILE.items[i];
    return (
      <section className="card p-5" aria-label={t.plTitle}>
        <p className="text-sm text-ink-2" aria-live="polite">{i + 1} / {FILE.items.length}</p>
        <p className="eyebrow mt-3">{t.plQuestion}</p>
        <p lang="en" className="font-display font-extrabold text-[30px] text-ink mt-1">{item.word}</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button type="button" onClick={() => answer(true)} className="btn">{t.plKnow}</button>
          <button type="button" onClick={() => answer(false)} className="btn btn-ghost">{t.plDontKnow}</button>
        </div>
      </section>
    );
  }

  if (state && "done" in state) {
    const r = state.done;
    const level = suggestedTaleLevel(r);
    return (
      <section className="card p-5 space-y-2" aria-label={t.plTitle}>
        <p className="eyebrow">{t.plTitle}</p>
        <p className="font-display font-extrabold text-[22px] text-ink">{r.level ? `${t.plAbout} ${r.level}` : t.plBelowA1}</p>
        <p className="text-sm text-ink-2">{t.plNotDiagnosis}</p>
        {!r.reliable && <p role="note" className="text-sm text-felt-deep">{t.plUnreliable}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => onRead(level)} className="btn btn-sm">{t.plReadAt} {level}</button>
          <button type="button" onClick={start} className="btn btn-ghost btn-sm">{t.plRetake}</button>
        </div>
      </section>
    );
  }

  // Skipped: nothing on the home screen; the profile still offers it.
  if (place === "home" && state && "skipped" in state) return null;
  return (
    <section className="card p-5 space-y-2" aria-label={t.plTitle}>
      <p className="eyebrow">{t.plTitle}</p>
      <p className="text-[15px] text-ink-2">{t.plOffer}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={start} className="btn btn-sm">{t.plStart}</button>
        {place === "home" && <button type="button" onClick={skip} className="btn btn-ghost btn-sm">{t.plSkip}</button>}
      </div>
    </section>
  );
}
