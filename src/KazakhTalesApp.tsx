import { useState, useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  BookOpen, Trophy, Home as HomeIcon, User, Layers, Mic, Flame, Zap
} from "lucide-react";
import {
  LevelUpModal, AchievementBanner, XpToast,
  StaticOrnamentBg, SaveErrorToast, BrandMark, DailyGoalRing
} from "./components/UIHelpers";
import { KilimStrip } from "./components/Ornaments";
import { ShoqanChat } from "./components/ShoqanChat";
import {
  HomeScreen, ReaderScreen, FlashcardsScreen, MatchingGame,
  QuizScreen, QuizSetup, SpeakScreen, ProfileScreen
} from "./components/Screens";
import { DICT, ACHIEVEMENTS, STORIES } from "./constants";
import { LangContext, loadLang, saveLang, type Lang } from "./lang";
import type { SavedWord } from "./types";
import { supabase } from "./lib/supabase";
import { saveToSupabase } from "./utils/supabase-save";
import { buildLevelQuiz } from "./utils/levelQuiz";
import { BataModal, OyuKilim, TurkicWords, loadMaqals } from "./components/Culture";
import { WordCoach } from "./components/WordCoach";
import {
  loadProgress, saveProgress, progressKey, loadLocalReviews, saveReview,
  nextReview, isDue, MAX_MASTERY, type ProgressStep
} from "./utils/progress";

