import { useState } from "react";
import { ChevronRight, LogOut, Share2 } from "lucide-react";
import { Sheet } from "../UIHelpers";
import { Shanyraq, OrnamentBand } from "../Ornaments";
import { AvatarBadge } from "../AvatarBadge";
import { ACHIEVEMENTS } from "../../constants";
import { IconFlame, IconBolt, IconCards, IconTrophy, Badge } from "../Icons";
import { PUBLIC_URL } from "../../lib/api";
import { XP_PER_LEVEL } from "../../research/params";
import { DeleteAccountCard, PolicyRow } from "../AccountRows";

/* --- 8. PROFILE SCREEN --- */
export function ProfileScreen({ xp, t, lang = "kk", setLang, savedWordsCount = 0, unlockedAchievements = [], userName = "Learner", onSignOut, streakDays = 0, quizzesCompleted = 0, kilim, cardsEntry, classes, roleSwitch, avatar = null, editor, placement }: {
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
  /** Entry to the hero cards (five-tab site: the cards left the tab bar). */
  cardsEntry?: React.ReactNode;
  classes?: React.ReactNode;
  roleSwitch?: React.ReactNode;
  /** Avatar id (src/utils/profileEdit.ts); the first letter of the name when none. */
  avatar?: string | null;
  /** The edit-profile button; absent in the research build (KazakhTalesApp.tsx). */
  editor?: React.ReactNode;
  /** The placement check, to take it again (ordinary site only). */
  placement?: React.ReactNode;
}) {
  const [showBuklet, setShowBuklet] = useState(false);
  // Levels count from 1: 0–99 XP is level 1.
  const rank = Math.floor(xp / XP_PER_LEVEL) + 1;
  const initial = (userName || "?").trim().charAt(0).toUpperCase();

  const stats = [
    { label: t.streakLabel, value: streakDays, Icon: IconFlame },
    { label: t.totalXpLabel, value: xp, Icon: IconBolt },
    { label: lang === "kk" ? "Сөздер" : "Words", value: savedWordsCount, Icon: IconCards },
    { label: lang === "kk" ? "Сынақтар" : "Quizzes", value: quizzesCompleted, Icon: IconTrophy },
  ];

  const share = async () => {
    const shareText = `🏆 ${userName} is learning English through Kazakh folklore on Ertegi English!\n${xp} XP • ${streakDays}-day streak • ${unlockedAchievements.length}/${ACHIEVEMENTS.length} badges unlocked`;
    const shareUrl = `${PUBLIC_URL}/`;
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
        <div className={`px-5 ${editor ? "pb-3" : "pb-5"} flex items-end gap-4`}>
          <div className="relative w-[88px] h-[88px] shrink-0 -mt-11">
            <Shanyraq className="absolute -inset-2 w-[104px] h-[104px] text-sun" strokeWidth={2.4} />
            <AvatarBadge id={avatar} initial={initial} className="absolute inset-0 border-4 border-card text-4xl" />
          </div>
          <div className="min-w-0 pt-3">
            <h1 className="font-display font-black text-2xl text-ink truncate">{userName}</h1>
            <p className="text-sm text-ink-2">{t.levelStatus} · {lang === "kk" ? `${rank}-деңгей` : `Level ${rank}`}</p>
          </div>
        </div>
        {/* A row of its own (redesign Q3): beside the avatar the column is too narrow at 360 px
            and «Профильді өзгерту» broke into two lines. */}
        {editor && <div className="px-5 pb-5 [&_button]:whitespace-nowrap">{editor}</div>}
      </div>

      {placement}

      {/* Heroes' cards above the numbers (redesign Q3). */}
      {cardsEntry}

      {/* Stats */}
      <div>
        <h2 className="font-display font-black text-xl text-ink mb-3">{lang === "kk" ? "Статистика" : "Statistics"}</h2>
        {/* A new learner has only zeros: say so once instead of four empty tiles. */}
        {stats.every((x) => x.value === 0) ? (
          <p className="tile p-4 text-[15px] text-ink-2">{t.noDataYet}</p>
        ) : (
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
        )}
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
        {roleSwitch}
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
        <PolicyRow lang={lang} />
        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60">
          <span className="w-8 h-8 rounded-lg bg-felt flex items-center justify-center"><LogOut size={16} className="text-white" /></span>
          <span className="flex-1 text-[16px] text-felt font-medium">{lang === "kk" ? "Шығу" : "Sign out"}</span>
        </button>
      </div>

      <DeleteAccountCard lang={lang} />

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
                  <p className="text-xs text-white/80 uppercase tracking-[0.06em]">{r.l}</p>
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
