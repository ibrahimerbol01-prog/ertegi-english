import { lazy, Suspense, useState, useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { IconYurt, IconBook, IconTrophy, IconCards, IconShield, IconLearner, IconTarget, IconFlame, IconBolt, IconBoard } from "./components/Icons";
import { ChevronRight } from "lucide-react";
import {
  LevelUpModal, AchievementBanner, XpToast,
  StaticOrnamentBg, SaveErrorToast, BrandMark, DailyGoalRing
} from "./components/UIHelpers";
import { KilimStrip } from "./components/Ornaments";
import { ShoqanChat } from "./components/ShoqanChat";
import { HomeScreen } from "./components/screens/HomeScreen";
import { ReaderScreen } from "./components/screens/ReaderScreen";
// Tabs other than Home and Read load on first use; all of them are fetched in
// the background once the app is idle, so switching tabs stays instant.
const loadWords = () => import("./components/screens/WordsScreens");
const loadQuiz = () => import("./components/screens/QuizScreens");
const loadSpeak = () => import("./components/screens/SpeakScreen");
const loadProfile = () => import("./components/screens/ProfileScreen");
const FlashcardsScreen = lazy(() => loadWords().then((m) => ({ default: m.FlashcardsScreen })));
const MatchingGame = lazy(() => loadWords().then((m) => ({ default: m.MatchingGame })));
// «Сөздік қоры», ordinary site only (R4); its data is a lazy chunk per level (src/data/wordbank).
const WordbankScreen = RESEARCH_MODE ? null : lazy(() => import("./components/screens/WordbankScreen"));
// Nickname and avatar editor, ordinary site only (R4; alias to ProfileEditor.off in the research build).
const ProfileEditor = RESEARCH_MODE ? null : lazy(() => import("./components/ProfileEditor"));
// Placement check v1, ordinary site only (R4; alias to PlacementCheck.off in the research build).
const PlacementCheck = RESEARCH_MODE ? null : lazy(() => import("./components/PlacementCheck"));
// Shoqan, the home-screen mascot, ordinary site only (R4; alias to ShoqanMascot.off in the research build).
const ShoqanMascot = RESEARCH_MODE ? null : lazy(() => import("./components/ShoqanMascot"));
// Временно скрыт на главной (владелец, 09.11.2026). Вернуть: true.
const SHOQAN_HOME_MASCOT = false;
const QuizSetup = lazy(() => loadQuiz().then((m) => ({ default: m.QuizSetup })));
const QuizScreen = lazy(() => loadQuiz().then((m) => ({ default: m.QuizScreen })));
const SpeakScreen = lazy(() => loadSpeak().then((m) => ({ default: m.SpeakScreen })));
const ProfileScreen = lazy(() => loadProfile().then((m) => ({ default: m.ProfileScreen })));
const prefetchTabs = () => { void loadWords(); void loadQuiz(); if (!RESEARCH_MODE) void loadSpeak(); void loadProfile(); };
import { DICT, ACHIEVEMENTS } from "./constants";
import { RESEARCH_MODE } from "./research/mode";
import { APP_STORIES as STORIES } from "./research/stories";
import { StudyGate } from "./research/StudyGate";
// R5: the vocabulary test exists only in the research build (no chunk in the ordinary one).
import { TestScreen } from "./research/testEntry";
import { LangContext, loadLang, saveLang, type Lang } from "./lang";
import type { SavedWord } from "./types";
import { supabase } from "./lib/supabase";
import { saveToSupabase } from "./utils/supabase-save";
import { buildLevelQuiz } from "./utils/levelQuiz";
import { DAILY_GOAL_XP, QUIZ_LEVEL_UNLOCK_SHARE, REVIEW_KNOWN_XP, SAVE_WORD_XP, XP_PER_LEVEL } from "./research/params";
import { BataModal, OyuKilim, TurkicWords } from "./components/Culture";
import { loadMaqals } from "./utils/maqals";
import { WordCoach } from "./components/WordCoach";
import { LegendScreen } from "./components/LegendCards";
// Teacher screens load only for teachers.
const TeacherScreen = lazy(() => import("./components/Teacher").then((m) => ({ default: m.TeacherScreen })));
const TeacherProfile = lazy(() => import("./components/TeacherProfile").then((m) => ({ default: m.TeacherProfile })));
import { RoleSwitchRow } from "./components/RolePicker";
import { clearPendingRole, type Role } from "./utils/role";
import { AssignmentsCard, JoinClassSheet, MyClassesSection } from "./components/StudentClasses";
import { clearPendingClass, flushQuizResults, peekPendingClass, saveQuizResult } from "./utils/classes";
import { setEventsUser, track } from "./utils/events";
import { setSyncUser } from "./utils/learnerSync";
import { useOnline } from "./utils/useOnline";
import {
  loadProgress, saveProgress, progressKey, loadLocalReviews, saveReview,
  nextReview, lapse, localDay, daysBetween, isDue, MAX_MASTERY, type ProgressStep, type CardDirection
} from "./utils/progress";

export default function KazakhTalesApp({ session, role, onRoleChange }: { session: Session; role: Role; onRoleChange: (r: Role) => Promise<boolean> }) {
  // Teachers get their own space: classes, the tales to preview, and a profile.
  const teacher = role === "teacher";
  const userId: string = session.user.id;
  const userEmail: string = session.user.email || "";
  const [displayName, setDisplayName] = useState<string>(
    (session.user.user_metadata?.display_name as string | undefined) || userEmail.split("@")[0] || "Learner"
  );
  // The chosen avatar id (src/utils/profileEdit.ts); not shown in the research build.
  const [avatar, setAvatar] = useState<string | null>(
    RESEARCH_MODE ? null : ((session.user.user_metadata?.avatar as string | undefined) ?? null)
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [tab, setTab] = useState(teacher ? "teacher" : "home");
  // A class link opened before sign-in: offer to join once the app is open.
  const [pendingCode, setPendingCode] = useState<string | null>(peekPendingClass);
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
  // Days since the learner last did anything (null = never). Drives the mascot's mood; no data is stored for it.
  const [daysAway, setDaysAway] = useState<number | null>(null);
  const lastActiveDateRef = useRef<string | null>(null);

  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  // Saved words could not be read: say so instead of showing "0 words".
  const [wordsLoadFailed, setWordsLoadFailed] = useState(false);
  const online = useOnline();
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [wordsMode, setWordsMode] = useState("cards");
  const [lastPractice, setLastPractice] = useState<"words" | "speak" | "quiz">("words");

  const [sessionXp, setSessionXp] = useState(0);
  const DAILY_GOAL = DAILY_GOAL_XP;

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
  const wordsReadyRef = useRef(false);
  const pendingRef = useRef({ xp: 0, quizzes: 0, perfect: 0, active: false });
  const saveProfile = (patch: () => Record<string, unknown>) => {
    if (!profileReadyRef.current) return;
    saveToSupabase(async () => supabase.from("profiles").update(patch()).eq("id", userId), onSaveError);
  };

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    idle(prefetchTabs);
  }, []);
  // Learning events (docs/events.md): the learner's own; a teacher's preview is not learning.
  // In the research build the StudyGate switches events on only after the code and the learner's assent.
  useEffect(() => {
    if (RESEARCH_MODE) return;
    setEventsUser(teacher ? null : userId);
    return () => setEventsUser(null);
  }, [userId, teacher]);
  // Cards, known words, votes, trails, debates follow the learner to another device (utils/learnerSync.ts).
  useEffect(() => {
    setSyncUser(userId);
    return () => setSyncUser(null);
  }, [userId]);
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
      setDaysAway(last ? Math.max(0, daysBetween(last, localDay())) : null);
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

    type WordRow = { word: string; translation: string; mastery: number; next_review_at?: string | null };
    const applyWords = (rows: WordRow[]) => {
      const localReviews = loadLocalReviews(userId);
      const fromServer: SavedWord[] = rows.map((row) => ({
        word: row.word,
        translation: row.translation,
        mastery: row.mastery,
        nextReviewAt: row.next_review_at ?? localReviews[row.word] ?? null,
      }));
      // Words saved while the list was still loading stay in it.
      setSavedWords((prev) => [...fromServer, ...prev.filter((w) => !fromServer.some((x) => x.word === w.word))]);
      wordsReadyRef.current = true;
      setWordsLoadFailed(false);
    };
    // A failed load must not look like "no words yet": try again a few times.
    let retryWhenOnline: (() => void) | null = null;
    const retryWords = (attempt: number) => {
      if (attempt >= 4) {
        // Gave up for now: one more round as soon as the network comes back.
        retryWhenOnline = () => { retryWhenOnline = null; retryWords(0); };
        window.addEventListener("online", retryWhenOnline, { once: true });
        return;
      }
      setTimeout(async () => {
        if (cancelled) return;
        const res = await supabase.from("saved_words").select("*").eq("user_id", userId).order("created_at", { ascending: true });
        if (cancelled) return;
        if (res.error || !res.data) retryWords(attempt + 1);
        else applyWords(res.data as WordRow[]);
      }, 1500 * 2 ** attempt);
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
      if (wordsRes.error || !wordsRes.data) { setWordsLoadFailed(true); retryWords(0); }
      else applyWords(wordsRes.data);
      if (achievementsRes.data) {
        setUnlockedAchievements(achievementsRes.data.map((row: { achievement_id: string }) => row.achievement_id));
      }
      setDataLoaded(true);
    };

    loadUserData().catch(() => {
      setDataLoaded(true);
      if (!profileReadyRef.current) retryProfile(0);
      if (!wordsReadyRef.current) { setWordsLoadFailed(true); retryWords(0); }
    });

    return () => {
      cancelled = true;
      if (retryWhenOnline) window.removeEventListener("online", retryWhenOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSignOut = async () => {
    clearPendingRole();
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
    setDaysAway(0);
    setStreakDays(nextStreak);
    latestStreakRef.current = { streak_days: nextStreak, last_active_date: today };
    saveProfile(() => latestStreakRef.current);
  };

  const addXp = (amount: number) => {
    // A teacher previewing a tale earns nothing: XP, streak and badges are the learner's.
    if (!amount || teacher) return;
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
    track("level_complete", { object_type: "level", object_id: `${storyId}:${step}`, story_id: storyId, level: step });
  };

  // Leitner review: "knew it" moves the word up a box, "not yet" one box back.
  const handleReview = (word: string, known: boolean, direction: CardDirection = "en_kk") => {
    const current = savedWords.find((w) => w.word === word);
    if (!current) return;
    const up = Math.min((current.mastery ?? 0) + 1, MAX_MASTERY);
    const { mastery, nextReviewAt } = known ? { mastery: up, nextReviewAt: nextReview(up) } : lapse(current.mastery ?? 0);
    setSavedWords((prev) => prev.map((w) => (w.word === word ? { ...w, mastery, nextReviewAt } : w)));
    saveReview(userId, word, mastery, nextReviewAt);
    // Days past (or before) the due date: the gap the forgetting curve needs.
    const due = current.nextReviewAt ? Date.parse(current.nextReviewAt) : NaN;
    track("srs_review", {
      object_type: "word", object_id: word,
      result: {
        correct: known, box_before: current.mastery ?? 0, box_after: mastery, direction,
        days_overdue: Number.isFinite(due) ? Math.round((Date.now() - due) / 86_400_000 * 10) / 10 : null,
      },
    });
    if (known) addXp(REVIEW_KNOWN_XP);
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
    // A teacher's try-out is not a score: it stays out of reports and progress.
    if (teacher) return;
    const storyId = selectedStory || STORIES[0].id;
    const step = quizLevel ?? "quiz";
    // The score goes to the teacher's report; it waits on the device while offline.
    saveQuizResult(userId, storyId, step, correctCount, total, firstTry);
    if (correctCount >= Math.ceil(total * QUIZ_LEVEL_UNLOCK_SHARE)) {
      // First time a whole tale is finished: the elder's blessing and its ornament.
      if (!RESEARCH_MODE && step === "quiz" && !progress.has(progressKey(storyId, "quiz"))) setBataStory(storyId);
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
    const prevRank = Math.floor(prevXpRef.current / XP_PER_LEVEL);
    const newRank = Math.floor(xp / XP_PER_LEVEL);
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
          async () => supabase.from("user_achievements").upsert({ user_id: userId, achievement_id: a.id }, { onConflict: "user_id,achievement_id", ignoreDuplicates: true }),
          // No error toast: an unsaved achievement is unlocked again from the stats on the
          // next sign-in, so nothing is lost (docs/error-states.md, finding 3).
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

  // Placement check result: open the first tale at the suggested level.
  const readAtLevel = (level: string) => { setSelectedStory(STORIES[0].id); setSelectedLevel(level); setTab("read"); };

  const handleSaveWord = (word: string, translation: string, source: "reader" | "daily" | "wordbank" = "reader") => {
    if (savedWords.some((w) => w.word === word)) return;
    track("word_save", {
      object_type: "word", object_id: word,
      story_id: source === "reader" ? selectedStory : null, level: source === "reader" ? selectedLevel : null,
      result: { source },
    });
    // Until the saved list has loaded, the word may already be on the server:
    // XP then waits for the server to confirm it is new.
    const known = wordsReadyRef.current;
    if (known) addXp(SAVE_WORD_XP);
    setSavedWords((prev: SavedWord[]) => [...prev, { word, translation, mastery: 0, nextReviewAt: null }]);
    saveToSupabase(async () => {
      // ignoreDuplicates: a word already saved keeps its mastery and review date.
      const res = await supabase
        .from("saved_words")
        .upsert({ user_id: userId, word, translation, mastery: 0 }, { onConflict: "user_id,word", ignoreDuplicates: true })
        .select("word");
      if (!res.error && !known && res.data?.length) addXp(SAVE_WORD_XP);
      return res;
    }, onSaveError);
  };

  // The name offered in a class: the first name only, never a surname or the
  // email prefix the display name falls back to.
  const classNick = displayName && !userEmail.toLowerCase().startsWith(`${displayName.toLowerCase()}@`)
    ? displayName.trim().split(/\s+/)[0].slice(0, 30)
    : "";

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

  const tabs: { id: string; label: string; Icon: typeof IconYurt }[] = teacher ? [
    { id: "teacher", label: lang === "kk" ? "Сыныптар" : "Classes", Icon: IconBoard },
    { id: "read",    label: lang === "kk" ? "Ертегілер" : "Tales", Icon: IconBook },
    { id: "profile", label: t.navProfile, Icon: IconLearner },
  ] : RESEARCH_MODE ? [
    // R4: the core loop only (reading with glosses and narration, quiz, word review) and the test.
    { id: "home",    label: t.navHome,    Icon: IconYurt },
    { id: "read",    label: t.navRead,    Icon: IconBook },
    { id: "quiz",    label: t.navQuiz,    Icon: IconTrophy },
    { id: "words",   label: lang === "kk" ? "Сөздер" : "Words", Icon: IconCards },
    { id: "test",    label: lang === "kk" ? "Тест" : "Test", Icon: IconBoard },
    { id: "profile", label: t.navProfile, Icon: IconLearner },
  ] : [
    // Shanyraq 2.0: five tabs. Practice holds word review, speaking and the quiz; Words is the word bank;
    // the hero cards open from Me. Inner tab ids stay as they were, so every setTab() call keeps working.
    { id: "home",     label: t.navHome,     Icon: IconYurt },
    { id: "read",     label: t.navTales,    Icon: IconBook },
    { id: "practice", label: t.navPractice, Icon: IconTarget },
    { id: "bank",     label: t.navBank,     Icon: IconCards },
    { id: "profile",  label: t.navMe,       Icon: IconLearner },
  ];
  const fiveTabs = !teacher && !RESEARCH_MODE;
  const inPractice = tab === "quiz" || tab === "speak" || (tab === "words" && wordsMode !== "bank");
  // A teacher's quiz opens from a tale, so "Tales" stays lit there.
  const isActive = (id: string) => {
    if (!fiveTabs) return tab === id || (teacher && tab === "quiz" && id === "read");
    if (id === "practice") return inPractice;
    if (id === "bank") return tab === "words" && wordsMode === "bank";
    if (id === "profile") return tab === "profile" || tab === "cards";
    return tab === id;
  };
  const openQuiz = () => { setQuizLevel(null); setQuizStarted(false); setTab("quiz"); };
  const openPractice = (sub: "words" | "speak" | "quiz") => {
    setLastPractice(sub);
    if (sub === "quiz") return openQuiz();
    if (sub === "words" && wordsMode === "bank") setWordsMode("cards");
    setTab(sub);
  };
  const navTo = (id: string) => {
    if (id === "practice") return openPractice(lastPractice);
    if (id === "bank") { setWordsMode("bank"); return setTab("words"); }
    if (id === "quiz") return openQuiz();
    setTab(id);
  };

  const dueCount = savedWords.filter((w) => isDue(w.nextReviewAt)).length;

  const wordsBadge = (id: string) =>
    id === (fiveTabs ? "practice" : "words") && dueCount > 0 ? (
      <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ember text-xs text-white flex items-center justify-center font-bold ring-2 ring-card">
        {dueCount}
      </span>
    ) : null;

  const LangToggle = () => (
    <div className="segmented w-[104px]" role="group" aria-label={lang === "kk" ? "Тіл" : "Language"}>
      <button aria-pressed={lang === "kk"} onClick={() => setLang("kk")}>ҚАЗ</button>
      <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>ENG</button>
    </div>
  );

  const StatChips = () => (fiveTabs && streakDays === 0 && xp === 0) ? null : (
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

  const app = (
    <LangContext.Provider value={lang}>
    <div className="relative h-dvh w-full bg-sand font-body text-ink overflow-hidden flex">
      <LevelUpModal show={showLevelUp} rank={levelUpRank} onClose={() => setShowLevelUp(false)} />
      <BataModal storyId={bataStory} lang={lang} onClose={() => setBataStory(null)} />
      <AchievementBanner
        achievement={achievementQueue[0] || null}
        onDone={() => setAchievementQueue((prev) => prev.slice(1))}
      />
      {/* The quiz is a focus mode: Shoqan steps aside so he never covers the answer buttons. */}
      {/* Teachers meet Shoqan only while previewing a tale, as their learners do. */}
      {/* R4: no Shoqan in the research build. */}
      {!RESEARCH_MODE && <ShoqanChat hidden={(tab === "quiz" && quizStarted) || (teacher && tab !== "read") || (fiveTabs && tab !== "read")} />}
      <SaveErrorToast show={showSaveError} message={t.saveError} onClose={() => setShowSaveError(false)} />
      <JoinClassSheet
        open={!!pendingCode && !teacher}
        onClose={() => { clearPendingClass(); setPendingCode(null); }}
        lang={lang}
        defaultName={classNick}
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
            const active = isActive(id);
            return (
              <button
                key={id}
                onClick={() => navTo(id)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-4 px-4 min-h-[52px] rounded-2xl border-2 transition-colors w-full ${active ? (fiveTabs ? "bg-ember-soft border-ember/40 text-ember-ink" : "bg-sky-soft border-sky/60 text-sky-deep") : "border-transparent text-ink-2 hover:bg-sand-2"}`}
              >
                <span className="relative">
                  <Icon size={30} />
                  {wordsBadge(id)}
                </span>
                <span className="font-display text-[16px] font-extrabold">{label}</span>
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
          {!teacher && <div className="ml-auto"><StatChips /></div>}
        </header>
        {/* A strip under the header, not an overlay: it never covers the achievement banner or the quiz. */}
        {!online && (
          <p role="status" className="shrink-0 bg-ink text-white text-[13px] leading-snug px-4 py-2 text-center">
            {t.offline}
          </p>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1040px] flex gap-8 px-4 md:px-8 pt-4 xl:pt-10 pb-44 md:pb-36">
            <main className="flex-1 min-w-0 max-w-[620px] mx-auto">
              <Suspense fallback={<div className="min-h-[50dvh]" />}>
              {/* A class link opened while signed in as a teacher: it is meant for learners. */}
              {teacher && pendingCode && (
                <div role="status" className="card p-4 mb-5 flex items-start gap-3">
                  <p className="flex-1 text-[15px] text-ink-2">
                    {lang === "kk"
                      ? `Бұл сілтеме оқушыларға арналған (код ${pendingCode}). Сыныпқа оқушы ретінде қосылу үшін профильде «Оқушы режиміне ауысу» таңда.`
                      : `This link is for learners (code ${pendingCode}). To join as a learner, choose "Switch to learner" in your profile.`}
                  </p>
                  <button onClick={() => { clearPendingClass(); setPendingCode(null); }} className="btn btn-ghost btn-sm shrink-0">{lang === "kk" ? "Жабу" : "Close"}</button>
                </div>
              )}
              {fiveTabs && inPractice && !(tab === "quiz" && quizStarted) && (
                <div role="tablist" aria-label={t.practiceSwitch} className="segmented mb-5 grid grid-cols-3">
                  {(["words", "speak", "quiz"] as const).map((sub) => {
                    const on = sub === "words" ? tab === "words" : tab === sub;
                    return (
                      <button key={sub} role="tab" aria-selected={on} aria-pressed={on} onClick={() => openPractice(sub)} className="min-h-[44px] text-[15px] font-semibold">
                        {sub === "words" ? t.practiceWords : sub === "speak" ? t.practiceSpeak : t.practiceTest}
                      </button>
                    );
                  })}
                </div>
              )}
              {tab === "home" && (
                <HomeScreen
                  progress={progress}
                  userId={userId}
                  onReward={addXp}
                  onOpenCards={() => setTab("cards")}
                  dueWords={dueCount}
                  onOpenReview={() => openPractice("words")}
                  placement={!RESEARCH_MODE && PlacementCheck && !teacher ? (
                    <Suspense fallback={null}><PlacementCheck userId={userId} lang={lang} place="home" onRead={readAtLevel} /></Suspense>
                  ) : undefined}
                  mascot={!RESEARCH_MODE && ShoqanMascot && !teacher && SHOQAN_HOME_MASCOT ? (
                    <Suspense fallback={null}><ShoqanMascot daysAway={daysAway} lang={lang} /></Suspense>
                  ) : undefined}
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
                  eventInfo={{ story_id: selectedStory || STORIES[0].id, level: quizLevel ?? "quiz" }}
                />
              )}
              {tab === "words" && (
                <div className="animate-pop-in">
                  {!RESEARCH_MODE && <div className="mb-8">
                    <WordCoach savedWords={savedWords} progress={progress} userId={userId} lang={lang} onLearn={(w, tr) => handleSaveWord(w, tr, "daily")} onReward={addXp} />
                  </div>}
                  {!RESEARCH_MODE && WordbankScreen && wordsMode === "bank" ? (
                    <WordbankScreen savedWords={savedWords} onAdd={(w, tr) => handleSaveWord(w, tr, "wordbank")} mode={wordsMode} setMode={setWordsMode} />
                  ) : wordsMode === "match" ? (
                    <MatchingGame savedWords={savedWords} onReward={addXp} mode={wordsMode} setMode={setWordsMode} />
                  ) : (
                    <FlashcardsScreen savedWords={savedWords} loadFailed={wordsLoadFailed} onReview={handleReview} lang={lang} mode={wordsMode} setMode={setWordsMode} />
                  )}
                  {!RESEARCH_MODE && <div className="mt-8"><TurkicWords lang={lang} /></div>}
                </div>
              )}
              {!RESEARCH_MODE && tab === "cards" && <LegendScreen lang={lang} userId={userId} onReward={addXp} />}
              {!RESEARCH_MODE && tab === "speak" && <SpeakScreen onReward={addXp} t={t} />}
              {RESEARCH_MODE && TestScreen && tab === "test" && !teacher && <TestScreen userId={userId} lang={lang} />}
              {tab === "profile" && teacher && (
                <TeacherProfile
                  lang={lang}
                  setLang={setLang}
                  userName={displayName}
                  email={userEmail}
                  onOpenClasses={() => setTab("teacher")}
                  roleSwitch={<RoleSwitchRow kk={lang === "kk"} to="student" onSwitch={onRoleChange} />}
                  onSignOut={handleSignOut}
                />
              )}
              {tab === "profile" && !teacher && (
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
                  cardsEntry={fiveTabs ? (
                    <button onClick={() => setTab("cards")} className="card w-full p-4 flex items-center gap-4 text-left min-h-[64px]">
                      <IconShield size={36} />
                      <span className="flex-1">
                        <span className="block font-display font-extrabold text-ink text-[17px]">{t.cardsEntryTitle}</span>
                        <span className="block text-sm text-ink-2">{t.cardsEntryHint}</span>
                      </span>
                      <ChevronRight size={20} className="text-ink-3" aria-hidden="true" />
                    </button>
                  ) : undefined}
                  classes={<MyClassesSection lang={lang} userId={userId} defaultName={classNick} />}
                  roleSwitch={<RoleSwitchRow kk={lang === "kk"} to="teacher" onSwitch={onRoleChange} />}
                  avatar={avatar}
                  placement={!RESEARCH_MODE && PlacementCheck ? (
                    <Suspense fallback={null}><PlacementCheck userId={userId} lang={lang} place="profile" onRead={readAtLevel} /></Suspense>
                  ) : undefined}
                  editor={!RESEARCH_MODE && ProfileEditor ? (
                    <Suspense fallback={null}>
                      <ProfileEditor userId={userId} lang={lang} name={displayName} avatar={avatar}
                        onSaved={(n, a) => { setDisplayName(n); setAvatar(a); }} />
                    </Suspense>
                  ) : undefined}
                />
              )}
              {tab === "teacher" && teacher && <TeacherScreen lang={lang} />}
              </Suspense>
            </main>

            {/* Right rail — wide desktop only, Duolingo-style widgets */}
            {!teacher && <aside className="hidden xl:flex flex-col gap-4 w-[300px] shrink-0 pt-2 sticky top-0 self-start">
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
                  {wordsLoadFailed && savedWords.length === 0
                    ? t.wordsNotLoaded
                    : <>{savedWords.length} {lang === "kk" ? "сөз сақталды" : "words saved"}</>}
                  {dueCount > 0 && <> · <b className="text-felt">{dueCount} {lang === "kk" ? "қайталауға" : "due"}</b></>}
                </p>
                <button onClick={() => (fiveTabs ? openPractice("words") : setTab("words"))} className="btn btn-ghost btn-sm w-full mt-4">
                  {lang === "kk" ? "Қайталау" : "Practice"}
                </button>
              </div>
            </aside>}
          </div>
        </div>

        {/* Tab bar — mobile only, Apple frosted */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-line/70 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
          <div className={`grid ${teacher ? "grid-cols-3" : RESEARCH_MODE ? "grid-cols-6" : "grid-cols-5"}`}>
            {tabs.map(({ id, label, Icon }) => {
              const active = isActive(id);
              return (
                <button
                  key={id}
                  onClick={() => navTo(id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 min-h-[50px] ${active ? (fiveTabs ? "text-ember-ink" : "text-sky-ink") : "text-ink-2"}`}
                >
                  {/* The active tab is in colour on a soft pill; the rest stay grey, so the state reads at a glance. */}
                  <span className={`relative px-2 py-0.5 rounded-full transition-colors ${active ? (fiveTabs ? "bg-ember-soft" : "bg-sky-soft") : ""}`}>
                    <Icon size={28} muted={!active} className={`transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                    {wordsBadge(id)}
                  </span>
                  <span className={`${fiveTabs ? "text-xs" : "text-[10px]"} max-w-full truncate px-0.5 ${active ? "font-bold" : "font-medium"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
    </LangContext.Provider>
  );
  // R4: a learner of the research build types the participant code first.
  return RESEARCH_MODE && !teacher ? <StudyGate userId={userId} lang={lang}>{app}</StudyGate> : app;
}
