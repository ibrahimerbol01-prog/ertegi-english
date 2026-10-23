import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { QoshqarMuyiz, Shanyraq, SteppeBackground, KilimStrip } from "./Ornaments";
import { useLang } from "../lang";

/* Brand mark used across screens: the qoşqar müiız horn pair. */
export const KazakhOrnament = ({ className = "w-6 h-6 text-sun-deep" }: { className?: string }) => (
  <QoshqarMuyiz className={className} strokeWidth={4} />
);

/* Kept under its old name so callers don't change. */
export const StaticOrnamentBg = SteppeBackground;

/* Logo: şañyraq in a sky tile plus the ERTEGI ENGLISH wordmark. */
export const BrandMark = ({ compact = false }: { compact?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span className="w-9 h-9 rounded-[11px] bg-sky flex items-center justify-center shadow-[0_3px_0_var(--color-sky-deep)]">
      <Shanyraq className="w-6 h-6 text-white" strokeWidth={4.5} />
    </span>
    {!compact && (
      <span className="font-display font-black text-[17px] tracking-[0.02em] text-ink leading-none whitespace-nowrap">
        ERTEGI <span className="text-sky">ENGLISH</span>
      </span>
    )}
  </div>
);

export const BackgroundVideo = ({ src, opacity = 50, videoKey }: { src: string; opacity?: number; videoKey?: string }) => {
  const [error, setError] = useState(false);
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {!error ? (
        <video
          key={videoKey || src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          src={src}
          onError={() => setError(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: opacity / 100 }}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-night-2 to-night" />
      )}
    </div>
  );
};

export const XpToast = ({ toast }: { toast: { amount: number; key: number } | null }) => {
  if (!toast) return null;
  return (
    <span
      key={toast.key}
      className="absolute top-full left-1/2 -ml-6 pointer-events-none animate-xp-float"
    >
      <span className="font-display text-sm font-black text-sun-deep whitespace-nowrap">
        +{toast.amount} XP
      </span>
    </span>
  );
};

const CONFETTI_COLORS = ["var(--color-sky)", "var(--color-sun)", "var(--color-felt)", "var(--color-jade)"];

export const LevelUpModal = ({ show, rank, onClose }: { show: boolean; rank: number; onClose: () => void }) => {
  const kk = useLang() === "kk";
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const confetti = useMemo(() => show ? Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: 4 + ((i * 53) % 92),
    delay: (i % 6) * 0.09,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  })) : [], [show]);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => onCloseRef.current(), 2600);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-6 animate-pop-in">
      <div className="relative w-full max-w-[320px]">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute top-0 w-2.5 h-2.5 rounded-[3px] animate-confetti"
            style={{ left: `${c.left}%`, backgroundColor: c.color, animationDelay: `${c.delay}s` }}
          />
        ))}
        <div className="relative card overflow-hidden p-7 text-center animate-rank-pop">
          <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full" />
          <span className="mx-auto mt-2 w-20 h-20 rounded-full bg-sun flex items-center justify-center shadow-[0_5px_0_var(--color-sun-deep)]">
            <Shanyraq className="w-12 h-12 text-white" strokeWidth={4} />
          </span>
          <p className="eyebrow mt-5 text-sun-deep">{kk ? "Жаңа деңгей" : "Rank achieved"}</p>
          <h3 className="large-title mt-1">{kk ? `${rank}-деңгей` : `Level ${rank}`}</h3>
          <p className="text-sm text-ink-2 mt-2">{kk ? "Дала ертегілеріне берген еңбегің ақталып жатыр." : "Your dedication to the steppe tales is paying off."}</p>
        </div>
      </div>
    </div>
  );
};

export const AchievementBanner = ({ achievement, onDone }: { achievement: { icon: string; title: string; desc: string; kk?: { title: string; desc: string } } | null; onDone: () => void }) => {
  const kk = useLang() === "kk";
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => onDoneRef.current(), 2800);
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  if (!achievement) return null;

  return (
    <div className="fixed top-[max(env(safe-area-inset-top),12px)] left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-32px)] max-w-[380px] pointer-events-none">
      <div className="animate-achievement card glass p-3 flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-sun-soft flex items-center justify-center text-2xl shrink-0">{achievement.icon}</span>
        <div className="min-w-0">
          <p className="eyebrow text-sun-deep">{kk ? "Белгі ашылды" : "Badge unlocked"}</p>
          <p className="font-display text-[15px] font-extrabold text-ink truncate">{kk && achievement.kk ? achievement.kk.title : achievement.title}</p>
          <p className="text-xs text-ink-2 truncate">{kk && achievement.kk ? achievement.kk.desc : achievement.desc}</p>
        </div>
      </div>
    </div>
  );
};

export const SaveErrorToast = ({ show, message }: { show: boolean; message: string }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[80] max-w-[340px] w-[calc(100%-32px)] pointer-events-none">
      <div className="animate-pop-in bg-ink text-white rounded-2xl px-4 py-3 text-sm text-center shadow-2xl">
        {message}
      </div>
    </div>
  );
};

/* Apple Activity-style ring. Sun while in progress, jade when the goal is met. */
export const DailyGoalRing = ({ current, goal, size = 72 }: { current: number; goal: number; size?: number }) => {
  const stroke = size * 0.12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(current / goal, 1));
  const offset = circumference * (1 - progress);
  const complete = progress >= 1;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--color-sand-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={complete ? "var(--color-jade)" : "var(--color-sun)"}
          strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1), stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <Check size={size * 0.32} strokeWidth={3.5} className="text-jade" />
        ) : (
          <>
            <span className="font-display text-base font-black text-ink leading-none">{current}</span>
            <span className="text-[10px] font-semibold text-ink-3 mt-0.5">/ {goal}</span>
          </>
        )}
      </div>
    </div>
  );
};

/* Screen header used by every tab: eyebrow + Apple large title + optional trailing slot. */
export const ScreenHeader = ({ eyebrow, title, trailing, onBack, backLabel }: {
  eyebrow?: string;
  title: string;
  trailing?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
}) => (
  <div className="pt-2 pb-4">
    {onBack && (
      <button onClick={onBack} className="-ml-1 mb-2 flex items-center gap-0.5 text-sky font-semibold text-[15px] min-h-[36px]">
        <span className="text-2xl leading-none -mt-0.5">‹</span> {backLabel}
      </button>
    )}
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="large-title">{title}</h1>
      </div>
      {trailing}
    </div>
  </div>
);

/* Bottom sheet used for word details, choices and the booklet. */
export const Sheet = ({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string }) => {
  const kk = useLang() === "kk";
  if (!open) return null;
  // Portal to body: animated ancestors would otherwise trap position:fixed.
  return createPortal(
    <div className="fixed inset-0 z-[68] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <button aria-label={kk ? "Жабу" : "Close"} onClick={onClose} className="absolute inset-0 bg-ink/35 backdrop-blur-[2px] animate-pop-in" />
      <div className="relative w-full sm:max-w-[420px] max-h-[85dvh] overflow-y-auto bg-card rounded-t-[28px] sm:rounded-[28px] shadow-2xl animate-sheet-up sm:animate-pop-in pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="sm:hidden mx-auto mt-2.5 mb-1 w-10 h-1.5 rounded-full bg-sand-3" />
        {children}
      </div>
    </div>,
    document.body
  );
};
