import { useState, useRef, useEffect } from "react";
import {
  ArrowRight, Play, Pause, Volume2, ChevronRight, RotateCcw, Compass, Layers, Trophy,
  Check, X, Flame, Heart, Mic, MicOff, LogOut, Share2, BookOpen, Lock, Timer, Zap, Plus
} from "lucide-react";
import { DailyGoalRing, ScreenHeader, Sheet, BrandMark } from "./UIHelpers";
import { displayTitle } from "../utils/text";
import { Shanyraq, OrnamentBand, Tumar, SteppeBackground, KilimStrip, QoshqarMuyiz } from "./Ornaments";
import { safePlayVoice } from "../utils/voice";
import {
  BG_VIDEO_ASSETS, STORIES, LEVEL_DETAILS, WORD_TRANSLATIONS, ACHIEVEMENTS
} from "../constants";
import type { SavedWord } from "../types";
import { supabase } from "../lib/supabase";

/* Small video tile with a night-sky fallback. */
function StoryVideo({ src, className = "", videoRef, paused }: { src: string; className?: string; videoRef?: React.Ref<HTMLVideoElement>; paused?: boolean }) {
  const [error, setError] = useState(false);
  return (
    <div className={`overflow-hidden bg-night ${className}`}>
      {!error ? (
        <video
          ref={videoRef}
          autoPlay={!paused} loop muted playsInline
          src={src}
          onError={() => setError(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-night-2 to-night">
          <Shanyraq className="w-14 h-14 text-white/25" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

const LEVEL_COLORS: Record<string, { bg: string; edge: string; soft: string }> = {
  A1: { bg: "bg-jade", edge: "shadow-[0_4px_0_var(--color-jade-deep)]", soft: "text-jade-deep" },
  A2: { bg: "bg-sky", edge: "shadow-[0_4px_0_var(--color-sky-deep)]", soft: "text-sky-deep" },
  B1: { bg: "bg-sun", edge: "shadow-[0_4px_0_var(--color-sun-deep)]", soft: "text-sun-deep" },
  B2: { bg: "bg-felt", edge: "shadow-[0_4px_0_var(--color-felt-deep)]", soft: "text-felt-deep" },
  C1: { bg: "bg-night", edge: "shadow-[0_4px_0_#121a31]", soft: "text-night" },
};

/* --- 1. INTRO SCREEN --- */
export function IntroScreen({ onFinish, t }: any) {
  return (
    <div className="relative min-h-dvh w-full bg-sand flex flex-col overflow-hidden">
      <SteppeBackground />
      <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full z-[1]" />

      <div className="relative z-10 flex flex-col flex-1 px-6 pt-[max(env(safe-area-inset-top),28px)] pb-[max(env(safe-area-inset-bottom),24px)] mx-auto w-full max-w-[440px]">
        <div className="flex justify-between items-center">
          <BrandMark />
          <button onClick={onFinish} className="text-sm font-semibold text-ink-2 hover:text-ink px-2 min-h-[44px]">
            {t.skip}
          </button>
        </div>

        <div className="my-auto py-10 text-center animate-pop-in">
          <div className="relative mx-auto w-[220px] h-[220px] mb-9">
            <div className="absolute inset-0 rounded-full bg-sun-soft" />
            <div className="absolute inset-5 rounded-full bg-sky shadow-[0_8px_0_var(--color-sky-deep)] flex items-center justify-center animate-float">
              <Shanyraq className="w-28 h-28 text-white" strokeWidth={3.2} />
            </div>
            <QoshqarMuyiz className="absolute -left-3 top-6 w-14 h-8 text-felt -rotate-[18deg]" strokeWidth={4.5} />
            <QoshqarMuyiz className="absolute -right-3 bottom-8 w-14 h-8 text-jade rotate-[160deg]" strokeWidth={4.5} />
            <Tumar className="absolute right-3 top-2 w-7 h-7 text-sun-deep" strokeWidth={3} />
          </div>

          <h1 className="font-display font-black text-[40px] leading-[1.05] tracking-tight text-ink">
            Dala añyzdary<br />
            <span className="text-sky">ağylşyn tilinde</span>
          </h1>
          <p className="text-[17px] text-ink-2 max-w-[320px] mx-auto leading-relaxed mt-4">
            {t.homeSubtitle}
          </p>
        </div>

        <button onClick={onFinish} className="btn w-full">
          {t.enter} <ArrowRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

/* --- 2. HOME SCREEN: greeting, daily goal, and the caravan path --- */
type PathNode =
  | { kind: "read"; storyId: string; title: string }
  | { kind: "quiz"; storyId: string; title: string }
  | { kind: "locked" }
  | { kind: "chest" };

const PATH_OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52];

export function HomeScreen({ onStartRead, onStartQuiz, t, lang, userName = "", sessionXp = 0, dailyGoal = 50 }: any) {
  const featured = STORIES[0];
  const totalPlanned = 10;
  const lockedCount = Math.min(3, totalPlanned - STORIES.length);

  const nodes: PathNode[] = [
    ...STORIES.flatMap((s): PathNode[] => [
      { kind: "read", storyId: s.id, title: s.title },
      { kind: "quiz", storyId: s.id, title: s.title },
    ]),
    ...Array.from({ length: lockedCount }, (): PathNode => ({ kind: "locked" })),
    { kind: "chest" },
  ];

  const firstName = (userName || "").split(/[\s@]/)[0];

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="pt-2">
        <p className="eyebrow mb-1">{lang === "kk" ? "Bügin" : "Today"}</p>
        <h1 className="large-title">{lang === "kk" ? "Sälem" : "Hi"}{firstName ? `, ${firstName}` : ""}!</h1>
        <p className="text-[15px] text-ink-2 mt-2 leading-relaxed">{t.homeSubtitle}</p>
      </div>

      {/* Daily goal — on wide screens this lives in the right rail */}
      <div className="card p-4 flex items-center gap-4 xl:hidden">
        <DailyGoalRing current={sessionXp} goal={dailyGoal} size={60} />
        <div className="flex-1 min-w-0">
          <p className="font-display font-extrabold text-ink text-[17px]">{lang === "kk" ? "Kündelikti maqsat" : "Daily goal"}</p>
          <p className="text-sm text-ink-2">
            {sessionXp >= dailyGoal
              ? (lang === "kk" ? "Orındaldy! Jaraısyñ." : "Done for today. Nice work!")
              : `${dailyGoal - sessionXp} XP ${lang === "kk" ? "qaldy" : "to go"}`}
          </p>
        </div>
      </div>

      {/* Continue card */}
      <button
        onClick={() => onStartRead(featured.id)}
        className="group relative w-full text-left rounded-[28px] overflow-hidden bg-night shadow-[0_6px_0_#121a31] active:translate-y-[3px] active:shadow-[0_3px_0_#121a31] transition-transform"
      >
        <StoryVideo src={BG_VIDEO_ASSETS.read} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/70 to-night/10" />
        <OrnamentBand className="absolute top-3 inset-x-0 h-3 w-full text-white/15" />
        <div className="relative p-5 pt-24">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/15 backdrop-blur text-white text-xs font-bold">
            <BookOpen size={13} /> {displayTitle(featured.sceneLabel)}
          </span>
          <h2 className="font-display font-black text-white text-2xl leading-tight mt-3">{displayTitle(featured.title)}</h2>
          <p className="text-white/75 text-sm mt-1.5 line-clamp-2">{featured.storyDesc[lang as "en" | "kk"] || featured.storyDesc.en}</p>
          <span className="btn btn-sun btn-sm mt-4 pointer-events-none">
            <Play size={15} className="fill-ink" /> {t.startReading}
          </span>
        </div>
      </button>

      {/* Unit banner */}
      <div className="relative rounded-[22px] bg-sky text-white px-5 py-4 overflow-hidden shadow-[0_4px_0_var(--color-sky-deep)]">
        <OrnamentBand className="absolute -bottom-0.5 inset-x-0 h-4 w-full text-white/20" />
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/80">{lang === "kk" ? "1-bölim" : "Unit 1"}</p>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display font-black text-xl">{t.collectionTitle}</h3>
          <span className="text-sm font-bold bg-white/20 rounded-full px-3 h-7 flex items-center shrink-0">{STORIES.length}/{totalPlanned}</span>
        </div>
      </div>

      {/* Caravan path */}
      <div className="relative flex flex-col items-center gap-5 pt-16 pb-4">
        {nodes.map((n, i) => {
          const x = PATH_OFFSETS[i % PATH_OFFSETS.length];
          const isFirst = i === 0;
          let body: React.ReactNode;
          if (n.kind === "read" || n.kind === "quiz") {
            const read = n.kind === "read";
            body = (
              <button
                onClick={() => (read ? onStartRead(n.storyId) : onStartQuiz(n.storyId))}
                aria-label={`${read ? t.startReading : t.takeQuiz}: ${displayTitle(n.title)}`}
                className={`relative w-[76px] h-[70px] rounded-[50%] flex items-center justify-center text-white transition-transform active:translate-y-[5px] ${
                  read
                    ? "bg-sky shadow-[0_7px_0_var(--color-sky-deep)] active:shadow-[0_2px_0_var(--color-sky-deep)]"
                    : "bg-sun shadow-[0_7px_0_var(--color-sun-deep)] active:shadow-[0_2px_0_var(--color-sun-deep)]"
                }`}
              >
                {read ? <BookOpen size={30} strokeWidth={2.6} /> : <Trophy size={30} strokeWidth={2.6} className="text-ink" />}
              </button>
            );
          } else if (n.kind === "locked") {
            body = (
              <div aria-label={lang === "kk" ? "Jaqynda" : "Coming soon"} className="w-[76px] h-[70px] rounded-[50%] bg-sand-3 shadow-[0_7px_0_var(--color-line-2)] flex items-center justify-center text-ink-3">
                <Lock size={26} strokeWidth={2.6} />
              </div>
            );
          } else {
            body = (
              <div aria-label={lang === "kk" ? "Mūra sandyğy" : "Heritage chest"} className="w-[88px] h-[76px] rounded-[22px] bg-sand-3 shadow-[0_7px_0_var(--color-line-2)] flex items-center justify-center text-ink-3">
                <Tumar className="w-10 h-10" strokeWidth={3} />
              </div>
            );
          }
          return (
            <div key={i} className="relative" style={{ transform: `translateX(${x}px)` }}>
              {isFirst && (
                <span className="absolute -top-12 left-1/2 animate-bob whitespace-nowrap rounded-xl bg-card border-2 border-line px-3 py-1.5 font-display font-black text-sm text-sky uppercase tracking-wide">
                  {lang === "kk" ? "Bastau" : "Start"}
                  <span className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-r-2 border-b-2 border-line" />
                </span>
              )}
              {body}
            </div>
          );
        })}
        {lockedCount > 0 && (
          <p className="text-sm text-ink-3 font-semibold pt-2">
            {lang === "kk" ? `Taǵy ${totalPlanned - STORIES.length} añyz jaqynda` : `${totalPlanned - STORIES.length} more tales coming soon`}
          </p>
        )}
      </div>
    </div>
  );
}

/* --- 3. READER SCREEN --- */
export function ReaderScreen({ selectedStory, setSelectedStory, selectedLevel, setSelectedLevel, onQuizGate, t, lang = "kk", onReward, savedWords, onSaveWord }: any) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState("");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isReadAlongPlaying, setIsReadAlongPlaying] = useState(false);
  const [readAlongTokenIndex, setReadAlongTokenIndex] = useState<number | null>(null);
  const isPlayingRef = useRef(false);
  const wordRefs = useRef<Record<number, HTMLElement | null>>({});

  const READ_SPEEDS = [
    { key: "slow", label: "0.5×", rate: 0.5 },
    { key: "normal", label: "0.65×", rate: 0.65 },
    { key: "fast", label: "0.85×", rate: 0.85 },
    { key: "fluent", label: "1×", rate: 1 },
  ];
  const [readSpeed, setReadSpeed] = useState(0.65);
  const readSpeedRef = useRef(0.65);
  useEffect(() => {
    readSpeedRef.current = readSpeed;
  }, [readSpeed]);

  useEffect(() => {
    if (readAlongTokenIndex !== null && wordRefs.current[readAlongTokenIndex]) {
      wordRefs.current[readAlongTokenIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [readAlongTokenIndex]);

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      try { window.speechSynthesis.cancel(); } catch { }
    };
  }, [selectedLevel]);

  if (!selectedStory) {
    return (
      <div className="animate-pop-in">
        <ScreenHeader eyebrow={lang === "kk" ? "Kitaphana" : "Library"} title={t.selectStoryTitle} />
        <p className="text-[15px] text-ink-2 -mt-2 mb-4">{t.selectStorySub}</p>

        <div className="card overflow-hidden divide-y divide-line">
          {STORIES.map((story: any) => (
            <button
              key={story.id}
              onClick={() => setSelectedStory(story.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-sand/60 transition-colors"
            >
              <StoryVideo src={BG_VIDEO_ASSETS.read} paused className="relative w-[72px] h-[72px] rounded-2xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="eyebrow text-[11px] text-sky-deep">{displayTitle(story.sceneLabel)}</p>
                <h3 className="font-display font-extrabold text-[17px] text-ink leading-snug mt-0.5">{displayTitle(story.title)}</h3>
                <p className="text-sm text-ink-2 line-clamp-1 mt-0.5">{story.storyDesc[lang] || story.storyDesc.en}</p>
              </div>
              <ChevronRight size={20} className="text-ink-3 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentStory = STORIES.find((s: any) => s.id === selectedStory) || STORIES[0];

  if (!selectedLevel) {
    return (
      <div className="animate-pop-in">
        <ScreenHeader
          onBack={() => setSelectedStory(null)}
          backLabel={lang === "kk" ? "Añyzdar" : "Stories"}
          eyebrow={displayTitle(currentStory.title)}
          title={t.selectLevelTitle}
        />
        <p className="text-[15px] text-ink-2 -mt-2 mb-5">{t.selectLevelSub}</p>

        <div className="space-y-3">
          {LEVEL_DETAILS.map((lvl) => {
            const c = LEVEL_COLORS[lvl.id];
            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className="tile w-full flex items-center gap-4 p-3.5 text-left hover:border-sky/50"
              >
                <span className={`w-14 h-14 rounded-2xl ${c.bg} ${c.edge} flex items-center justify-center font-display font-black text-xl text-white shrink-0`}>
                  {lvl.badge}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-extrabold text-[17px] text-ink">{lvl.title}</h3>
                  <p className="text-sm text-ink-2 leading-snug">{lvl.desc}</p>
                </div>
                <ChevronRight size={20} className="text-ink-3 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const text = currentStory.levels[selectedLevel as keyof typeof currentStory.levels];
  const tokens = text.split(/(\s+)/);
  const wordIndices = tokens.reduce((acc: number[], tok: string, i: number) => {
    if (/[a-zA-Z]/.test(tok)) acc.push(i);
    return acc;
  }, [] as number[]);

  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    setActiveWord(word);
    setTranslation(WORD_TRANSLATIONS[cleanWord as keyof typeof WORD_TRANSLATIONS] || "Аудармасы әзірге жоқ");
    safePlayVoice(word);
  };

  const speakWordAt = (pos: number) => {
    if (!isPlayingRef.current) return;
    if (pos >= wordIndices.length) {
      isPlayingRef.current = false;
      setIsReadAlongPlaying(false);
      return;
    }
    const tokenIdx = wordIndices[pos];
    setReadAlongTokenIndex(tokenIdx);
    const word = tokens[tokenIdx];
    const rate = readSpeedRef.current;

    const fallbackAdvance = () => {
      if (isPlayingRef.current) setTimeout(() => speakWordAt(pos + 1), Math.max(280, word.length * 90) / rate);
    };
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(word);
        utter.rate = rate;
        utter.pitch = 0.6;
        utter.lang = "en-US";
        utter.onend = () => {
          if (isPlayingRef.current) setTimeout(() => speakWordAt(pos + 1), 150 / rate);
        };
        utter.onerror = fallbackAdvance;
        window.speechSynthesis.speak(utter);
      } else {
        fallbackAdvance();
      }
    } catch {
      fallbackAdvance();
    }
  };

  const handleToggleReadAlong = () => {
    if (isReadAlongPlaying) {
      isPlayingRef.current = false;
      setIsReadAlongPlaying(false);
      try { window.speechSynthesis.cancel(); } catch { }
    } else {
      isPlayingRef.current = true;
      setIsReadAlongPlaying(true);
      let startPos = 0;
      if (readAlongTokenIndex !== null) {
        const idx = wordIndices.indexOf(readAlongTokenIndex);
        startPos = idx >= 0 && idx < wordIndices.length - 1 ? idx + 1 : 0;
      }
      speakWordAt(startPos);
    }
  };

  const handleRestartReadAlong = () => {
    isPlayingRef.current = false;
    try { window.speechSynthesis.cancel(); } catch { }
    setReadAlongTokenIndex(null);
    setIsReadAlongPlaying(false);
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const cleanActive = activeWord ? activeWord.replace(/[^a-zA-Z]/g, "").toLowerCase() : "";
  const alreadySaved = !!activeWord && savedWords && savedWords.some((w: any) => w.word === cleanActive);
  const levelColor = LEVEL_COLORS[selectedLevel] || LEVEL_COLORS.A1;

  return (
    <div className="space-y-4 animate-pop-in relative">
      <ScreenHeader
        onBack={() => setSelectedLevel(null)}
        backLabel={t.changeLevel}
        eyebrow={displayTitle(currentStory.sceneLabel)}
        title={displayTitle(currentStory.title)}
        trailing={
          <span className={`shrink-0 w-12 h-12 rounded-2xl ${levelColor.bg} ${levelColor.edge} flex items-center justify-center font-display font-black text-white`}>
            {selectedLevel}
          </span>
        }
      />

      <div className="relative rounded-[24px] overflow-hidden h-48 sm:h-56">
        <StoryVideo src={BG_VIDEO_ASSETS.read} videoRef={videoRef} className="absolute inset-0" />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 h-7 px-3 rounded-full glass text-ink text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-felt animate-pulse" /> {t.sceneAnimation}
        </span>
        <button
          onClick={toggleVideo}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full glass text-ink flex items-center justify-center"
        >
          {isPlaying ? <Pause size={18} className="fill-ink" /> : <Play size={18} className="fill-ink" />}
        </button>
      </div>

      {/* Read-along player (Apple Music mini player) */}
      <div className="card p-3.5 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleReadAlong}
            aria-label={isReadAlongPlaying ? "Pause read-along" : "Start read-along"}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform active:translate-y-[3px] ${
              isReadAlongPlaying
                ? "bg-felt text-white shadow-[0_3px_0_var(--color-felt-deep)] active:shadow-none"
                : "bg-sun text-ink shadow-[0_3px_0_var(--color-sun-deep)] active:shadow-none"
            }`}
          >
            {isReadAlongPlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-ink ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-display font-extrabold text-ink text-[15px]">Read along</p>
            <p className="text-sm text-ink-2 truncate">
              {readAlongTokenIndex !== null ? <>Now: <b className="text-ink">{tokens[readAlongTokenIndex]}</b></> : t.tapWordHint}
            </p>
          </div>
          {readAlongTokenIndex !== null && (
            <button onClick={handleRestartReadAlong} aria-label="Restart" className="w-10 h-10 rounded-full flex items-center justify-center text-ink-2 hover:bg-sand-2">
              <RotateCcw size={18} />
            </button>
          )}
        </div>
        <div className="segmented" role="group" aria-label="Speed">
          {READ_SPEEDS.map((s) => (
            <button key={s.key} aria-pressed={readSpeed === s.rate} onClick={() => setReadSpeed(s.rate)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Story text */}
      <div className="card p-5 sm:p-7 max-h-[440px] overflow-y-auto">
        <p className="text-[18px] text-ink leading-[1.9]">
          {tokens.map((tok: string, i: number) => {
            const isWord = /[a-zA-Z]/.test(tok);
            if (!isWord) return <span key={i}>{tok}</span>;
            const isCurrentlyRead = i === readAlongTokenIndex;
            const isActive = activeWord === tok;
            return (
              <span
                key={i}
                ref={(el) => { wordRefs.current[i] = el; }}
                onClick={() => handleWordClick(tok)}
                className={`rounded-md px-0.5 -mx-0.5 cursor-pointer transition-colors duration-200 ${
                  isCurrentlyRead
                    ? "bg-sun text-ink"
                    : isActive
                    ? "bg-sky-soft text-sky-deep"
                    : "hover:bg-sky-soft decoration-ink-3/40 decoration-dotted underline underline-offset-[6px]"
                }`}
              >
                {tok}
              </span>
            );
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button onClick={() => setShowChoiceModal(true)} className="btn btn-ghost">
          <Compass size={18} strokeWidth={2.6} /> <span className="truncate">{t.interactiveChoiceTitle}</span>
        </button>
        <button onClick={onQuizGate} className="btn">
          {t.takeQuiz} <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>

      {/* Word sheet */}
      <Sheet open={!!activeWord} onClose={() => setActiveWord(null)} label="Word">
        {activeWord && (
          <div className="p-6 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">English</p>
                <h3 className="font-display font-black text-[32px] text-ink leading-tight">{cleanActive}</h3>
                <p className="text-lg text-sky-deep font-semibold mt-1">{translation}</p>
              </div>
              <button onClick={() => safePlayVoice(activeWord)} aria-label="Listen" className="w-12 h-12 rounded-full bg-sky-soft text-sky flex items-center justify-center shrink-0">
                <Volume2 size={22} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setActiveWord(null)} className="btn btn-ghost">{t.closeBuklet}</button>
              <button
                onClick={() => !alreadySaved && onSaveWord && onSaveWord(cleanActive, translation)}
                disabled={alreadySaved}
                className="btn btn-jade"
              >
                {alreadySaved ? <><Check size={18} strokeWidth={3} /> Saved</> : <><Plus size={18} strokeWidth={3} /> My words</>}
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Choice sheet */}
      <Sheet open={showChoiceModal} onClose={() => setShowChoiceModal(false)} label={t.interactiveChoiceTitle}>
        <div className="p-6 pt-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-sun-soft flex items-center justify-center shrink-0">
              <Compass size={22} className="text-sun-deep" />
            </span>
            <h3 className="font-display font-black text-xl text-ink">{t.interactiveChoiceTitle}</h3>
          </div>
          <p className="text-[15px] text-ink-2">{currentStory.choicePrompt}</p>
          <div className="space-y-2.5">
            {[{ label: currentStory.choiceOptionA, xp: 20 }, { label: currentStory.choiceOptionB, xp: 10 }].map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  setChoiceMade(true);
                  onReward(opt.xp);
                  setShowChoiceModal(false);
                }}
                className="tile w-full p-4 text-left text-[15px] font-medium text-ink hover:border-sky/50"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {choiceMade && <p className="text-sm text-jade-deep font-bold text-center">{t.artifactUnlocked}</p>}
        </div>
      </Sheet>
    </div>
  );
}

/* Words tab switcher shared by flashcards and matching. */
function WordsHeader({ mode, setMode, trailing }: { mode?: string; setMode?: (m: string) => void; trailing?: React.ReactNode }) {
  return (
    <>
      <ScreenHeader eyebrow="Vocabulary" title={mode === "match" ? "Find the pair" : "Flashcards"} trailing={trailing} />
      {setMode && (
        <div className="segmented mb-5" role="group" aria-label="Practice mode">
          <button aria-pressed={mode === "cards"} onClick={() => setMode("cards")}>Flashcards</button>
          <button aria-pressed={mode === "match"} onClick={() => setMode("match")}>Matching</button>
        </div>
      )}
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card p-8 text-center">
      <span className="mx-auto w-16 h-16 rounded-full bg-sky-soft flex items-center justify-center">
        <Layers className="text-sky" size={28} />
      </span>
      <p className="text-[15px] text-ink-2 leading-relaxed mt-4 max-w-[280px] mx-auto">{text}</p>
    </div>
  );
}

/* --- 3.5 FLASHCARDS SCREEN --- */
export function FlashcardsScreen({ savedWords, onReward, mode, setMode }: { savedWords: SavedWord[]; onReward: (xp: number) => void; mode?: string; setMode?: (m: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!savedWords || savedWords.length === 0) {
    return (
      <div className="animate-pop-in">
        <WordsHeader mode={mode} setMode={setMode} />
        <EmptyState text="No words saved yet. Tap any word while reading a story to save it here." />
      </div>
    );
  }

  const currentWord = savedWords[currentIndex % savedWords.length];

  const handleNext = (known: boolean) => {
    if (known) onReward(2);
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % savedWords.length);
  };

  return (
    <div className="animate-pop-in">
      <WordsHeader mode={mode} setMode={setMode} trailing={<span className="chip text-ink-2">{currentIndex + 1} / {savedWords.length}</span>} />

      <div className="track mb-5"><span style={{ width: `${((currentIndex + 1) / savedWords.length) * 100}%` }} /></div>

      <button
        onClick={() => {
          setFlipped(!flipped);
          safePlayVoice(currentWord.word);
        }}
        aria-label="Flip card"
        className="flip block w-full h-[280px]"
      >
        <div className={`flip-inner w-full h-full ${flipped ? "is-flipped" : ""}`}>
          <div className="flip-face card overflow-hidden flex flex-col items-center justify-center p-6">
            <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full" />
            <span className="eyebrow">English</span>
            <span className="font-display font-black text-[40px] text-ink mt-2">{currentWord.word}</span>
            <span className="mt-6 text-sm text-ink-3 flex items-center gap-1.5"><Volume2 size={15} /> Tap to flip</span>
          </div>
          <div className="flip-face flip-back rounded-[24px] bg-sky shadow-[0_6px_0_var(--color-sky-deep)] flex flex-col items-center justify-center p-6 text-white">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-white/75">Qazaqşa</span>
            <span className="font-display font-black text-[32px] mt-2 text-center">{currentWord.translation}</span>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3 mt-7">
        <button onClick={() => handleNext(false)} className="btn btn-ghost">Not yet</button>
        <button onClick={() => handleNext(true)} className="btn btn-jade">I knew it</button>
      </div>
    </div>
  );
}

/* --- 3.6 MATCHING GAME SCREEN --- */
export function MatchingGame({ savedWords, onReward, mode, setMode }: any) {
  const GRID_SIZE = 6;
  const [round, setRound] = useState(0);
  const [tiles, setTiles] = useState<any[]>([]);
  const [selectedTile, setSelectedTile] = useState<any>(null);
  const [matchedIds, setMatchedIds] = useState<any[]>([]);
  const [wrongPair, setWrongPair] = useState<any[]>([]);
  const [roundComplete, setRoundComplete] = useState(false);

  useEffect(() => {
    if (!savedWords || savedWords.length < 3) return;
    const shuffled = [...savedWords].sort(() => Math.random() - 0.5).slice(0, Math.min(GRID_SIZE, savedWords.length));
    const wordTiles = shuffled.map((w, i) => ({ tileId: `w-${i}`, pairId: i, text: w.word, kind: "word" }));
    const transTiles = shuffled.map((w, i) => ({ tileId: `t-${i}`, pairId: i, text: w.translation, kind: "translation" }));
    const combined = [...wordTiles, ...transTiles].sort(() => Math.random() - 0.5);
    setTiles(combined);
    setMatchedIds([]);
    setSelectedTile(null);
    setWrongPair([]);
    setRoundComplete(false);
  }, [round, savedWords]);

  const handleTileTap = (tile: any) => {
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
      onReward(4);
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
        <EmptyState text="Save at least 3 words while reading to unlock the matching game." />
      </div>
    );
  }

  if (roundComplete) {
    return (
      <div className="animate-pop-in">
        <WordsHeader mode={mode} setMode={setMode} />
        <div className="card p-8 text-center">
          <span className="mx-auto w-20 h-20 rounded-full bg-sun flex items-center justify-center shadow-[0_5px_0_var(--color-sun-deep)]">
            <Trophy className="text-ink" size={36} />
          </span>
          <p className="font-display font-black text-2xl text-ink mt-5">All matched!</p>
          <p className="text-[15px] text-ink-2 mt-1">Great recognition speed.</p>
          <button onClick={() => setRound((r) => r + 1)} className="btn w-full mt-6">Next round</button>
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

/* --- 6. QUIZ SCREEN --- */
export function QuizScreen({ onReward, t, onQuizFinish, questions, storyTitle }: {
  onReward: (xp: number) => void;
  t: Record<string, string>;
  onQuizFinish?: (correct: number, total: number) => void;
  questions: { type?: string; q?: string; sentence?: string; options: string[]; correct: number }[];
  storyTitle?: string;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const MAX_HEARTS = 3;
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [outOfHearts, setOutOfHearts] = useState(false);

  const QUESTION_TIME = 15;
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [timedOut, setTimedOut] = useState(false);

  const question = questions[qIndex];

  const handleCheck = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === question.correct) {
      const speedBonus = Math.max(0, Math.round((timeLeft / QUESTION_TIME) * 5));
      onReward(10 + speedBonus);
      setCorrectCount((c) => c + 1);
    } else {
      setHearts((h) => {
        const next = Math.max(h - 1, 0);
        if (next === 0) setOutOfHearts(true);
        return next;
      });
    }
  };

  const handleTimeout = () => {
    if (submitted) return;
    setSubmitted(true);
    setTimedOut(true);
    setHearts((h) => {
      const next = Math.max(h - 1, 0);
      if (next === 0) setOutOfHearts(true);
      return next;
    });
  };

  const handleNext = () => {
    if (outOfHearts) return;
    if (qIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setQIndex(qIndex + 1);
      setSelected(null);
      setSubmitted(false);
      setTimedOut(false);
      setTimeLeft(QUESTION_TIME);
    }
  };

  const handleRestart = () => {
    setQIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrectCount(0);
    setFinished(false);
    setHearts(MAX_HEARTS);
    setOutOfHearts(false);
    setTimedOut(false);
    setTimeLeft(QUESTION_TIME);
  };

  useEffect(() => {
    if (submitted || finished || outOfHearts) return;
    if (timeLeft <= 0) { handleTimeout(); return; }
    const id = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted, finished, outOfHearts]);

  useEffect(() => {
    if (finished && onQuizFinish) onQuizFinish(correctCount, questions.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const heartsChip = (
    <span className="chip text-felt border-transparent bg-transparent px-0" aria-label={`${hearts} hearts`}>
      <Heart size={22} className={hearts > 0 ? "fill-felt" : "text-ink-3"} /> {hearts}
    </span>
  );

  if (outOfHearts) {
    return (
      <div className="animate-pop-in">
        <ScreenHeader eyebrow={storyTitle ? displayTitle(storyTitle) : undefined} title={t.quizTitle} />
        <div className="card p-8 text-center">
          <span className="mx-auto w-20 h-20 rounded-full bg-felt-soft flex items-center justify-center">
            <Heart className="text-felt" size={38} />
          </span>
          <p className="font-display font-black text-2xl text-ink mt-5">Out of hearts</p>
          <p className="text-[15px] text-ink-2 mt-2 leading-relaxed">
            Re-read the story to refresh your memory, then try again from the start.
          </p>
          <button onClick={handleRestart} className="btn btn-felt w-full mt-6">Restart quiz</button>
        </div>
      </div>
    );
  }

  if (finished) {
    const passed = correctCount >= Math.ceil(questions.length * 0.6);
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="animate-pop-in">
        <div className="text-center pt-6">
          <span className={`mx-auto w-28 h-28 rounded-full flex items-center justify-center ${passed ? "bg-sun shadow-[0_6px_0_var(--color-sun-deep)]" : "bg-sand-3 shadow-[0_6px_0_var(--color-line-2)]"}`}>
            <Trophy className={passed ? "text-ink" : "text-ink-3"} size={52} />
          </span>
          <h2 className="large-title mt-6">{passed ? "Lesson complete!" : "Almost there"}</h2>
          <p className="text-[15px] text-ink-2 mt-2 max-w-[320px] mx-auto">
            {passed ? "Great comprehension! You understood the story well." : "Re-read the story and try again — comprehension takes practice."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-7">
          {[
            { label: "Correct", value: `${correctCount}/${questions.length}`, color: "border-sky text-sky-deep", head: "bg-sky" },
            { label: "Accuracy", value: `${accuracy}%`, color: "border-jade text-jade-deep", head: "bg-jade" },
            { label: "Hearts", value: `${hearts}`, color: "border-felt text-felt-deep", head: "bg-felt" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border-2 overflow-hidden ${s.color}`}>
              <p className={`${s.head} text-white text-xs font-bold uppercase tracking-[0.06em] py-1 text-center`}>{s.label}</p>
              <p className="font-display font-black text-xl text-center py-3 bg-card">{s.value}</p>
            </div>
          ))}
        </div>
        <button onClick={handleRestart} className="btn w-full mt-7">{t.tryAgain}</button>
      </div>
    );
  }

  const isCorrect = submitted && !timedOut && selected === question.correct;

  return (
    <div className="animate-pop-in">
      {/* Progress + hearts */}
      <div className="flex items-center gap-4 pt-2">
        <div className="track flex-1"><span style={{ width: `${((qIndex + (submitted ? 1 : 0)) / questions.length) * 100}%` }} /></div>
        {heartsChip}
      </div>

      <div className="flex items-center justify-between mt-5">
        <p className="eyebrow">{storyTitle ? displayTitle(storyTitle) : t.quizTitle}</p>
        <span className={`chip h-7 text-[13px] ${timeLeft <= 5 ? "text-felt border-felt/40 bg-felt-soft" : "text-ink-2"}`}>
          <Timer size={14} /> {Math.max(0, timeLeft)}s
        </span>
      </div>

      <div className="mt-3 mb-6">
        {question.type === "fillblank" ? (
          <>
            <h2 className="font-display font-black text-[22px] text-ink">Fill in the blank</h2>
            <p className="text-[18px] text-ink leading-relaxed mt-3">
              {(question.sentence || "").split("___")[0]}
              <span className="inline-block min-w-[72px] border-b-[3px] border-sky mx-1 text-center text-sky-deep font-bold">
                {selected !== null ? question.options[selected] : " "}
              </span>
              {(question.sentence || "").split("___")[1]}
            </p>
          </>
        ) : (
          <h2 className="font-display font-black text-[22px] leading-snug text-ink">{question.q}</h2>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((opt: string, idx: number) => {
          let state = "text-ink hover:border-sky/40";
          let anim = "";
          if (selected === idx) state = "tile-selected";
          if (submitted) {
            if (idx === question.correct) {
              state = "tile-correct";
              anim = "animate-answer-correct";
            } else if (selected === idx) {
              state = "tile-wrong";
              anim = "animate-answer-wrong";
            } else {
              state = "text-ink-3";
            }
          }
          return (
            <button
              key={idx}
              disabled={submitted}
              onClick={() => setSelected(idx)}
              className={`tile w-full text-left p-3.5 flex items-center gap-3.5 ${state} ${anim}`}
            >
              <span className="w-8 h-8 rounded-lg border-2 border-current/25 flex items-center justify-center font-display font-black text-sm shrink-0 opacity-70">
                {idx + 1}
              </span>
              <span className="flex-1 text-[16px] font-semibold">{opt}</span>
              {submitted && idx === question.correct && <Check size={20} strokeWidth={3} className="text-jade" />}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button onClick={handleCheck} disabled={selected === null} className="btn w-full mt-7">
          {t.checkAnswer}
        </button>
      ) : (
        <div className={`mt-7 rounded-[24px] p-5 animate-pop-in ${isCorrect ? "bg-jade-soft" : "bg-felt-soft"}`}>
          <div className="flex items-center gap-3">
            <span className={`w-11 h-11 rounded-full bg-card flex items-center justify-center shrink-0 ${isCorrect ? "text-jade" : "text-felt"}`}>
              {isCorrect ? <Check size={24} strokeWidth={3.5} /> : <X size={24} strokeWidth={3.5} />}
            </span>
            <div className="min-w-0">
              <p className={`font-display font-black text-xl ${isCorrect ? "text-jade-deep" : "text-felt-deep"}`}>
                {timedOut ? "Time's up" : isCorrect ? t.correctMsg : t.wrongMsg}
              </p>
              {!isCorrect && (
                <p className="text-[15px] text-felt-deep font-semibold">{question.options[question.correct]}</p>
              )}
            </div>
          </div>
          <button onClick={handleNext} className={`btn w-full mt-4 ${isCorrect ? "btn-jade" : "btn-felt"}`}>
            {qIndex + 1 >= questions.length ? "See results" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

/* Score ring for pronunciation results. */
function ScoreRing({ value, size = 120 }: { value: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "var(--color-jade)" : value >= 60 ? "var(--color-sun)" : "var(--color-felt)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-sand-2)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display font-black text-3xl text-ink">{value}</span>
    </div>
  );
}

/* --- 7. SPEAK SCREEN --- */
export function SpeakScreen({ onReward, t }: {
  onReward: (xp: number) => void;
  t: Record<string, string>;
}) {
  const [recording, setRecording] = useState(false);
  const [scores, setScores] = useState<{
    accuracy: number;
    fluency: number;
    completeness: number;
    pronunciation: number;
  } | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognizerRef = useRef<{ stopContinuousRecognitionAsync?: () => void; close?: () => void } | null>(null);

  const targetPhrase = "He is renowned across the steppe for his sharp wit.";

  const toggleRecord = async () => {
    if (recording) {
      try {
        recognizerRef.current?.stopContinuousRecognitionAsync?.();
      } catch {
        // ignore
      }
      return;
    }

    setSpeechError(null);
    setScores(null);
    setTranscript("");

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const tokenRes = await fetch("/api/azure-token", {
        headers: { Authorization: `Bearer ${s?.access_token ?? ""}` },
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData?.error || "Couldn't reach the pronunciation service.");

      // Loaded lazily so the ~2MB SDK only downloads once someone actually
      // opens this screen, not as part of the app's main bundle.
      const SpeechSDK = await import("microsoft-cognitiveservices-speech-sdk");

      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(tokenData.token, tokenData.region);
      speechConfig.speechRecognitionLanguage = "en-US";

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

      const pronunciationConfig = new SpeechSDK.PronunciationAssessmentConfig(
        targetPhrase,
        SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
        SpeechSDK.PronunciationAssessmentGranularity.Word,
        true
      );

      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      pronunciationConfig.applyTo(recognizer);
      recognizerRef.current = recognizer;
      setRecording(true);

      recognizer.recognizeOnceAsync(
        (result: { reason: number; text: string }) => {
          setRecording(false);
          if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const assessment = SpeechSDK.PronunciationAssessmentResult.fromResult(result as Parameters<typeof SpeechSDK.PronunciationAssessmentResult.fromResult>[0]);
            setTranscript(result.text);
            const next = {
              accuracy: Math.round(assessment.accuracyScore),
              fluency: Math.round(assessment.fluencyScore),
              completeness: Math.round(assessment.completenessScore),
              pronunciation: Math.round(assessment.pronunciationScore),
            };
            setScores(next);
            if (next.pronunciation >= 50) onReward(Math.round(5 + (next.pronunciation / 100) * 15));
          } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
            setSpeechError("Didn't catch that — try speaking a bit louder and closer to the mic.");
          } else {
            setSpeechError("Something went wrong with speech recognition. Please try again.");
          }
          recognizer.close();
        },
        () => {
          setRecording(false);
          setSpeechError("Something went wrong reaching the speech service. Please try again.");
          recognizer.close();
        }
      );
    } catch (err: unknown) {
      setRecording(false);
      setSpeechError((err instanceof Error ? err.message : null) || "Couldn't start pronunciation practice — check your microphone permissions.");
    }
  };

  useEffect(() => {
    return () => {
      try {
        recognizerRef.current?.close?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const overallScore = scores?.pronunciation ?? null;

  const feedbackMessage =
    overallScore === null
      ? ""
      : overallScore >= 90
      ? t.greatIntonation
      : overallScore >= 70
      ? "Good — close to the target. Listen again and try once more."
      : "Keep practicing — tap the speaker to hear it again, then try to match it closely.";

  return (
    <div className="animate-pop-in">
      <ScreenHeader eyebrow="Pronunciation" title={t.speakTitle} />

      <div className="card p-6">
        <p className="eyebrow">{t.speakSubtitle}</p>
        <div className="flex items-start gap-4 mt-3">
          <p className="flex-1 font-display font-extrabold text-[22px] leading-snug text-ink">“{targetPhrase}”</p>
          <button onClick={() => safePlayVoice(targetPhrase)} aria-label="Listen" className="w-12 h-12 rounded-full bg-sky-soft text-sky flex items-center justify-center shrink-0">
            <Volume2 size={22} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-10">
        <div className="relative">
          {recording && <span className="absolute inset-0 rounded-full bg-felt/30 animate-ping" />}
          <button
            onClick={toggleRecord}
            aria-label={recording ? "Stop recording" : "Start recording"}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center text-white transition-transform active:translate-y-[5px] ${
              recording
                ? "bg-felt shadow-[0_7px_0_var(--color-felt-deep)] active:shadow-[0_2px_0_var(--color-felt-deep)]"
                : "bg-sky shadow-[0_7px_0_var(--color-sky-deep)] active:shadow-[0_2px_0_var(--color-sky-deep)]"
            }`}
          >
            {recording ? <MicOff size={44} /> : <Mic size={44} />}
          </button>
        </div>
        <span className="mt-5 text-[15px] font-semibold text-ink-2">{recording ? t.recording : t.pressMic}</span>
      </div>

      {speechError && (
        <div className="rounded-2xl bg-felt-soft text-felt-deep p-4 text-sm font-medium text-center animate-pop-in">
          {speechError}
        </div>
      )}

      {scores !== null && (
        <div className="card p-6 animate-pop-in">
          <div className="flex items-center gap-5">
            <ScoreRing value={scores.pronunciation} />
            <div className="flex-1 space-y-3">
              {[
                { label: "Accuracy", v: scores.accuracy },
                { label: "Fluency", v: scores.fluency },
                { label: "Completeness", v: scores.completeness },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm"><span className="text-ink-2">{m.label}</span><b className="text-ink">{m.v}</b></div>
                  <div className="track h-2 mt-1"><span style={{ width: `${m.v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          {transcript && <p className="text-sm text-ink-2 italic mt-5">You said: “{transcript}”</p>}
          <p className="text-[15px] text-ink mt-2">{feedbackMessage}</p>
        </div>
      )}
    </div>
  );
}

/* --- 8. PROFILE SCREEN --- */
export function ProfileScreen({ xp, t, lang = "kk", setLang, savedWordsCount = 0, unlockedAchievements = [], userName = "Learner", onSignOut, streakDays = 0, quizzesCompleted = 0 }: {
  xp: number;
  t: Record<string, string>;
  lang?: string;
  setLang?: (l: string) => void;
  savedWordsCount?: number;
  unlockedAchievements?: string[];
  userName?: string;
  onSignOut: () => void;
  streakDays?: number;
  quizzesCompleted?: number;
}) {
  const [showBuklet, setShowBuklet] = useState(false);
  const rank = Math.floor(xp / 100);
  const initial = (userName || "?").trim().charAt(0).toUpperCase();

  const stats = [
    { label: t.streakLabel, value: streakDays, Icon: Flame, cls: "text-felt fill-felt" },
    { label: t.totalXpLabel, value: xp, Icon: Zap, cls: "text-sun-deep fill-sun" },
    { label: lang === "kk" ? "Sözder" : "Words", value: savedWordsCount, Icon: Layers, cls: "text-sky" },
    { label: lang === "kk" ? "Synaqtar" : "Quizzes", value: quizzesCompleted, Icon: Trophy, cls: "text-jade" },
  ];

  const share = async () => {
    const shareText = `🏆 ${userName} is learning English through Kazakh folklore on Ertegi English!\n${xp} XP • ${streakDays}-day streak • ${unlockedAchievements.length}/${ACHIEVEMENTS.length} badges unlocked`;
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ertegi English — My Progress", text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert("Copied to clipboard — paste it anywhere to share!");
      }
    } catch {
      // AbortError: user dismissed native share sheet — not an error
    }
  };

  return (
    <div className="space-y-6 animate-pop-in">
      {/* Identity */}
      <div className="card overflow-hidden">
        <div className="relative h-20 bg-sky">
          <OrnamentBand className="absolute bottom-1 inset-x-0 h-4 w-full text-white/25" />
        </div>
        <div className="px-5 pb-5 flex items-end gap-4">
          <div className="relative w-[88px] h-[88px] shrink-0 -mt-11">
            <Shanyraq className="absolute -inset-2 w-[104px] h-[104px] text-sun" strokeWidth={2.4} />
            <div className="absolute inset-0 rounded-full bg-sun border-4 border-card flex items-center justify-center font-display font-black text-4xl text-ink">
              {initial}
            </div>
          </div>
          <div className="min-w-0 pt-3">
            <h1 className="font-display font-black text-2xl text-ink truncate">{userName}</h1>
            <p className="text-sm text-ink-2">{t.levelStatus} · Level {rank}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="font-display font-black text-xl text-ink mb-3">{lang === "kk" ? "Statistika" : "Statistics"}</h2>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, Icon, cls }) => (
            <div key={label} className="tile p-4 flex items-center gap-3">
              <Icon size={26} className={cls} />
              <div className="min-w-0">
                <p className="font-display font-black text-xl text-ink leading-none">{value}</p>
                <p className="text-[13px] text-ink-2 mt-1 truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-black text-xl text-ink">{lang === "kk" ? "Mūra artefaktilerı" : "Achievements"}</h2>
          <span className="text-sm font-bold text-ink-3">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="card p-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchievements.includes(a.id);
            return (
              <div key={a.id} title={a.desc} className="text-center">
                <span className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl ${unlocked ? "bg-sun-soft ring-[3px] ring-sun" : "bg-sand-2 grayscale opacity-50"}`}>
                  {a.icon}
                </span>
                <span className={`block text-xs font-semibold mt-2 leading-tight ${unlocked ? "text-ink" : "text-ink-3"}`}>{a.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings — Apple grouped list */}
      <div className="card overflow-hidden divide-y divide-line">
        <div className="flex items-center justify-between gap-3 px-4 min-h-[56px]">
          <span className="text-[16px] text-ink">{lang === "kk" ? "Til" : "Language"}</span>
          {setLang && (
            <div className="segmented w-[120px]" role="group" aria-label="Language">
              <button aria-pressed={lang === "kk"} onClick={() => setLang("kk")}>QAZ</button>
              <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>ENG</button>
            </div>
          )}
        </div>
        <button onClick={() => setShowBuklet(true)} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60">
          <span className="w-8 h-8 rounded-lg bg-sun flex items-center justify-center"><Share2 size={16} className="text-ink" /></span>
          <span className="flex-1 text-[16px] text-ink">{t.shareBuklet}</span>
          <ChevronRight size={18} className="text-ink-3" />
        </button>
        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60">
          <span className="w-8 h-8 rounded-lg bg-felt flex items-center justify-center"><LogOut size={16} className="text-white" /></span>
          <span className="flex-1 text-[16px] text-felt font-medium">Sign out</span>
        </button>
      </div>

      {/* Heritage booklet */}
      <Sheet open={showBuklet} onClose={() => setShowBuklet(false)} label={t.bukletHeader}>
        <div className="p-5 pt-3">
          <div className="relative rounded-[24px] bg-night text-white overflow-hidden p-6 text-center">
            <OrnamentBand className="absolute top-2 inset-x-0 h-3 w-full text-sun/40" />
            <OrnamentBand className="absolute bottom-2 inset-x-0 h-3 w-full text-sun/40 rotate-180" />
            <Shanyraq className="w-14 h-14 mx-auto text-sun mt-3" strokeWidth={3.5} />
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-sun mt-3">{t.bukletHeader}</p>
            <h3 className="font-display font-black text-2xl mt-1">{userName}</h3>
            <div className="grid grid-cols-3 gap-2 mt-5 mb-3">
              {[
                { l: "XP", v: xp },
                { l: lang === "kk" ? "Kün" : "Streak", v: streakDays },
                { l: lang === "kk" ? "Belgiler" : "Badges", v: `${unlockedAchievements.length}/${ACHIEVEMENTS.length}` },
              ].map((r) => (
                <div key={r.l} className="rounded-2xl bg-white/10 py-3">
                  <p className="font-display font-black text-xl">{r.v}</p>
                  <p className="text-[11px] text-white/70 uppercase tracking-[0.06em]">{r.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => setShowBuklet(false)} className="btn btn-ghost">{t.closeBuklet}</button>
            <button onClick={share} className="btn btn-sun"><Share2 size={18} /> {t.downloadBuklet}</button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