export default function KazakhTalesApp({ session }: { session: Session }) {
  const userId: string = session.user.id;
  const userEmail: string = session.user.email || "";
  const [displayName, setDisplayName] = useState<string>(
    (session.user.user_metadata?.display_name as string | undefined) || userEmail.split("@")[0] || "Learner"
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [tab, setTab] = useState("home");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  // Set when the quiz was opened from the reader: a short check for that level only.
  const [quizLevel, setQuizLevel] = useState<ProgressStep | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [bataStory, setBataStory] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [lang, setLangState] = useState<Lang>(loadLang);
  const setLang = (next: string) => {
    const l: Lang = next === "en" ? "en" : "kk";
    setLangState(l);
    saveLang(l);
  };

  const [streakDays, setStreakDays] = useState(0);
  const lastActiveDateRef = useRef<string | null>(null);

  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [wordsMode, setWordsMode] = useState("cards");

  const [sessionXp, setSessionXp] = useState(0);
  const DAILY_GOAL = 50;

  const [xpToast, setXpToast] = useState<{ amount: number; key: number } | null>(null);
  const xpToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevXpRef = useRef(xp);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpRank, setLevelUpRank] = useState(0);

  const [quizzesCompleted, setQuizzesCompleted] = useState(0);
  const [perfectQuizzes, setPerfectQuizzes] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [achievementQueue, setAchievementQueue] = useState<(typeof ACHIEVEMENTS)[number][]>([]);

  // Save-error toast
  const [showSaveError, setShowSaveError] = useState(false);
  const saveErrorShowingRef = useRef(false);

  // Refs for latest mutable values — retries read these so they save the
  // freshest state even if the user accumulated more progress in the 1s window.
  const latestXpRef = useRef(0);
  const latestQuizzesRef = useRef(0);
  const latestPerfectRef = useRef(0);
  const latestStreakRef = useRef<{ streak_days: number; last_active_date: string }>({
    streak_days: 0,
    last_active_date: "",
  });

  useEffect(() => { latestXpRef.current = xp; }, [xp]);
  useEffect(() => { latestQuizzesRef.current = quizzesCompleted; }, [quizzesCompleted]);
  useEffect(() => { latestPerfectRef.current = perfectQuizzes; }, [perfectQuizzes]);

  const t = DICT[lang as keyof typeof DICT];

  const onSaveError = () => {
    if (saveErrorShowingRef.current) return;
    saveErrorShowingRef.current = true;
    setShowSaveError(true);
    setTimeout(() => {
      setShowSaveError(false);
      saveErrorShowingRef.current = false;
    }, 4000);
  };

  useEffect(() => {
    let cancelled = false;

    const loadUserData = async () => {
      const [profileRes, wordsRes, achievementsRes, progressSet] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("saved_words").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
        loadProgress(userId),
      ]);

      if (cancelled) return;

      if (profileRes.data) {
        // Loading saved XP is not a level-up; start the rank baseline here.
        prevXpRef.current = profileRes.data.xp ?? 0;
        setXp(profileRes.data.xp ?? 0);
        setQuizzesCompleted(profileRes.data.quizzes_completed ?? 0);
        setPerfectQuizzes(profileRes.data.perfect_quizzes ?? 0);
        setStreakDays(profileRes.data.streak_days ?? 0);
        lastActiveDateRef.current = profileRes.data.last_active_date ?? null;
        if (profileRes.data.display_name) setDisplayName(profileRes.data.display_name as string);
      }
      setProgress(progressSet);
      if (wordsRes.data) {
        const localReviews = loadLocalReviews(userId);
        setSavedWords(
          wordsRes.data.map((row: { word: string; translation: string; mastery: number; next_review_at?: string | null }) => ({
            word: row.word,
            translation: row.translation,
            mastery: row.mastery,
            nextReviewAt: row.next_review_at ?? localReviews[row.word] ?? null,
          }))
        );
      }
      if (achievementsRes.data) {
        setUnlockedAchievements(achievementsRes.data.map((row: { achievement_id: string }) => row.achievement_id));
      }
      setDataLoaded(true);
    };

    loadUserData().catch(() => setDataLoaded(true));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) onSaveError();
  };

  const checkAndUpdateStreak = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (lastActiveDateRef.current === today) return;

    let nextStreak = 1;
    if (lastActiveDateRef.current) {
      const prevDate = new Date(lastActiveDateRef.current + "T00:00:00Z");
      const todayDate = new Date(today + "T00:00:00Z");
      const diffDays = Math.round((todayDate.getTime() - prevDate.getTime()) / 86400000);
      if (diffDays === 1) nextStreak = streakDays + 1;
    }

    lastActiveDateRef.current = today;
    setStreakDays(nextStreak);
    latestStreakRef.current = { streak_days: nextStreak, last_active_date: today };
    saveToSupabase(
      async () => supabase.from("profiles").update(latestStreakRef.current).eq("id", userId),
      onSaveError
    );
  };

  const addXp = (amount: number) => {
    if (!amount) return;
    // Update ref immediately so retry thunks read the freshest value.
    latestXpRef.current += amount;
    setXp(latestXpRef.current);
    setSessionXp((prev: number) => prev + amount);
    saveToSupabase(
      async () => supabase.from("profiles").update({ xp: latestXpRef.current }).eq("id", userId),
      onSaveError
    );
    checkAndUpdateStreak();
    setXpToast({ amount, key: Date.now() + Math.random() });
    if (xpToastTimer.current) clearTimeout(xpToastTimer.current);
    xpToastTimer.current = setTimeout(() => setXpToast(null), 1300);
  };

  const markStep = (storyId: string, step: ProgressStep) => {
    const key = progressKey(storyId, step);
    if (progress.has(key)) return;
    const next = new Set(progress).add(key);
    setProgress(next);
    saveProgress(userId, storyId, step, next);
  };

  // Leitner review: "knew it" moves the word up a box, "not yet" back to box 0.
  const handleReview = (word: string, known: boolean) => {
    const current = savedWords.find((w) => w.word === word);
    if (!current) return;
    const mastery = known ? Math.min((current.mastery ?? 0) + 1, MAX_MASTERY) : 0;
    const nextReviewAt = nextReview(mastery);
    setSavedWords((prev) => prev.map((w) => (w.word === word ? { ...w, mastery, nextReviewAt } : w)));
    saveReview(userId, word, mastery, nextReviewAt);
    if (known) addXp(2);
  };

  const quizStory = STORIES.find((s) => s.id === selectedStory) || STORIES[0];
  const quizQuestions = quizLevel && quizLevel !== "quiz" && quizLevel in quizStory.levels
    ? buildLevelQuiz(quizStory.levels[quizLevel as keyof typeof quizStory.levels])
    : quizStory.quizQuestions;

  const handleQuizFinish = (correctCount: number, total: number) => {
    const storyId = selectedStory || STORIES[0].id;
    const step = quizLevel ?? "quiz";
    if (correctCount >= Math.ceil(total * 0.6)) {
      // First time a whole tale is finished: the elder's blessing and its ornament.
      if (step === "quiz" && !progress.has(progressKey(storyId, "quiz"))) setBataStory(storyId);
      markStep(storyId, step);
    }
    latestQuizzesRef.current += 1;
    setQuizzesCompleted(latestQuizzesRef.current);
    saveToSupabase(
      async () => supabase.from("profiles").update({ quizzes_completed: latestQuizzesRef.current }).eq("id", userId),
      onSaveError
    );
    if (correctCount === total) {
      latestPerfectRef.current += 1;
      setPerfectQuizzes(latestPerfectRef.current);
      saveToSupabase(
        async () => supabase.from("profiles").update({ perfect_quizzes: latestPerfectRef.current }).eq("id", userId),
        onSaveError
      );
    }
  };

  useEffect(() => {
    const prevRank = Math.floor(prevXpRef.current / 100);
    const newRank = Math.floor(xp / 100);
    if (newRank > prevRank) {
      setLevelUpRank(newRank);
      setShowLevelUp(true);
    }
    prevXpRef.current = xp;
  }, [xp]);

  useEffect(() => {
    const stats = { xp, savedWordsCount: savedWords.length, quizzesCompleted, perfectQuizzes };
    const newlyUnlocked = ACHIEVEMENTS.filter(
      (a) => !unlockedAchievements.includes(a.id) && a.check(stats)
    );
    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements((prev) => [...prev, ...newlyUnlocked.map((a) => a.id)]);
      setAchievementQueue((prev) => [...prev, ...newlyUnlocked]);
      newlyUnlocked.forEach((a) => {
        saveToSupabase(
          async () => supabase.from("user_achievements").upsert({ user_id: userId, achievement_id: a.id }, { onConflict: "user_id,achievement_id" }),
          onSaveError
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp, savedWords.length, quizzesCompleted, perfectQuizzes]);

  useEffect(() => {
    return () => {
      if (xpToastTimer.current) clearTimeout(xpToastTimer.current);
    };
  }, []);

  const handleSaveWord = (word: string, translation: string) => {
    if (savedWords.some((w) => w.word === word)) return;
    addXp(5);
    setSavedWords((prev: SavedWord[]) => [...prev, { word, translation, mastery: 0, nextReviewAt: null }]);
    saveToSupabase(
      async () => supabase.from("saved_words").upsert({ user_id: userId, word, translation, mastery: 0 }, { onConflict: "user_id,word" }),
      onSaveError
    );
  };

  // Each screen starts at the top, like a new page.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab, selectedStory, selectedLevel]);

  if (!dataLoaded) {
    return <div className="min-h-dvh w-full bg-sand" />;
  }

  const tabs = [
    { id: "home",    label: t.navHome,    Icon: HomeIcon },
    { id: "read",    label: t.navRead,    Icon: BookOpen },
    { id: "quiz",    label: t.navQuiz,    Icon: Trophy   },
    { id: "words",   label: lang === "kk" ? "Сөздер" : "Words", Icon: Layers },
    { id: "speak",   label: t.navSpeak,   Icon: Mic      },
    { id: "profile", label: t.navProfile, Icon: User     },
  ] as const;

  const dueCount = savedWords.filter((w) => isDue(w.nextReviewAt)).length;

  const wordsBadge = (id: string) =>
    id === "words" && dueCount > 0 ? (
      <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-felt text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-card">
        {dueCount}
      </span>
    ) : null;

  const LangToggle = () => (
    <div className="segmented w-[104px]" role="group" aria-label={lang === "kk" ? "Тіл" : "Language"}>
      <button aria-pressed={lang === "kk"} onClick={() => setLang("kk")}>ҚАЗ</button>
      <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>ENG</button>
    </div>
  );

  const StatChips = () => (
    <div className="flex items-center gap-2">
      <span className="chip text-felt" title={t.streakLabel}>
        <Flame size={16} className="fill-felt" /> {streakDays}
      </span>
      <span className="chip relative text-sun-deep" title={t.totalXpLabel}>
        <Zap size={16} className="fill-sun text-sun-deep" /> {xp}
        <XpToast toast={xpToast} />
      </span>
    </div>
  );

  return (
    <LangContext.Provider value={lang}>
    <div className="relative h-dvh w-full bg-sand font-body text-ink overflow-hidden flex">
      <LevelUpModal show={showLevelUp} rank={levelUpRank} onClose={() => setShowLevelUp(false)} />
      <BataModal storyId={bataStory} lang={lang} onClose={() => setBataStory(null)} />
      <AchievementBanner
        achievement={achievementQueue[0] || null}
        onDone={() => setAchievementQueue((prev) => prev.slice(1))}
      />
      <ShoqanChat />
      <SaveErrorToast show={showSaveError} message={t.saveError} />

      <StaticOrnamentBg />

      {/* Sidebar — desktop only (Duolingo-style rail) */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r-2 md:border-line md:bg-card/70 relative z-10">
        <div className="px-6 pt-7 pb-6">
          <BrandMark />
        </div>
        <nav className="flex flex-col flex-1 px-4 gap-1.5">
          {tabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => { if (id === "quiz") { setQuizLevel(null); setQuizStarted(false); } setTab(id); }}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-4 px-4 min-h-[52px] rounded-2xl border-2 transition-colors w-full ${active ? "bg-sky-soft border-sky/60 text-sky-deep" : "border-transparent text-ink-2 hover:bg-sand-2"}`}
              >
                <span className="relative">
                  <Icon size={24} strokeWidth={active ? 2.6 : 2.2} />
                  {wordsBadge(id)}
                </span>
                <span className="font-display text-[15px] font-extrabold tracking-wide uppercase">{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-6 pb-6 space-y-4">
          <LangToggle />
          <KilimStrip className="h-2 w-full opacity-80" />
        </div>
      </aside>

      {/* Main column */}
      <div className="relative z-10 flex-1 h-dvh overflow-hidden flex flex-col min-w-0">

        {/* Top bar — Apple frosted, stats on the right */}
        <header className="xl:hidden glass border-b border-line/70 flex items-center gap-3 px-4 md:px-8 pt-[max(env(safe-area-inset-top),12px)] pb-3">
          <div className="md:hidden"><BrandMark compact /></div>
          <div className="md:hidden"><LangToggle /></div>
          <div className="ml-auto"><StatChips /></div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1040px] flex gap-8 px-4 md:px-8 pt-4 xl:pt-10 pb-28 md:pb-10">
            <main className="flex-1 min-w-0 max-w-[620px] mx-auto">
              {tab === "home" && (
                <HomeScreen
                  progress={progress}
                  userId={userId}
                  onReward={addXp}
                  onStartRead={(storyId: string, level?: string) => {
                    setSelectedStory(storyId);
                    setSelectedLevel(level ?? null);
                    setTab("read");
                  }}
                  onStartQuiz={(storyId: string) => {
                    setSelectedStory(storyId);
                    setQuizLevel(null);
                    setQuizStarted(false);
                    setTab("quiz");
                  }}
                  t={t}
                  lang={lang}
                  userName={displayName}
                  sessionXp={sessionXp}
                  dailyGoal={DAILY_GOAL}
                />
              )}
              {tab === "read" && (
                <ReaderScreen
                  selectedStory={selectedStory}
                  setSelectedStory={setSelectedStory}
                  selectedLevel={selectedLevel}
                  setSelectedLevel={setSelectedLevel}
                  onQuizGate={() => { setQuizLevel(selectedLevel as ProgressStep | null); setQuizStarted(false); setTab("quiz"); }}
                  onLevelDone={(storyId: string, level: ProgressStep) => markStep(storyId, level)}
                  t={t}
                  lang={lang}
                  onReward={addXp}
                  savedWords={savedWords}
                  onSaveWord={handleSaveWord}
                />
              )}
              {tab === "quiz" && !quizStarted && (
                <QuizSetup
                  storyId={selectedStory || STORIES[0].id}
                  level={quizLevel}
                  onChange={(storyId: string, level: string | null) => { setSelectedStory(storyId); setQuizLevel(level as ProgressStep | null); }}
                  onStart={() => setQuizStarted(true)}
                  progress={progress}
                  lang={lang}
                  t={t}
                />
              )}
              {tab === "quiz" && quizStarted && (
                <QuizScreen
                  key={`${selectedStory || "default"}:${quizLevel || "story"}`}
                  onReward={addXp}
                  t={t}
                  onQuizFinish={handleQuizFinish}
                  storyTitle={`${(STORIES.find((s) => s.id === selectedStory) || STORIES[0]).title}${quizLevel ? ` · ${quizLevel}` : ""}`}
                  questions={quizQuestions}
                />
              )}
              {tab === "words" && (
                <div className="animate-pop-in">
                  <div className="mb-8">
                    <WordCoach savedWords={savedWords} progress={progress} userId={userId} lang={lang} onLearn={handleSaveWord} onReward={addXp} />
                  </div>
                  {wordsMode === "cards" ? (
                    <FlashcardsScreen savedWords={savedWords} onReview={handleReview} lang={lang} mode={wordsMode} setMode={setWordsMode} />
                  ) : (
                    <MatchingGame savedWords={savedWords} onReward={addXp} mode={wordsMode} setMode={setWordsMode} />
                  )}
                  <div className="mt-8"><TurkicWords lang={lang} /></div>
                </div>
              )}
              {tab === "speak" && <SpeakScreen onReward={addXp} t={t} />}
              {tab === "profile" && (
                <ProfileScreen
                  xp={xp}
                  t={t}
                  lang={lang}
                  setLang={setLang}
                  savedWordsCount={savedWords.length}
                  unlockedAchievements={unlockedAchievements}
                  userName={displayName}
                  onSignOut={handleSignOut}
                  streakDays={streakDays}
                  quizzesCompleted={quizzesCompleted}
                  kilim={<OyuKilim progress={progress} lang={lang} maqalCount={loadMaqals(userId).length} />}
                />
              )}
            </main>

            {/* Right rail — wide desktop only, Duolingo-style widgets */}
            <aside className="hidden xl:flex flex-col gap-4 w-[300px] shrink-0 pt-2 sticky top-0 self-start">
              <StatChips />
              <div className="card p-5 flex items-center gap-4">
                <DailyGoalRing current={sessionXp} goal={DAILY_GOAL} size={64} />
                <div>
                  <p className="font-display font-extrabold text-ink">{lang === "kk" ? "Күнделікті мақсат" : "Daily goal"}</p>
                  <p className="text-sm text-ink-2">{Math.min(sessionXp, DAILY_GOAL)} / {DAILY_GOAL} XP</p>
                </div>
              </div>
              <div className="card p-5">
                <p className="font-display font-extrabold text-ink">{lang === "kk" ? "Сөздік" : "Vocabulary"}</p>
                <p className="text-sm text-ink-2 mt-1">
                  {savedWords.length} {lang === "kk" ? "сөз сақталды" : "words saved"}
                  {dueCount > 0 && <> · <b className="text-felt">{dueCount} {lang === "kk" ? "қайталауға" : "due"}</b></>}
                </p>
                <button onClick={() => setTab("words")} className="btn btn-ghost btn-sm w-full mt-4">
                  {lang === "kk" ? "Қайталау" : "Practice"}
                </button>
              </div>
            </aside>
          </div>
        </div>

        {/* Tab bar — mobile only, Apple frosted */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-line/70 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
          <div className="grid grid-cols-6">
            {tabs.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => { if (id === "quiz") { setQuizLevel(null); setQuizStarted(false); } setTab(id); }}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 min-h-[50px] ${active ? "text-sky" : "text-ink-3"}`}
                >
                  <span className="relative">
                    <Icon size={24} strokeWidth={active ? 2.6 : 2} />
                    {wordsBadge(id)}
                  </span>
                  <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
    </LangContext.Provider>
  );
}
