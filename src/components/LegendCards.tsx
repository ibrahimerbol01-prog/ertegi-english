import { useEffect, useState } from "react";
import { ChevronRight, Headphones, Lock, RotateCcw } from "lucide-react";
import { QoshqarMuyiz, Shanyraq, Tumar, KilimStrip } from "./Ornaments";
import { ScreenHeader, Sheet } from "./UIHelpers";
import { stopVoice } from "../utils/voice";
import { ScenePlayer } from "./ScenePlayer";
import { LEGENDS, PASS, RARITY, type LegendCard, type Ornament, type Question } from "../data/legends";

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
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-ink-2">
        <span className="opacity-40">{ORNAMENT[card.ornament]("w-12 h-12")}</span>
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em]">
          <Lock size={12} /> {r[lang]}
        </span>
      </div>
      <div className="py-2 text-center text-[11px] font-bold text-[#075F75] flex items-center justify-center gap-1">
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

/* Listening challenge: six questions on the scene; four right and the card is yours. */
function Challenge({ card, lang, onWin, onClose }: { card: LegendCard; lang: Lang; onWin: () => void; onClose: () => void }) {
  const total = card.qs.length;
  const [answers, setAnswers] = useState<(number | null)[]>(() => card.qs.map(() => null));
  const [checked, setChecked] = useState(false);
  const [listened, setListened] = useState(false);
  const r = RARITY[card.rarity];

  // True/false answers are stored as 1 (true) or 0 (false).
  const rightAnswer = (q: Question) => (q.kind === "tf" ? (q.a ? 1 : 0) : q.answer);
  const isRight = card.qs.map((q, i) => answers[i] === rightAnswer(q));
  const score = isRight.filter(Boolean).length;
  const won = checked && score >= PASS;
  const answered = answers.filter((x) => x !== null).length;
  const ready = answered === total;

  const choose = (i: number, value: number) => setAnswers((prev) => prev.map((x, j) => (j === i ? value : x)));
  const check = () => {
    setChecked(true);
    if (score >= PASS) onWin();
  };
  const retry = () => {
    setAnswers(card.qs.map(() => null));
    setChecked(false);
  };

  if (won) {
    return (
      <div className="p-6 text-center">
        <div className="w-44 mx-auto animate-rank-pop"><CardFace card={card} lang={lang} big /></div>
        <p className="eyebrow text-sun-deep mt-5">{lang === "kk" ? "Карта сенікі!" : "The card is yours!"}</p>
        <p className="text-sm font-bold text-ink mt-1">{score}/{total} · +{r.xp} XP</p>
        <div className="mt-4 rounded-2xl bg-sand-2 p-4 text-left">
          <p className="eyebrow">{lang === "kk" ? "Білесің бе?" : "Did you know?"}</p>
          <p className="text-sm text-ink mt-1 leading-relaxed">{card.fact[lang]}</p>
        </div>
        <button onClick={onClose} className="btn btn-sun w-full mt-6">{lang === "kk" ? "Жинаққа" : "To my deck"}</button>
      </div>
    );
  }

  const option = (i: number, value: number, label: string) => {
    const chosen = answers[i] === value;
    const correct = rightAnswer(card.qs[i]) === value;
    let state = chosen ? "tile-selected" : "text-ink";
    if (checked && chosen) state = correct ? "tile-correct" : "tile-wrong animate-answer-wrong";
    if (checked && !chosen && correct) state = "tile-correct";
    return (
      <button
        key={label}
        disabled={checked}
        aria-pressed={chosen}
        onClick={() => choose(i, value)}
        className={`tile flex-1 min-w-0 px-2 py-2.5 text-sm font-bold leading-tight ${state}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-sky-deep">{lang === "kk" ? "Тыңда да жең" : "Listen and win"}</p>
        <span className={`chip h-7 text-[12px] text-white border-0 ${CHIP_FILL[card.rarity]}`}>{r[lang]} · +{r.xp} XP</span>
      </div>
      <h3 className="font-display font-black text-xl text-ink mt-2">{lang === "kk" ? card.kk : card.name}</h3>

      <div className="mt-4">
        <ScenePlayer text={card.scene} lang={lang} onPlay={() => setListened(true)} />
      </div>
      <p className="text-xs text-ink-3 mt-2 text-center">
        {!listened
          ? (lang === "kk" ? "Алдымен тыңда, сосын жауап бер. Қажет болса, ойнатқышты кері айналдыр." : "Listen first, then answer. Drag the slider back to hear a part again.")
          : (lang === "kk" ? `Жауап берілді: ${answered}/${total} · картаға ${PASS} дұрыс жауап керек` : `Answered: ${answered}/${total} · ${PASS} right wins the card`)}
      </p>

      <ol className="mt-5 space-y-4">
        {card.qs.map((q, i) => {
          const [before, after] = q.s.split("___");
          return (
            <li key={q.s}>
              <p lang="en" className="text-[15px] font-semibold text-ink">
                {i + 1}.{" "}
                {q.kind === "gap" ? (
                  <>
                    {before}
                    <span className="inline-block min-w-[64px] border-b-[3px] border-sky mx-1 text-center text-sky-deep font-bold">
                      {answers[i] !== null ? q.options[answers[i]!] : " "}
                    </span>
                    {after}
                  </>
                ) : q.s}
              </p>
              <div className={`flex gap-2 mt-2 ${q.kind === "mc" ? "flex-col" : ""}`}>
                {q.kind === "tf"
                  ? [option(i, 1, lang === "kk" ? "Рас" : "True"), option(i, 0, lang === "kk" ? "Жалған" : "False")]
                  : q.options.map((opt, k) => option(i, k, opt))}
              </div>
            </li>
          );
        })}
      </ol>

      {checked ? (
        <div className="mt-6 rounded-[20px] bg-felt-soft p-4 animate-pop-in">
          <p className="font-display font-black text-felt-deep">{score}/{total} · {lang === "kk" ? "Тағы бір рет тыңда" : "Listen once more"}</p>
          <p className="text-sm text-ink-2 mt-1">{lang === "kk" ? `Картаны алу үшін кемінде ${PASS} дұрыс жауап керек.` : `You need at least ${PASS} right to win the card.`}</p>
          <details className="mt-2">
            <summary className="text-sm font-bold text-sky-deep cursor-pointer">{lang === "kk" ? "Мәтінді көр" : "Show the text"}</summary>
            <p lang="en" className="text-sm text-ink mt-2 leading-relaxed">{card.scene}</p>
          </details>
          <button onClick={retry} className="btn btn-felt w-full mt-4"><RotateCcw size={18} /> {lang === "kk" ? "Қайтадан" : "Try again"}</button>
        </div>
      ) : (
        <button onClick={check} disabled={!ready} className="btn w-full mt-6">
          {ready ? (lang === "kk" ? "Тексеру" : "Check") : (lang === "kk" ? `Тағы ${total - answered} сұрақ қалды` : `${total - answered} more to answer`)}
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
      <div className="mt-5"><ScenePlayer text={card.scene} lang={lang} /></div>
      <p lang="en" className="text-[15px] text-ink leading-relaxed mt-4">{card.scene}</p>
      <div className="mt-4 rounded-2xl bg-sand-2 p-4">
        <p className="eyebrow">{lang === "kk" ? "Білесің бе?" : "Did you know?"}</p>
        <p className="text-sm text-ink mt-1 leading-relaxed">{card.fact[lang]}</p>
      </div>
    </div>
  );
}

/* The whole deck: its own tab in the menu. */
// Rarity tones one step deeper so the white chip label passes AA.
const CHIP_FILL: Record<string, string> = { ertegi: "bg-sky-deep", epos: "bg-[#15805A]", anyz: "bg-[#C4441E]", tarih: "bg-night" };

export function LegendScreen({ lang, userId, onReward }: { lang: string; userId?: string; onReward: (xp: number) => void }) {
  const l = pick(lang);
  const [owned, setOwned] = useState<string[]>(() => loadCards(userId));
  // play: the card was still locked when opened, so keep the challenge (and its win screen) on.
  const [active, setActive] = useState<{ card: LegendCard; play: boolean } | null>(null);
  const close = () => { stopVoice(); setActive(null); };
  const isOwned = (id: string) => owned.includes(id);
  // Leaving the tab stops a scene that is still playing.
  useEffect(() => () => stopVoice(), []);

  const win = (card: LegendCard) => {
    if (owned.includes(card.id)) return;
    saveCard(userId, card.id);
    setOwned(loadCards(userId));
    onReward(RARITY[card.rarity].xp);
  };

  return (
    <div className="animate-pop-in">
      <ScreenHeader
        eyebrow={l === "kk" ? "Тыңда да жина" : "Listen and collect"}
        title={l === "kk" ? "Батырлар карталары" : "Batyr cards"}
        trailing={<span className="chip text-sun-deep shrink-0">{owned.length}/{LEGENDS.length}</span>}
      />
      <p className="text-[15px] text-ink-2 leading-relaxed -mt-2">
        {l === "kk"
          ? "Қазақ ертегілері, жырлары, аңыздары мен тарихы. Ағылшынша сахнаны тыңда, 6 сұраққа жауап бер — карта сенікі."
          : "Kazakh tales, epics, legends and history. Listen to a scene in English, answer 6 questions, and the card is yours."}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        {(Object.keys(RARITY) as (keyof typeof RARITY)[]).map((k) => (
          <span key={k} className="chip h-7 text-[12px] text-ink-2">
            <span className={`w-2.5 h-2.5 rounded-full ${RARITY[k].tone}`} /> {RARITY[k][l]} · +{RARITY[k].xp}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-5">
        {LEGENDS.map((card) => (
          <button key={card.id} onClick={() => setActive({ card, play: !isOwned(card.id) })} className="text-left active:scale-[0.97] transition-transform" aria-label={isOwned(card.id) ? (l === "kk" ? card.kk : card.name) : l === "kk" ? `${RARITY[card.rarity][l]} картасы` : `${RARITY[card.rarity][l]} card`}>
            {isOwned(card.id) ? <CardFace card={card} lang={l} /> : <CardBack card={card} lang={l} />}
          </button>
        ))}
      </div>

      <Sheet open={!!active} onClose={close} label={(active && (l === "kk" ? active.card.kk : active.card.name)) || ""}>
        {active && (active.play
          ? <Challenge key={active.card.id} card={active.card} lang={l} onWin={() => win(active.card)} onClose={close} />
          : <CardDetail card={active.card} lang={l} />)}
      </Sheet>
    </div>
  );
}

/* Home entry: a fanned stack of cards that opens the deck. */
export function LegendDeckEntry({ lang, userId, onOpen }: { lang: string; userId?: string; onOpen: () => void }) {
  const l = pick(lang);
  const owned = loadCards(userId);
  const preview = [...LEGENDS.filter((c) => owned.includes(c.id)), ...LEGENDS.filter((c) => !owned.includes(c.id))].slice(0, 3);

  return (
    <button onClick={onOpen} className="card w-full text-left p-5 flex items-center gap-4 overflow-hidden">
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
  );
}
