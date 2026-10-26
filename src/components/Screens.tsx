import { useState, useRef, useEffect } from "react";
import { useLang } from "../lang";
import {
  ArrowRight, Play, Pause, Volume2, ChevronRight, RotateCcw, Compass, Trophy,
  Check, X, Mic, MicOff, LogOut, Share2, BookOpen, Lock, Plus, MessageCircle,
  GraduationCap,
} from "lucide-react";
import { DailyGoalRing, ScreenHeader, Sheet, BrandMark } from "./UIHelpers";
import { displayTitle, foldAccents } from "../utils/text";
import { Shanyraq, OrnamentBand, Tumar, SteppeBackground, KilimStrip, QoshqarMuyiz } from "./Ornaments";
import { safePlayVoice, stopVoice } from "../utils/voice";
import { narrate, alignWords, bestBrowserVoice, primeAudio } from "../utils/narration";
import {
  BG_VIDEO_ASSETS, STORIES, LEVEL_DETAILS, WORD_TRANSLATIONS, ACHIEVEMENTS
} from "../constants";
import type { SavedWord } from "../types";
import { supabase } from "../lib/supabase";
import { isDue, MAX_MASTERY } from "../utils/progress";
import { MaqalCard, StoryHistory } from "./Culture";
import { LegendDeckEntry } from "./LegendCards";
import { IconFlame, IconBolt, IconCards, IconTrophy, Badge } from "./Icons";
import { TrailButton } from "./ThinkingTrail";
import { CouncilCard } from "./Council";
import { WeekWordsCard } from "./WeekWords";
import { currentWeek, weekWordOf } from "../data/weekWords";
import { StoryCover } from "./StoryCover";
import { buildLevelQuiz } from "../utils/levelQuiz";
import { findEvidence } from "../utils/evidence";

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

/* Picks the Kazakh or English UI string for the current language. */
function useTr() {
  const kk = useLang() === "kk";
  return (kkText: string, enText: string) => (kk ? kkText : enText);
}

const LEVEL_COLORS: Record<string, { bg: string; edge: string; island: string; soft: string }> = {
  A1: { bg: "bg-[#15805A]", edge: "shadow-[0_4px_0_#0F6446]", island: "shadow-[0_7px_0_#0F6446]", soft: "text-jade-deep" },
  A2: { bg: "bg-sky-deep", edge: "shadow-[0_4px_0_#075F75]", island: "shadow-[0_7px_0_#075F75]", soft: "text-sky-deep" },
  B1: { bg: "bg-sun", edge: "shadow-[0_4px_0_var(--color-sun-deep)]", island: "shadow-[0_7px_0_var(--color-sun-deep)]", soft: "text-sun-deep" },
  B2: { bg: "bg-felt", edge: "shadow-[0_4px_0_var(--color-felt-deep)]", island: "shadow-[0_7px_0_var(--color-felt-deep)]", soft: "text-felt-deep" },
  C1: { bg: "bg-night", edge: "shadow-[0_4px_0_#121a31]", island: "shadow-[0_7px_0_#121a31]", soft: "text-night" },
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
            Дала аңыздары<br />
            <span className="text-sky">ағылшын тілінде</span>
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

/* Shoqan's tip of the day on the home path: one per day, same for everyone. */
const SHOQAN_TIPS = [
  { kk: "Бір мәтінді екі деңгейде оқып көр: алдымен A2, сосын B1. Жаңа сөздер бірден көзге түседі.", en: "Read one tale at two levels: A2 first, then B1. The new words jump out.", ask: "Which words change between the A2 and B1 versions of a tale?" },
  { kk: "Таныс емес сөзді бас та, сақта. Ертеңіне ол «Сөздер» бөліміне қайталауға келеді.", en: "Tap an unknown word and save it. It comes back for review in Words the next day.", ask: "How should I review the words I saved?" },
  { kk: "«Бірге оқу» батырмасын басып, дауыспен бірге оқы. Айтылымға жақсы жаттығу.", en: "Turn on Read along and read out loud with it. Great practice for pronunciation.", ask: "How can I practise English pronunciation with the stories?" },
  { kk: "Алдар Көсе — айлакер. Ағылшынша оны «clever» немесе «cunning» дейді. Айырмасы неде?", en: "Aldar Köse is a trickster. In English he is \"clever\" or \"cunning\". What's the difference?", ask: "What is the difference between clever and cunning?" },
  { kk: "Күн сайын 10 минут — аптасына бір сағаттан артық. Кішкене қадам да қадам.", en: "Ten minutes a day adds up to over an hour a week. Small steps count.", ask: "Give me a 10-minute daily English routine." },
  { kk: "Сынақта қателессең, мәтінге қайтып, сол сөйлемді тап. Осылай есте жақсы қалады.", en: "Missed a quiz question? Go back and find that sentence in the text. It sticks better.", ask: "Why do I keep forgetting new English words?" },
  { kk: "Жиренше шешен үш сұраққа жауап берді. Сен ағылшынша бір сұрақ қойып көр!", en: "Zhirenshe answered three questions. Try asking me one in English!", ask: "What is the fastest thing in the world?" },
];

/* --- 2. HOME SCREEN: greeting, daily goal, and the caravan path --- */
const PATH_OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52];
// Fills are one step deeper than the brand tokens so white text keeps 4.5:1 (same values as .btn).
const UNIT_COLORS = [
  { bg: "bg-sky-deep", edge: "shadow-[0_4px_0_#075F75]" },
  { bg: "bg-[#C4441E]", edge: "shadow-[0_4px_0_#973213]" },
  { bg: "bg-[#15805A]", edge: "shadow-[0_4px_0_#0F6446]" },
  { bg: "bg-night", edge: "shadow-[0_4px_0_#121a31]" },
];

/* One island on the path: a level badge (A1–C1), C2 as "coming soon",
   then the story quiz. Shape mirrors Duolingo's oval nodes. */
function PathIsland({ label, caption, color, edge, x, onClick, locked, highlight, done, ariaLabel, bubble, children }: {
  label?: string; caption?: string; bubble?: string; color: string; edge: string; x: number;
  onClick?: () => void; locked?: boolean; highlight?: boolean; done?: boolean; ariaLabel: string; children?: React.ReactNode;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <div className={`relative flex flex-col items-center ${bubble ? "mt-12" : ""}`} style={{ transform: `translateX(${x}px)` }}>
      {highlight && <span aria-hidden="true" className="absolute top-0 w-[92px] h-[86px] -mt-2 rounded-[50%] border-4 border-sky/30 animate-pulse" />}
      {bubble && (
        <span className="absolute bottom-full mb-3 left-1/2 animate-bob whitespace-nowrap px-3 py-1.5 rounded-xl bg-card border-2 border-line font-display font-black text-xs uppercase tracking-[0.06em] text-sky-deep">
          {bubble}
          <span aria-hidden="true" className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 rotate-45 bg-card border-r-2 border-b-2 border-line" />
        </span>
      )}
      <Tag
        onClick={onClick}
        aria-label={ariaLabel}
        className={`relative w-[76px] h-[70px] rounded-[50%] flex items-center justify-center font-display font-black text-[22px] ${color} ${edge} ${
          onClick ? "transition-transform active:translate-y-[5px] active:shadow-none" : ""
        } ${locked ? "text-ink-3" : "text-white"}`}
      >
        {children ?? label}
        {done && (
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-jade border-[3px] border-card flex items-center justify-center">
            <Check size={14} strokeWidth={4} className="text-white" />
          </span>
        )}
        {locked && (
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-line flex items-center justify-center">
            <Lock size={12} strokeWidth={3} className="text-ink-3" />
          </span>
        )}
      </Tag>
      {caption && <span className="mt-3 text-xs font-bold text-ink-2">{caption}</span>}
    </div>
  );
}

