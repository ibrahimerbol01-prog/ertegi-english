import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Headphones, Lock, RotateCcw, Snail } from "lucide-react";
import { QoshqarMuyiz, Shanyraq, Tumar, KilimStrip } from "./Ornaments";
import { CloseButton, Sheet } from "./UIHelpers";
import { useEscape } from "../utils/useEscape";
import { safePlayVoice, stopVoice } from "../utils/voice";
import { LEGENDS, RARITY, type LegendCard, type Ornament } from "../data/legends";

type Lang = "kk" | "en";
const pick = (lang: string) => (lang === "kk" ? "kk" : "en") as Lang;

/* Collected cards, kept per user in localStorage. */
const cardsKey = (userId?: string) => `ertegi_cards_${userId || "guest"}`;
function loadCards(userId?: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(cardsKey(userId)) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
function saveCard(userId: string | undefined, id: string) {
  const all = new Set(loadCards(userId));
  all.add(id);
  try { localStorage.setItem(cardsKey(userId), JSON.stringify([...all])); } catch { /* storage full or blocked */ }
}

const ORNAMENT: Record<Ornament, (cls: string) => React.ReactNode> = {
  qoshqar: (cls) => <QoshqarMuyiz className={cls} strokeWidth={4} />,
  shanyraq: (cls) => <Shanyraq className={cls} strokeWidth={4} />,
  tumar: (cls) => <Tumar className={cls} strokeWidth={2.6} />,
};

/* Front of a collected card. */
function CardFace({ card, lang, big = false }: { card: LegendCard; lang: Lang; big?: boolean }) {
  const r = RARITY[card.rarity];
  const legendary = card.rarity === "tarih";
  return (
    <div className={`w-full aspect-[3/4] rounded-[22px] overflow-hidden border-[3px] ${r.frame} bg-card flex flex-col shadow-[0_4px_0_var(--color-line-2)]`}>
      <div className={`relative flex-[1.25] ${r.tone} flex items-center justify-center ${legendary ? "text-sun" : "text-white/90"}`}>
        <KilimStrip className="absolute top-0 inset-x-0 h-1.5 w-full opacity-80" />
        {ORNAMENT[card.ornament](big ? "w-24 h-24" : "w-14 h-14")}
      </div>
      <div className={`flex-1 flex flex-col justify-center text-center ${big ? "px-4 py-3" : "px-2 py-2"}`}>
        <p className={`font-bold uppercase tracking-[0.08em] text-ink-3 ${big ? "text-xs mb-1" : "text-[9px] mb-0.5"}`}>{r[lang]}</p>
        <p className={`font-display font-black text-ink leading-tight ${big ? "text-2xl" : "text-[12px] line-clamp-2"}`}>{lang === "kk" ? card.kk : card.name}</p>
        {big && lang !== "kk" && <p className="text-ink-3 font-semibold mt-0.5 text-sm">{card.kk}</p>}
      </div>
    </div>
  );
}

/* Back of a card that is still to be won. */
function CardBack({ card, lang }: { card: LegendCard; lang: Lang }) {
  const r = RARITY[card.rarity];
  return (
    <div className="w-full aspect-[3/4] rounded-[22px] overflow-hidden border-[3px] border-line bg-sand-2 flex flex-col shadow-[0_4px_0_var(--color-line-2)]">
      <div className={`h-2 ${r.tone}`} />
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-ink-3">
        <span className="opacity-40">{ORNAMENT[card.ornament]("w-12 h-12")}</span>
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em]">
          <Lock size={12} /> {r[lang]}
        </span>
      </div>
      <div className="py-2 text-center text-[11px] font-bold text-sky-deep flex items-center justify-center gap-1">
        <Headphones size={13} /> {lang === "kk" ? "Тыңда да аш" : "Listen to unlock"}
      </div>
    </div>
  );
}

