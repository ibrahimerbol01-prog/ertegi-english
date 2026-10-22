import { useState, useRef, useEffect } from "react";
import {
  Sparkles, ArrowRight, Play, Video, Pause, Volume2,
  ChevronRight, ArrowLeft, X, Compass, Layers, Trophy, CheckCircle2, Flame,
  Mic, MicOff, LogOut, Share2, Download
} from "lucide-react";
import { BackgroundVideo, KazakhOrnament, DailyGoalRing } from "./UIHelpers";
import { Shanyraq, OrnamentBand, OrnamentDivider, OrnamentFrame, Tumar, SteppeBackground } from "./Ornaments";
import { safePlayVoice } from "../utils/voice";
import {
  BG_VIDEO_ASSETS, STORIES, LEVEL_DETAILS, WORD_TRANSLATIONS, ACHIEVEMENTS
} from "../constants";
import type { SavedWord } from "../types";
import { supabase } from "../lib/supabase";

/* --- 1. INTRO SCREEN --- */
export function IntroScreen({ onFinish, t }: any) {
  return (
    <div className="relative min-h-dvh w-full bg-ink flex flex-col overflow-hidden animate-pop-in">
      <SteppeBackground />
      <BackgroundVideo src={BG_VIDEO_ASSETS.intro} opacity={50} videoKey="intro-bg" />
      {/* Şañyraq watermark behind the title */}
      <div aria-hidden="true" className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
        <Shanyraq className="w-[min(120vw,560px)] h-[min(120vw,560px)] text-gold/[0.07]" strokeWidth={1.2} />
      </div>
      <OrnamentBand className="absolute top-0 inset-x-0 z-[2] h-4 w-full text-gold/40" />
      <OrnamentBand className="absolute bottom-0 inset-x-0 z-[2] h-4 w-full text-felt/70 rotate-180" />

      <div className="relative z-10 flex flex-col flex-1 justify-between px-6 py-8 mx-auto w-full max-w-[480px]">
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-2.5">
            <Shanyraq className="w-7 h-7 text-gold" strokeWidth={4} />
            <span className="font-editorial text-lg tracking-[0.2em] text-cream uppercase font-extrabold">Ertegi English</span>
          </div>
          <button
            onClick={onFinish}
            className="text-[10px] font-editorial uppercase tracking-[0.15em] text-gold hover:text-cream px-3.5 py-1.5 border border-gold/30 bg-black/50 backdrop-blur-md transition-all"
          >
            {t.skip}
          </button>
        </div>

        <div className="space-y-4 my-auto text-center px-4 animate-float">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 terracotta-badge text-[10px] tracking-[0.2em]">
            <Sparkles size={10} /> QAZAQSTAN EDTECH INITIATIVE
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl font-extrabold text-cream leading-[1.05] uppercase tracking-wide">
            DALA AÑYZDARY <br />
            <span className="text-gold drop-shadow-[0_0_20px_rgba(231,169,63,0.4)]">AĞYLŞYN TİLİNDE</span>
          </h1>
          <OrnamentDivider className="text-gold/80 max-w-[220px] mx-auto" />
          <p className="font-body text-sm text-cream/85 max-w-xs mx-auto leading-relaxed">
            {t.homeSubtitle}
          </p>
        </div>

        <div className="pb-6">
          <button
            onClick={onFinish}
            className="rounded-full w-full py-4 bg-gradient-to-r from-gold via-gold-deep to-gold hover:brightness-110 text-ink font-editorial font-extrabold text-xs tracking-[0.2em] uppercase gold-glow transition-all flex items-center justify-center gap-2"
          >
            {t.enter} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- 2. HOME SCREEN --- */
export function HomeScreen({ onStartRead, t, lang, sessionXp = 0, dailyGoal = 50 }: any) {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="relative glass-luxury-card p-6 overflow-hidden min-h-[140px]">
        <BackgroundVideo src={BG_VIDEO_ASSETS.home} opacity={35} videoKey="home-hero" />
        <OrnamentFrame className="text-gold/50 z-10" size="w-6 h-6" />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 gold-badge text-[10px]">HERITAGE · QAZAQSTAN</span>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-editorial text-xl font-bold text-cream uppercase tracking-wide">
              {t.greeting}
            </h2>
            <p className="font-body text-xs text-cream/80 mt-1 leading-relaxed">
              {t.homeSubtitle}
            </p>
          </div>
          <DailyGoalRing current={sessionXp} goal={dailyGoal} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-editorial text-sm tracking-[0.1em] text-gold uppercase">
            <Tumar className="w-3.5 h-3.5 text-felt" />
            {t.collectionTitle}
          </h3>
          <span className="text-[10px] text-gold font-bold bg-surface px-2.5 py-1 border border-gold/30">
            {STORIES.length}/10 UNLOCKED
          </span>
        </div>

        {STORIES.map((story: any) => (
          <div
            key={story.id}
            onClick={() => onStartRead(story.id)}
            className="group relative glass-luxury-card glass-card-hover p-4 cursor-pointer transition-all duration-300"
          >
            <div className="relative h-48 w-full overflow-hidden mb-4 border border-gold/30 bg-ink-2">
              {!videoError ? (
                <video 
                  autoPlay loop muted playsInline
                  src={BG_VIDEO_ASSETS.read}
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-cover contrast-110 saturate-100 group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-surface to-ink">
                  <KazakhOrnament className="w-12 h-12 text-gold/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent opacity-90 pointer-events-none" />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="gold-badge text-[10px] px-2 py-0.5">ADAPTIVE A1–C1</span>
                <span className="bg-ink/90 border border-gold/40 text-gold text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">
                  <Video size={10} /> CINEMATIC
                </span>
              </div>
            </div>

            <h4 className="font-editorial text-base font-extrabold text-cream uppercase tracking-wide">{story.title}</h4>
            <p className="font-body text-xs text-cream/70 mt-1 leading-relaxed">
              {story.storyDesc[lang] || story.storyDesc.en}
            </p>

            <button className="rounded-full mt-4 w-full py-3.5 bg-gradient-to-r from-gold to-gold-deep hover:brightness-110 text-ink font-editorial font-bold text-xs tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 gold-glow">
              <Play size={13} fill="currentColor" /> {t.startReading}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- 3. READER SCREEN --- */
export function ReaderScreen({ selectedStory, setSelectedStory, selectedLevel, setSelectedLevel, onQuizGate, t, onReward, savedWords, onSaveWord }: any) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState("");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const [videoError, setVideoError] = useState(false);
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
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="ornament-rule pb-5 flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 terracotta-badge text-[10px]">STORY SELECT</span>
            <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">{t.selectStoryTitle}</h2>
          </div>
          <KazakhOrnament className="w-5 h-5 text-gold" />
        </div>

        <p className="font-body text-xs text-cream/70">{t.selectStorySub}</p>

        <div className="space-y-2.5 pt-2">
          {STORIES.map((story: any) => (
            <div
              key={story.id}
              onClick={() => setSelectedStory(story.id)}
              className="group glass-luxury-card glass-card-hover p-4 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="space-y-1 min-w-0">
                <span className="px-2 py-0.5 gold-badge text-[10px]">{story.sceneLabel}</span>
                <h3 className="font-editorial text-xs font-bold text-cream uppercase tracking-wider">{story.title}</h3>
                <p className="font-body text-xs text-cream/70">{story.storyDesc.en}</p>
              </div>
              <ChevronRight size={16} className="text-gold group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentStory = STORIES.find((s: any) => s.id === selectedStory) || STORIES[0];

  if (!selectedLevel) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="ornament-rule pb-5 flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedStory(null)}
              className="text-[10px] text-gold/70 hover:text-gold flex items-center gap-1 mb-1"
            >
              <ArrowLeft size={10} /> {currentStory.title}
            </button>
            <span className="px-2 py-0.5 terracotta-badge text-[10px]">PHASE 01 · LEVEL SELECT</span>
            <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">{t.selectLevelTitle}</h2>
          </div>
          <KazakhOrnament className="w-5 h-5 text-gold" />
        </div>

        <p className="font-body text-xs text-cream/70">{t.selectLevelSub}</p>

        <div className="space-y-2.5 pt-2">
          {LEVEL_DETAILS.map((lvl) => (
            <div
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.id)}
              className="group glass-luxury-card glass-card-hover p-4 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 gold-badge text-[10px]">{lvl.badge}</span>
                  <h3 className="font-editorial text-xs font-bold text-cream uppercase tracking-wider">{lvl.title}</h3>
                </div>
                <p className="font-body text-xs text-cream/70">{lvl.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gold group-hover:translate-x-1 transition-transform" />
            </div>
          ))}
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

  return (
    <div className="px-5 pb-6 space-y-4 animate-pop-in relative">
      <div className="flex items-center justify-between ornament-rule pb-5">
        <div>
          <p className="font-editorial text-xs tracking-[0.1em] text-gold uppercase">{currentStory.sceneLabel}</p>
          <h1 className="font-editorial text-sm font-extrabold text-cream uppercase tracking-wide">{currentStory.title}</h1>
        </div>

        <button
          onClick={() => setSelectedLevel(null)}
          className="flex items-center gap-1 px-3 min-h-[44px] bg-surface border border-gold/30 text-xs font-editorial text-gold uppercase hover:border-gold transition-all"
        >
          <ArrowLeft size={10} /> {selectedLevel} · {t.changeLevel}
        </button>
      </div>

      <div className="relative border border-gold/30 bg-ink overflow-hidden h-44">
        {!videoError ? (
          <video
            ref={videoRef}
            autoPlay loop muted playsInline
            src={BG_VIDEO_ASSETS.read}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover opacity-90 contrast-110 saturate-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface">
            <KazakhOrnament className="w-10 h-10 text-gold/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-ink/80 border border-gold/30 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="font-editorial text-xs text-cream uppercase tracking-[0.1em]">
            {t.sceneAnimation}
          </span>
        </div>

        {!videoError && (
          <button
            onClick={toggleVideo}
            className="absolute bottom-2.5 right-2.5 p-3.5 bg-ink/80 border border-gold/40 text-gold hover:border-gold transition-all"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
        )}
      </div>

      <div className="px-3 py-1.5 bg-surface border border-gold/20 flex items-center justify-between text-xs text-cream/80">
        <span className="flex items-center gap-1"><Volume2 size={12} className="text-gold" /> {t.tapWordHint}</span>
        {activeWord && (
          <button onClick={() => safePlayVoice(activeWord)} className="text-gold underline font-bold">
            🔊 Re-read
          </button>
        )}
      </div>

      <div className="glass-luxury-card p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleToggleReadAlong}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-editorial font-bold uppercase tracking-[0.1em] rounded-full transition-all ${
              isReadAlongPlaying
                ? "bg-felt text-cream"
                : "bg-gradient-to-r from-gold to-gold-deep text-ink gold-glow"
            }`}
          >
            {isReadAlongPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
            {isReadAlongPlaying ? "Pause Read-Along" : "Read Along"}
          </button>

          <div className="flex-1 min-w-0 text-right">
            {readAlongTokenIndex !== null ? (
              <>
                <span className="text-xs text-cream/70 uppercase tracking-[0.1em] block">Now reading</span>
                <span className="font-editorial text-xs font-bold text-gold truncate block">
                  "{tokens[readAlongTokenIndex]}"
                </span>
              </>
            ) : (
              <span className="text-xs text-cream/70 italic">Tap play to follow along</span>
            )}
          </div>

          {readAlongTokenIndex !== null && (
            <button onClick={handleRestartReadAlong} className="p-2.5 text-cream/70 hover:text-cream" title="Restart from the beginning">
              <ArrowLeft size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-gold/15">
          <span className="text-xs text-cream/70 uppercase tracking-[0.1em] pr-1">Speed</span>
          {READ_SPEEDS.map((s) => (
            <button
              key={s.key}
              onClick={() => setReadSpeed(s.rate)}
              className={`px-3 min-h-[44px] text-xs font-editorial font-bold rounded-full transition-all flex items-center ${
                readSpeed === s.rate
                  ? "bg-gold text-ink"
                  : "bg-surface text-cream/70 border border-gold/20 hover:text-cream"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {activeWord && (
        <div className="glass-luxury-card p-3 border border-gold flex items-center justify-between gap-2 animate-pop-in">
          <div className="min-w-0">
            <span className="text-xs text-gold uppercase tracking-[0.1em] block">SELECTED WORD</span>
            <span className="font-editorial text-sm font-extrabold text-cream">"{activeWord}"</span>
            <span className="text-xs text-gold font-medium ml-2">→ {translation}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(() => {
              const cleanWord = activeWord.replace(/[^a-zA-Z]/g, "").toLowerCase();
              const alreadySaved = savedWords && savedWords.some((w: any) => w.word === cleanWord);
              return (
                <button
                  onClick={() => !alreadySaved && onSaveWord && onSaveWord(cleanWord, translation)}
                  disabled={alreadySaved}
                  className={`px-3 min-h-[44px] text-xs font-editorial font-bold uppercase tracking-[0.1em] border transition-all flex items-center ${
                    alreadySaved
                      ? "border-turq/50 text-turq bg-turq/10"
                      : "border-gold text-gold hover:bg-gold/15"
                  }`}
                >
                  {alreadySaved ? "✓ SAVED" : "+ MY WORDS"}
                </button>
              );
            })()}
            <button onClick={() => setActiveWord(null)} className="p-3 text-cream/70 hover:text-cream">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="glass-luxury-card p-5 leading-relaxed relative border-gold/30 max-h-[320px] overflow-y-auto">
        <p className="font-body text-base text-cream leading-8">
          {tokens.map((tok: string, i: number) => {
            const isWord = /[a-zA-Z]/.test(tok);
            if (!isWord) return <span key={i} className="text-cream/50">{tok}</span>;
            const isCurrentlyRead = i === readAlongTokenIndex;
            return (
              <span key={i} className="relative inline-block mx-0.5">
                <span
                  ref={(el) => { wordRefs.current[i] = el; }}
                  onClick={() => handleWordClick(tok)}
                  className={`px-1 py-0.5 rounded font-semibold cursor-pointer transition-all duration-300 ${
                    isCurrentlyRead
                      ? "bg-gold text-ink shadow-[0_2px_10px_-2px_rgba(231,169,63,0.6)]"
                      : "text-cream hover:text-gold hover:bg-gold/15 border-b border-gold/40"
                  }`}
                >
                  {tok}
                </span>
              </span>
            );
          })}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowChoiceModal(true)}
          className="flex-1 py-3.5 bg-surface border border-gold text-gold font-editorial font-bold text-[10px] tracking-widest uppercase hover:bg-gold/10 transition-all flex items-center justify-center gap-2"
        >
          <Compass size={14} /> {t.interactiveChoiceTitle}
        </button>
        <button
          onClick={onQuizGate}
          className="flex-1 py-3.5 bg-gradient-to-r from-gold to-gold-deep text-ink font-editorial font-extrabold text-[10px] tracking-widest uppercase gold-glow flex items-center justify-center gap-1.5"
        >
          {t.takeQuiz} <ChevronRight size={14} />
        </button>
      </div>

      {showChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-pop-in">
          <div className="w-full max-w-[360px] bg-ink-2 border-2 border-gold p-6 rounded-2xl shadow-2xl space-y-4 text-center relative">
            <OrnamentFrame className="text-gold/50" size="w-5 h-5" />
            <button onClick={() => setShowChoiceModal(false)} className="absolute top-3 right-3 text-gold">
              <X size={18} />
            </button>

            <KazakhOrnament className="w-7 h-7 mx-auto text-gold" />
            <h3 className="font-editorial text-sm font-black text-cream uppercase tracking-wider">{t.interactiveChoiceTitle}</h3>
            <p className="font-body text-xs text-cream/80">{currentStory.choicePrompt}</p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setChoiceMade(true);
                  onReward(20);
                  setShowChoiceModal(false);
                }}
                className="w-full p-3 bg-surface border border-gold/40 hover:border-gold text-left font-body text-xs text-cream transition-all"
              >
                {currentStory.choiceOptionA}
              </button>
              <button
                onClick={() => {
                  setChoiceMade(true);
                  onReward(10);
                  setShowChoiceModal(false);
                }}
                className="w-full p-3 bg-surface border border-gold/40 hover:border-gold text-left font-body text-xs text-cream transition-all"
              >
                {currentStory.choiceOptionB}
              </button>
            </div>

            {choiceMade && (
              <p className="text-[10px] text-turq font-editorial uppercase tracking-widest">
                {t.artifactUnlocked}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- 3.5 FLASHCARDS SCREEN --- */
export function FlashcardsScreen({ savedWords, onReward }: { savedWords: SavedWord[]; onReward: (xp: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!savedWords || savedWords.length === 0) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="ornament-rule pb-5">
          <span className="px-2 py-0.5 terracotta-badge text-[10px]">VOCABULARY DRILL</span>
          <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">FLASHCARDS</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-2">
          <Layers className="mx-auto text-gold/50" size={28} />
          <p className="font-body text-xs text-cream/70 leading-relaxed">
            No words saved yet. Tap any word while reading a story to save it to your flashcards bank!
          </p>
        </div>
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
    <div className="px-5 pb-6 space-y-4 animate-pop-in">
      <div className="ornament-rule pb-5 flex items-center justify-between">
        <div>
          <span className="px-2 py-0.5 terracotta-badge text-[10px]">VOCABULARY DRILL</span>
          <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">FLASHCARDS</h2>
        </div>
        <span className="text-[10px] font-editorial text-gold font-bold">
          {currentIndex + 1} / {savedWords.length}
        </span>
      </div>

      <div
        onClick={() => {
          setFlipped(!flipped);
          safePlayVoice(currentWord.word);
        }}
        className="glass-luxury-card glass-card-hover min-h-[220px] p-6 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden transition-all duration-500"
      >
        <span className="absolute top-3 left-3 text-[10px] font-editorial text-gold/70 uppercase tracking-widest">
          TAP TO FLIP
        </span>

        {!flipped ? (
          <div className="space-y-2 animate-pop-in">
            <h3 className="font-editorial text-2xl font-black text-cream">{currentWord.word}</h3>
            <p className="text-xs font-body text-cream/70 italic">English Word</p>
          </div>
        ) : (
          <div className="space-y-2 animate-pop-in">
            <h3 className="font-editorial text-xl font-extrabold text-gold">{currentWord.translation}</h3>
            <p className="text-xs font-body text-cream/70">Kazakh Translation</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleNext(false)}
          className="flex-1 py-3 bg-surface border border-felt/50 text-felt font-editorial text-[10px] font-bold uppercase tracking-wider hover:bg-felt/10"
        >
          Still Learning
        </button>
        <button
          onClick={() => handleNext(true)}
          className="flex-1 py-3 bg-surface border border-turq/50 text-turq font-editorial text-[10px] font-bold uppercase tracking-wider hover:bg-turq/10"
        >
          I Knew It (+2 XP)
        </button>
      </div>
    </div>
  );
}

/* --- 3.6 MATCHING GAME SCREEN --- */
export function MatchingGame({ savedWords, onReward }: any) {
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
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="ornament-rule pb-5">
          <span className="px-2 py-0.5 terracotta-badge text-[10px]">MATCHING GAME</span>
          <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">FIND THE PAIR</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-2">
          <Layers className="mx-auto text-gold/50" size={28} />
          <p className="font-body text-xs text-cream/70 leading-relaxed">
            Save at least 3 words while reading to unlock the matching game.
          </p>
        </div>
      </div>
    );
  }

  if (roundComplete) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="ornament-rule pb-5">
          <span className="px-2 py-0.5 gold-badge text-[10px]">MATCHING GAME</span>
          <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">FIND THE PAIR</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-3">
          <Trophy className="mx-auto text-gold" size={28} />
          <p className="font-editorial text-sm font-bold text-cream uppercase">All Matched!</p>
          <p className="font-body text-xs text-cream/70">Great recognition speed.</p>
          <button
            onClick={() => setRound((r) => r + 1)}
            className="w-full py-3 bg-gradient-to-r from-gold to-gold-deep text-ink font-editorial font-bold text-xs uppercase"
          >
            Play Next Round
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-4 animate-pop-in">
      <div className="ornament-rule pb-5 flex items-center justify-between">
        <div>
          <span className="px-2 py-0.5 terracotta-badge text-[10px]">MATCHING GAME</span>
          <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">FIND THE PAIR</h2>
        </div>
        <span className="text-[10px] font-editorial text-gold font-bold">
          Matched: {matchedIds.length} / {tiles.length / 2}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((tile) => {
          const isMatched = matchedIds.includes(tile.pairId);
          const isSelected = selectedTile?.tileId === tile.tileId;
          const isWrong = wrongPair.includes(tile.tileId);

          return (
            <button
              key={tile.tileId}
              onClick={() => handleTileTap(tile)}
              disabled={isMatched}
              className={`p-3.5 min-h-[64px] text-center rounded-[14px] font-editorial text-xs transition-all duration-200 border flex items-center justify-center ${
                isMatched
                  ? "bg-turq/10 border-turq/30 text-turq opacity-40"
                  : isWrong
                  ? "bg-felt-deep/40 border-felt text-[#F2A08A] animate-answer-wrong"
                  : isSelected
                  ? "bg-gold border-gold text-ink font-bold scale-[1.02]"
                  : "bg-surface border-gold/20 text-cream hover:border-gold/60"
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
export function QuizScreen({ onReward, t, onQuizFinish, questions }: {
  onReward: (xp: number) => void;
  t: Record<string, string>;
  onQuizFinish?: (correct: number, total: number) => void;
  questions: { type?: string; q?: string; sentence?: string; options: string[]; correct: number }[];
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

  const HeartsRow = () => (
    <div className="flex items-center gap-1">
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <Flame key={i} size={13} className={i < hearts ? "text-felt fill-felt" : "text-cream/15"} />
      ))}
    </div>
  );

  if (outOfHearts) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-pop-in">
        <div className="ornament-rule pb-5 flex justify-between items-center">
          <div>
            <span className="px-2 py-0.5 terracotta-badge text-[10px]">QUIZ MODULE</span>
            <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">{t.quizTitle}</h2>
          </div>
          <HeartsRow />
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-3">
          <Flame className="mx-auto text-felt" size={30} />
          <p className="font-editorial text-sm font-bold text-cream uppercase">Out of Hearts</p>
          <p className="font-body text-xs text-cream/70">
            You've run out of hearts for this attempt. Re-read the story to refresh your memory, then try again from the start.
          </p>
          <button onClick={handleRestart} className="w-full py-3 bg-gradient-to-r from-gold to-gold-deep text-ink font-editorial font-bold text-[10px] tracking-widest uppercase gold-glow">
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const passed = correctCount >= Math.ceil(questions.length * 0.6);
    return (
      <div className="px-5 pb-6 space-y-5 animate-pop-in">
        <div className="ornament-rule pb-5 flex justify-between items-center">
          <div>
            <span className="px-2 py-0.5 gold-badge text-[10px]">QUIZ MODULE</span>
            <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">{t.quizTitle}</h2>
          </div>
          <Trophy className="text-gold w-5 h-5" />
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-3">
          <Trophy className={`mx-auto ${passed ? "text-gold" : "text-cream/40"}`} size={30} />
          <p className="font-editorial text-lg font-black text-cream">{correctCount} / {questions.length}</p>
          <p className="font-body text-xs text-cream/70">
            {passed ? "Great comprehension! You understood the story well." : "Re-read the story and try again — comprehension takes practice."}
          </p>
          <button onClick={handleRestart} className="w-full py-3 bg-gradient-to-r from-gold to-gold-deep text-ink font-editorial font-bold text-[10px] tracking-widest uppercase gold-glow">
            {t.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="ornament-rule pb-5 flex justify-between items-center">
        <div>
          <span className="px-2 py-0.5 gold-badge text-[10px]">QUIZ MODULE</span>
          <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">{t.quizTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          <HeartsRow />
          <span className="text-[10px] text-gold font-bold bg-surface px-2.5 py-1 rounded-full border border-gold/30">
            {qIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden border border-gold/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLeft <= 5 ? "bg-felt" : "bg-gradient-to-r from-gold to-gold-deep"}`}
            style={{ width: `${Math.max(0, (timeLeft / QUESTION_TIME) * 100)}%` }}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums w-5 text-right ${timeLeft <= 5 ? "text-felt" : "text-cream/70"}`}>
          {Math.max(0, timeLeft)}s
        </span>
      </div>

      <div className="glass-luxury-card p-5 space-y-4">
        {question.type === "fillblank" ? (
          <>
            <span className="text-xs text-gold uppercase tracking-[0.1em] font-bold block">FILL IN THE BLANK</span>
            <p className="font-body text-sm font-semibold text-cream leading-relaxed">
              {(question.sentence || "").split("___")[0]}
              <span className="inline-block min-w-[54px] border-b-2 border-gold mx-1 text-center text-gold">
                {submitted && selected !== null ? question.options[selected] : " "}
              </span>
              {(question.sentence || "").split("___")[1]}
            </p>
          </>
        ) : (
          <p className="font-body text-xs font-semibold text-cream leading-relaxed">{question.q}</p>
        )}

        <div className="space-y-2">
          {question.options.map((opt: string, idx: number) => {
            let style = "border-gold/20 bg-surface/80 text-cream/80 hover:border-gold/50";
            let anim = "";
            if (selected === idx) style = "border-gold bg-gold/15 text-gold font-bold";
            if (submitted) {
              if (idx === question.correct) {
                style = "border-turq/80 bg-turq/10 text-turq font-bold";
                anim = "animate-answer-correct";
              } else if (selected === idx) {
                style = "border-felt/80 bg-felt-deep/50 text-[#F2A08A]";
                anim = "animate-answer-wrong";
              }
            }
            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => setSelected(idx)}
                className={`w-full text-left p-3.5 border font-body text-xs transition-all flex items-center justify-between ${style} ${anim}`}
              >
                <span>{opt}</span>
                {submitted && idx === question.correct && <CheckCircle2 size={15} className="text-turq" />}
              </button>
            );
          })}
        </div>
      </div>

      {!submitted ? (
        <button
          onClick={handleCheck}
          disabled={selected === null}
          className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-deep disabled:opacity-40 text-ink font-editorial font-extrabold text-xs tracking-[0.18em] uppercase gold-glow rounded-full"
        >
          {t.checkAnswer}
        </button>
      ) : (
        <div className="p-4 border border-turq/30 bg-turq/10 backdrop-blur-md text-center space-y-2 animate-pop-in">
          <p className="font-editorial text-xs font-extrabold text-turq uppercase tracking-wider">
            {timedOut ? "Time's Up" : selected === question.correct ? t.correctMsg : t.wrongMsg}
          </p>
          <button
            onClick={handleNext}
            className="text-xs font-editorial text-gold font-bold uppercase hover:text-cream flex items-center justify-center gap-1 mx-auto"
          >
            {qIndex + 1 >= questions.length ? "See Results" : "Next Question"} <ChevronRight size={12} />
          </button>
        </div>
      )}
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
      : "Keep practicing — tap the quote to hear it again, then try to match it closely.";

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="ornament-rule pb-5 flex justify-between items-center">
        <div>
          <span className="px-2 py-0.5 terracotta-badge text-[10px]">SPEECH EVALUATION</span>
          <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">{t.speakTitle}</h2>
        </div>
        <Mic className="text-gold w-5 h-5" />
      </div>

      <div className="glass-luxury-card p-6 text-center space-y-3">
        <p className="font-body text-xs text-cream/70">{t.speakSubtitle}</p>
        <blockquote
          className="font-editorial text-sm font-bold text-gold uppercase tracking-wide leading-relaxed cursor-pointer"
          onClick={() => safePlayVoice(targetPhrase)}
        >
          "{targetPhrase}" 🔊
        </blockquote>
      </div>

      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        <button
          onClick={toggleRecord}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            recording
              ? "bg-felt text-cream animate-pulse shadow-[0_0_30px_rgba(178,83,62,0.6)]"
              : "bg-surface border border-gold text-gold hover:bg-gold hover:text-ink gold-glow"
          }`}
        >
          {recording ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        <span className="font-editorial text-xs tracking-[0.1em] text-gold uppercase">
          {recording ? t.recording : t.pressMic}
        </span>
      </div>

      {speechError && (
        <div className="glass-luxury-card p-4 text-center space-y-1 animate-pop-in border-felt/40">
          <p className="font-body text-xs text-felt">{speechError}</p>
        </div>
      )}

      {scores !== null && (
        <div className="glass-luxury-card p-4 text-center space-y-2 animate-pop-in border-turq/30">
          <p className="font-editorial text-xl font-extrabold text-turq">{scores.pronunciation}% {t.accuracy}</p>
          {transcript && <p className="font-body text-xs text-cream/70 italic">You said: "{transcript}"</p>}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <p className="font-editorial text-sm font-bold text-gold">{scores.accuracy}%</p>
              <p className="text-xs text-cream/70 uppercase tracking-[0.1em]">Accuracy</p>
            </div>
            <div>
              <p className="font-editorial text-sm font-bold text-gold">{scores.fluency}%</p>
              <p className="text-xs text-cream/70 uppercase tracking-[0.1em]">Fluency</p>
            </div>
            <div>
              <p className="font-editorial text-sm font-bold text-gold">{scores.completeness}%</p>
              <p className="text-xs text-cream/70 uppercase tracking-[0.1em]">Completeness</p>
            </div>
          </div>
          <p className="font-body text-xs text-cream/90 pt-1">{feedbackMessage}</p>
        </div>
      )}
    </div>
  );
}

/* --- 8. PROFILE SCREEN --- */
export function ProfileScreen({ xp, t, savedWordsCount = 0, unlockedAchievements = [], userName = "Learner", onSignOut, streakDays = 0 }: {
  xp: number;
  t: Record<string, string>;
  savedWordsCount?: number;
  unlockedAchievements?: string[];
  userName?: string;
  onSignOut: () => void;
  streakDays?: number;
}) {
  const [showBuklet, setShowBuklet] = useState(false);

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="ornament-rule pb-5 flex justify-between items-center">
        <div>
          <span className="px-2 py-0.5 gold-badge text-[10px]">USER PASSPORT</span>
          <h2 className="font-editorial text-xl font-bold text-cream uppercase mt-1.5 tracking-wide">{t.profileTitle}</h2>
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          className="flex items-center gap-1 text-[10px] font-editorial font-bold text-cream/50 hover:text-felt uppercase tracking-wider"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <div className="glass-luxury-card p-5 text-center space-y-3 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative w-28 h-28 mx-auto flex items-center justify-center animate-float">
          <Shanyraq className="absolute inset-0 w-full h-full text-gold/35" strokeWidth={2} />
          <div className="relative w-[70px] h-[70px] rounded-full border-2 border-gold bg-surface flex items-center justify-center gold-glow">
            <span className="font-editorial text-2xl font-black text-gold">II</span>
          </div>
        </div>

        <div>
          <h3 className="font-editorial text-lg font-extrabold text-cream uppercase tracking-wide">{userName}</h3>
          <p className="font-body text-xs text-gold uppercase tracking-[0.1em] mt-0.5">{t.levelStatus}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gold/20">
          <div className="bg-surface/90 p-2.5 border border-gold/20 rounded-xl">
            <span className="text-xs text-cream/70 block">{t.totalXpLabel}</span>
            <span className="font-editorial text-sm font-extrabold text-gold">{xp} XP</span>
          </div>
          <div className="bg-surface/90 p-2.5 border border-gold/20 rounded-xl">
            <span className="text-xs text-cream/70 block">{t.streakLabel}</span>
            <span className="font-editorial text-sm font-extrabold text-gold flex items-center justify-center gap-1">
              <Flame size={13} /> {streakDays}d
            </span>
          </div>
          <div className="bg-surface/90 p-2.5 border border-gold/20 rounded-xl">
            <span className="text-xs text-cream/70 block">WORDS SAVED</span>
            <span className="font-editorial text-sm font-extrabold text-cream flex items-center justify-center gap-1">
              <Layers size={13} className="text-gold" /> {savedWordsCount}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-luxury-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-editorial text-xs font-bold text-gold uppercase tracking-wider">🏛️ HERITAGE ARTEFACTS VAULT</h4>
          <span className="text-xs text-cream/70">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchievements.includes(a.id);
            return (
              <div
                key={a.id}
                title={a.desc}
                className={`p-2.5 bg-surface border rounded-xl ${unlocked ? "border-gold/40" : "border-gold/20 opacity-50"}`}
              >
                <span className="text-xl">{a.icon}</span>
                <span className={`block font-editorial text-xs tracking-[0.05em] mt-1 ${unlocked ? "text-cream" : "text-cream/70"}`}>
                  {a.title.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setShowBuklet(true)}
        className="rounded-full w-full py-4 bg-gradient-to-r from-gold to-gold-deep text-ink font-editorial font-extrabold text-xs tracking-[0.18em] uppercase gold-glow flex items-center justify-center gap-2"
      >
        <Share2 size={16} /> {t.shareBuklet}
      </button>

      {showBuklet && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-pop-in">
          <div className="w-full max-w-[380px] bg-ink-2 border-2 border-gold p-7 rounded-2xl shadow-2xl relative space-y-5 text-center">
            <OrnamentFrame className="text-gold/60" />
            <button onClick={() => setShowBuklet(false)} className="absolute top-4 right-4 text-gold hover:text-white">
              <X size={20} />
            </button>

            <div className="space-y-1 pt-2">
              <Shanyraq className="w-10 h-10 mx-auto text-gold" strokeWidth={3.5} />
              <span className="font-editorial text-xs tracking-[0.15em] text-gold uppercase block">{t.bukletHeader}</span>
              <h3 className="font-editorial text-lg font-black text-cream uppercase tracking-wider">ERTEGI ENGLISH DIPLOMA</h3>
            </div>

            <div className="relative w-28 h-28 mx-auto my-3 rounded-full border-4 border-gold p-1 bg-gradient-to-b from-surface to-ink shadow-[0_0_25px_rgba(231,169,63,0.3)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center border border-gold/50 overflow-hidden">
                <span className="font-editorial text-3xl font-black text-gold">II</span>
              </div>
              <span className="absolute -bottom-2 bg-gold text-ink-2 font-editorial font-extrabold text-[10px] px-2 py-0.5 uppercase tracking-widest">
                PASSPORT
              </span>
            </div>

            <div className="space-y-2 bg-surface p-3.5 border border-gold/30 text-left text-xs font-body text-cream">
              <div className="flex justify-between border-b border-gold/20 pb-1.5">
                <span className="text-cream/70">Learner:</span>
                <span className="font-bold text-gold">{userName}</span>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-1.5">
                <span className="text-cream/70">Active Streak:</span>
                <span className="font-bold text-gold">🔥 {streakDays} Days</span>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-1.5">
                <span className="text-cream/70">Total XP:</span>
                <span className="font-bold text-gold">{xp} XP</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={async () => {
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
                }}
                className="flex-1 py-3 bg-gradient-to-r from-gold to-gold-deep text-ink font-editorial font-black text-[10px] tracking-widest uppercase gold-glow flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> {t.downloadBuklet}
              </button>
              <button
                onClick={() => setShowBuklet(false)}
                className="px-4 py-3 bg-surface border border-gold/40 text-cream font-editorial font-bold text-[10px] uppercase"
              >
                {t.closeBuklet}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
