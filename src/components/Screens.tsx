import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, ArrowRight, Play, Video, Pause, Volume2, 
  ChevronRight, ArrowLeft, X, Compass, Layers, Trophy, CheckCircle2 
} from "lucide-react";
import { 
  BackgroundVideo, KazakhOrnament, DailyGoalRing, 
  safePlayVoice 
} from "./UIHelpers";
import { 
  BG_VIDEO_ASSETS, STORIES, LEVEL_DETAILS, WORD_TRANSLATIONS 
} from "../constants";
import { SavedWord } from "../types";

/* --- 1. INTRO SCREEN --- */
export function IntroScreen({ onFinish, t }: any) {
  return (
    <div className="relative min-h-screen w-full bg-[#09090D] flex flex-col justify-between p-6 overflow-hidden animate-pop-in">
      <BackgroundVideo src={BG_VIDEO_ASSETS.intro} opacity={60} videoKey="intro-bg" />

      <div className="relative z-10 flex justify-between items-center pt-4">
        <div className="flex items-center gap-2.5">
          <KazakhOrnament className="w-6 h-6 text-[#C5A059]" />
          <span className="font-editorial text-lg tracking-[0.2em] text-[#F8F5EE] uppercase font-extrabold">Ertegi English</span>
        </div>
        <button 
          onClick={onFinish}
          className="text-[10px] font-editorial uppercase tracking-[0.15em] text-[#C5A059] hover:text-[#F8F5EE] px-3.5 py-1.5 border border-[#C5A059]/30 bg-black/50 backdrop-blur-md transition-all"
        >
          {t.skip}
        </button>
      </div>

      <div className="relative z-10 space-y-4 my-auto text-center px-4 animate-float">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 terracotta-badge text-[9px] tracking-[0.2em]">
          <Sparkles size={10} /> QAZAQSTAN EDTECH INITIATIVE
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#F8F5EE] leading-tight uppercase tracking-wide">
          DALA AÑYZDARY <br />
          <span className="text-[#C5A059] drop-shadow-[0_0_20px_rgba(197,160,89,0.4)]">AĞYLŞYN TİLİNDE</span>
        </h1>
        <p className="font-body text-xs text-[#F8F5EE]/80 max-w-xs mx-auto leading-relaxed">
          {t.homeSubtitle}
        </p>
      </div>

      <div className="relative z-10 pb-6">
        <button
          onClick={onFinish}
          className="rounded-full w-full py-4 bg-gradient-to-r from-[#C5A059] via-[#9A7B38] to-[#C5A059] hover:brightness-110 text-[#09090D] font-editorial font-extrabold text-xs tracking-[0.2em] uppercase gold-glow transition-all flex items-center justify-center gap-2"
        >
          {t.enter} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* --- 2. HOME SCREEN --- */
export function HomeScreen({ onStartRead, t, lang, sessionXp = 0, dailyGoal = 50 }: any) {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="relative glass-luxury-card p-5 border-l-2 border-l-[#C5A059] overflow-hidden min-h-[140px]">
        <BackgroundVideo src={BG_VIDEO_ASSETS.home} opacity={35} videoKey="home-hero" />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 gold-badge text-[8px]">HERITAGE · QAZAQSTAN</span>
          <KazakhOrnament className="w-5 h-5 text-[#C5A059]" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-editorial text-xl font-bold text-[#F8F5EE] uppercase tracking-wide">
              {t.greeting}
            </h2>
            <p className="font-body text-xs text-[#F8F5EE]/80 mt-1 leading-relaxed">
              {t.homeSubtitle}
            </p>
          </div>
          <DailyGoalRing current={sessionXp} goal={dailyGoal} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-[11px] tracking-[0.18em] text-[#C5A059] uppercase">{t.collectionTitle}</h3>
          <span className="text-[9px] text-[#C5A059] font-bold bg-[#14141C] px-2.5 py-1 border border-[#C5A059]/30">
            {STORIES.length}/10 UNLOCKED
          </span>
        </div>

        {STORIES.map((story: any) => (
          <div
            key={story.id}
            onClick={() => onStartRead(story.id)}
            className="group relative glass-luxury-card glass-card-hover p-4 cursor-pointer transition-all duration-300"
          >
            <div className="relative h-48 w-full overflow-hidden mb-4 border border-[#C5A059]/30 bg-[#121218]">
              {!videoError ? (
                <video 
                  autoPlay loop muted playsInline
                  src={BG_VIDEO_ASSETS.read}
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-cover contrast-110 saturate-100 group-hover:scale-105 transition-transform duration-700 ease-out" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#1E1810] to-[#0A0A0E]">
                  <KazakhOrnament className="w-12 h-12 text-[#C5A059]/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090D] via-[#09090D]/30 to-transparent opacity-90 pointer-events-none" />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="gold-badge text-[8px] px-2 py-0.5">ADAPTIVE A1–C1</span>
                <span className="bg-[#09090D]/90 border border-[#C5A059]/40 text-[#C5A059] text-[8px] px-2 py-0.5 font-bold flex items-center gap-1">
                  <Video size={10} /> CINEMATIC
                </span>
              </div>
            </div>

            <h4 className="font-editorial text-base font-extrabold text-[#F8F5EE] uppercase tracking-wide">{story.title}</h4>
            <p className="font-body text-xs text-[#F8F5EE]/70 mt-1 leading-relaxed">
              {story.storyDesc[lang] || story.storyDesc.en}
            </p>

            <button className="rounded-full mt-4 w-full py-3.5 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] hover:brightness-110 text-[#09090D] font-editorial font-bold text-xs tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 gold-glow">
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
      try { window.speechSynthesis.cancel(); } catch (e) {}
    };
  }, [selectedLevel]);

  if (!selectedStory) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="border-b border-[#C5A059]/20 pb-3 flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 terracotta-badge text-[8px]">STORY SELECT</span>
            <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">{t.selectStoryTitle}</h2>
          </div>
          <KazakhOrnament className="w-5 h-5 text-[#C5A059]" />
        </div>

        <p className="font-body text-xs text-[#F8F5EE]/70">{t.selectStorySub}</p>

        <div className="space-y-2.5 pt-2">
          {STORIES.map((story: any) => (
            <div
              key={story.id}
              onClick={() => setSelectedStory(story.id)}
              className="group glass-luxury-card glass-card-hover p-4 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="space-y-1 min-w-0">
                <span className="px-2 py-0.5 gold-badge text-[9px]">{story.sceneLabel}</span>
                <h3 className="font-editorial text-xs font-bold text-[#F8F5EE] uppercase tracking-wider">{story.title}</h3>
                <p className="font-body text-[11px] text-[#F8F5EE]/70">{story.storyDesc.en}</p>
              </div>
              <ChevronRight size={16} className="text-[#C5A059] group-hover:translate-x-1 transition-transform shrink-0" />
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
        <div className="border-b border-[#C5A059]/20 pb-3 flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedStory(null)}
              className="text-[9px] text-[#C5A059]/70 hover:text-[#C5A059] flex items-center gap-1 mb-1"
            >
              <ArrowLeft size={10} /> {currentStory.title}
            </button>
            <span className="px-2 py-0.5 terracotta-badge text-[8px]">PHASE 01 · LEVEL SELECT</span>
            <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">{t.selectLevelTitle}</h2>
          </div>
          <KazakhOrnament className="w-5 h-5 text-[#C5A059]" />
        </div>

        <p className="font-body text-xs text-[#F8F5EE]/70">{t.selectLevelSub}</p>

        <div className="space-y-2.5 pt-2">
          {LEVEL_DETAILS.map((lvl) => (
            <div
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.id)}
              className="group glass-luxury-card glass-card-hover p-4 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 gold-badge text-[9px]">{lvl.badge}</span>
                  <h3 className="font-editorial text-xs font-bold text-[#F8F5EE] uppercase tracking-wider">{lvl.title}</h3>
                </div>
                <p className="font-body text-[11px] text-[#F8F5EE]/70">{lvl.desc}</p>
              </div>
              <ChevronRight size={16} className="text-[#C5A059] group-hover:translate-x-1 transition-transform" />
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
    } catch (err) {
      fallbackAdvance();
    }
  };

  const handleToggleReadAlong = () => {
    if (isReadAlongPlaying) {
      isPlayingRef.current = false;
      setIsReadAlongPlaying(false);
      try { window.speechSynthesis.cancel(); } catch (e) {}
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
    try { window.speechSynthesis.cancel(); } catch (e) {}
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
      <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-3">
        <div>
          <p className="font-editorial text-[9px] tracking-[0.18em] text-[#C5A059] uppercase">{currentStory.sceneLabel}</p>
          <h1 className="font-editorial text-sm font-extrabold text-[#F8F5EE] uppercase tracking-wide">{currentStory.title}</h1>
        </div>

        <button
          onClick={() => setSelectedLevel(null)}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#14141C] border border-[#C5A059]/30 text-[9px] font-editorial text-[#C5A059] uppercase hover:border-[#C5A059] transition-all"
        >
          <ArrowLeft size={10} /> {selectedLevel} · {t.changeLevel}
        </button>
      </div>

      <div className="relative border border-[#C5A059]/30 bg-[#09090D] overflow-hidden h-44">
        {!videoError ? (
          <video
            ref={videoRef}
            autoPlay loop muted playsInline
            src={BG_VIDEO_ASSETS.read}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover opacity-90 contrast-110 saturate-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#14141C]">
            <KazakhOrnament className="w-10 h-10 text-[#C5A059]/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090D] via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-[#09090D]/80 border border-[#C5A059]/30 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
          <span className="font-editorial text-[8px] text-[#F8F5EE] uppercase tracking-[0.15em]">
            {t.sceneAnimation}
          </span>
        </div>

        {!videoError && (
          <button
            onClick={toggleVideo}
            className="absolute bottom-2.5 right-2.5 p-2 bg-[#09090D]/80 border border-[#C5A059]/40 text-[#C5A059] hover:border-[#C5A059] transition-all"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
        )}
      </div>

      <div className="px-3 py-1.5 bg-[#14141C] border border-[#C5A059]/20 flex items-center justify-between text-[10px] text-[#F8F5EE]/80">
        <span className="flex items-center gap-1"><Volume2 size={12} className="text-[#C5A059]" /> {t.tapWordHint}</span>
        {activeWord && (
          <button onClick={() => safePlayVoice(activeWord)} className="text-[#C5A059] underline font-bold">
            🔊 Re-read
          </button>
        )}
      </div>

      <div className="glass-luxury-card p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleToggleReadAlong}
            className={`flex items-center gap-2 px-3.5 py-2 text-[10px] font-editorial font-bold uppercase tracking-wider rounded-full transition-all ${
              isReadAlongPlaying
                ? "bg-[#B2533E] text-[#F8F5EE]"
                : "bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] gold-glow"
            }`}
          >
            {isReadAlongPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
            {isReadAlongPlaying ? "Pause Read-Along" : "Read Along"}
          </button>

          <div className="flex-1 min-w-0 text-right">
            {readAlongTokenIndex !== null ? (
              <>
                <span className="text-[9px] text-[#F8F5EE]/50 uppercase tracking-widest block">Now reading</span>
                <span className="font-editorial text-xs font-bold text-[#C5A059] truncate block">
                  "{tokens[readAlongTokenIndex]}"
                </span>
              </>
            ) : (
              <span className="text-[9px] text-[#F8F5EE]/40 italic">Tap play to follow along</span>
            )}
          </div>

          {readAlongTokenIndex !== null && (
            <button onClick={handleRestartReadAlong} className="text-[#F8F5EE]/40 hover:text-[#F8F5EE]" title="Restart from the beginning">
              <ArrowLeft size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-[#C5A059]/15">
          <span className="text-[8px] text-[#F8F5EE]/40 uppercase tracking-widest pr-1">Speed</span>
          {READ_SPEEDS.map((s) => (
            <button
              key={s.key}
              onClick={() => setReadSpeed(s.rate)}
              className={`px-2.5 py-1 text-[9px] font-editorial font-bold rounded-full transition-all ${
                readSpeed === s.rate
                  ? "bg-[#C5A059] text-[#09090D]"
                  : "bg-[#14141C] text-[#F8F5EE]/50 border border-[#C5A059]/20 hover:text-[#F8F5EE]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {activeWord && (
        <div className="glass-luxury-card p-3 border border-[#C5A059] flex items-center justify-between gap-2 animate-pop-in">
          <div className="min-w-0">
            <span className="text-[9px] text-[#C5A059] uppercase tracking-widest block">SELECTED WORD</span>
            <span className="font-editorial text-sm font-extrabold text-[#F8F5EE]">"{activeWord}"</span>
            <span className="text-xs text-[#C5A059] font-medium ml-2">→ {translation}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(() => {
              const cleanWord = activeWord.replace(/[^a-zA-Z]/g, "").toLowerCase();
              const alreadySaved = savedWords && savedWords.some((w: any) => w.word === cleanWord);
              return (
                <button
                  onClick={() => !alreadySaved && onSaveWord && onSaveWord(cleanWord, translation)}
                  disabled={alreadySaved}
                  className={`px-2.5 py-1.5 text-[9px] font-editorial font-bold uppercase tracking-wider border transition-all ${
                    alreadySaved
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/30"
                      : "border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/15"
                  }`}
                >
                  {alreadySaved ? "✓ SAVED" : "+ MY WORDS"}
                </button>
              );
            })()}
            <button onClick={() => setActiveWord(null)} className="text-[#F8F5EE]/50 hover:text-[#F8F5EE]">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="glass-luxury-card p-5 leading-relaxed relative border-[#C5A059]/30 max-h-[320px] overflow-y-auto">
        <p className="font-body text-sm text-[#F8F5EE] leading-7">
          {tokens.map((tok: string, i: number) => {
            const isWord = /[a-zA-Z]/.test(tok);
            if (!isWord) return <span key={i} className="text-[#F8F5EE]/50">{tok}</span>;
            const isCurrentlyRead = i === readAlongTokenIndex;
            return (
              <span key={i} className="relative inline-block mx-0.5">
                <span
                  ref={(el) => { wordRefs.current[i] = el; }}
                  onClick={() => handleWordClick(tok)}
                  className={`px-1 py-0.5 rounded font-semibold cursor-pointer transition-all duration-300 ${
                    isCurrentlyRead
                      ? "bg-[#C5A059] text-[#09090D] shadow-[0_2px_10px_-2px_rgba(197,160,89,0.6)]"
                      : "text-[#F8F5EE] hover:text-[#C5A059] hover:bg-[#C5A059]/15 border-b border-[#C5A059]/40"
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
          className="flex-1 py-3.5 bg-[#14141C] border border-[#C5A059] text-[#C5A059] font-editorial font-bold text-[10px] tracking-widest uppercase hover:bg-[#C5A059]/10 transition-all flex items-center justify-center gap-2"
        >
          <Compass size={14} /> {t.interactiveChoiceTitle}
        </button>
        <button
          onClick={onQuizGate}
          className="flex-1 py-3.5 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-extrabold text-[10px] tracking-widest uppercase gold-glow flex items-center justify-center gap-1.5"
        >
          {t.takeQuiz} <ChevronRight size={14} />
        </button>
      </div>

      {showChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-pop-in">
          <div className="w-full max-w-[360px] bg-[#0E0E14] border-2 border-[#C5A059] p-5 rounded-lg shadow-2xl space-y-4 text-center relative">
            <button onClick={() => setShowChoiceModal(false)} className="absolute top-3 right-3 text-[#C5A059]">
              <X size={18} />
            </button>

            <KazakhOrnament className="w-7 h-7 mx-auto text-[#C5A059]" />
            <h3 className="font-editorial text-sm font-black text-[#F8F5EE] uppercase tracking-wider">{t.interactiveChoiceTitle}</h3>
            <p className="font-body text-xs text-[#F8F5EE]/80">{currentStory.choicePrompt}</p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setChoiceMade(true);
                  onReward(20);
                  setShowChoiceModal(false);
                }}
                className="w-full p-3 bg-[#14141C] border border-[#C5A059]/40 hover:border-[#C5A059] text-left font-body text-xs text-[#F8F5EE] transition-all"
              >
                {currentStory.choiceOptionA}
              </button>
              <button
                onClick={() => {
                  setChoiceMade(true);
                  onReward(10);
                  setShowChoiceModal(false);
                }}
                className="w-full p-3 bg-[#14141C] border border-[#C5A059]/40 hover:border-[#C5A059] text-left font-body text-xs text-[#F8F5EE] transition-all"
              >
                {currentStory.choiceOptionB}
              </button>
            </div>

            {choiceMade && (
              <p className="text-[10px] text-emerald-400 font-editorial uppercase tracking-widest">
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
        <div className="border-b border-white/[0.06] pb-3">
          <span className="px-2 py-0.5 terracotta-badge text-[8px]">VOCABULARY DRILL</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">FLASHCARDS</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-2">
          <Layers className="mx-auto text-[#C5A059]/50" size={28} />
          <p className="font-body text-xs text-[#F8F5EE]/70 leading-relaxed">
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
      <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
        <div>
          <span className="px-2 py-0.5 terracotta-badge text-[8px]">VOCABULARY DRILL</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">FLASHCARDS</h2>
        </div>
        <span className="text-[10px] font-editorial text-[#C5A059] font-bold">
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
        <span className="absolute top-3 left-3 text-[8px] font-editorial text-[#C5A059]/70 uppercase tracking-widest">
          TAP TO FLIP
        </span>

        {!flipped ? (
          <div className="space-y-2 animate-pop-in">
            <h3 className="font-editorial text-2xl font-black text-[#F8F5EE]">{currentWord.word}</h3>
            <p className="text-[10px] font-body text-[#F8F5EE]/40 italic">English Word</p>
          </div>
        ) : (
          <div className="space-y-2 animate-pop-in">
            <h3 className="font-editorial text-xl font-extrabold text-[#C5A059]">{currentWord.translation}</h3>
            <p className="text-[10px] font-body text-[#F8F5EE]/50">Kazakh Translation</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleNext(false)}
          className="flex-1 py-3 bg-[#14141C] border border-[#B2533E]/50 text-[#B2533E] font-editorial text-[10px] font-bold uppercase tracking-wider hover:bg-[#B2533E]/10"
        >
          Still Learning
        </button>
        <button
          onClick={() => handleNext(true)}
          className="flex-1 py-3 bg-[#14141C] border border-emerald-500/50 text-emerald-400 font-editorial text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-950/20"
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

  const buildRound = () => {
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
  };

  useEffect(() => {
    buildRound();
  }, [round, savedWords?.length]);

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
        <div className="border-b border-white/[0.06] pb-3">
          <span className="px-2 py-0.5 terracotta-badge text-[8px]">MATCHING GAME</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">FIND THE PAIR</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-2">
          <Layers className="mx-auto text-[#C5A059]/50" size={28} />
          <p className="font-body text-xs text-[#F8F5EE]/70 leading-relaxed">
            Save at least 3 words while reading to unlock the matching game.
          </p>
        </div>
      </div>
    );
  }

  if (roundComplete) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="border-b border-white/[0.06] pb-3">
          <span className="px-2 py-0.5 gold-badge text-[8px]">MATCHING GAME</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">FIND THE PAIR</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-3">
          <Trophy className="mx-auto text-[#C5A059]" size={28} />
          <p className="font-editorial text-sm font-bold text-[#F8F5EE] uppercase">All Matched!</p>
          <p className="font-body text-xs text-[#F8F5EE]/70">Great recognition speed.</p>
          <button
            onClick={() => setRound((r) => r + 1)}
            className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-bold text-xs uppercase"
          >
            Play Next Round
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-4 animate-pop-in">
      <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
        <div>
          <span className="px-2 py-0.5 terracotta-badge text-[8px]">MATCHING GAME</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">FIND THE PAIR</h2>
        </div>
        <span className="text-[10px] font-editorial text-[#C5A059] font-bold">
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
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400 opacity-40"
                  : isWrong
                  ? "bg-rose-950/40 border-rose-500 text-rose-300 animate-answer-wrong"
                  : isSelected
                  ? "bg-[#C5A059] border-[#C5A059] text-[#09090D] font-bold scale-[1.02]"
                  : "bg-[#14141C] border-[#C5A059]/20 text-[#F8F5EE] hover:border-[#C5A059]/60"
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