export function HomeScreen({ onStartRead, onStartQuiz, t, lang, userName = "", sessionXp = 0, dailyGoal = 50, progress = new Set<string>(), userId, onReward = () => {}, onOpenCards = () => {}, assignments = null }: any) {
  // Next step on the path: first level or quiz not yet finished, in order.
  const steps = STORIES.flatMap((s: any) => [...LEVEL_DETAILS.map((l) => ({ story: s, step: l.id })), { story: s, step: "quiz" }]);
  const current = steps.find((x) => !progress.has(`${x.story.id}:${x.step}`)) || null;
  const featured = current?.story || STORIES[0];
  const featuredLevel = current && current.step !== "quiz" ? LEVEL_DETAILS.find((l) => l.id === current.step) : null;
  const totalPlanned = 10;
  const comingSoon = totalPlanned - STORIES.length;

  const firstName = (userName || "").split(/[\s@]/)[0];
  const [tip] = useState(() => SHOQAN_TIPS[Math.floor(Date.now() / 86400000) % SHOQAN_TIPS.length]);

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="pt-2">
        <p className="eyebrow mb-1">{lang === "kk" ? "Бүгін" : "Today"}</p>
        <h1 className="large-title">{lang === "kk" ? "Сәлем" : "Hi"}{firstName ? `, ${firstName}` : ""}!</h1>
        <p className="text-[15px] text-ink-2 mt-2 leading-relaxed">{t.homeSubtitle}</p>
      </div>

      {/* Daily goal — on wide screens this lives in the right rail */}
      <div className="card p-4 flex items-center gap-4 xl:hidden">
        <DailyGoalRing current={sessionXp} goal={dailyGoal} size={60} />
        <div className="flex-1 min-w-0">
          <p className="font-display font-extrabold text-ink text-[17px]">{lang === "kk" ? "Күнделікті мақсат" : "Daily goal"}</p>
          <p className="text-sm text-ink-2">
            {sessionXp >= dailyGoal
              ? (lang === "kk" ? "Орындалды! Жарайсың." : "Done for today. Nice work!")
              : `${dailyGoal - sessionXp} XP ${lang === "kk" ? "қалды" : "to go"}`}
          </p>
        </div>
      </div>

      {/* The teacher's assignments come first: they have a due date. */}
      {assignments}

      {/* Continue card: only once there is progress, otherwise the first island is the start */}
      {progress.size > 0 && (
      <button
        onClick={() => (current?.step === "quiz" ? onStartQuiz(featured.id) : onStartRead(featured.id, featuredLevel?.id))}
        className="group relative w-full text-left rounded-[28px] overflow-hidden bg-night shadow-[0_6px_0_#121a31] active:translate-y-[3px] active:shadow-[0_3px_0_#121a31] transition-transform"
      >
        <StoryCover id={featured.id} className="absolute top-4 right-4 w-24 h-24 rounded-[20px] shadow-[0_4px_0_rgba(0,0,0,0.25)] rotate-3" />
        <OrnamentBand className="absolute top-3 inset-x-0 h-3 w-full text-white/15" />
        <div className="relative p-5 pt-[124px]">
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/15 backdrop-blur text-white text-xs font-bold">
            <BookOpen size={13} /> {featuredLevel ? `${featuredLevel.id} · ${lang === "kk" ? featuredLevel.kkTitle : featuredLevel.title}` : current?.step === "quiz" ? t.takeQuiz : lang === "kk" ? featured.sceneLabelKk : displayTitle(featured.sceneLabel)}
          </span>
          <h2 className="font-display font-black text-white text-2xl leading-tight mt-3">{displayTitle(featured.title)}</h2>
          <p className="text-white/75 text-sm mt-1.5 line-clamp-2">{featured.storyDesc[lang as "en" | "kk"] || featured.storyDesc.en}</p>
          <span className="btn btn-sun btn-sm mt-4 pointer-events-none">
            <Play size={15} className="fill-ink" /> {lang === "kk" ? "Жалғастыру" : "Continue"}
          </span>
        </div>
      </button>
      )}

      {/* Shoqan by the path, like Duolingo's owl: tip of the day + a ready question */}
      <div className="flex items-end gap-3">
        <img src="/shoqan-avatar.jpg" alt="Shoqan" className="w-16 h-16 rounded-full object-cover border-[3px] border-sun shadow-[0_4px_0_var(--color-sun-deep)] shrink-0" />
        <div className="relative flex-1 card p-4 rounded-bl-md">
          <p className="eyebrow text-sun-deep">{lang === "kk" ? "Шоқанның кеңесі" : "Shoqan's tip"}</p>
          <p className="text-[15px] text-ink mt-1 leading-snug">{tip[lang === "kk" ? "kk" : "en"]}</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("shoqan:open", { detail: tip.ask }))}
            className="mt-2 text-sm font-bold text-sky-deep"
          >
            {lang === "kk" ? "Шоқаннан сұра ›" : "Ask Shoqan ›"}
          </button>
        </div>
      </div>

      <WeekWordsCard lang={lang} userId={userId} progress={progress} onReward={onReward} />
      <MaqalCard lang={lang} userId={userId} onReward={onReward} />
      <LegendDeckEntry lang={lang} userId={userId} onOpen={onOpenCards} />
      <CouncilCard lang={lang} userId={userId} progress={progress} onReward={onReward} />

      {/* Caravan path: one unit per story, islands are CEFR levels */}
      {STORIES.map((story: any, si: number) => {
        const unit = UNIT_COLORS[si % UNIT_COLORS.length];
        const isDone = (step: string) => progress.has(`${story.id}:${step}`);
        const isCurrent = (step: string) => current?.story.id === story.id && current?.step === step;
        const doneCount = [...LEVEL_DETAILS.map((l) => l.id), "quiz"].filter(isDone).length;
        return (
          <section key={story.id} className="space-y-6">
            <div className={`relative rounded-[22px] ${unit.bg} ${unit.edge} text-white px-5 py-4 overflow-hidden`}>
              <OrnamentBand className="absolute -bottom-0.5 inset-x-0 h-4 w-full text-white/20" />
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-white">
                {lang === "kk" ? `${si + 1}-бөлім` : `Unit ${si + 1}`}
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="font-display font-black text-xl leading-tight">{displayTitle(story.title)}</h3>
                <span className="text-sm font-bold bg-black/20 rounded-full px-3 h-7 flex items-center shrink-0">{doneCount}/{LEVEL_DETAILS.length + 1}</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 pb-2">
              {LEVEL_DETAILS.map((lvl, li) => {
                const c = LEVEL_COLORS[lvl.id];
                return (
                  <PathIsland
                    key={lvl.id}
                    label={lvl.id}
                    caption={lang === "kk" ? lvl.kkTitle : lvl.title}
                    color={c.bg}
                    edge={c.island}
                    x={PATH_OFFSETS[li % PATH_OFFSETS.length]}
                    highlight={isCurrent(lvl.id)}
                    bubble={progress.size === 0 && isCurrent(lvl.id) ? t.startReading : undefined}
                    done={isDone(lvl.id)}
                    onClick={() => onStartRead(story.id, lvl.id)}
                    ariaLabel={`${displayTitle(story.title)}: ${lvl.id} ${lvl.title}`}
                  />
                );
              })}
              <PathIsland
                label="C2"
                caption={lang === "kk" ? "Жақында" : "Coming soon"}
                color="bg-sand-3"
                edge="shadow-[0_7px_0_var(--color-line-2)]"
                x={PATH_OFFSETS[5]}
                locked
                ariaLabel={`C2: ${lang === "kk" ? "жақында" : "coming soon"}`}
              />
              <PathIsland
                caption={t.takeQuiz}
                color="bg-sun"
                edge="shadow-[0_7px_0_var(--color-sun-deep)]"
                x={PATH_OFFSETS[6]}
                onClick={() => onStartQuiz(story.id)}
                highlight={isCurrent("quiz")}
                done={isDone("quiz")}
                ariaLabel={`${t.takeQuiz}: ${displayTitle(story.title)}`}
              >
                <Trophy size={30} strokeWidth={2.6} className="text-ink" />
              </PathIsland>
            </div>
          </section>
        );
      })}

      {comingSoon > 0 && (
        <div className="flex flex-col items-center gap-3 pt-2 pb-4">
          <div className="w-[88px] h-[76px] rounded-[22px] bg-sand-3 shadow-[0_7px_0_var(--color-line-2)] flex items-center justify-center text-ink-3">
            <Tumar className="w-10 h-10" strokeWidth={3} />
          </div>
          <p className="text-sm text-ink-3 font-semibold pt-1">
            {lang === "kk" ? `Тағы ${comingSoon} аңыз жақында` : `${comingSoon} more tales coming soon`}
          </p>
        </div>
      )}
    </div>
  );
}

