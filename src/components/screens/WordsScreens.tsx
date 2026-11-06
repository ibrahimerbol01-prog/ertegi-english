import { useState, useMemo } from "react";
import { Volume2, Check } from "lucide-react";
import { KilimStrip } from "../Ornaments";
import { safePlayVoice } from "../../utils/voice";
import type { SavedWord } from "../../types";
import { cardDirection, isDue, MAX_MASTERY, type CardDirection } from "../../utils/progress";
import { exampleFor } from "../../utils/lexicon";
import { IconCards, IconTrophy } from "../Icons";
import { useTr } from "./shared";
import { ScreenHeader } from "../UIHelpers";
import { MATCH_XP } from "../../research/params";
import { RESEARCH_MODE } from "../../research/mode";
import { DICT } from "../../dict";
import { useLang } from "../../lang";

/* Words tab switcher shared by flashcards, matching and the wordbank (ordinary site only). */
export function WordsHeader({ mode, setMode, trailing }: { mode?: string; setMode?: (m: string) => void; trailing?: React.ReactNode }) {
  const tr = useTr();
  const t = DICT[useLang()];
  const title = mode === "match" ? tr("Жұбын тап", "Find the pair") : mode === "bank" && !RESEARCH_MODE ? t.wbTitle : tr("Карточкалар", "Flashcards");
  return (
    <>
      <ScreenHeader eyebrow={tr("Сөздік", "Vocabulary")} title={title} trailing={trailing} />
      {setMode && (
        <div className="segmented mb-5" role="group" aria-label={tr("Жаттығу түрі", "Practice mode")}>
          <button aria-pressed={mode === "cards"} onClick={() => setMode("cards")}>{tr("Карточкалар", "Flashcards")}</button>
          <button aria-pressed={mode === "match"} onClick={() => setMode("match")}>{tr("Сәйкестендіру", "Matching")}</button>
          {/* R4: no wordbank in the research build. */}
          {!RESEARCH_MODE && <button aria-pressed={mode === "bank"} onClick={() => setMode("bank")}>{t.wbTab}</button>}
        </div>
      )}
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card p-8 text-center">
      <span className="mx-auto w-20 h-20 rounded-full bg-sky-soft flex items-center justify-center">
        <IconCards size={48} />
      </span>
      <p className="text-[15px] text-ink-2 leading-relaxed mt-4 max-w-[280px] mx-auto">{text}</p>
    </div>
  );
}

