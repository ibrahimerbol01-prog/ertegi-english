import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";

export const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    .font-editorial { font-family: 'Cinzel', serif; }
    .font-body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Plus Jakarta Sans', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    * { -webkit-tap-highlight-color: transparent; }

    :root {
      --radius-sm: 12px;
      --radius-md: 18px;
      --radius-lg: 26px;
      --radius-pill: 999px;
    }

    .gold-badge {
      background: linear-gradient(135deg, #C5A059 0%, #9A7B38 100%);
      color: #0B0B0E;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border-radius: var(--radius-pill);
      box-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 4px 14px rgba(197, 160, 89, 0.22);
    }

    .terracotta-badge {
      background: linear-gradient(135deg, #B2533E 0%, #8C3A27 100%);
      color: #F8F5EE;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border-radius: var(--radius-pill);
    }

    .gold-glow { box-shadow: 0 8px 28px -6px rgba(197, 160, 89, 0.35), 0 1px 2px rgba(0,0,0,0.15); }

    .glass-luxury-card {
      background: rgba(20, 20, 26, 0.72);
      backdrop-filter: saturate(180%) blur(24px);
      -webkit-backdrop-filter: saturate(180%) blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-lg);
      box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 40px -12px rgba(0, 0, 0, 0.55);
    }

    .glass-card-hover {
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .glass-card-hover:hover {
      border-color: rgba(197, 160, 89, 0.5);
      box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(197,160,89,0.15);
    }
    .glass-card-hover:active { transform: scale(0.985); }

    button {
      border-radius: var(--radius-md);
      transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease, background-color 0.2s ease, border-color 0.2s ease;
    }
    button:active:not(:disabled) { transform: scale(0.96); opacity: 0.92; }

    .gold-glow, .glass-luxury-card { border-radius: var(--radius-lg); }

    @keyframes pop-in {
      0% { opacity: 0; transform: scale(0.96) translateY(8px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

    @keyframes float-slow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    .animate-float { animation: float-slow 4s ease-in-out infinite; }

    @keyframes xp-float {
      0% { opacity: 0; transform: translateY(4px) scale(0.75); }
      15% { opacity: 1; transform: translateY(-2px) scale(1.15); }
      75% { opacity: 1; transform: translateY(-20px) scale(1); }
      100% { opacity: 0; transform: translateY(-32px) scale(0.9); }
    }
    .animate-xp-float { animation: xp-float 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

    @keyframes confetti-fall {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(240px) rotate(540deg); opacity: 0; }
    }
    .animate-confetti { animation: confetti-fall 1.8s cubic-bezier(0.3, 0.6, 0.5, 1) forwards; }

    @keyframes rank-pop {
      0% { opacity: 0; transform: scale(0.6) translateY(10px); }
      60% { opacity: 1; transform: scale(1.08) translateY(0); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-rank-pop { animation: rank-pop 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }

    @keyframes ring-pulse {
      0%, 100% { filter: drop-shadow(0 0 3px rgba(197,160,89,0.4)); }
      50% { filter: drop-shadow(0 0 9px rgba(197,160,89,0.75)); }
    }
    .animate-ring-pulse { animation: ring-pulse 2.4s ease-in-out infinite; }

    @keyframes answer-correct-pulse {
      0% { transform: scale(1); }
      40% { transform: scale(1.035); box-shadow: 0 0 0 3px rgba(16,185,129,0.28); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    .animate-answer-correct { animation: answer-correct-pulse 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

    @keyframes answer-wrong-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-5px); }
      40% { transform: translateX(4px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(2px); }
    }
    .animate-answer-wrong { animation: answer-wrong-shake 0.4s ease-in-out both; }

    @keyframes achievement-slide {
      0% { opacity: 0; transform: translateY(-16px) scale(0.97); }
      12% { opacity: 1; transform: translateY(0) scale(1); }
      88% { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(-10px) scale(0.98); }
    }
    .animate-achievement { animation: achievement-slide 2.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
  `}</style>
);

export const safePlayVoice = (text: string, onFallback?: (msg?: string) => void) => {
  try {
    if (!("speechSynthesis" in window)) {
      if (onFallback) onFallback("Speech synthesis not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.6;
    utterance.lang = "en-US";
    utterance.onerror = (e) => console.warn("Speech synthesis error:", e);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Voice playback failed:", err);
  }
};

export const KazakhOrnament = ({ className = "w-6 h-6 text-amber-200" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 C30 25, 10 30, 10 50 C10 70, 30 75, 50 95 C70 75, 90 70, 90 50 C90 30, 70 25, 50 5 Z M50 25 C40 38, 30 40, 30 50 C30 60, 40 62, 50 75 C60 62, 70 60, 70 50 C70 40, 60 38, 50 25 Z" />
  </svg>
);

export const BackgroundVideo = ({ src, opacity = 50, videoKey }: any) => {
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
          style={{ opacity: opacity / 100, filter: "contrast(1.15) saturate(1.1)" }}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1A150C] to-[#09090D]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090D]/40 via-[#09090D]/55 to-[#09090D]/85" />
    </div>
  );
};

export const XpToast = ({ toast }: any) => {
  if (!toast) return null;
  return (
    <span
      key={toast.key}
      className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none animate-xp-float"
    >
      <span className="font-editorial text-xs font-black text-[#C5A059] drop-shadow-[0_0_6px_rgba(197,160,89,0.7)] whitespace-nowrap">
        +{toast.amount} XP
      </span>
    </span>
  );
};

export const LevelUpModal = ({ show, rank, onClose }: any) => {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (show) {
      const colors = ["#C5A059", "#B2533E", "#F8F5EE", "#9A7B38"];
      const pieces = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: 4 + ((i * 53) % 92),
        delay: (i % 6) * 0.09,
        color: colors[i % colors.length],
      }));
      setConfetti(pieces);
      const timer = setTimeout(() => onCloseRef.current(), 2600);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-pop-in">
      <div className="relative w-full max-w-[300px] overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute top-0 w-2 h-2 rounded-sm animate-confetti"
            style={{ left: `${c.left}%`, backgroundColor: c.color, animationDelay: `${c.delay}s` }}
          />
        ))}
        <div className="relative glass-luxury-card border-2 border-[#C5A059] p-6 text-center space-y-3 animate-rank-pop">
          <KazakhOrnament className="w-9 h-9 mx-auto text-[#C5A059] animate-float" />
          <p className="font-editorial text-[10px] tracking-[0.25em] text-[#C5A059] uppercase">RANK ACHIEVED</p>
          <h3 className="font-editorial text-2xl font-black text-[#F8F5EE] uppercase">Level {rank}</h3>
          <p className="font-body text-xs text-[#F8F5EE]/70">Your dedication to the steppe tales is paying off.</p>
        </div>
      </div>
    </div>
  );
};

export const AchievementBanner = ({ achievement, onDone }: any) => {
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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-32px)] max-w-[380px] px-4 pointer-events-none">
      <div className="animate-achievement glass-luxury-card border-2 border-[#C5A059] p-3.5 flex items-center gap-3 gold-glow">
        <span className="text-2xl shrink-0">{achievement.icon}</span>
        <div className="min-w-0">
          <p className="text-[8px] text-[#C5A059] uppercase tracking-[0.2em] font-bold">Badge Unlocked</p>
          <p className="font-editorial text-xs font-extrabold text-[#F8F5EE] truncate">{achievement.title}</p>
          <p className="font-body text-[10px] text-[#F8F5EE]/60 truncate">{achievement.desc}</p>
        </div>
      </div>
    </div>
  );
};

export const DailyGoalRing = ({ current, goal }: any) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(current / goal, 1));
  const offset = circumference * (1 - progress);
  const complete = progress >= 1;

  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center shrink-0">
      <svg viewBox="0 0 72 72" className={`w-full h-full -rotate-90 ${complete ? "animate-ring-pulse" : ""}`}>
        <circle cx="36" cy="36" r={radius} stroke="#2A2A32" strokeWidth="6" fill="none" />
        <circle
          cx="36" cy="36" r={radius}
          stroke={complete ? "#34D399" : "#C5A059"}
          strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1), stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <CheckCircle2 size={18} className="text-emerald-400" />
        ) : (
          <>
            <span className="font-editorial text-[11px] font-black text-[#F8F5EE] leading-none">{current}</span>
            <span className="text-[7px] text-[#F8F5EE]/50 uppercase tracking-wider mt-0.5">/ {goal} XP</span>
          </>
        )}
      </div>
    </div>
  );
};
