import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, ChevronRight, RotateCcw, Compass, Check, Plus } from "lucide-react";
import { ScreenHeader, Sheet } from "../UIHelpers";
import { displayTitle, foldAccents } from "../../utils/text";
import { Shanyraq } from "../Ornaments";
import { safePlayVoice, stopVoice } from "../../utils/voice";
import { narrate, alignWords, bestBrowserVoice, primeAudio } from "../../utils/narration";
import { BG_VIDEO_ASSETS, LEVEL_DETAILS, WORD_TRANSLATIONS } from "../../constants";
import { RESEARCH_MODE } from "../../research/mode";
import { APP_STORIES as STORIES } from "../../research/stories";
import { MAX_MASTERY } from "../../utils/progress";
import { StoryHistory } from "../Culture";
import { TrailButton } from "../ThinkingTrail";
import { currentWeek, weekWordOf } from "../../data/weekWords";
import { StoryCover } from "../StoryCover";
import type { Lang } from "../../lang";
import type { SavedWord } from "../../types";
import { LEVEL_COLORS, useTr, type UiText } from "./shared";
import { READ_SPEEDS } from "../../research/params";
import { track } from "../../utils/events";
import { wordTap } from "../../utils/wordTap";
import { CORPUS_META } from "../../data/corpusMeta";