/* --- 3. READER SCREEN --- */
export function ReaderScreen({ selectedStory, setSelectedStory, selectedLevel, setSelectedLevel, onQuizGate, onLevelDone, t, lang = "kk", onReward, savedWords, onSaveWord, userId }: any) {
  const tr = useTr();
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWord, setActiveWord] = useState<string | null>(null);
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef<number | null>(null);

  // Real playback rates: 1× is a person reading at normal pace.
  const READ_SPEEDS = [0.75, 1, 1.25, 1.5, 2];
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

  if (!selectedStory) {
    return (
      <div className="animate-pop-in">
        <ScreenHeader eyebrow={lang === "kk" ? "Кітапхана" : "Library"} title={t.selectStoryTitle} />
        <p className="text-[15px] text-ink-2 -mt-2 mb-4">{t.selectStorySub}</p>

        <div className="card overflow-hidden divide-y divide-line">
          {STORIES.map((story: any) => (
            <button
              key={story.id}
              onClick={() => setSelectedStory(story.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-sand/60 transition-colors"
            >
              <StoryCover id={story.id} className="w-[72px] h-[72px] rounded-2xl shrink-0 shadow-[0_3px_0_var(--color-line-2)]" />
              <div className="flex-1 min-w-0">
                <p className="eyebrow text-[11px] text-sky-deep">{lang === "kk" ? story.sceneLabelKk : displayTitle(story.sceneLabel)}</p>
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
          backLabel={lang === "kk" ? "Аңыздар" : "Stories"}
          eyebrow={displayTitle(currentStory.title)}
          title={t.selectLevelTitle}
        />
        <p className="text-[15px] text-ink-2 -mt-2 mb-5">{t.selectLevelSub}</p>
        <div className="mb-5"><StoryHistory storyId={currentStory.id} lang={lang} /></div>

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
                  <h3 className="font-display font-extrabold text-[17px] text-ink">{lang === "kk" ? lvl.kkTitle : lvl.title}</h3>
                  <p className="text-sm text-ink-2 leading-snug">{lang === "kk" ? lvl.kkDesc : lvl.desc}</p>
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

  const handleWordClick = (word: string) => {
    // Try the word as written ("didn't"), then without a possessive ("man's" -> "man"), then letters only.
    const withApostrophe = foldAccents(word).toLowerCase().replace(/[’]/g, "'").replace(/[^a-z']/g, "").replace(/^'+|'+$/g, "");
    const candidates = [withApostrophe, withApostrophe.replace(/'s$/, ""), withApostrophe.replace(/[^a-z]/g, "")];
    const found = candidates.map((c) => WORD_TRANSLATIONS[c]).find(Boolean);
    if (isReadAlongPlaying) { stopNarration(); setIsReadAlongPlaying(false); }
    setActiveWord(word);
    setTranslation(found || "Аудармасы әзірге жоқ");
    safePlayVoice(word);
  };

  const finishReadAlong = () => {
    stopNarration();
    setIsReadAlongPlaying(false);
    setReadAlongTokenIndex(null);
    setReadAlongSentence(null);
    onLevelDone?.(currentStory.id, selectedLevel);
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
  const alreadySaved = !!activeWord && savedWords && savedWords.some((w: any) => w.word === cleanActive);
  const levelColor = LEVEL_COLORS[selectedLevel] || LEVEL_COLORS.A1;
  // Saved words: learning ones get a sun highlight, mastered ones a jade underline.
  const savedMastery = new Map<string, number>((savedWords || []).map((w: any) => [w.word, w.mastery ?? 0]));
  const cleanTok = (tok: string) => foldAccents(tok).replace(/[^a-zA-Z]/g, "").toLowerCase();
  const savedInText = new Set(tokens.map(cleanTok).filter((w: string) => savedMastery.has(w))).size;
  const { week } = currentWeek();
  const activeWeekWord = activeWord ? weekWordOf(week, activeWord) : null;
  const weekInText = tokens.some((tok: string) => !savedMastery.has(cleanTok(tok)) && !!weekWordOf(week, tok));

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
            <StoryVideo src={BG_VIDEO_ASSETS.read} videoRef={videoRef} className="absolute inset-0" />
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

      <StoryHistory storyId={currentStory.id} lang={lang} />

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
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sun-soft border-b-2 border-sun-deep/60" />{lang === "kk" ? "Үйреніп жатырсың" : "Learning"}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-b-2 border-jade" />{lang === "kk" ? "Меңгерілді" : "Mastered"}</span>
              <span className="text-ink-3">{savedInText} {lang === "kk" ? "сақталған сөз осы мәтінде" : "saved words in this text"}</span>
            </>}
          </p>
        )}
        <p lang="en" className="text-[18px] text-ink leading-[1.9]">
          {tokens.map((tok: string, i: number) => {
            const isWord = /[a-zA-Z]/.test(tok);
            const inSentence = readAlongSentence !== null && sentenceOf[i] === readAlongSentence;
            if (!isWord) return <span key={i} className={inSentence ? "bg-sun-soft" : ""}>{tok}</span>;
            const isCurrentlyRead = i === readAlongTokenIndex;
            const isActive = activeWord === tok;
            const mastery = savedMastery.get(cleanTok(tok));
            const savedCls = mastery === undefined && weekWordOf(week, tok)
              ? "font-bold text-sky-deep hover:bg-sky-soft decoration-sky decoration-dashed decoration-2 underline underline-offset-[6px]"
              : mastery === undefined
              ? "hover:bg-sky-soft decoration-ink-3/40 decoration-dotted underline underline-offset-[6px]"
              : mastery >= MAX_MASTERY
              ? "hover:bg-jade-soft decoration-jade decoration-2 underline underline-offset-[6px]"
              : "bg-sun-soft hover:bg-sun/40 decoration-sun-deep/60 decoration-2 underline underline-offset-[6px]";
            return (
              <span
                key={i}
                ref={(el) => { wordRefs.current[i] = el; }}
                onClick={() => handleWordClick(tok)}
                className={`rounded-md px-0.5 -mx-0.5 cursor-pointer transition-colors duration-200 ${
                  isCurrentlyRead
                    ? "bg-sun text-ink"
                    : inSentence
                    ? "bg-sun-soft"
                    : isActive
                    ? "bg-sky-soft text-sky-deep"
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
          onClick={() => {
            onLevelDone?.(currentStory.id, selectedLevel);
            onQuizGate();
          }}
          className="btn flex-1"
        >
          {t.takeQuiz} <ChevronRight size={18} strokeWidth={3} />
        </button>
        <button onClick={() => setShowChoiceModal(true)} className="btn btn-ghost flex-1">
          <Compass size={18} strokeWidth={2.6} /> {t.interactiveChoiceTitle}
        </button>
      </div>
      <TrailButton storyId={currentStory.id} level={selectedLevel} text={text} lang={lang} userId={userId} onReward={onReward} />

      {/* Word sheet */}
      <Sheet open={!!activeWord} onClose={() => setActiveWord(null)} label={tr("Сөз", "Word")}>
        {activeWord && (
          <div className="p-6 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{tr("Ағылшынша", "English")}</p>
                <h3 className="font-display font-black text-[32px] text-ink leading-tight">{cleanActive}</h3>
                <p className="text-lg text-sky-deep font-semibold mt-1">{translation}</p>
                {activeWeekWord && (
                  <p className="mt-2 inline-flex flex-wrap items-center gap-x-2 rounded-xl bg-sky-soft px-2.5 py-1 text-[13px] font-semibold text-sky-deep">
                    <span className="font-black">{tr("Апта сөзі", "Word of the week")}</span>
                    <span>{activeWeekWord.family}</span>
                  </p>
                )}
              </div>
              <button onClick={() => safePlayVoice(activeWord)} aria-label={tr("Тыңдау", "Listen")} className="w-12 h-12 rounded-full bg-sky-soft text-sky flex items-center justify-center shrink-0">
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
                {alreadySaved ? <><Check size={18} strokeWidth={3} /> {tr("Сақталды", "Saved")}</> : <><Plus size={18} strokeWidth={3} /> {tr("Сөздігіме", "My words")}</>}
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
  const tr = useTr();
  return (
    <>
      <ScreenHeader eyebrow={tr("Сөздік", "Vocabulary")} title={mode === "match" ? tr("Жұбын тап", "Find the pair") : tr("Карточкалар", "Flashcards")} trailing={trailing} />
      {setMode && (
        <div className="segmented mb-5" role="group" aria-label={tr("Жаттығу түрі", "Practice mode")}>
          <button aria-pressed={mode === "cards"} onClick={() => setMode("cards")}>{tr("Карточкалар", "Flashcards")}</button>
          <button aria-pressed={mode === "match"} onClick={() => setMode("match")}>{tr("Сәйкестендіру", "Matching")}</button>
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
  onReview: (word: string, known: boolean) => void;
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

  const handleNext = (known: boolean) => {
    // Free practice doesn't move words between boxes. A word missed in this
    // session drops one box once; getting it right on the second pass doesn't undo that.
    if (!practice && !missed.has(currentWord.word)) onReview(currentWord.word, known);
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
          safePlayVoice(currentWord.word);
        }}
        aria-label={kk ? "Карточканы аудару" : "Flip card"}
        className="flip block w-full h-[280px]"
      >
        <div className={`flip-inner w-full h-full ${flipped ? "is-flipped" : ""}`}>
          <div className="flip-face card overflow-hidden flex flex-col items-center justify-center p-6">
            <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full" />
            <span className="eyebrow">{kk ? "Ағылшынша" : "English"}</span>
            <span className="font-display font-black text-[40px] text-ink mt-2">{currentWord.word}</span>
            <span className="mt-6 text-sm text-ink-3 flex items-center gap-1.5"><Volume2 size={15} /> {kk ? "Аудару үшін бас" : "Tap to flip"}</span>
            <span className="absolute bottom-4 flex gap-1.5" aria-label={kk ? `${MAX_MASTERY} қораптың ${box}-сі` : `Box ${box} of ${MAX_MASTERY}`}>
              {Array.from({ length: MAX_MASTERY }, (_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i < box ? "bg-jade" : "bg-sand-3"}`} />
              ))}
            </span>
          </div>
          <div className="flip-face flip-back rounded-[24px] bg-sky-deep shadow-[0_6px_0_#075F75] flex flex-col items-center justify-center p-6 text-white">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-white">Қазақша</span>
            <span className="font-display font-black text-[32px] mt-2 text-center">{currentWord.translation}</span>
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
export function MatchingGame({ savedWords, onReward, mode, setMode }: any) {
  const tr = useTr();
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
          <button onClick={() => setRound((r) => r + 1)} className="btn w-full mt-6">{tr("Келесі раунд", "Next round")}</button>
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

/* --- 6a. QUIZ SETUP --- */
// Pick the text and its level first; the quiz starts after "Бастау".
export function QuizSetup({ storyId, level, onChange, onStart, progress, lang, t }: {
  storyId: string;
  level: string | null;
  onChange: (storyId: string, level: string | null) => void;
  onStart: () => void;
  progress: Set<string>;
  lang: string;
  t: Record<string, string>;
}) {
  const kk = lang === "kk";
  // A level check counts as reading that level, so only levels already read
  // (or the one the learner just came from in the reader) can be picked here.
  const [entry] = useState(() => ({ storyId, level }));
  const canPick = (sid: string, lvl: string | null) =>
    lvl === null || progress.has(`${sid}:${lvl}`) || (sid === entry.storyId && lvl === entry.level);
  const modes = [
    { id: null, label: kk ? "Бүкіл ертегі" : "Whole tale" },
    ...LEVEL_DETAILS.map((l) => ({ id: l.id as string | null, label: l.id })),
  ];
  const story = STORIES.find((s: any) => s.id === storyId) || STORIES[0];
  const count = level ? buildLevelQuiz(story.levels[level as keyof typeof story.levels]).length : story.quizQuestions.length;

  return (
    <div className="animate-pop-in">
      <ScreenHeader eyebrow={kk ? "Сынаққа дайындал" : "Get ready"} title={t.quizTitle} />

      <p className="eyebrow mb-2">{kk ? "1. Мәтінді таңда" : "1. Choose a text"}</p>
      <div className="space-y-2">
        {STORIES.map((s: any) => {
          const active = s.id === storyId;
          const done = progress.has(`${s.id}:quiz`);
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id, canPick(s.id, level) ? level : null)}
              aria-pressed={active}
              className={`tile w-full text-left p-3 flex items-center gap-3 ${active ? "tile-selected" : "text-ink"}`}
            >
              <StoryCover id={s.id} className={`w-11 h-11 rounded-xl shrink-0 ${active ? "" : "opacity-80"}`} />
              <span className="flex-1 min-w-0">
                <span className="block font-display font-extrabold text-[15px] leading-snug">{displayTitle(s.title)}</span>
              </span>
              {done && <Check size={20} strokeWidth={3} className="text-jade shrink-0" />}
            </button>
          );
        })}
      </div>

      <p className="eyebrow mt-6 mb-2">{kk ? "2. Деңгейді таңда" : "2. Choose the level"}</p>
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => {
          const active = m.id === level;
          const done = m.id ? progress.has(`${storyId}:${m.id}`) : false;
          const open = canPick(storyId, m.id);
          return (
            <button
              key={m.label}
              onClick={() => open && onChange(storyId, m.id)}
              disabled={!open}
              aria-pressed={active}
              title={open ? undefined : (kk ? "Алдымен осы деңгейді оқы" : "Read this level first")}
              className={`tile h-11 px-4 text-sm font-bold flex items-center gap-1.5 ${active ? "tile-selected" : open ? "text-ink" : "text-ink-3 opacity-60"}`}
            >
              {!open && <Lock size={13} />}
              {m.label}
              {done && <Check size={14} strokeWidth={3} className="text-jade" />}
            </button>
          );
        })}
      </div>

      <div className="card p-4 mt-6 grid grid-cols-3 text-center">
        <div><p className="font-display font-black text-xl text-ink">{count}</p><p className="text-xs text-ink-2">{kk ? "сұрақ" : "questions"}</p></div>
        <div className="border-x-2 border-line"><p className="font-display font-black text-xl text-ink">2</p><p className="text-xs text-ink-2">{kk ? "мүмкіндік" : "tries each"}</p></div>
        <div><p className="font-display font-black text-xl text-ink">{Math.ceil(count * 0.6)}/{count}</p><p className="text-xs text-ink-2">{kk ? "өту үшін" : "to pass"}</p></div>
      </div>
      <p className="text-[13px] text-ink-2 mt-3 leading-relaxed">
        {kk ? "Уақыт шектеулі емес. Қателессең, ертегідегі сөйлемді көрсетіп, тағы бір мүмкіндік береміз." : "No time limit. If you get one wrong, we show you the line in the tale and give you another try."}
      </p>

      <button onClick={onStart} className="btn w-full mt-6">
        {kk ? "Бастау" : "Start"} <ArrowRight size={20} />
      </button>
    </div>
  );
}

/* --- 6. QUIZ SCREEN --- */
// No timer and no hearts: a wrong answer sends the learner back to the tale
// for one more try, and only then shows the right answer with its sentence.
type QuizQuestion = { type?: string; q?: string; sentence?: string; options: string[]; correct: number };
type QuizResult = "first" | "second" | "missed";

export function QuizScreen({ onReward, t, onQuizFinish, questions, storyTitle, onExit, sourceTexts = [] }: {
  onExit?: () => void;
  onReward: (xp: number) => void;
  t: Record<string, string>;
  onQuizFinish?: (correct: number, total: number, firstTry: number) => void;
  questions: QuizQuestion[];
  storyTitle?: string;
  sourceTexts?: string[];
}) {
  const tr = useTr();
  // The questions of this round, as indexes into `questions`. A practice round
  // holds only the ones missed, earns no XP and doesn't count as a quiz.
  const [round, setRound] = useState(() => questions.map((_, i) => i));
  const [practice, setPractice] = useState(false);
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [status, setStatus] = useState<"answering" | "correct" | "revealed">("answering");
  const [results, setResults] = useState<QuizResult[]>([]);
  const [finished, setFinished] = useState(false);

  const question = questions[round[pos]];
  const answer = question?.options[question.correct] ?? "";
  const isGap = !!question?.sentence?.includes("___");
  // With two options, one wrong pick leaves nothing to choose, so reveal at once.
  const maxTries = Math.min(2, (question?.options.length ?? 2) - 1);
  const evidence = question ? findEvidence(question, sourceTexts) : null;
  // A gap sentence read aloud carries the missing word, so it is the hint for gaps.
  const fullSentence = isGap ? (question.sentence || "").replace("___", answer) : null;
  const done = status !== "answering";

  useEffect(() => () => stopVoice(), []);

  const handleCheck = () => {
    if (selected === null || done) return;
    stopVoice();
    if (selected === question.correct) {
      const firstTry = wrongPicks.length === 0;
      if (!practice) onReward(firstTry ? 10 : 5);
      setResults((r) => [...r, firstTry ? "first" : "second"]);
      setStatus("correct");
      return;
    }
    const picks = [...wrongPicks, selected];
    setWrongPicks(picks);
    setSelected(null);
    if (picks.length >= maxTries) {
      setResults((r) => [...r, "missed"]);
      setStatus("revealed");
    }
  };

  const startRound = (indexes: number[], isPractice: boolean) => {
    stopVoice();
    setRound(indexes);
    setPractice(isPractice);
    setPos(0);
    setSelected(null);
    setWrongPicks([]);
    setStatus("answering");
    setResults([]);
    setFinished(false);
  };

  const handleNext = () => {
    stopVoice();
    if (pos + 1 >= round.length) {
      setFinished(true);
      return;
    }
    setPos(pos + 1);
    setSelected(null);
    setWrongPicks([]);
    setStatus("answering");
  };

  const correct = results.filter((r) => r !== "missed").length;
  const firstTry = results.filter((r) => r === "first").length;

  useEffect(() => {
    if (finished && !practice && onQuizFinish) onQuizFinish(correct, round.length, firstTry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Keyboard: 1–4 pick an option, Enter checks or moves on.
  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (document.querySelector("[role=dialog]")) return;
      const n = Number(e.key) - 1;
      if (!done && n >= 0 && n < question.options.length && !wrongPicks.includes(n)) {
        setSelected(n);
        // Let the next Enter check the answer, not press whatever button had focus.
        (document.activeElement as HTMLElement | null)?.blur();
      }
      else if (e.key === "Enter" && !(el instanceof HTMLButtonElement)) {
        if (done) handleNext();
        else handleCheck();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const askShoqan = () => {
    const task = question.sentence || question.q || "";
    const mine = wrongPicks.length ? ` I chose "${question.options[wrongPicks[wrongPicks.length - 1]]}".` : "";
    window.dispatchEvent(new CustomEvent("shoqan:open", {
      detail: `Why is "${answer}" the right answer here: "${task}"?${mine} Explain simply, comparing with Kazakh.${tr(" Answer in Kazakh, in Cyrillic script.", "")}`,
    }));
  };

  if (!question && !finished) {
    return (
      <div className="card p-8 text-center animate-pop-in">
        <p className="font-display font-black text-xl text-ink">{tr("Бұл мәтінге сұрақ әлі жоқ", "No questions for this text yet")}</p>
        {onExit && <button onClick={onExit} className="btn w-full mt-6">{tr("Сынақтарға оралу", "Back to quizzes")}</button>}
      </div>
    );
  }

  if (finished) {
    const total = round.length;
    const passed = correct >= Math.ceil(total * 0.6);
    const toPractice = round.filter((_, i) => results[i] !== "first");
    return (
      <div className="animate-pop-in">
        <div className="text-center pt-6">
          <span className={`mx-auto w-28 h-28 rounded-full flex items-center justify-center ${passed ? "bg-sun shadow-[0_6px_0_var(--color-sun-deep)]" : "bg-sand-3 shadow-[0_6px_0_var(--color-line-2)]"}`}>
            <Trophy className={passed ? "text-ink" : "text-ink-3"} size={52} />
          </span>
          <h2 className="large-title mt-6">
            {practice ? tr("Жаттығу аяқталды", "Practice done") : passed ? tr("Сабақ аяқталды!", "Lesson complete!") : tr("Аз қалды", "Almost there")}
          </h2>
          <p className="text-[15px] text-ink-2 mt-2 max-w-[320px] mx-auto">
            {practice
              ? tr("Қате кеткен сұрақтарды тағы бір рет өттің.", "You went over the questions you missed once more.")
              : passed
                ? tr("Керемет! Ертегіні жақсы түсіндің.", "Great comprehension! You understood the story well.")
                : tr(`Өту үшін ${Math.ceil(total * 0.6)} дұрыс жауап керек. Ертегіні қайта оқып, тағы байқап көр.`, `You need ${Math.ceil(total * 0.6)} right answers to pass. Re-read the story and try again.`)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-7">
          {[
            { label: tr("Дұрыс", "Correct"), value: `${correct}/${total}`, color: "border-sky text-sky-deep", head: "bg-sky-deep text-white" },
            { label: tr("Бірден", "First try"), value: `${firstTry}/${total}`, color: "border-jade text-jade-deep", head: "bg-[#15805A] text-white" },
            { label: "XP", value: practice ? "—" : `+${firstTry * 10 + (correct - firstTry) * 5}`, color: "border-sun-deep text-ink", head: "bg-sun-deep text-ink" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border-2 overflow-hidden ${s.color}`}>
              <p className={`${s.head} text-xs font-bold uppercase tracking-[0.06em] py-1 text-center truncate px-1`}>{s.label}</p>
              <p className="font-display font-black text-xl text-center py-3 bg-card">{s.value}</p>
            </div>
          ))}
        </div>
        {toPractice.length > 0 && (
          <button onClick={() => startRound(toPractice, true)} className="btn w-full mt-7">
            <RotateCcw size={18} /> {tr(`Қателерді қайталау (${toPractice.length})`, `Practise mistakes (${toPractice.length})`)}
          </button>
        )}
        <button onClick={() => startRound(questions.map((_, i) => i), false)} className={`btn w-full ${toPractice.length ? "btn-ghost mt-3" : "mt-7"}`}>
          {tr("Басынан бастау", "Start again")}
        </button>
        {onExit && <button onClick={onExit} className="btn btn-ghost w-full mt-3">{tr("Сынақтарға оралу", "Back to quizzes")}</button>}
      </div>
    );
  }

  const blank = status === "answering" ? (selected !== null ? question.options[selected] : " ") : answer;

  return (
    <div className="animate-pop-in">
      {/* Exit + progress */}
      <div className="flex items-center gap-4 pt-2">
        {onExit && (
          <button onClick={onExit} aria-label={tr("Сынақтан шығу", "Leave quiz")} className="w-9 h-9 -ml-1 rounded-full text-ink-3 hover:bg-sand-2 flex items-center justify-center shrink-0">
            <X size={22} strokeWidth={2.6} />
          </button>
        )}
        <div className="track flex-1"><span style={{ width: `${((pos + (done ? 1 : 0)) / round.length) * 100}%` }} /></div>
        <span className="text-sm font-bold text-ink-2 tabular-nums shrink-0">{pos + 1}/{round.length}</span>
      </div>

      <div className="flex items-center justify-between gap-3 mt-5">
        <p className="eyebrow truncate">{storyTitle ? displayTitle(storyTitle) : t.quizTitle}</p>
        {practice && <span className="chip h-7 text-[13px] text-ink-2 shrink-0"><RotateCcw size={13} /> {tr("Жаттығу", "Practice")}</span>}
      </div>

      <div className="mt-3 mb-6">
        {isGap ? (
          <>
            <h2 className="font-display font-black text-[22px] text-ink">{tr("Бос орынды толтыр", "Fill in the blank")}</h2>
            <p lang="en" className="text-[18px] text-ink leading-relaxed mt-3">
              {(question.sentence || "").split("___")[0]}
              <span className={`inline-block min-w-[72px] border-b-[3px] mx-1 text-center font-bold ${done ? (status === "correct" ? "border-jade text-jade-deep" : "border-felt text-felt-deep") : "border-sky text-sky-deep"}`}>
                {blank}
              </span>
              {(question.sentence || "").split("___")[1]}
            </p>
          </>
        ) : (
          <h2 lang="en" className="font-display font-black text-[22px] leading-snug text-ink">{question.q}</h2>
        )}
      </div>

      <div lang="en" className="space-y-3">
        {question.options.map((opt: string, idx: number) => {
          const ruledOut = wrongPicks.includes(idx);
          let state = "text-ink hover:border-sky/40";
          let anim = "";
          if (selected === idx) state = "tile-selected";
          if (ruledOut) {
            state = "tile-wrong opacity-70";
            if (!done && idx === wrongPicks[wrongPicks.length - 1]) anim = "animate-answer-wrong";
          }
          if (done) {
            if (idx === question.correct) { state = "tile-correct"; anim = "animate-answer-correct"; }
            else if (!ruledOut) state = "text-ink-3";
          }
          return (
            <button
              key={idx}
              disabled={done || ruledOut}
              onClick={() => setSelected(idx)}
              aria-pressed={selected === idx}
              className={`tile w-full text-left p-3.5 flex items-center gap-3.5 ${state} ${anim}`}
            >
              <span className="w-8 h-8 rounded-lg border-2 border-current/25 flex items-center justify-center font-display font-black text-sm shrink-0 opacity-70">
                {idx + 1}
              </span>
              <span className={`flex-1 text-[16px] font-semibold ${ruledOut ? "line-through decoration-2" : ""}`}>{opt}</span>
              {done && idx === question.correct && <Check size={20} strokeWidth={3} className="text-jade" />}
              {ruledOut && <X size={20} strokeWidth={3} className="text-felt" />}
            </button>
          );
        })}
      </div>

      {/* One more try: point back to the tale without naming the answer. */}
      {!done && wrongPicks.length > 0 && (
        <div className="mt-6 rounded-[24px] p-5 bg-sun-soft animate-pop-in" aria-live="polite">
          <p className="font-display font-black text-lg text-ink">{tr("Қате. Тағы бір мүмкіндік бар", "Not quite. You have one more try")}</p>
          {isGap ? (
            <>
              <p className="text-[15px] text-ink-2 mt-1">{tr("Сөйлемді тыңдап, жетіспейтін сөзді тап.", "Listen to the sentence and catch the missing word.")}</p>
              <button onClick={() => safePlayVoice(fullSentence || "")} className="btn btn-ghost btn-sm mt-3"><Volume2 size={16} /> {tr("Сөйлемді тыңдау", "Listen to the sentence")}</button>
            </>
          ) : evidence ? (
            <>
              <p className="text-[15px] text-ink-2 mt-1">{tr("Ертегіде осылай делінген:", "Here is what the tale says:")}</p>
              <blockquote className="mt-2 border-l-4 border-sun-deep pl-3 text-[16px] text-ink leading-relaxed italic">{evidence}</blockquote>
              <button onClick={() => safePlayVoice(evidence)} className="btn btn-ghost btn-sm mt-3"><Volume2 size={16} /> {tr("Тыңдау", "Listen")}</button>
            </>
          ) : (
            <p className="text-[15px] text-ink-2 mt-1">{tr("Ертегіні есіңе түсір: кім, не істеді, неге? Қалған нұсқалардан таңда.", "Think back to the tale: who did what, and why? Pick from the options left.")}</p>
          )}
        </div>
      )}

      {!done ? (
        <button onClick={handleCheck} disabled={selected === null} className="btn w-full mt-7">
          {t.checkAnswer}
        </button>
      ) : (
        <div className={`mt-7 rounded-[24px] p-5 animate-pop-in ${status === "correct" ? "bg-jade-soft" : "bg-felt-soft"}`} aria-live="polite">
          <div className="flex items-start gap-3">
            <span className={`w-11 h-11 rounded-full bg-card flex items-center justify-center shrink-0 ${status === "correct" ? "text-jade" : "text-felt"}`}>
              {status === "correct" ? <Check size={24} strokeWidth={3.5} /> : <X size={24} strokeWidth={3.5} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-display font-black text-xl ${status === "correct" ? "text-jade-deep" : "text-felt-deep"}`}>
                {status === "correct"
                  ? (wrongPicks.length ? tr("Дұрыс, екінші әрекетпен!", "Right, on the second try!") : t.correctMsg)
                  : tr("Дұрыс жауап:", "The right answer:")}
              </p>
              {status === "revealed" && <p className="text-[15px] text-felt-deep font-semibold">{answer}</p>}
              {!practice && (
                <p className="text-sm font-bold text-ink-2 mt-0.5">
                  {status === "correct" ? `+${wrongPicks.length ? 5 : 10} XP` : tr("Бұл сұрақ жаттығуда қайта шығады", "This one comes back in practice")}
                </p>
              )}
            </div>
          </div>
          {status === "revealed" && (fullSentence || evidence) && (
            <div className="mt-3 rounded-2xl bg-card p-3">
              <p className="text-[15px] text-ink leading-relaxed italic">{fullSentence || evidence}</p>
              <button onClick={() => safePlayVoice(fullSentence || evidence || "")} className="mt-2 h-8 px-3 rounded-full bg-sand-2 text-ink text-sm font-bold inline-flex items-center gap-1.5">
                <Volume2 size={15} /> {tr("Тыңдау", "Listen")}
              </button>
            </div>
          )}
          {status === "revealed" && (
            <button onClick={askShoqan} className="mt-3 h-8 px-3 rounded-full bg-card text-felt-deep text-sm font-bold inline-flex items-center gap-1.5">
              <MessageCircle size={15} /> {tr("Неге? Шоқаннан сұра", "Why? Ask Shoqan")}
            </button>
          )}
          <button onClick={handleNext} className={`btn w-full mt-4 ${status === "correct" ? "btn-jade" : "btn-felt"}`}>
            {pos + 1 >= round.length ? tr("Нәтижені көру", "See results") : tr("Жалғастыру", "Continue")}
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
// Practice phrases: every sentence from every story, grouped by level.
// Higher levels allow longer sentences, since their texts use them.
const SPEAK_LEVELS = LEVEL_DETAILS.map((l) => l.id);
const SPEAK_MAX_WORDS: Record<string, number> = { A1: 16, A2: 18, B1: 24, B2: 32, C1: 40 };
const SPEAK_PHRASES: Record<string, string[]> = Object.fromEntries(
  SPEAK_LEVELS.map((lvl) => [
    lvl,
    STORIES.flatMap((s: any) => (s.levels[lvl] as string).match(/[^.!?]+[.!?]/g) ?? [])
      .map((x: string) => x.trim())
      .filter((x: string) => !/["“”]/.test(x) && x.split(/\s+/).length >= 4 && x.split(/\s+/).length <= (SPEAK_MAX_WORDS[lvl] ?? 24)),
  ])
);

// Share of the target's words the learner actually said. Below half, they read
// something else, and a pronunciation score would only mislead.
const speechWords = (s: string) => foldAccents(s).toLowerCase().replace(/’/g, "'").match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
function matchShare(target: string, said: string) {
  const heard = new Set(speechWords(said));
  const wanted = speechWords(target);
  return wanted.length ? wanted.filter((w) => heard.has(w)).length / wanted.length : 0;
}

export function SpeakScreen({ onReward, t }: {
  onReward: (xp: number) => void;
  t: Record<string, string>;
}) {
  const tr = useTr();
  const [recording, setRecording] = useState(false);
  const [scores, setScores] = useState<{
    accuracy: number;
    fluency: number;
    completeness: number;
    pronunciation: number;
  } | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [wordScores, setWordScores] = useState<{ word: string; score: number; error: string }[]>([]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [misread, setMisread] = useState(false);
  const recognizerRef = useRef<{ stopContinuousRecognitionAsync?: () => void; close?: () => void } | null>(null);

  const [speakLevel, setSpeakLevel] = useState("A2");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrases = SPEAK_PHRASES[speakLevel];
  const targetPhrase = phrases[phraseIndex % phrases.length];
  const changePhrase = (level: string, index: number) => {
    setSpeakLevel(level);
    setPhraseIndex(index);
    setScores(null);
    setTranscript("");
    setWordScores([]);
    setSpeechError(null);
    setMisread(false);
  };

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
    setMisread(false);
    setScores(null);
    setTranscript("");
    setWordScores([]);

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
            if (matchShare(targetPhrase, result.text) < 0.5 || assessment.completenessScore < 40) {
              setMisread(true);
              recognizer.close();
              return;
            }
            // Per-word accuracy, so the learner sees exactly which words to fix.
            const words = (assessment.detailResult?.Words ?? []) as { Word: string; PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string } }[];
            setWordScores(words.map((w) => ({
              word: w.Word,
              score: Math.round(w.PronunciationAssessment?.AccuracyScore ?? 0),
              error: w.PronunciationAssessment?.ErrorType ?? "None",
            })));
            const next = {
              accuracy: Math.round(assessment.accuracyScore),
              fluency: Math.round(assessment.fluencyScore),
              completeness: Math.round(assessment.completenessScore),
              pronunciation: Math.round(assessment.pronunciationScore),
            };
            setScores(next);
            if (next.pronunciation >= 50) onReward(Math.round(5 + (next.pronunciation / 100) * 15));
          } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
            setSpeechError(tr("Естілмеді. Микрофонға жақынырақ, қаттырақ сөйлеп көр.", "Didn't catch that — try speaking a bit louder and closer to the mic."));
          } else {
            setSpeechError(tr("Сөйлеуді тану кезінде қате шықты. Қайта байқап көр.", "Something went wrong with speech recognition. Please try again."));
          }
          recognizer.close();
        },
        () => {
          setRecording(false);
          setSpeechError(tr("Дыбыс қызметіне қосылу мүмкін болмады. Қайта байқап көр.", "Something went wrong reaching the speech service. Please try again."));
          recognizer.close();
        }
      );
    } catch (err: unknown) {
      setRecording(false);
      setSpeechError((err instanceof Error ? err.message : null) || tr("Жаттығу басталмады: микрофонға рұқсатты тексер.", "Couldn't start pronunciation practice — check your microphone permissions."));
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
      ? tr("Жақсы, үлгіге жақын. Тағы тыңдап, қайта айтып көр.", "Good — close to the target. Listen again and try once more.")
      : tr("Жаттыға бер: динамикті басып тыңда да, үлгіге жақындатып айт.", "Keep practicing — tap the speaker to hear it again, then try to match it closely.");

  return (
    <div className="animate-pop-in">
      <ScreenHeader eyebrow={tr("Айтылым", "Pronunciation")} title={t.speakTitle} />

      <div className="segmented mb-4" role="group" aria-label={tr("Деңгей", "Level")}>
        {SPEAK_LEVELS.map((lvl) => (
          <button key={lvl} aria-pressed={speakLevel === lvl} disabled={recording} onClick={() => changePhrase(lvl, 0)}>
            {lvl}
          </button>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{t.speakSubtitle}</p>
          <span className="text-xs font-bold text-ink-3 whitespace-nowrap shrink-0">{(phraseIndex % phrases.length) + 1} / {phrases.length}</span>
        </div>
        <div className="flex items-start gap-4 mt-3">
          <p className="flex-1 font-display font-extrabold text-[22px] leading-snug text-ink">“{targetPhrase}”</p>
          <button onClick={() => safePlayVoice(targetPhrase)} aria-label={tr("Тыңдау", "Listen")} className="w-12 h-12 rounded-full bg-sky-soft text-sky flex items-center justify-center shrink-0">
            <Volume2 size={22} />
          </button>
        </div>
        <button onClick={() => changePhrase(speakLevel, phraseIndex + 1)} disabled={recording} className="btn btn-ghost btn-sm w-full mt-5">
          <RotateCcw size={16} /> {t.nextPhrase}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-10">
        <div className="relative">
          {recording && <span className="absolute inset-0 rounded-full bg-felt/30 animate-ping" />}
          <button
            onClick={toggleRecord}
            aria-label={recording ? tr("Жазуды тоқтату", "Stop recording") : tr("Жазуды бастау", "Start recording")}
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

      {misread && (
        <div className="card p-6 text-center animate-pop-in">
          <span className="mx-auto w-14 h-14 rounded-full bg-felt-soft text-felt flex items-center justify-center">
            <X size={28} strokeWidth={3} />
          </span>
          <p className="font-display font-black text-xl text-felt-deep mt-3">{tr("Сөйлем дұрыс оқылмады", "That's not the sentence")}</p>
          <p className="text-[15px] text-ink-2 mt-1">{tr("Жоғарыдағы сөйлемге қарап, қайта оқып көр.", "Look at the sentence above and read it again.")}</p>
          {transcript && <p className="text-sm text-ink-3 italic mt-3">{tr("Естілгені", "We heard")}: “{transcript}”</p>}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => safePlayVoice(targetPhrase)} className="btn btn-ghost btn-sm"><Volume2 size={16} /> {tr("Тыңдау", "Listen")}</button>
            <button onClick={toggleRecord} className="btn btn-felt btn-sm"><Mic size={16} /> {tr("Қайталау", "Try again")}</button>
          </div>
        </div>
      )}

      {scores !== null && (
        <div className="card p-6 animate-pop-in">
          <div className="flex items-center gap-5">
            <ScoreRing value={scores.pronunciation} />
            <div className="flex-1 space-y-3">
              {[
                { label: tr("Дәлдік", "Accuracy"), v: scores.accuracy },
                { label: tr("Еркіндік", "Fluency"), v: scores.fluency },
                { label: tr("Толықтық", "Completeness"), v: scores.completeness },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm"><span className="text-ink-2">{m.label}</span><b className="text-ink">{m.v}</b></div>
                  <div className="track h-2 mt-1"><span style={{ width: `${m.v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          {wordScores.length > 0 && (
            <div className="mt-5">
              <p className="eyebrow mb-2">{tr("Сөзбе-сөз · тыңдау үшін бас", "Word by word · tap to hear")}</p>
              <div className="flex flex-wrap gap-2">
                {wordScores.map((w, i) => {
                  const missed = w.error === "Omission";
                  const cls = missed
                    ? "bg-felt-soft text-felt-deep line-through"
                    : w.score >= 80 ? "bg-jade-soft text-jade-deep" : w.score >= 60 ? "bg-sun-soft text-ink" : "bg-felt-soft text-felt-deep";
                  return (
                    <button key={i} onClick={() => safePlayVoice(w.word)} className={`h-9 px-3 rounded-xl font-semibold text-[15px] flex items-center gap-1.5 ${cls}`}>
                      {w.word}
                      <span className="text-xs font-bold opacity-70">{missed ? "—" : w.score}</span>
                    </button>
                  );
                })}
              </div>
              {wordScores.some((w) => w.score < 60 || w.error === "Omission") && (
                <p className="text-sm text-ink-2 mt-3">{tr("Қызыл сөздерді пысықта: тыңда да, сөйлемді қайта жаз.", "Red words need work: listen, then record the phrase again.")}</p>
              )}
            </div>
          )}
          {transcript && <p className="text-sm text-ink-2 italic mt-5">You said: “{transcript}”</p>}
          <p className="text-[15px] text-ink mt-2">{feedbackMessage}</p>
        </div>
      )}
    </div>
  );
}

/* --- 8. PROFILE SCREEN --- */
export function ProfileScreen({ xp, t, lang = "kk", setLang, savedWordsCount = 0, unlockedAchievements = [], userName = "Learner", onSignOut, streakDays = 0, quizzesCompleted = 0, kilim, classes, onOpenTeacher }: {
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
  kilim?: React.ReactNode;
  classes?: React.ReactNode;
  onOpenTeacher?: () => void;
}) {
  const [showBuklet, setShowBuklet] = useState(false);
  // Levels count from 1: 0–99 XP is level 1.
  const rank = Math.floor(xp / 100) + 1;
  const initial = (userName || "?").trim().charAt(0).toUpperCase();

  const stats = [
    { label: t.streakLabel, value: streakDays, Icon: IconFlame },
    { label: t.totalXpLabel, value: xp, Icon: IconBolt },
    { label: lang === "kk" ? "Сөздер" : "Words", value: savedWordsCount, Icon: IconCards },
    { label: lang === "kk" ? "Сынақтар" : "Quizzes", value: quizzesCompleted, Icon: IconTrophy },
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
            <p className="text-sm text-ink-2">{t.levelStatus} · {lang === "kk" ? `${rank}-деңгей` : `Level ${rank}`}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="font-display font-black text-xl text-ink mb-3">{lang === "kk" ? "Статистика" : "Statistics"}</h2>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="tile p-4 flex items-center gap-3">
              <Icon size={32} className="shrink-0" />
              <div className="min-w-0">
                <p className="font-display font-black text-xl text-ink leading-none">{value}</p>
                <p className="text-[13px] text-ink-2 mt-1 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {kilim}

      {/* Achievements */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-black text-xl text-ink">{lang === "kk" ? "Мұра артефактілері" : "Achievements"}</h2>
          <span className="text-sm font-bold text-ink-3">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="card p-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchievements.includes(a.id);
            return (
              <div key={a.id} title={lang === "kk" ? a.kk.desc : a.desc} className="text-center">
                <Badge glyph={a.badge.glyph} color={a.badge.color} locked={!unlocked} size={72} className={`mx-auto ${unlocked ? "animate-pop-in" : ""}`} />
                <span className={`block text-xs font-semibold mt-1.5 leading-tight ${unlocked ? "text-ink" : "text-ink-2"}`}>{lang === "kk" ? a.kk.title : a.title}</span>
                <span className="sr-only">{unlocked ? (lang === "kk" ? "ашылды" : "unlocked") : (lang === "kk" ? "жабық" : "locked")}. {lang === "kk" ? a.kk.desc : a.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {classes}

      {/* Settings — Apple grouped list */}
      <div className="card overflow-hidden divide-y divide-line">
        {onOpenTeacher && (
          <button onClick={onOpenTeacher} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60">
            <span className="w-8 h-8 rounded-lg bg-night flex items-center justify-center"><GraduationCap size={16} className="text-white" /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[16px] text-ink">{lang === "kk" ? "Мұғалім кабинеті" : "Teacher cabinet"}</span>
              <span className="block text-[13px] text-ink-2">{lang === "kk" ? "Сынып ашу, тапсырма беру, прогресті көру" : "Create classes, give assignments, see progress"}</span>
            </span>
            <ChevronRight size={18} className="text-ink-3" />
          </button>
        )}
        <div className="flex items-center justify-between gap-3 px-4 min-h-[56px]">
          <span className="text-[16px] text-ink">{lang === "kk" ? "Тіл" : "Language"}</span>
          {setLang && (
            <div className="segmented w-[120px]" role="group" aria-label={lang === "kk" ? "Тіл" : "Language"}>
              <button aria-pressed={lang === "kk"} onClick={() => setLang("kk")}>ҚАЗ</button>
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
          <span className="flex-1 text-[16px] text-felt font-medium">{lang === "kk" ? "Шығу" : "Sign out"}</span>
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
                { l: lang === "kk" ? "Күн" : "Streak", v: streakDays },
                { l: lang === "kk" ? "Белгілер" : "Badges", v: `${unlockedAchievements.length}/${ACHIEVEMENTS.length}` },
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