/* Tiny card for the home preview: colour and ornament only. */
function MiniCard({ card, owned }: { card: LegendCard; owned: boolean }) {
  const r = RARITY[card.rarity];
  return (
    <div className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 flex items-center justify-center shadow-[0_3px_0_var(--color-line-2)] ${owned ? `${r.tone} ${r.frame} ${card.rarity === "tarih" ? "text-sun" : "text-white"}` : "bg-card border-line text-ink-3"}`}>
      {!owned && <span className={`absolute top-0 inset-x-0 h-1.5 ${r.tone}`} />}
      {owned ? ORNAMENT[card.ornament]("w-8 h-8") : <span className="opacity-35">{ORNAMENT[card.ornament]("w-7 h-7")}</span>}
    </div>
  );
}

/* Listening challenge: two true/false lines and one gap, then the card is yours. */
function Challenge({ card, lang, onWin, onClose }: { card: LegendCard; lang: Lang; onWin: () => void; onClose: () => void }) {
  const [tf, setTf] = useState<(boolean | null)[]>([null, null]);
  const [gap, setGap] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [listened, setListened] = useState(false);
  const r = RARITY[card.rarity];

  const tfOk = card.tf.map((q, i) => tf[i] === q.a);
  const gapOk = gap === card.gap.answer;
  const score = tfOk.filter(Boolean).length + (gapOk ? 1 : 0);
  const won = checked && score >= 2;
  const ready = tf.every((x) => x !== null) && gap !== null;

  const play = (rate: number) => {
    setListened(true);
    safePlayVoice(card.scene, undefined, rate);
  };
  const check = () => {
    setChecked(true);
    if (score >= 2) onWin();
  };
  const retry = () => {
    setTf([null, null]);
    setGap(null);
    setChecked(false);
  };

  if (won) {
    return (
      <div className="p-6 text-center">
        <div className="w-44 mx-auto animate-rank-pop"><CardFace card={card} lang={lang} big /></div>
        <p className="eyebrow text-sun-deep mt-5">{lang === "kk" ? "Карта сенікі!" : "The card is yours!"}</p>
        <p className="text-sm font-bold text-ink mt-1">{score}/3 · +{r.xp} XP</p>
        <div className="mt-4 rounded-2xl bg-sand-2 p-4 text-left">
          <p className="eyebrow">{lang === "kk" ? "Білесің бе?" : "Did you know?"}</p>
          <p className="text-sm text-ink mt-1 leading-relaxed">{card.fact[lang]}</p>
        </div>
        <button onClick={onClose} className="btn btn-sun w-full mt-6">{lang === "kk" ? "Жинаққа" : "To my deck"}</button>
      </div>
    );
  }

  const tfButton = (i: number, value: boolean) => {
    const chosen = tf[i] === value;
    let state = chosen ? "tile-selected" : "text-ink";
    if (checked && chosen) state = tfOk[i] ? "tile-correct" : "tile-wrong animate-answer-wrong";
    if (checked && !chosen && card.tf[i].a === value) state = "tile-correct";
    return (
      <button
        disabled={checked}
        aria-pressed={chosen}
        onClick={() => setTf((prev) => prev.map((x, j) => (j === i ? value : x)))}
        className={`tile flex-1 py-2.5 text-sm font-bold ${state}`}
      >
        {value ? (lang === "kk" ? "Рас" : "True") : (lang === "kk" ? "Жалған" : "False")}
      </button>
    );
  };

  const [before, after] = card.gap.sentence.split("___");

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-sky-deep">{lang === "kk" ? "Тыңда да жең" : "Listen and win"}</p>
        <span className={`chip h-7 text-[12px] text-white border-0 ${r.tone}`}>{r[lang]} · +{r.xp} XP</span>
      </div>
      <h3 className="font-display font-black text-xl text-ink mt-2">{lang === "kk" ? card.kk : card.name}</h3>

      <div className="grid grid-cols-[1fr_auto] gap-2 mt-4">
        <button onClick={() => play(1)} className="btn">
          <Headphones size={18} /> {lang === "kk" ? "Тыңдау" : "Listen"}
        </button>
        <button onClick={() => play(0.75)} className="btn btn-ghost px-4" aria-label={lang === "kk" ? "Баяу" : "Slow"}>
          <Snail size={18} />
        </button>
      </div>
      {!listened && (
        <p className="text-xs text-ink-3 mt-2 text-center">
          {lang === "kk" ? "Алдымен тыңда, сосын жауап бер." : "Listen first, then answer."}
        </p>
      )}

      <div className="mt-5 space-y-4">
        {card.tf.map((q, i) => (
          <div key={q.s}>
            <p className="text-[15px] font-semibold text-ink">{i + 1}. {q.s}</p>
            <div className="flex gap-2 mt-2">{tfButton(i, true)}{tfButton(i, false)}</div>
          </div>
        ))}
        <div>
          <p className="text-[15px] font-semibold text-ink">
            3. {before}
            <span className="inline-block min-w-[64px] border-b-[3px] border-sky mx-1 text-center text-sky-deep font-bold">
              {gap !== null ? card.gap.options[gap] : " "}
            </span>
            {after}
          </p>
          <div className="flex gap-2 mt-2">
            {card.gap.options.map((opt, i) => {
              let state = gap === i ? "tile-selected" : "text-ink";
              if (checked && gap === i) state = gapOk ? "tile-correct" : "tile-wrong animate-answer-wrong";
              if (checked && gap !== i && i === card.gap.answer) state = "tile-correct";
              return (
                <button key={opt} disabled={checked} aria-pressed={gap === i} onClick={() => setGap(i)} className={`tile flex-1 py-2.5 text-sm font-bold ${state}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {checked ? (
        <div className="mt-6 rounded-[20px] bg-felt-soft p-4 animate-pop-in">
          <p className="font-display font-black text-felt-deep">{score}/3 · {lang === "kk" ? "Тағы бір рет тыңда" : "Listen once more"}</p>
          <p className="text-sm text-ink-2 mt-1">{lang === "kk" ? "Картаны алу үшін кемінде 2 дұрыс жауап керек." : "You need at least 2 right to win the card."}</p>
          <details className="mt-2">
            <summary className="text-sm font-bold text-sky-deep cursor-pointer">{lang === "kk" ? "Мәтінді көр" : "Show the text"}</summary>
            <p className="text-sm text-ink mt-2 leading-relaxed">{card.scene}</p>
          </details>
          <button onClick={retry} className="btn btn-felt w-full mt-4"><RotateCcw size={18} /> {lang === "kk" ? "Қайтадан" : "Try again"}</button>
        </div>
      ) : (
        <button onClick={check} disabled={!ready} className="btn w-full mt-6">
          {lang === "kk" ? "Тексеру" : "Check"}
        </button>
      )}
    </div>
  );
}

