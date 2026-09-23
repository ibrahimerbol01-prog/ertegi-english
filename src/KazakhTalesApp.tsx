import React, { useState } from "react";
import { 
  BookOpen, Trophy, Home as HomeIcon, Flame, User, Layers 
} from "lucide-react";
import { 
  FontLoader, LevelUpModal, AchievementBanner, XpToast 
} from "./components/UIHelpers";
import { ShoqanChat } from "./components/ShoqanChat";
import { 
  IntroScreen, HomeScreen, ReaderScreen, FlashcardsScreen, MatchingGame 
} from "./components/Screens";
import { DICT, ACHIEVEMENTS } from "./constants";
import { SavedWord } from "./types";

export default function KazakhTalesApp() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "read" | "flashcards" | "matching" | "profile">("home");
  const [selectedStory, setSelectedStory] = useState<string | null>("aldar_kose");
  const [selectedLevel, setSelectedLevel] = useState<string | null>("A1");
  
  const [xp, setXp] = useState(120);
  const [sessionXp, setSessionXp] = useState(0);
  const [rank, setRank] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [xpToast, setXpToast] = useState<{ key: number; amount: number } | null>(null);

  const [savedWords, setSavedWords] = useState<SavedWord[]>([
    { word: "clever", translation: "тапқыр / айлакер" },
    { word: "coat", translation: "шапан / сырт киім" },
    { word: "horse", translation: "ат / жылқы" }
  ]);

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [activeAchievement, setActiveAchievement] = useState<any>(null);

  const handleReward = (amount: number) => {
    setXp((prev) => {
      const nextXp = prev + amount;
      const nextRank = Math.floor(nextXp / 100) + 1;
      if (nextRank > rank) {
        setRank(nextRank);
        setShowLevelUp(true);
      }
      return nextXp;
    });
    setSessionXp((prev) => prev + amount);
    setXpToast({ key: Date.now(), amount });

    const updatedState = {
      xp: xp + amount,
      savedWordsCount: savedWords.length,
      quizzesCompleted: 1,
      perfectQuizzes: 0
    };

    ACHIEVEMENTS.forEach((ach) => {
      if (!unlockedAchievements.includes(ach.id) && ach.check(updatedState)) {
        setUnlockedAchievements((prev) => [...prev, ach.id]);
        setActiveAchievement(ach);
      }
    });
  };

  const handleSaveWord = (word: string, translation: string) => {
    if (!savedWords.some((w) => w.word === word)) {
      setSavedWords((prev) => [...prev, { word, translation }]);
      handleReward(5);
    }
  };

  const t = DICT.en;

  return (
    <div className="min-h-screen bg-[#09090D] text-[#F8F5EE] font-body relative overflow-x-hidden selection:bg-[#C5A059] selection:text-[#09090D]">
      <FontLoader />
      <XpToast toast={xpToast} />
      <LevelUpModal show={showLevelUp} rank={rank} onClose={() => setShowLevelUp(false)} />
      <AchievementBanner achievement={activeAchievement} onDone={() => setActiveAchievement(null)} />
      <ShoqanChat />

      {showIntro ? (
        <IntroScreen onFinish={() => setShowIntro(false)} t={t} />
      ) : (
        <div className="max-w-md mx-auto min-h-screen flex flex-col justify-between pt-4 pb-20 relative z-10">
          
          {/* Header */}
          <div className="px-5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-sm font-black text-[#C5A059] tracking-widest uppercase">
                Ertegi English
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[#14141C] border border-[#C5A059]/30 px-2.5 py-1 rounded-full text-xs font-editorial font-bold text-[#C5A059]">
                <Flame size={12} className="text-amber-500 fill-amber-500" />
                <span>{xp} XP</span>
              </div>
            </div>
          </div>

          {/* Body content base */}
          <main className="flex-1">
            {activeTab === "home" && (
              <HomeScreen 
                onStartRead={(storyId: string) => {
                  setSelectedStory(storyId);
                  setActiveTab("read");
                }}
                t={t}
                lang="en"
                sessionXp={sessionXp}
                dailyGoal={50}
              />
            )}
            {activeTab === "read" && (
              <ReaderScreen
                selectedStory={selectedStory}
                setSelectedStory={setSelectedStory}
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                onQuizGate={() => {}}
                t={t}
                onReward={handleReward}
                savedWords={savedWords}
                onSaveWord={handleSaveWord}
              />
            )}
            {activeTab === "flashcards" && (
              <FlashcardsScreen savedWords={savedWords} onReward={handleReward} />
            )}
            {activeTab === "matching" && (
              <MatchingGame savedWords={savedWords} onReward={handleReward} />
            )}
            {activeTab === "profile" && (
              <div className="px-5 pb-6 space-y-4 animate-pop-in">
                <div className="border-b border-[#C5A059]/20 pb-3">
                  <span className="px-2 py-0.5 gold-badge text-[8px]">PASSPORT</span>
                  <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">USER PROFILE</h2>
                </div>
                <div className="glass-luxury-card p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#C5A059]/20 border border-[#C5A059] flex items-center justify-center font-editorial font-black text-[#C5A059]">
                      L{rank}
                    </div>
                    <div>
                      <h3 className="font-editorial text-sm font-bold uppercase text-[#F8F5EE]">Steppe Explorer</h3>
                      <p className="text-[10px] text-[#C5A059]">Rank Level {rank} Ambassador</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5 space-y-1 text-xs text-[#F8F5EE]/70">
                    <p>Total XP: <span className="text-[#C5A059] font-bold">{xp}</span></p>
                    <p>Saved Words: <span className="text-[#C5A059] font-bold">{savedWords.length}</span></p>
                    <p>Unlocked Badges: <span className="text-[#C5A059] font-bold">{unlockedAchievements.length}</span></p>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Navigation Bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090D]/90 backdrop-blur-lg border-t border-[#C5A059]/20 max-w-md mx-auto px-4 py-2.5 flex justify-around items-center">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center gap-1 ${activeTab === "home" ? "text-[#C5A059]" : "text-[#F8F5EE]/40"}`}
            >
              <HomeIcon size={18} />
              <span className="text-[9px] font-editorial font-bold uppercase tracking-wider">Home</span>
            </button>
            <button
              onClick={() => setActiveTab("read")}
              className={`flex flex-col items-center gap-1 ${activeTab === "read" ? "text-[#C5A059]" : "text-[#F8F5EE]/40"}`}
            >
              <BookOpen size={18} />
              <span className="text-[9px] font-editorial font-bold uppercase tracking-wider">Tales</span>
            </button>
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`flex flex-col items-center gap-1 ${activeTab === "flashcards" ? "text-[#C5A059]" : "text-[#F8F5EE]/40"}`}
            >
              <Layers size={18} />
              <span className="text-[9px] font-editorial font-bold uppercase tracking-wider">Cards</span>
            </button>
            <button
              onClick={() => setActiveTab("matching")}
              className={`flex flex-col items-center gap-1 ${activeTab === "matching" ? "text-[#C5A059]" : "text-[#F8F5EE]/40"}`}
            >
              <Trophy size={18} />
              <span className="text-[9px] font-editorial font-bold uppercase tracking-wider">Match</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 ${activeTab === "profile" ? "text-[#C5A059]" : "text-[#F8F5EE]/40"}`}
            >
              <User size={18} />
              <span className="text-[9px] font-editorial font-bold uppercase tracking-wider">Profile</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
