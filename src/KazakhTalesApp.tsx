import { useState, useRef, useEffect } from "react";
import { Users } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { IconYurt, IconBook, IconTrophy, IconCards, IconShield, IconMic, IconLearner, IconFlame, IconBolt } from "./components/Icons";
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
import { LegendScreen } from "./components/LegendCards";
import { TeacherScreen } from "./components/Teacher";
import { AssignmentsCard, JoinClassSheet, MyClassesSection } from "./components/StudentClasses";
import { flushQuizResults, saveQuizResult, takePendingClass } from "./utils/classes";
import {
  loadProgress, saveProgress, progressKey, loadLocalReviews, saveReview,
  nextReview, lapse, localDay, daysBetween, isDue, MAX_MASTERY, type ProgressStep
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
  // A class link opened before sign-in: offer to join once the app is open.
  const [pendingCode, setPendingCode] = useState<string | null>(takePendingClass);
  const [isTeacher, setIsTeacher] = useState(() => {
    try { return localStorage.getItem(`ertegi_is_teacher_${userId}`) === "1"; } catch { return false; }
  });
  const markTeacher = (yes: boolean) => {
    setIsTeacher(yes);
    try { if (yes) localStorage.setItem(`ertegi_is_teacher_${userId}`, "1"); else localStorage.removeItem(`ertegi_is_teacher_${userId}`); } catch { /* storage blocked */ }
  };
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

  // Profile writes send absolute values, so they wait until the server profile
  // has loaded. Until then, gains collect here and are added on top of it.
  const profileReadyRef = useRef(false);
  const pendingRef = useRef({ xp: 0, quizzes: 0, perfect: 0, active: false });
  const saveProfile = (patch: () => Record<string, unknown>) => {
    if (!profileReadyRef.current) return;
    saveToSupabase(async () => supabase.from("profiles").update(patch()).eq("id", userId), onSaveError);
  };

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

    type ProfileRow = {
      xp?: number | null; quizzes_completed?: number | null; perfect_quizzes?: number | null;
      streak_days?: number | null; last_active_date?: string | null; display_name?: string | null;
    };

    const applyProfile = (row: ProfileRow | null) => {
      const p = pendingRef.current;
      const baseXp = row?.xp ?? 0;
      // Loading saved XP is not a level-up; start the rank baseline here.
      prevXpRef.current = baseXp;
      latestXpRef.current = baseXp + p.xp;
      latestQuizzesRef.current = (row?.quizzes_completed ?? 0) + p.quizzes;
      latestPerfectRef.current = (row?.perfect_quizzes ?? 0) + p.perfect;
      setXp(latestXpRef.current);
      setQuizzesCompleted(latestQuizzesRef.current);
      setPerfectQuizzes(latestPerfectRef.current);
      lastActiveDateRef.current = row?.last_active_date ?? null;
      // A streak with a missed day is over, even before today's first action.
      const last = lastActiveDateRef.current;
      const streak = last && daysBetween(last, localDay()) <= 1 ? (row?.streak_days ?? 0) : 0;
      setStreakDays(streak);
      latestStreakRef.current = { streak_days: streak, last_active_date: last ?? "" };
      if (row?.display_name) setDisplayName(row.display_name);
      profileReadyRef.current = true;
      // Progress made while the profile was unreachable is written once, on top of the server values.
      if (p.xp || p.quizzes || p.perfect) {
        saveProfile(() => ({
          xp: latestXpRef.current,
          quizzes_completed: latestQuizzesRef.current,
          perfect_quizzes: latestPerfectRef.current,
        }));
      }
      const wasActive = p.active;
      pendingRef.current = { xp: 0, quizzes: 0, perfect: 0, active: false };
      if (wasActive) checkAndUpdateStreak();
    };

    // A failed profile read must never be treated as an empty profile: retry with backoff.
    const retryProfile = (attempt: number) => {
      const delay = [2000, 5000, 15000, 30000][Math.min(attempt, 3)];
      setTimeout(async () => {
        if (cancelled) return;
        const res = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        if (cancelled) return;
        if (res.error) retryProfile(attempt + 1);
        else applyProfile(res.data as ProfileRow | null);
      }, delay);
    };

    const loadUserData = async () => {
      const [profileRes, wordsRes, achievementsRes, progressSet] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("saved_words").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
        loadProgress(userId),
      ]);

      if (cancelled) return;

      if (profileRes.error) retryProfile(0);
      else applyProfile(profileRes.data as ProfileRow | null);
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

    loadUserData().catch(() => {
      setDataLoaded(true);
      if (!profileReadyRef.current) retryProfile(0);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) onSaveError();
  };

  const checkAndUpdateStreak = () => {
    if (!profileReadyRef.current) { pendingRef.current.active = true; return; }
    // Any one learning action keeps the streak; it is not tied to the daily XP goal.
    const today = localDay();
    if (lastActiveDateRef.current === today) return;

    let nextStreak = 1;
    if (lastActiveDateRef.current && daysBetween(lastActiveDateRef.current, today) === 1) nextStreak = latestStreakRef.current.streak_days + 1;

    lastActiveDateRef.current = today;
    setStreakDays(nextStreak);
    latestStreakRef.current = { streak_days: nextStreak, last_active_date: today };
    saveProfile(() => latestStreakRef.current);
  };

  const addXp = (amount: number) => {
    if (!amount) return;
    // Update ref immediately so retry thunks read the freshest value.
    latestXpRef.current += amount;
    setXp(latestXpRef.current);
    setSessionXp((prev: number) => prev + amount);
    if (!profileReadyRef.current) pendingRef.current.xp += amount;
    saveProfile(() => ({ xp: latestXpRef.current }));
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

  // Leitner review: "knew it" moves the word up a box, "not yet" one box back.
  const handleReview = (word: string, known: boolean) => {
    const current = savedWords.find((w) => w.word === word);
    if (!current) return;
    const up = Math.min((current.mastery ?? 0) + 1, MAX_MASTERY);
    const { mastery, nextReviewAt } = known ? { mastery: up, nextReviewAt: nextReview(up) } : lapse(current.mastery ?? 0);
    setSavedWords((prev) => prev.map((w) => (w.word === word ? { ...w, mastery, nextReviewAt } : w)));
    saveReview(userId, word, mastery, nextReviewAt);
    if (known) addXp(2);
    else checkAndUpdateStreak();
  };

  const quizStory = STORIES.find((s) => s.id === selectedStory) || STORIES[0];
  const quizQuestions = quizLevel && quizLevel !== "quiz" && quizLevel in quizStory.levels
    ? buildLevelQuiz(quizStory.levels[quizLevel as keyof typeof quizStory.levels])
    : quizStory.quizQuestions;
  // Where a wrong answer points back to: the level just read, or the whole tale.
  const quizTexts: string[] = quizLevel && quizLevel !== "quiz" && quizLevel in quizStory.levels
    ? [quizStory.levels[quizLevel as keyof typeof quizStory.levels]]
    : Object.values(quizStory.levels);

  const handleQuizFinish = (correctCount: number, total: number, firstTry: number) => {
    const storyId = selectedStory || STORIES[0].id;
    const step = quizLevel ?? "quiz";
    // The score goes to the teacher's report; it waits on the device while offline.
    saveQuizResult(userId, storyId, step, correctCount, total, firstTry);
    if (correctCount >= Math.ceil(total * 0.6)) {
      // First time a whole tale is finished: the elder's blessing and its ornament.
      if (step === "quiz" && !progress.has(progressKey(storyId, "quiz"))) setBataStory(storyId);
      markStep(storyId, step);
    }
    latestQuizzesRef.current += 1;
    setQuizzesCompleted(latestQuizzesRef.current);
    if (!profileReadyRef.current) pendingRef.current.quizzes += 1;
    saveProfile(() => ({ quizzes_completed: latestQuizzesRef.current }));
    // Perfect means every answer right first time, not after a hint.
    if (firstTry === total) {
      latestPerfectRef.current += 1;
      setPerfectQuizzes(latestPerfectRef.current);
      if (!profileReadyRef.current) pendingRef.current.perfect += 1;
      saveProfile(() => ({ perfect_quizzes: latestPerfectRef.current }));
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

  // Quiz scores saved offline go up on start and whenever the connection returns.
  useEffect(() => {
    void flushQuizResults(userId);
    const online = () => void flushQuizResults(userId);
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [userId]);

  // Each screen starts at the top, like a new page.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab, selectedStory, selectedLevel]);

  if (!dataLoaded) {
    return <div className="min-h-dvh w-full bg-sand" />;
  }

  const tabs = [
    { id: "home",    label: t.navHome,    Icon: IconYurt },
    { id: "read",    label: t.navRead,    Icon: IconBook },
    { id: "quiz",    label: t.navQuiz,    Icon: IconTrophy },
    { id: "words",   label: lang === "kk" ? "Сөздер" : "Words", Icon: IconCards },
    { id: "cards",   label: lang === "kk" ? "Карталар" : "Cards", Icon: IconShield },
    { id: "speak",   label: t.navSpeak,   Icon: IconMic },
    { id: "profile", label: t.navProfile, Icon: IconLearner },
  ] as const;

  const dueCount = savedWords.filter((w) => isDue(w.nextReviewAt)).length;

  const wordsBadge = (id: string) =>
    id === "words" && dueCount > 0 ? (
      <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C4441E] text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-card">
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
        <IconFlame size={18} /> {streakDays}
      </span>
      <span className="chip relative text-sun-deep" title={t.totalXpLabel}>
        <IconBolt size={18} /> {xp}
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
      {/* The quiz is a focus mode: Shoqan steps aside so he never covers the answer buttons. */}
      <ShoqanChat hidden={tab === "quiz" && quizStarted} />
      <SaveErrorToast show={showSaveError} message={t.saveError} />
      <JoinClassSheet
        open={!!pendingCode}
        onClose={() => setPendingCode(null)}
        lang={lang}
        defaultName={displayName}
        initialCode={pendingCode ?? ""}
      />

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
                  <Icon size={30} />
                  {wordsBadge(id)}
                </span>
                <span className="font-display text-[15px] font-extrabold tracking-wide uppercase">{label}</span>
              </button>
            );
          })}
          {(isTeacher || tab === "teacher") && (
            <button
              onClick={() => setTab("teacher")}
              aria-current={tab === "teacher" ? "page" : undefined}
              className={`flex items-center gap-4 px-4 min-h-[52px] rounded-2xl border-2 transition-colors w-full mt-3 ${tab === "teacher" ? "bg-sky-soft border-sky/60 text-sky-deep" : "border-transparent text-ink-2 hover:bg-sand-2"}`}
            >
              <span className="w-[30px] h-[30px] rounded-lg bg-night text-white flex items-center justify-center"><Users size={18} /></span>
              <span className="font-display text-[15px] font-extrabold tracking-wide uppercase">{lang === "kk" ? "Мұғалім" : "Teacher"}</span>
            </button>
          )}
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
          <div className="mx-auto w-full max-w-[1040px] flex gap-8 px-4 md:px-8 pt-4 xl:pt-10 pb-44 md:pb-28">
            <main className="flex-1 min-w-0 max-w-[620px] mx-auto">
              {tab === "home" && (
                <HomeScreen
                  progress={progress}
                  userId={userId}
                  onReward={addXp}
                  onOpenCards={() => setTab("cards")}
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
                  assignments={
                    <AssignmentsCard
                      lang={lang}
                      userId={userId}
                      progress={progress}
                      onStartRead={(storyId: string, level?: string) => { setSelectedStory(storyId); setSelectedLevel(level ?? null); setTab("read"); }}
                      onStartQuiz={(storyId: string) => { setSelectedStory(storyId); setQuizLevel(null); setQuizStarted(false); setTab("quiz"); }}
                    />
                  }
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
                  userId={userId}
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
                  onExit={() => setQuizStarted(false)}
                  storyTitle={`${(STORIES.find((s) => s.id === selectedStory) || STORIES[0]).title}${quizLevel ? ` · ${quizLevel}` : ""}`}
                  questions={quizQuestions}
                  sourceTexts={quizTexts}
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
              {tab === "cards" && <LegendScreen lang={lang} userId={userId} onReward={addXp} />}
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
                  classes={<MyClassesSection lang={lang} userId={userId} defaultName={displayName} />}
                  onOpenTeacher={() => setTab("teacher")}
                />
              )}
              {tab === "teacher" && (
                <TeacherScreen lang={lang} onBack={() => setTab("profile")} onTeacher={markTeacher} />
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
          <div className="grid grid-cols-7">
            {tabs.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => { if (id === "quiz") { setQuizLevel(null); setQuizStarted(false); } setTab(id); }}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 min-h-[50px] ${active ? "text-sky-deep" : "text-ink-2"}`}
                >
                  {/* The active tab is in colour on a soft pill; the rest stay grey, so the state reads at a glance. */}
                  <span className={`relative px-2 py-0.5 rounded-full transition-colors ${active ? "bg-sky-soft" : ""}`}>
                    <Icon size={28} muted={!active} className={`transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                    {wordsBadge(id)}
                  </span>
                  <span className={`text-[9px] min-[360px]:text-[10px] max-w-full truncate px-0.5 ${active ? "font-bold" : "font-medium"}`}>{label}</span>
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
