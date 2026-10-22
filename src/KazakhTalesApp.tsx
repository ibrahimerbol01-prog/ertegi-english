import { useState, useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  BookOpen, Trophy, Home as HomeIcon, User, Layers, Globe, Mic
} from "lucide-react";
import {
  FontLoader, LevelUpModal, AchievementBanner, XpToast,
  StaticOrnamentBg, SaveErrorToast
} from "./components/UIHelpers";
import { Shanyraq, OrnamentBand } from "./components/Ornaments";
import { ShoqanChat } from "./components/ShoqanChat";
import {
  HomeScreen, ReaderScreen, FlashcardsScreen, MatchingGame,
  QuizScreen, SpeakScreen, ProfileScreen
} from "./components/Screens";
import { DICT, ACHIEVEMENTS, STORIES } from "./constants";
import type { SavedWord } from "./types";
import { supabase } from "./lib/supabase";
import { saveToSupabase } from "./utils/supabase-save";

export default function KazakhTalesApp({ session }: { session: Session }) {
  const userId: string = session.user.id;
  const userEmail: string = session.user.email || "";
  const [displayName, setDisplayName] = useState<string>(
    (session.user.user_metadata?.display_name as string | undefined) || userEmail.split("@")[0] || "Learner"
  );
  const [dataLoaded, setDataLoaded] = useState(false);

  const [tab, setTab] = useState("home");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [lang, setLang] = useState("kk");

  const [streakDays, setStreakDays] = useState(0);
  const lastActiveDateRef = useRef<string | null>(null);

  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
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
      const [profileRes, wordsRes, achievementsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("saved_words").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
      ]);

      if (cancelled) return;

      if (profileRes.data) {
        setXp(profileRes.data.xp ?? 0);
        setQuizzesCompleted(profileRes.data.quizzes_completed ?? 0);
        setPerfectQuizzes(profileRes.data.perfect_quizzes ?? 0);
        setStreakDays(profileRes.data.streak_days ?? 0);
        lastActiveDateRef.current = profileRes.data.last_active_date ?? null;
        if (profileRes.data.display_name) setDisplayName(profileRes.data.display_name as string);
      }
      if (wordsRes.data) {
        setSavedWords(
          wordsRes.data.map((row: { word: string; translation: string; mastery: number }) => ({
            word: row.word,
            translation: row.translation,
            mastery: row.mastery,
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

  const handleQuizFinish = (correctCount: number, total: number) => {
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
    setSavedWords((prev: SavedWord[]) => [...prev, { word, translation, mastery: 0 }]);
    saveToSupabase(
      async () => supabase.from("saved_words").upsert({ user_id: userId, word, translation, mastery: 0 }, { onConflict: "user_id,word" }),
      onSaveError
    );
  };

  if (!dataLoaded) {
    return <div className="min-h-dvh w-full bg-ink" />;
  }

  const tabs = [
    { id: "home",    label: t.navHome,    Icon: HomeIcon },
    { id: "read",    label: t.navRead,    Icon: BookOpen },
    { id: "quiz",    label: t.navQuiz,    Icon: Trophy   },
    { id: "words",   label: "WORDS",      Icon: Layers   },
    { id: "speak",   label: t.navSpeak,   Icon: Mic      },
    { id: "profile", label: t.navProfile, Icon: User     },
  ] as const;

  return (
    <div className="relative h-dvh w-full bg-ink font-body text-cream overflow-hidden flex">
      <FontLoader />

      <LevelUpModal show={showLevelUp} rank={levelUpRank} onClose={() => setShowLevelUp(false)} />
      <AchievementBanner
        achievement={achievementQueue[0] || null}
        onDone={() => setAchievementQueue((prev) => prev.slice(1))}
      />
      <ShoqanChat />
      <SaveErrorToast show={showSaveError} message={t.saveError} />

      {/* Static ornament bg on all tabs — video only inside hero card (HomeScreen) and IntroScreen */}
      <StaticOrnamentBg />

      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-gold/25 md:bg-ink-2/90 md:backdrop-blur-md relative z-10">
        <div className="px-5 py-5 border-b border-gold/20 flex items-center gap-2">
          <Shanyraq className="w-6 h-6 text-gold" strokeWidth={4} />
          <span className="font-editorial text-sm font-extrabold tracking-[0.2em] text-cream uppercase">Ertegi English</span>
        </div>
        <nav className="flex flex-col flex-1 px-3 py-4 gap-1">
          {tabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 w-full ${active ? "bg-gold text-ink" : "text-cream/70 hover:text-cream hover:bg-white/5"}`}
              >
                <span className="relative flex items-center justify-center w-9 h-9 shrink-0">
                  <Icon size={15} />
                  {id === "words" && savedWords.length > 0 && (
                    <span className="absolute -top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-felt text-[9px] text-cream flex items-center justify-center font-bold ring-2 ring-ink">
                      {savedWords.length}
                    </span>
                  )}
                </span>
                <span className={`font-editorial text-xs tracking-[0.05em] uppercase ${active ? "font-bold" : ""}`}>{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-5 pb-6 text-gold/35">
          <OrnamentBand className="h-4 w-full" />
        </div>
      </aside>

      {/* Main column */}
      <div className="relative z-10 flex-1 h-dvh overflow-hidden flex flex-col">

        <div className="flex items-center px-5 pt-[max(env(safe-area-inset-top),20px)] pb-3 bg-ink/85 backdrop-blur-md relative">
          <div className="flex items-center gap-2 mr-auto md:hidden">
            <Shanyraq className="w-6 h-6 text-gold" strokeWidth={4} />
            <span className="font-editorial text-sm font-extrabold tracking-[0.2em] text-cream uppercase">Ertegi English</span>
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={() => setLang(lang === "kk" ? "en" : "kk")}
              className="flex items-center gap-1.5 px-3 min-h-[44px] border border-gold/30 bg-surface text-xs font-editorial font-bold tracking-[0.1em] hover:border-gold transition-all"
            >
              <Globe size={11} className="text-gold" />
              <span className={lang === "kk" ? "text-gold" : "text-cream/70"}>QAZ</span>
              <span className="text-cream/20">|</span>
              <span className={lang === "en" ? "text-gold" : "text-cream/70"}>ENG</span>
            </button>
            <span className="relative px-2.5 py-0.5 gold-badge text-[10px] gold-glow">
              {xp} XP
              <XpToast toast={xpToast} />
            </span>
          </div>
          {/* Felt edging: gold hairline over a red felt stripe */}
          <span aria-hidden="true" className="absolute inset-x-0 -bottom-[3px] h-[3px] border-t border-gold/50 bg-felt/70" />
        </div>

        <div className="flex-1 overflow-y-auto pt-4">
          <div className="mx-auto w-full max-w-[720px]">
            {tab === "home" && (
              <HomeScreen
                onStartRead={(storyId: string) => {
                  setSelectedStory(storyId);
                  setSelectedLevel(null);
                  setTab("read");
                }}
                t={t}
                lang={lang}
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
                onQuizGate={() => setTab("quiz")}
                t={t}
                onReward={addXp}
                savedWords={savedWords}
                onSaveWord={handleSaveWord}
              />
            )}
            {tab === "quiz" && (
              <QuizScreen
                onReward={addXp}
                t={t}
                onQuizFinish={handleQuizFinish}
                questions={(STORIES.find((s) => s.id === selectedStory) || STORIES[0]).quizQuestions}
              />
            )}
            {tab === "words" && (
              <div className="animate-pop-in">
                <div className="px-5 pt-1 pb-3">
                  <div className="grid grid-cols-2 gap-1 p-1 bg-surface rounded-full border border-white/[0.06]">
                    <button
                      onClick={() => setWordsMode("cards")}
                      className={`py-3 text-xs font-editorial font-bold uppercase tracking-[0.1em] rounded-full transition-all ${wordsMode === "cards" ? "bg-gold text-ink" : "text-cream/70"}`}
                    >
                      Flashcards
                    </button>
                    <button
                      onClick={() => setWordsMode("match")}
                      className={`py-3 text-xs font-editorial font-bold uppercase tracking-[0.1em] rounded-full transition-all ${wordsMode === "match" ? "bg-gold text-ink" : "text-cream/70"}`}
                    >
                      Matching Game
                    </button>
                  </div>
                </div>
                {wordsMode === "cards" ? (
                  <FlashcardsScreen savedWords={savedWords} onReward={addXp} />
                ) : (
                  <MatchingGame savedWords={savedWords} onReward={addXp} />
                )}
              </div>
            )}
            {tab === "speak" && <SpeakScreen onReward={addXp} t={t} />}
            {tab === "profile" && (
              <ProfileScreen
                xp={xp}
                t={t}
                savedWordsCount={savedWords.length}
                unlockedAchievements={unlockedAchievements}
                userName={displayName}
                onSignOut={handleSignOut}
                streakDays={streakDays}
              />
            )}
          </div>
        </div>

        {/* Bottom nav — mobile only */}
        <div className="md:hidden px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-1.5 border-t border-gold/25 bg-ink-2/95 backdrop-blur-2xl">
          <div className="grid grid-cols-6 gap-0.5">
            {tabs.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="relative flex flex-col items-center justify-center gap-1 py-2"
                >
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-300 ${active ? "bg-gold text-ink shadow-[0_4px_14px_-2px_rgba(231,169,63,0.55)]" : "text-cream/70"}`}
                  >
                    <Icon size={15} />
                    {id === "words" && savedWords.length > 0 && (
                      <span className="absolute -top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-felt text-[9px] text-cream flex items-center justify-center font-bold ring-2 ring-ink">
                        {savedWords.length}
                      </span>
                    )}
                  </span>
                  <span className={`font-editorial text-xs tracking-[0.05em] uppercase transition-colors ${active ? "text-gold font-bold" : "text-cream/70"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
