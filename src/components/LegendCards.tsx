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

/* Colours of each kind of card: a bright face, a deep edge, a soft paper and
   a text colour that keeps 4.5:1 on that paper. */
const LOOK: Record<LegendCard["rarity"], { face: string; deep: string; soft: string; text: string; mark: string }> = {
  ertegi: { face: "#12A3C6", deep: "#0B7E9A", soft: "#E1F4F9", text: "#075F75", mark: "#FFFFFF" },
  epos: { face: "#22B07D", deep: "#15805A", soft: "#DDF5EA", text: "#0F6E4B", mark: "#FFFFFF" },
  anyz: { face: "#E4572E", deep: "#B53D1A", soft: "#FDE6DE", text: "#9E3415", mark: "#FFFFFF" },
  tarih: { face: "#2B3B66", deep: "#1F2B4D", soft: "#E4E8F3", text: "#1F2B4D", mark: "#FFB81F" },
};

/* Four-point star for the twinkles. */
const Star = ({ className, style }: { className: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 10 10" className={className} style={style} aria-hidden="true">
    <path d="M5 0 C5.6 3.6 6.4 4.4 10 5 C6.4 5.6 5.6 6.4 5 10 C4.4 6.4 3.6 5.6 0 5 C3.6 4.4 4.4 3.6 5 0Z" fill="#FFB81F" />
  </svg>
);

/* The card's emblem: its ornament on a glossy medallion with a sun rim,
   slow rays behind it and a couple of twinkling stars. `delay` staggers the
   motion so a grid of cards doesn't move in step. */
function Emblem({ card, size, delay = 0, onColor = false }: { card: LegendCard; size: "s" | "m" | "l"; delay?: number; onColor?: boolean }) {
  const look = LOOK[card.rarity];
  const box = { s: "w-[50px] h-[50px]", m: "w-[58px] h-[58px] sm:w-[70px] sm:h-[70px]", l: "w-[84px] h-[84px]" }[size];
  const glyph = { s: "w-7 h-7", m: "w-8 h-8 sm:w-10 sm:h-10", l: "w-12 h-12" }[size];
  const t = (s: number) => ({ animationDelay: `${-((delay * 0.7 + s) % 6)}s` });
  return (
    <div className="relative grid place-items-center">
      <svg viewBox="0 0 100 100" className={`absolute w-[150%] h-[150%] animate-spin-slow`} style={t(0)} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M50 4 L54 20 L46 20 Z" fill={onColor ? "#FFFFFF" : look.face} opacity={onColor ? (i % 2 ? 0.14 : 0.26) : i % 2 ? 0.16 : 0.28} transform={`rotate(${i * 30} 50 50)`} />
        ))}
      </svg>
      <div className="animate-float" style={t(0.5)}>
        <div
          className={`relative ${box} rounded-full grid place-items-center overflow-hidden`}
          style={onColor ? {
            // A won card: a gold coin with the ornament struck in the card's colour.
            background: "radial-gradient(circle at 32% 28%, #FFE7A3 0%, #FFB81F 50%, #D98E00 100%)",
            boxShadow: `0 0 0 3px #FFFFFF, 0 5px 0 3px ${look.deep}`,
          } : {
            background: `radial-gradient(circle at 32% 28%, ${look.face} 0%, ${look.face} 45%, ${look.deep} 100%)`,
            boxShadow: `0 0 0 3px #FFB81F, 0 0 0 5px ${look.deep}33, 0 5px 0 4px ${look.deep}`,
          }}
        >
          <span className="absolute left-[14%] top-[10%] w-[46%] h-[30%] rounded-full bg-white/30 blur-[2px] -rotate-[20deg]" />
          <span style={{ color: onColor ? look.deep : look.mark, filter: `drop-shadow(0 2px 0 ${onColor ? "#FFFFFF99" : look.deep})` }} className="relative">
            {ORNAMENT[card.ornament](glyph)}
          </span>
        </div>
      </div>
      <Star className="absolute -top-1 -right-2 w-3.5 h-3.5 animate-twinkle" style={t(1.2)} />
      <Star className="absolute bottom-1 -left-2.5 w-2.5 h-2.5 animate-twinkle" style={t(2.4)} />
    </div>
  );
}