/* --- 3.5 FLASHCARDS SCREEN: spaced repetition (Leitner boxes) --- */
export function FlashcardsScreen({ savedWords, onReview, lang = "kk", mode, setMode }: {
  savedWords: SavedWord[];
  onReview: (word: string, known: boolean, direction: CardDirection) => void;
  lang?: string;
  mode?: string;
  setMode?: (m: string) => void;
}) {
  // The session queue is fixed when the screen opens; "not yet" cards go to the back.
  const [queue, setQueue] = useState<string[]>(() =>
    savedWords
      .filter((w) => isDue(w.nextReviewAt))
      .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))
      .map((w) => w.word)
  );
  const [sessionSize, setSessionSize] = useState(queue.length);
  const [reviewed, setReviewed] = useState(0);
  const [practice, setPractice] = useState(false);
  const [missed, setMissed] = useState<Set<string>>(() => new Set());
  const [flipped, setFlipped] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const kk = lang === "kk";
  const example = useMemo(() => (queue[0] ? exampleFor(queue[0]) : null), [queue]);

  if (!savedWords || savedWords.length === 0) {
    return (
      <div className="animate-pop-in">
        <WordsHeader mode={mode} setMode={setMode} />
        <EmptyState text={kk ? "Әзірге сөз сақталмаған. Ертегіні оқып отырып, кез келген сөзді бассаң, ол осында сақталады." : "No words saved yet. Tap any word while reading a story to save it here."} />
      </div>
    );
  }

  if (queue.length === 0) {
    const upcoming = savedWords
      .map((w) => w.nextReviewAt)
      .filter((d): d is string => !!d && !isDue(d, openedAt))
      .sort()[0];
    const days = upcoming ? Math.max(1, Math.round((new Date(upcoming).getTime() - openedAt) / 86400000)) : null;
    return (
      <div className="animate-pop-in">
        <WordsHeader mode={mode} setMode={setMode} />
        <div className="card p-8 text-center">
          <span className="mx-auto w-20 h-20 rounded-full bg-jade flex items-center justify-center shadow-[0_5px_0_var(--color-jade-deep)]">
            <Check className="text-white" size={40} strokeWidth={3.5} />
          </span>
          <p className="font-display font-black text-2xl text-ink mt-5">{kk ? "Бәрі қайталанды!" : "All caught up!"}</p>
          <p className="text-[15px] text-ink-2 mt-1">
            {reviewed > 0 && `${reviewed} ${kk ? "сөз қайталанды. " : "words reviewed. "}`}
            {days !== null && (kk ? `Келесі қайталау ${days} күннен кейін.` : `Next review in ${days} day${days > 1 ? "s" : ""}.`)}
          </p>
          <button
            onClick={() => {
              const all = savedWords.map((w) => w.word);
              setPractice(true);
              setQueue(all);
              setSessionSize(all.length);
              setReviewed(0);
            }}
            className="btn btn-ghost w-full mt-6"
          >
            {kk ? "Бәрін қайталау" : "Practice all anyway"}
          </button>
        </div>
      </div>
    );
  }

  const currentWord = savedWords.find((w) => w.word === queue[0]) || savedWords[0];
  const box = currentWord.mastery ?? 0;
  // New and weak words: English first (recognition); from box 2 Kazakh first (recall), I3.
  const dir = cardDirection(box);
  const recall = dir === "kk_en";

  const handleNext = (known: boolean) => {
    // Free practice doesn't move words between boxes. A word missed in this
    // session drops one box once; getting it right on the second pass doesn't undo that.
    if (!practice && !missed.has(currentWord.word)) onReview(currentWord.word, known, dir);
    if (!known) setMissed((m) => new Set(m).add(currentWord.word));
    setFlipped(false);
    setQueue((q) => (known || practice ? q.slice(1) : [...q.slice(1), q[0]]));
    if (known || practice) setReviewed((r) => r + 1);
  };

  return (
    <div className="animate-pop-in">
      <WordsHeader
        mode={mode}
        setMode={setMode}
        trailing={<span className="chip text-ink-2">{Math.min(reviewed + 1, sessionSize)} / {sessionSize}</span>}
      />

      <div className="track mb-5"><span style={{ width: `${(reviewed / Math.max(sessionSize, 1)) * 100}%` }} /></div>

      <button
        onClick={() => {
          setFlipped(!flipped);
          // On a recall card the English word is the answer: say it only when it shows.
          if (!recall || !flipped) safePlayVoice(currentWord.word);
        }}
        aria-pressed={flipped}
        className="flip block w-full h-[280px]"
      >
        <div className={`flip-inner w-full h-full ${flipped ? "is-flipped" : ""}`}>
          <div aria-hidden={flipped} className="flip-face card overflow-hidden flex flex-col items-center justify-center p-6">
            <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full" />
            {recall ? (
              <>
                <span className="eyebrow">{kk ? "Ағылшынша қалай?" : "How do you say it in English?"}</span>
                <span lang="kk" className="font-display font-black text-[32px] text-ink mt-2 text-center break-words max-w-full">{currentWord.translation}</span>
                <span className="mt-6 text-sm text-ink-3 text-center">{kk ? "Ойыңда айт, сосын аударып тексер" : "Say it to yourself, then flip to check"}</span>
              </>
            ) : (
              <>
                <span className="eyebrow">{kk ? "Ағылшынша" : "English"}</span>
                <span lang="en" className="font-display font-black text-[40px] text-ink mt-2 break-words max-w-full">{currentWord.word}</span>
                <span className="mt-6 text-sm text-ink-3 flex items-center gap-1.5"><Volume2 size={15} /> {kk ? "Аудару үшін бас" : "Tap to flip"}</span>
              </>
            )}
            <span role="img" className="absolute bottom-4 flex gap-1.5" aria-label={kk ? `${MAX_MASTERY} қораптың ${box}-сі` : `Box ${box} of ${MAX_MASTERY}`}>
              {Array.from({ length: MAX_MASTERY }, (_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i < box ? "bg-jade" : "bg-sand-3"}`} />
              ))}
            </span>
          </div>
          <div aria-hidden={!flipped} className="flip-face flip-back rounded-[24px] bg-sky-deep shadow-[0_6px_0_#075F75] flex flex-col items-center justify-center p-6 text-white">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-white">{recall ? (kk ? "Ағылшынша" : "English") : (kk ? "Қазақша" : "Kazakh")}</span>
            <span lang={recall ? "en" : "kk"} className="font-display font-black text-[32px] mt-2 text-center break-words max-w-full">{recall ? currentWord.word : currentWord.translation}</span>
            {example && (
              <span lang="en" className="mt-4 text-[14px] leading-snug text-center italic text-white/90 line-clamp-3">
                <span className="sr-only">{kk ? "Ертегіден: " : "From the tale: "}</span>{example}
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3 mt-7">
        <button onClick={() => handleNext(false)} className="btn btn-ghost">{kk ? "Әлі білмеймін" : "Not yet"}</button>
        <button onClick={() => handleNext(true)} className="btn btn-jade">{kk ? "Білемін" : "I knew it"}</button>
      </div>
      {!practice && (
        <p className="text-center text-sm text-ink-3 mt-4">
          {kk ? "Білсең, сөз кейінірек қайталанады: 1, 3, 7 күн..." : "Words you know come back later: 1, 3, 7 days..."}
        </p>
      )}
    </div>
  );
}

/* --- 3.6 MATCHING GAME SCREEN --- */
interface MatchTile {
  tileId: string;
  pairId: number;
  text: string;
  kind: "word" | "translation";
}

const MATCH_GRID_SIZE = 6;

/* Deal a shuffled board of up to MATCH_GRID_SIZE word/translation pairs. */
function dealTiles(savedWords: SavedWord[]): MatchTile[] {
  const shuffled = [...savedWords].sort(() => Math.random() - 0.5).slice(0, Math.min(MATCH_GRID_SIZE, savedWords.length));
  const wordTiles = shuffled.map((w, i) => ({ tileId: `w-${i}`, pairId: i, text: w.word, kind: "word" as const }));
  const transTiles = shuffled.map((w, i) => ({ tileId: `t-${i}`, pairId: i, text: w.translation, kind: "translation" as const }));
  return [...wordTiles, ...transTiles].sort(() => Math.random() - 0.5);
}

type MatchingProps = {
  savedWords: SavedWord[];
  onReward: (xp: number) => void;
  mode?: string;
  setMode?: (m: string) => void;
};

/* Each round is its own keyed MatchingRound: a new round or a changed word list remounts it,
   so the board is dealt fresh and the round state resets without setState in an effect. */
export function MatchingGame(props: MatchingProps) {
  const [round, setRound] = useState(0);
  const { savedWords } = props;
  const deckKey = useMemo(
    () => (savedWords ?? []).map((w) => `${w.word}\u0000${w.translation}`).join("\u0001"),
    [savedWords],
  );
  return (
    <MatchingRound
      key={`${round}\u0002${deckKey}`}
      {...props}
      onNextRound={() => setRound((r) => r + 1)}
    />
  );
}

function MatchingRound({ savedWords, onReward, mode, setMode, onNextRound }: MatchingProps & { onNextRound: () => void }) {
  const tr = useTr();
  const [tiles] = useState<MatchTile[]>(() => (savedWords && savedWords.length >= 3 ? dealTiles(savedWords) : []));
  const [selectedTile, setSelectedTile] = useState<MatchTile | null>(null);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [roundComplete, setRoundComplete] = useState(false);

  const handleTileTap = (tile: MatchTile) => {
    if (matchedIds.includes(tile.pairId) || wrongPair.length > 0) return;

    if (!selectedTile) {
      setSelectedTile(tile);
      if (tile.kind === "word") safePlayVoice(tile.text);
      return;
    }
    if (selectedTile.tileId === tile.tileId) {
      setSelectedTile(null);
      return;
    }
    if (selectedTile.pairId === tile.pairId && selectedTile.kind !== tile.kind) {
      const newMatched = [...matchedIds, tile.pairId];
      setMatchedIds(newMatched);
      setSelectedTile(null);
      onReward(MATCH_XP);
      if (newMatched.length === tiles.length / 2) {
        setTimeout(() => setRoundComplete(true), 400);
      }
    } else {
      setWrongPair([selectedTile.tileId, tile.tileId]);
      setTimeout(() => {
        setWrongPair([]);
        setSelectedTile(null);
      }, 500);
    }
  };

  if (!savedWords || savedWords.length < 3) {
    return (
      <div className="animate-pop-in">
        <WordsHeader mode={mode} setMode={setMode} />
        <EmptyState text={tr("Ойын ашылуы үшін оқу кезінде кемінде 3 сөз сақта.", "Save at least 3 words while reading to unlock the matching game.")} />
      </div>
    );
  }

  if (roundComplete) {
    return (
      <div className="animate-pop-in">
        <WordsHeader mode={mode} setMode={setMode} />
        <div className="card p-8 text-center">
          <IconTrophy size={88} className="mx-auto animate-pop-in" />
          <p className="font-display font-black text-2xl text-ink mt-5">{tr("Бәрі сәйкес келді!", "All matched!")}</p>
          <p className="text-[15px] text-ink-2 mt-1">{tr("Сөздерді тез таныдың.", "Great recognition speed.")}</p>
          <button onClick={onNextRound} className="btn w-full mt-6">{tr("Келесі раунд", "Next round")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pop-in">
      <WordsHeader mode={mode} setMode={setMode} trailing={<span className="chip text-ink-2">{matchedIds.length} / {tiles.length / 2}</span>} />
      <div className="track mb-5"><span style={{ width: `${tiles.length ? (matchedIds.length / (tiles.length / 2)) * 100 : 0}%` }} /></div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const isMatched = matchedIds.includes(tile.pairId);
          const isSelected = selectedTile?.tileId === tile.tileId;
          const isWrong = wrongPair.includes(tile.tileId);

          return (
            <button
              key={tile.tileId}
              onClick={() => handleTileTap(tile)}
              disabled={isMatched}
              className={`tile p-3 min-h-[68px] text-center font-display font-bold text-[15px] flex items-center justify-center ${
                isMatched
                  ? "tile-correct opacity-50"
                  : isWrong
                  ? "tile-wrong animate-answer-wrong"
                  : isSelected
                  ? "tile-selected"
                  : "text-ink hover:border-sky/40"
              }`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