/* Detail of a collected card: replay its scene and read its fact. */
function CardDetail({ card, lang }: { card: LegendCard; lang: Lang }) {
  return (
    <div className="p-6">
      <div className="w-40 mx-auto"><CardFace card={card} lang={lang} big /></div>
      <button onClick={() => safePlayVoice(card.scene)} className="btn w-full mt-5">
        <Headphones size={18} /> {lang === "kk" ? "Қайта тыңдау" : "Listen again"}
      </button>
      <p className="text-[15px] text-ink leading-relaxed mt-4">{card.scene}</p>
      <div className="mt-4 rounded-2xl bg-sand-2 p-4">
        <p className="eyebrow">{lang === "kk" ? "Білесің бе?" : "Did you know?"}</p>
        <p className="text-sm text-ink mt-1 leading-relaxed">{card.fact[lang]}</p>
      </div>
    </div>
  );
}

/* The whole deck, full screen. */
function LegendDeck({ lang, owned, onWin, onClose }: {
  lang: Lang; owned: string[]; onWin: (card: LegendCard) => void; onClose: () => void;
}) {
  // play: the card was still locked when opened, so keep the challenge (and its win screen) on.
  const [active, setActive] = useState<{ card: LegendCard; play: boolean } | null>(null);
  const close = () => { stopVoice(); setActive(null); };
  useEscape(true, () => { stopVoice(); onClose(); });
  const isOwned = (id: string) => owned.includes(id);

  return createPortal(
    <div className="fixed inset-0 z-[66] bg-sand overflow-y-auto animate-pop-in" role="dialog" aria-modal="true" aria-label={lang === "kk" ? "Батырлар карталары" : "Batyr cards"}>
      <div className="sticky top-0 z-10 glass border-b border-line/70">
        <div className="mx-auto max-w-[620px] px-4 h-16 flex items-center gap-3">
          <CloseButton onClick={() => { stopVoice(); onClose(); }} />
          <p className="font-display font-black text-lg text-ink flex-1">{lang === "kk" ? "Батырлар карталары" : "Batyr cards"}</p>
          <span className="chip text-sun-deep">{owned.length}/{LEGENDS.length}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[620px] px-4 pt-5 pb-16">
        <p className="text-[15px] text-ink-2 leading-relaxed">
          {lang === "kk"
            ? "Қазақ ертегілері, жырлары, аңыздары мен тарихы. Ағылшынша сахнаны тыңда, 3 сұраққа жауап бер — карта сенікі."
            : "Kazakh tales, epics, legends and history. Listen to a scene in English, answer 3 questions, and the card is yours."}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {(Object.keys(RARITY) as (keyof typeof RARITY)[]).map((k) => (
            <span key={k} className="chip h-7 text-[12px] text-ink-2">
              <span className={`w-2.5 h-2.5 rounded-full ${RARITY[k].tone}`} /> {RARITY[k][lang]} · +{RARITY[k].xp}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-5">
          {LEGENDS.map((card) => (
            <button key={card.id} onClick={() => setActive({ card, play: !isOwned(card.id) })} className="text-left active:scale-[0.97] transition-transform" aria-label={isOwned(card.id) ? (lang === "kk" ? card.kk : card.name) : lang === "kk" ? `${RARITY[card.rarity][lang]} картасы` : `${RARITY[card.rarity][lang]} card`}>
              {isOwned(card.id) ? <CardFace card={card} lang={lang} /> : <CardBack card={card} lang={lang} />}
            </button>
          ))}
        </div>
      </div>

      <Sheet open={!!active} onClose={close} label={(active && (lang === "kk" ? active.card.kk : active.card.name)) || ""}>
        {active && (active.play
          ? <Challenge key={active.card.id} card={active.card} lang={lang} onWin={() => onWin(active.card)} onClose={close} />
          : <CardDetail card={active.card} lang={lang} />)}
      </Sheet>
    </div>,
    document.body
  );
}

/* Home entry: a fanned stack of cards that opens the deck. */
export function LegendDeckEntry({ lang, userId, onReward }: { lang: string; userId?: string; onReward: (xp: number) => void }) {
  const l = pick(lang);
  const [open, setOpen] = useState(false);
  const [owned, setOwned] = useState<string[]>(() => loadCards(userId));
  const preview = [...LEGENDS.filter((c) => owned.includes(c.id)), ...LEGENDS.filter((c) => !owned.includes(c.id))].slice(0, 3);

  const win = (card: LegendCard) => {
    if (owned.includes(card.id)) return;
    saveCard(userId, card.id);
    setOwned(loadCards(userId));
    onReward(RARITY[card.rarity].xp);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="card w-full text-left p-5 flex items-center gap-4 overflow-hidden">
        <div className="relative w-[104px] h-[92px] shrink-0">
          {preview.map((card, i) => (
            <div
              key={card.id}
              className="absolute top-1 w-[58px]"
              style={{ left: i * 22, transform: `rotate(${(i - 1) * 9}deg)`, zIndex: i }}
            >
              <MiniCard card={card} owned={owned.includes(card.id)} />
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <p className="eyebrow text-sky-deep">{l === "kk" ? "Тыңда да жина" : "Listen and collect"}</p>
          <p className="font-display font-extrabold text-ink text-[17px] mt-0.5">{l === "kk" ? "Батырлар карталары" : "Batyr cards"}</p>
          <p className="text-sm text-ink-2 mt-0.5">{owned.length}/{LEGENDS.length} · {l === "kk" ? "ертегі, жыр, аңыз, тарих" : "tales, epics, legends, history"}</p>
        </div>
        <ChevronRight size={22} className="text-ink-3 shrink-0" />
      </button>
      {open && <LegendDeck lang={l} owned={owned} onWin={win} onClose={() => setOpen(false)} />}
    </>
  );
}