/* Front of a collected card. */
function CardFace({ card, lang, big = false, index = 0 }: { card: LegendCard; lang: Lang; big?: boolean; index?: number }) {
  const r = RARITY[card.rarity];
  const look = LOOK[card.rarity];
  return (
    <div
      className="relative w-full aspect-[3/4] rounded-[22px] overflow-hidden border-[3px] border-sun bg-card flex flex-col"
      style={{ boxShadow: `0 4px 0 #D98E00, 0 8px 22px -8px ${look.face}99` }}
    >
      <div className="relative flex-[1.3] flex items-center justify-center overflow-hidden pt-1.5" style={{ background: `linear-gradient(160deg, ${look.face} 0%, ${look.deep} 100%)` }}>
        <KilimStrip className="absolute top-0 inset-x-0 h-1.5 w-full" />
        <Emblem card={card} size={big ? "l" : "s"} delay={index} onColor />
      </div>
      <div className={`flex-1 flex flex-col justify-center text-center ${big ? "px-4 py-3" : "px-2 py-2"}`}>
        <p className={`font-bold uppercase tracking-[0.08em] ${big ? "text-xs mb-1" : "text-[9px] mb-0.5"}`} style={{ color: look.text }}>{r[lang]}</p>
        <p className={`font-display font-black text-ink leading-tight ${big ? "text-2xl" : "text-[12px] line-clamp-2"}`}>{lang === "kk" ? card.kk : card.name}</p>
        {big && lang !== "kk" && <p className="text-ink-3 font-semibold mt-0.5 text-sm">{card.kk}</p>}
      </div>
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-card-shine" style={{ animationDelay: `${-(index * 0.9) % 5.5}s` }} />
    </div>
  );
}

/* Back of a card that is still to be won: already in full colour, with a lock. */
function CardBack({ card, lang, index = 0 }: { card: LegendCard; lang: Lang; index?: number }) {
  const r = RARITY[card.rarity];
  const look = LOOK[card.rarity];
  return (
    <div
      className="relative w-full aspect-[3/4] rounded-[22px] overflow-hidden border-[3px] flex flex-col transition-transform duration-200 group-hover:-translate-y-1"
      style={{ borderColor: `${look.face}55`, background: `linear-gradient(170deg, ${look.soft} 0%, #FFFFFF 95%)`, boxShadow: `0 4px 0 ${look.face}55` }}
    >
      <div className="h-2" style={{ background: look.face }} />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 pt-2">
        <Emblem card={card} size="m" delay={index} />
        <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.08em]" style={{ color: look.text }}>
          <Lock size={12} strokeWidth={3} /> {r[lang]}
        </span>
      </div>
      <div className="py-2 text-center text-[11px] font-bold flex items-center justify-center gap-1" style={{ color: look.text, background: `${look.face}1F` }}>
        <Headphones size={13} strokeWidth={2.6} /> {lang === "kk" ? "Тыңда да аш" : "Listen to unlock"}
      </div>
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-card-shine" style={{ animationDelay: `${-(index * 0.9) % 5.5}s` }} />
    </div>
  );
}

/* Tiny card for the home preview: colour and ornament only. */
function MiniCard({ card, owned }: { card: LegendCard; owned: boolean }) {
  const look = LOOK[card.rarity];
  return (
    <div
      className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 flex items-center justify-center"
      style={owned
        ? { background: `radial-gradient(circle at 35% 30%, ${look.face}, ${look.deep})`, borderColor: "#FFB81F", boxShadow: "0 3px 0 #D98E00", color: look.mark }
        : { background: `linear-gradient(170deg, ${look.soft}, #FFFFFF)`, borderColor: `${look.face}55`, boxShadow: `0 3px 0 ${look.face}55`, color: look.face }}
    >
      {!owned && <span className="absolute top-0 inset-x-0 h-1.5" style={{ background: look.face }} />}
      {ORNAMENT[card.ornament]("w-8 h-8")}
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
        {LEGENDS.map((card, i) => (
          <button key={card.id} onClick={() => setActive({ card, play: !isOwned(card.id) })} className="group text-left active:scale-[0.97] transition-transform" aria-label={isOwned(card.id) ? (l === "kk" ? card.kk : card.name) : l === "kk" ? `${RARITY[card.rarity][l]} картасы` : `${RARITY[card.rarity][l]} card`}>
            {isOwned(card.id) ? <CardFace card={card} lang={l} index={i} /> : <CardBack card={card} lang={l} index={i} />}
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