/* Small video tile with a night-sky fallback. */
function StoryVideo({ src, poster, className = "", videoRef, paused }: { src: string; poster?: string; className?: string; videoRef?: React.Ref<HTMLVideoElement>; paused?: boolean }) {
  const [error, setError] = useState(false);
  return (
    <div className={`overflow-hidden bg-night ${className}`}>
      {!error ? (
        <video
          ref={videoRef}
          autoPlay={!paused} loop muted playsInline
          preload="metadata"
          src={src}
          poster={poster}
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

/* --- 3. READER SCREEN --- */
export interface ReaderScreenProps {
  selectedStory: string | null;
  setSelectedStory: (id: string | null) => void;
  selectedLevel: string | null;
  setSelectedLevel: (level: string | null) => void;
  /** Opens the level's quiz: a level counts as done only after it is passed. */
  onQuizGate: () => void;
  t: UiText;
  lang?: Lang;
  onReward: (xp: number) => void;
  savedWords: SavedWord[];
  onSaveWord: (word: string, translation: string) => void;
  userId?: string;
}

export function ReaderScreen({ selectedStory, setSelectedStory, selectedLevel, setSelectedLevel, onQuizGate, t, lang = "kk", onReward, savedWords, onSaveWord, userId }: ReaderScreenProps) {
  const tr = useTr();
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  // Token index of the tapped word, to show its sentence in the word sheet.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [translation, setTranslation] = useState("");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isReadAlongPlaying, setIsReadAlongPlaying] = useState(false);
  const [readAlongLoading, setReadAlongLoading] = useState(false);
  const [readAlongTokenIndex, setReadAlongTokenIndex] = useState<number | null>(null);
  const [readAlongSentence, setReadAlongSentence] = useState<number | null>(null);
  const isPlayingRef = useRef(false);
  const wordRefs = useRef<Record<number, HTMLElement | null>>({});
  const [rovingWord, setRovingWord] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef<number | null>(null);

  // Real playback rates: 1× is a person reading at normal pace.
  const [readSpeed, setReadSpeed] = useState(1);
  const readSpeedRef = useRef(1);
  useEffect(() => {
    readSpeedRef.current = readSpeed;
    if (audioRef.current) audioRef.current.playbackRate = readSpeed;
  }, [readSpeed]);

  useEffect(() => {
    if (readAlongTokenIndex !== null && wordRefs.current[readAlongTokenIndex]) {
      wordRefs.current[readAlongTokenIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [readAlongTokenIndex]);

  const stopNarration = () => {
    isPlayingRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    audioRef.current?.pause();
    try { window.speechSynthesis.cancel(); } catch { /* not supported */ }
  };

  useEffect(() => {
    setReadAlongTokenIndex(null);
    setReadAlongSentence(null);
    setIsReadAlongPlaying(false);
    return () => {
      stopNarration();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, selectedStory]);

  // A tale opened at a level: the text is on screen.
  useEffect(() => {
    if (selectedStory && selectedLevel) {
      track("story_open", { object_type: "story", object_id: selectedStory, story_id: selectedStory, level: selectedLevel });
    }
  }, [selectedStory, selectedLevel]);

  if (!selectedStory) {
    return (
      <div className="animate-pop-in">
        <ScreenHeader eyebrow={lang === "kk" ? "Кітапхана" : "Library"} title={t.selectStoryTitle} />
        <p className="text-[15px] text-ink-2 -mt-2 mb-4">{t.selectStorySub}</p>

        <div className="card overflow-hidden divide-y divide-line">
          {STORIES.map((story) => (
            <button
              key={story.id}
              onClick={() => setSelectedStory(story.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-sand/60 transition-colors"
            >
              <StoryCover id={story.id} className="w-[72px] h-[72px] rounded-2xl shrink-0 shadow-[0_3px_0_var(--color-line-2)]" />
              <div className="flex-1 min-w-0">
                <p className="eyebrow text-sky-ink">{lang === "kk" ? story.sceneLabelKk : displayTitle(story.sceneLabel)}</p>
                <h2 className="font-display font-extrabold text-[17px] text-ink leading-snug mt-0.5">{displayTitle(story.title)}</h2>
                <p className="text-sm text-ink-2 line-clamp-1 mt-0.5">{story.storyDesc[lang] || story.storyDesc.en}</p>
              </div>
              <ChevronRight size={20} className="text-ink-3 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentStory = STORIES.find((s) => s.id === selectedStory) || STORIES[0];

  if (!selectedLevel) {
    return (
      <div className="animate-pop-in">
        <ScreenHeader
          onBack={() => setSelectedStory(null)}
          backLabel={lang === "kk" ? "Аңыздар" : "Stories"}
          eyebrow={displayTitle(currentStory.title)}
          title={t.selectLevelTitle}
        />
        <p className="text-[15px] text-ink-2 -mt-2 mb-5">{t.selectLevelSub}</p>
        {!RESEARCH_MODE && <div className="mb-5"><StoryHistory storyId={currentStory.id} lang={lang} /></div>}

        <div className="space-y-3">
          {LEVEL_DETAILS.map((lvl) => {
            const c = LEVEL_COLORS[lvl.id];
            const meta = CORPUS_META[currentStory.id]?.[lvl.id];
            const metaText = meta && [
              lang === "kk" ? `${meta.words} сөз` : `${meta.words} word${meta.words === 1 ? "" : "s"}`,
              meta.newWords ? (lang === "kk" ? `${meta.newWords} жаңа сөз` : `${meta.newWords} new word${meta.newWords === 1 ? "" : "s"}`) : null,
            ].filter(Boolean).join(" · ");
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
                  <h2 className="font-display font-extrabold text-[17px] text-ink">{lang === "kk" ? lvl.kkTitle : lvl.title}</h2>
                  <p className="text-sm text-ink-2 leading-snug">{lang === "kk" ? lvl.kkDesc : lvl.desc}</p>
                  {metaText && (
                    <p
                      className="text-xs font-semibold text-ink-3 mt-1"
                      title={lang === "kk" ? "Жаңа сөз — осы ертегінің төменгі деңгейлерінде кездеспеген сөздер" : "New words: words not used in the lower levels of this tale"}
                    >
                      {metaText}
                    </p>
                  )}
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
  // Keyboard: one word of the tale is in the Tab order at a time; arrows move
  // between words, Enter or Space opens the translation.
  const isWordTok = (t: string | undefined) => !!t && /[a-zA-Z]/.test(t);
  const tabWord = rovingWord !== null && isWordTok(tokens[rovingWord]) ? rovingWord : tokens.findIndex(isWordTok);
  const moveWord = (from: number, dir: 1 | -1) => {
    for (let j = from + dir; j >= 0 && j < tokens.length; j += dir) {
      if (isWordTok(tokens[j])) { setRovingWord(j); wordRefs.current[j]?.focus(); return; }
    }
  };
  // Character start of each token, and the sentence each token belongs to.
  const tokenStarts: number[] = [];
  const sentenceOf: number[] = [];
  const sentences: number[][] = [[]];
  tokens.reduce((pos: number, tok: string, i: number) => {
    tokenStarts.push(pos);
    sentenceOf[i] = sentences.length - 1;
    sentences[sentences.length - 1].push(i);
    if (/[.!?]["”’)]*$/.test(tok)) sentences.push([]);
    return pos + tok.length;
  }, 0);
  if (!sentences[sentences.length - 1].length) sentences.pop();
  const sentenceText = (si: number) => sentences[si].map((i) => tokens[i]).join("").trim();
  const tokenAt = (offset: number) => {
    let lo = 0, hi = tokens.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (tokenStarts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo;
  };

  const handleWordClick = (word: string, index: number | null = null) => {
    // Try the word as written ("didn't"), then without a possessive ("man's" -> "man"), then letters only.
    const { translation: found, event } = wordTap(word, WORD_TRANSLATIONS, currentStory.id, selectedLevel, isReadAlongPlaying);
    track("word_tap", event);
    if (isReadAlongPlaying) { stopNarration(); setIsReadAlongPlaying(false); }
    setActiveWord(word);
    setActiveIndex(index);
    setTranslation(found || "Аудармасы әзірге жоқ");
    safePlayVoice(word);
  };

  const finishReadAlong = () => {
    stopNarration();
    setIsReadAlongPlaying(false);
    setReadAlongTokenIndex(null);
    setReadAlongSentence(null);
  };

  const showToken = (ti: number) => {
    setReadAlongTokenIndex((prev) => (prev === ti ? prev : ti));
    setReadAlongSentence((prev) => (prev === sentenceOf[ti] ? prev : sentenceOf[ti]));
  };

  // Neural voice: one audio file for the whole text, highlighted from its word timings.
  const playNarration = async (fromSentence: number) => {
    const narration = await narrate(text);
    if (!isPlayingRef.current) return;
    const audio = audioRef.current ?? new Audio();
    if (audio.src !== narration.url) audio.src = narration.url;
    audioRef.current = audio;
    audio.playbackRate = readSpeedRef.current;
    audio.onended = finishReadAlong;
    const wordTokens = alignWords(narration.words, tokens);
    const firstToken = sentences[fromSentence][0];
    const startWord = wordTokens.findIndex((ti) => ti >= firstToken);
    audio.currentTime = fromSentence > 0 && startWord >= 0 ? narration.words[startWord].time : 0;
    await audio.play();
    setReadAlongLoading(false);
    const tick = () => {
      if (!isPlayingRef.current) return;
      const now = audio.currentTime + 0.05;
      let k = -1;
      for (let i = 0; i < narration.words.length && narration.words[i].time <= now; i++) if (wordTokens[i] >= 0) k = i;
      if (k >= 0) showToken(wordTokens[k]);
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  // Fallback: the browser voice reads one sentence at a time, never word by word.
  const speakSentence = (si: number) => {
    if (!isPlayingRef.current) return;
    if (si >= sentences.length) { finishReadAlong(); return; }
    const first = sentences[si].find((i) => /[a-zA-Z]/.test(tokens[i]));
    if (first !== undefined) showToken(first);
    const raw = sentences[si].map((i) => tokens[i]).join("");
    const lead = raw.length - raw.trimStart().length;
    const next = () => { if (isPlayingRef.current) setTimeout(() => speakSentence(si + 1), 120); };
    try {
      const utter = new SpeechSynthesisUtterance(raw.trim());
      const voice = bestBrowserVoice();
      if (voice) utter.voice = voice;
      utter.lang = voice?.lang ?? "en-US";
      utter.rate = readSpeedRef.current;
      utter.onboundary = (e) => {
        if (e.name === "word") showToken(tokenAt(tokenStarts[sentences[si][0]] + lead + e.charIndex));
      };
      utter.onend = next;
      utter.onerror = next;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      setTimeout(next, (sentenceText(si).split(/\s+/).length * 400) / readSpeedRef.current);
    }
  };

  const handleToggleReadAlong = async () => {
    if (isReadAlongPlaying) {
      stopNarration();
      setIsReadAlongPlaying(false);
      setReadAlongLoading(false);
      return;
    }
    stopVoice();
    if (!audioRef.current) {
      audioRef.current = new Audio();
      primeAudio(audioRef.current);
    }
    isPlayingRef.current = true;
    setIsReadAlongPlaying(true);
    // Resume from the start of the sentence that was playing.
    const from = readAlongSentence ?? 0;
    track("audio_play", {
      object_type: "reading", object_id: `${currentStory.id}:${selectedLevel}`, story_id: currentStory.id, level: selectedLevel,
      result: { speed: readSpeedRef.current, from_sentence: from, sentences: sentences.length },
    });
    setReadAlongLoading(true);
    try {
      await playNarration(from);
    } catch {
      setReadAlongLoading(false);
      speakSentence(from);
    }
  };

  const handleRestartReadAlong = () => {
    stopNarration();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setReadAlongTokenIndex(null);
    setReadAlongSentence(null);
    setIsReadAlongPlaying(false);
    setReadAlongLoading(false);
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const cleanActive = activeWord ? foldAccents(activeWord).replace(/[^a-zA-Z]/g, "").toLowerCase() : "";
  const alreadySaved = !!activeWord && savedWords && savedWords.some((w: SavedWord) => w.word === cleanActive);
  const levelColor = LEVEL_COLORS[selectedLevel] || LEVEL_COLORS.A1;
  // Saved words: learning ones get a sun highlight, mastered ones a jade underline.
  const savedMastery = new Map<string, number>((savedWords || []).map((w: SavedWord) => [w.word, w.mastery ?? 0]));
  const cleanTok = (tok: string) => foldAccents(tok).replace(/[^a-zA-Z]/g, "").toLowerCase();
  const savedInText = new Set(tokens.map(cleanTok).filter((w: string) => savedMastery.has(w))).size;
  const { week } = currentWeek();
  const activeWeekWord = !RESEARCH_MODE && activeWord ? weekWordOf(week, activeWord) : null;
  // Word sheet (Shanyraq 2.0): the word's state comes from the saved words, read only, so the
  // spaced-repetition logic is unchanged; and the sentence of the tale it was tapped in.
  const activeMastery = cleanActive ? savedMastery.get(cleanActive) : undefined;
  const activeState = activeMastery === undefined ? "new" : activeMastery >= MAX_MASTERY ? "known" : "learning";
  const activeSentence = activeIndex !== null && sentenceOf[activeIndex] !== undefined
    ? sentences[sentenceOf[activeIndex]].filter((ti, k, all) => !(k === 0 && !tokens[ti].trim()) && !(k === all.length - 1 && !tokens[ti].trim()))
    : null;
  const weekInText = !RESEARCH_MODE && tokens.some((tok: string) => !savedMastery.has(cleanTok(tok)) && !!weekWordOf(week, tok));

  return (
    <div className="space-y-4 animate-pop-in relative">
      <ScreenHeader
        onBack={() => setSelectedLevel(null)}
        backLabel={t.changeLevel}
        eyebrow={lang === "kk" ? currentStory.sceneLabelKk : displayTitle(currentStory.sceneLabel)}
        title={displayTitle(currentStory.title)}
        trailing={
          <span className={`shrink-0 w-12 h-12 rounded-2xl ${levelColor.bg} ${levelColor.edge} flex items-center justify-center font-display font-black text-white`}>
            {selectedLevel}
          </span>
        }
      />

      {/* Only Aldar Köse has an animated scene so far; the other tales show their cover. */}
      <div className="relative rounded-[24px] overflow-hidden h-48 sm:h-56">
        {currentStory.id === "aldar_kose" ? (
          <>
            <StoryVideo src={BG_VIDEO_ASSETS.read} poster={BG_VIDEO_ASSETS.readPoster} videoRef={videoRef} className="absolute inset-0" />
            <span className="absolute top-3 left-3 flex items-center gap-1.5 h-7 px-3 rounded-full glass text-ink text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-felt animate-pulse" /> {t.sceneAnimation}
            </span>
            <button
              onClick={toggleVideo}
              aria-label={isPlaying ? tr("Видеоны тоқтату", "Pause video") : tr("Видеоны қосу", "Play video")}
              className="absolute bottom-3 right-3 w-11 h-11 rounded-full glass text-ink flex items-center justify-center"
            >
              {isPlaying ? <Pause size={18} className="fill-ink" /> : <Play size={18} className="fill-ink" />}
            </button>
          </>
        ) : (
          <StoryCover id={currentStory.id} wide className="absolute inset-0 w-full h-full" />
        )}
      </div>

      {/* R4: the research build shows the text only: no history notes, plot choice, trail or week words, which a control text could not have. */}
      {!RESEARCH_MODE && <StoryHistory storyId={currentStory.id} lang={lang} />}

      {/* Read-along player (Apple Music mini player) */}
      <div className="card p-3.5 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleReadAlong}
            aria-label={isReadAlongPlaying ? tr("Бірге оқуды тоқтату", "Pause read-along") : tr("Бірге оқуды бастау", "Start read-along")}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform active:translate-y-[3px] ${
              isReadAlongPlaying
                ? "bg-[#C4441E] text-white shadow-[0_3px_0_var(--color-felt-deep)] active:shadow-none"
                : "bg-sun text-ink shadow-[0_3px_0_var(--color-sun-deep)] active:shadow-none"
            }`}
          >
            {isReadAlongPlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-ink ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-display font-extrabold text-ink text-[15px]">{tr("Бірге оқу", "Read along")}</p>
            <p className="text-sm text-ink-2">
              {readAlongLoading ? tr("Дауыс дайындалуда…", "Preparing the voice…") : t.tapWordHint}
            </p>
          </div>
          {readAlongSentence !== null && (
            <button onClick={handleRestartReadAlong} aria-label={tr("Басынан", "Restart")} className="w-10 h-10 rounded-full flex items-center justify-center text-ink-2 hover:bg-sand-2">
              <RotateCcw size={18} />
            </button>
          )}
        </div>
        {/* Subtitle: the sentence being read right now */}
        {readAlongSentence !== null && (
          <p className="rounded-2xl bg-night text-white/70 px-4 py-3 text-[16px] leading-snug" aria-live="polite">
            {sentences[readAlongSentence].map((ti) => (
              <span key={ti} className={ti === readAlongTokenIndex ? "text-sun font-bold" : ""}>{tokens[ti]}</span>
            ))}
          </p>
        )}
        <div className="segmented" role="group" aria-label={tr("Жылдамдық", "Speed")}>
          {READ_SPEEDS.map((rate) => (
            <button key={rate} aria-pressed={readSpeed === rate} onClick={() => setReadSpeed(rate)}>
              {rate}×
            </button>
          ))}
        </div>
      </div>

      {/* Story text */}
      <div tabIndex={0} role="region" aria-label={lang === "kk" ? "Ертегі мәтіні" : "Story text"} className="card p-5 sm:p-7 max-h-[440px] overflow-y-auto">
        {(savedInText > 0 || weekInText) && (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-ink-2 mb-3">
            {weekInText && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-b-2 border-dashed border-sky" />{lang === "kk" ? "Апта сөзі" : "Word of the week"}</span>}
            {savedInText > 0 && <>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-b-[3px] border-sun" />{lang === "kk" ? "Үйреніп жатырсың" : "Learning"}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-b-2 border-jade" />{lang === "kk" ? "Меңгерілді" : "Mastered"}</span>
              <span className="text-ink-3">{savedInText} {lang === "kk" ? "сақталған сөз осы мәтінде" : "saved words in this text"}</span>
            </>}
          </p>
        )}
        <p lang="en" className="text-[20px] text-ink leading-[1.8]">
          {tokens.map((tok: string, i: number) => {
            const isWord = /[a-zA-Z]/.test(tok);
            const inSentence = readAlongSentence !== null && sentenceOf[i] === readAlongSentence;
            if (!isWord) return <span key={i} className={inSentence ? "bg-sun-soft" : ""}>{tok}</span>;
            const isCurrentlyRead = i === readAlongTokenIndex;
            const isActive = activeWord === tok;
            const mastery = savedMastery.get(cleanTok(tok));
            const savedCls = !RESEARCH_MODE && mastery === undefined && weekWordOf(week, tok)
              ? "font-bold text-sky-deep hover:bg-sky-soft decoration-sky decoration-dashed decoration-2 underline underline-offset-[6px]"
              : mastery === undefined
              ? "hover:bg-sky-soft"
              : mastery >= MAX_MASTERY
              ? "hover:bg-jade-soft decoration-jade decoration-2 underline underline-offset-[6px]"
              : "hover:bg-sun-soft decoration-sun decoration-[3px] underline underline-offset-[6px]";
            return (
              <span
                key={i}
                ref={(el) => { wordRefs.current[i] = el; }}
                role="button"
                tabIndex={i === tabWord ? 0 : -1}
                onFocus={() => setRovingWord(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleWordClick(tok, i); }
                  else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); moveWord(i, 1); }
                  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); moveWord(i, -1); }
                }}
                onClick={() => handleWordClick(tok, i)}
                className={`rounded-md px-0.5 -mx-0.5 cursor-pointer transition-colors duration-200 ${
                  isCurrentlyRead
                    ? "bg-sun text-ink"
                    : inSentence
                    ? "bg-sun-soft"
                    : isActive
                    ? "bg-sun-hl ring-2 ring-sun text-ink"
                    : savedCls
                }`}
              >
                {tok}
              </span>
            );
          })}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row-reverse gap-3 pt-1">
        <button
          // The level counts as done only once its quiz is passed.
          onClick={onQuizGate}
          className="btn flex-1"
        >
          {t.takeQuiz} <ChevronRight size={18} strokeWidth={3} />
        </button>
        {!RESEARCH_MODE && <button onClick={() => setShowChoiceModal(true)} className="btn btn-ghost flex-1">
          <Compass size={18} strokeWidth={2.6} /> {t.interactiveChoiceTitle}
        </button>}
      </div>
      {!RESEARCH_MODE && <TrailButton storyId={currentStory.id} level={selectedLevel} text={text} lang={lang} userId={userId} onReward={onReward} />}

      {/* Word sheet */}
      <Sheet open={!!activeWord} onClose={() => { setActiveWord(null); setActiveIndex(null); }} label={tr("Сөз", "Word")}>
        {activeWord && (
          <div className="p-6 pt-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">{tr("Ағылшынша", "English")}</p>
                <h3 className="font-display font-black text-[36px] text-ink leading-tight break-words">{cleanActive}</h3>
              </div>
              <button onClick={() => safePlayVoice(activeWord)} aria-label={tr("Тыңдау", "Listen")} className="w-14 h-14 rounded-full bg-sky-soft text-sky-ink flex items-center justify-center shrink-0">
                <Volume2 size={24} />
              </button>
            </div>
            <p className="font-display font-black text-[22px] text-ember-ink leading-snug">{translation}</p>
            {activeSentence && (
              <p lang="en" className="text-[15px] text-ink-2 leading-relaxed">
                <span lang="kk">{tr("Ертегіде", "In the tale")}: </span>«{activeSentence.map((ti) => ti === activeIndex
                  ? <b key={ti} className="text-ink">{tokens[ti]}</b>
                  : <span key={ti}>{tokens[ti]}</span>)}»
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold ${activeState === "new" ? "bg-sky-soft text-sky-ink" : activeState === "learning" ? "bg-sun-soft text-word-learning" : "bg-jade-soft text-word-known"}`}>
                {activeState === "new" ? tr("Жаңа", "New") : activeState === "learning" ? tr("Үйреніп жүрмін", "Learning") : tr("Білемін", "Known")}
              </span>
              {activeWeekWord && (
                <span className="inline-flex flex-wrap items-center gap-x-2 rounded-full bg-sky-soft px-3 py-1 text-[13px] font-semibold text-sky-ink">
                  <span className="font-black">{tr("Апта сөзі", "Word of the week")}</span>
                  <span>{activeWeekWord.family}</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => !alreadySaved && onSaveWord && onSaveWord(cleanActive, translation)}
                disabled={alreadySaved}
                className="btn btn-ember"
              >
                {alreadySaved ? <><Check size={18} strokeWidth={3} aria-hidden="true" /> {tr("Сақталды", "Saved")}</> : <><Plus size={18} strokeWidth={3} aria-hidden="true" /> {tr("Сөздікке қосу", "Add to words")}</>}
              </button>
              {!RESEARCH_MODE ? (
                <button
                  onClick={() => {
                    const sentence = activeSentence ? activeSentence.map((ti) => tokens[ti]).join("").trim() : "";
                    setActiveWord(null); setActiveIndex(null);
                    window.dispatchEvent(new CustomEvent("shoqan:open", { detail: sentence ? `What does "${cleanActive}" mean in: "${sentence}"?` : `What does "${cleanActive}" mean?` }));
                  }}
                  className="btn btn-ghost"
                >
                  {tr("Шоқаннан сұрау", "Ask Shoqan")}
                </button>
              ) : (
                <button onClick={() => { setActiveWord(null); setActiveIndex(null); }} className="btn btn-ghost">{t.closeBuklet}</button>
              )}
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
