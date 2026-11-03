import { useState } from "react";
import { Play, Trophy, Check, BookOpen, Lock } from "lucide-react";
import { DailyGoalRing } from "../UIHelpers";
import { displayTitle } from "../../utils/text";
import { OrnamentBand, Tumar } from "../Ornaments";
import { STORIES, LEVEL_DETAILS } from "../../constants";
import { MaqalCard } from "../Culture";
import { LegendDeckEntry } from "../LegendCards";
import { CouncilCard } from "../Council";
import { WeekWordsCard } from "../WeekWords";
import { StoryCover } from "../StoryCover";
import type { ReactNode } from "react";
import type { Lang } from "../../lang";
import { LEVEL_COLORS, type UiText } from "./shared";

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

export interface HomeScreenProps {
  onStartRead: (storyId: string, level?: string) => void;
  onStartQuiz: (storyId: string) => void;
  t: UiText;
  lang: Lang;
  userName?: string;
  sessionXp?: number;
  dailyGoal?: number;
  progress?: Set<string>;
  userId?: string;
  onReward?: (xp: number) => void;
  onOpenCards?: () => void;
  /** The teacher's assignments card, shown first on the path. */
  assignments?: ReactNode;
}

export function HomeScreen({ onStartRead, onStartQuiz, t, lang, userName = "", sessionXp = 0, dailyGoal = 50, progress = new Set<string>(), userId, onReward = () => {}, onOpenCards = () => {}, assignments = null }: HomeScreenProps) {
  // Next step on the path: first level or quiz not yet finished, in order.
  const steps = STORIES.flatMap((s) => [...LEVEL_DETAILS.map((l) => ({ story: s, step: l.id })), { story: s, step: "quiz" }]);
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
        <img src="/shoqan-avatar.webp" width={128} height={128} decoding="async" alt="Shoqan" className="w-16 h-16 rounded-full object-cover border-[3px] border-sun shadow-[0_4px_0_var(--color-sun-deep)] shrink-0" />
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
      {STORIES.map((story, si) => {
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
