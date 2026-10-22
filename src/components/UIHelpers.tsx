import { useState, useEffect, useRef, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { OrnamentFrame, QoshqarMuyiz, Shanyraq, SteppeBackground } from "./Ornaments";

export const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Alegreya+SC:wght@500;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');

    /* Display: Alegreya SC (storybook small caps, Latin-ext + Cyrillic).
       Body: Manrope (Latin-ext + Cyrillic, covers ä ğ ı ñ ö ş ū ü and Қ Ә Ң). */
    .font-editorial { font-family: var(--font-display); letter-spacing: 0.02em; }
    .font-body {
      font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased;
    }

    * { -webkit-tap-highlight-color: transparent; }
    ::selection { background: rgba(231,169,63,0.35); color: var(--color-cream); }

    :root {
      --radius-sm: 12px;
      --radius-md: 18px;
      --radius-lg: 24px;
      --radius-pill: 999px;
      color-scheme: dark;
    }

    /* Primary label chip: gold felt with dark ink text */
    .gold-badge {
      background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-deep) 100%);
      color: var(--color-ink);
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border-radius: var(--radius-pill);
      box-shadow: 0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 14px -4px rgba(231,169,63,0.45);
    }

    /* Secondary label chip: red felt */
    .terracotta-badge {
      background: linear-gradient(135deg, var(--color-felt) 0%, var(--color-felt-deep) 100%);
      color: var(--color-cream);
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border-radius: var(--radius-pill);
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset;
    }

    .gold-glow { box-shadow: 0 10px 28px -8px rgba(231,169,63,0.5), 0 1px 0 rgba(255,255,255,0.25) inset; }

    /* Card: teal felt panel with a faint gold rim and top sheen */
    .glass-luxury-card {
      background:
        linear-gradient(180deg, rgba(246,238,220,0.045) 0%, rgba(246,238,220,0) 40%),
        rgba(19, 54, 64, 0.92);
      backdrop-filter: saturate(140%) blur(18px);
      -webkit-backdrop-filter: saturate(140%) blur(18px);
      border: 1px solid rgba(231, 169, 63, 0.16);
      border-radius: var(--radius-lg);
      box-shadow: 0 1px 0 rgba(246,238,220,0.06) inset, 0 18px 40px -16px rgba(3, 14, 18, 0.7);
    }

    .glass-card-hover {
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .glass-card-hover:hover {
      border-color: rgba(231, 169, 63, 0.5);
      box-shadow: 0 22px 48px -14px rgba(3, 14, 18, 0.8), 0 0 0 1px rgba(231,169,63,0.18);
    }
    .glass-card-hover:active { transform: scale(0.985); }

    button {
      border-radius: var(--radius-md);
      transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease, background-color 0.2s ease, border-color 0.2s ease;
    }
    button:active:not(:disabled) { transform: scale(0.96); opacity: 0.92; }
    button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible {
      outline: 2px solid var(--color-gold);
      outline-offset: 2px;
    }

    input, textarea { caret-color: var(--color-gold); }

    .gold-glow, .glass-luxury-card { border-radius: var(--radius-lg); }


    /* Section header rule: a thin band of horn motifs instead of a flat border */
    .ornament-rule { position: relative; }
    .ornament-rule::after {
      content: "";
      position: absolute; left: 0; right: 0; bottom: 0; height: 12px;
      background-color: var(--color-gold);
      opacity: 0.45;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='34' height='12' viewBox='0 0 100 36'%3E%3Cg fill='none' stroke='black' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M32 34 V24 C32 14 39 6 47 6 C55 6 60 11 59 17 C58 23 51 24 49 20 C47.5 17 50 14.5 52.5 16 M32 24 C32 14 25 6 17 6 C9 6 4 11 5 17 C6 23 13 24 15 20 C16.5 17 14 14.5 11.5 16'/%3E%3C/g%3E%3Cpath d='M83 15 L89 21 L83 27 L77 21 Z' fill='black'/%3E%3Cpath d='M66 21 H74 M92 21 H100' stroke='black' stroke-width='3'/%3E%3C/svg%3E") repeat-x left center / 34px 12px;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='34' height='12' viewBox='0 0 100 36'%3E%3Cg fill='none' stroke='black' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M32 34 V24 C32 14 39 6 47 6 C55 6 60 11 59 17 C58 23 51 24 49 20 C47.5 17 50 14.5 52.5 16 M32 24 C32 14 25 6 17 6 C9 6 4 11 5 17 C6 23 13 24 15 20 C16.5 17 14 14.5 11.5 16'/%3E%3C/g%3E%3Cpath d='M83 15 L89 21 L83 27 L77 21 Z' fill='black'/%3E%3Cpath d='M66 21 H74 M92 21 H100' stroke='black' stroke-width='3'/%3E%3C/svg%3E") repeat-x left center / 34px 12px;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
    }

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
      0%, 100% { filter: drop-shadow(0 0 3px rgba(231,169,63,0.4)); }
      50% { filter: drop-shadow(0 0 9px rgba(231,169,63,0.75)); }
    }
    .animate-ring-pulse { animation: ring-pulse 2.4s ease-in-out infinite; }

    @keyframes answer-correct-pulse {
      0% { transform: scale(1); }
      40% { transform: scale(1.035); box-shadow: 0 0 0 3px rgba(77,191,174,0.28); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(77,191,174,0); }
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


/* Brand mark used across screens: the qoşqar müiız horn pair. */
export const KazakhOrnament = ({ className = "w-6 h-6 text-gold" }: { className?: string }) => (
  <QoshqarMuyiz className={className} strokeWidth={4} />
);

/* Kept under its old name so callers don't change. */
export const StaticOrnamentBg = SteppeBackground;

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
          style={{ opacity: opacity / 100, filter: "contrast(1.15) saturate(1.1)" }}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-ink-2 to-ink" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/55 to-ink/85" />
    </div>
  );
};

export const XpToast = ({ toast }: { toast: { amount: number; key: number } | null }) => {
  if (!toast) return null;
  return (
    <span
      key={toast.key}
      className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none animate-xp-float"
    >
      <span className="font-editorial text-xs font-black text-gold drop-shadow-[0_0_6px_rgba(231,169,63,0.7)] whitespace-nowrap">
        +{toast.amount} XP
      </span>
    </span>
  );
};

const CONFETTI_COLORS = ["#E7A93F", "#C8502E", "#F6EEDC", "#4DBFAE"];

export const LevelUpModal = ({ show, rank, onClose }: { show: boolean; rank: number; onClose: () => void }) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const confetti = useMemo(() => show ? Array.from({ length: 18 }, (_, i) => ({
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
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-pop-in">
      <div className="relative w-full max-w-[300px] overflow-hidden">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute top-0 w-2 h-2 rounded-sm animate-confetti"
            style={{ left: `${c.left}%`, backgroundColor: c.color, animationDelay: `${c.delay}s` }}
          />
        ))}
        <div className="relative glass-luxury-card border-2 border-gold p-6 text-center space-y-3 animate-rank-pop">
          <OrnamentFrame />
          <Shanyraq className="w-12 h-12 mx-auto text-gold animate-float" strokeWidth={3.5} />
          <p className="font-editorial text-xs tracking-[0.15em] text-gold uppercase">RANK ACHIEVED</p>
          <h3 className="font-editorial text-2xl font-black text-cream uppercase">Level {rank}</h3>
          <p className="font-body text-xs text-cream/70">Your dedication to the steppe tales is paying off.</p>
        </div>
      </div>
    </div>
  );
};

export const AchievementBanner = ({ achievement, onDone }: { achievement: { icon: string; title: string; desc: string } | null; onDone: () => void }) => {
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
      <div className="animate-achievement glass-luxury-card border-2 border-gold p-3.5 flex items-center gap-3 gold-glow">
        <span className="text-2xl shrink-0">{achievement.icon}</span>
        <div className="min-w-0">
          <p className="text-xs text-gold uppercase tracking-[0.1em] font-bold">Badge Unlocked</p>
          <p className="font-editorial text-xs font-extrabold text-cream truncate">{achievement.title}</p>
          <p className="font-body text-xs text-cream/70 truncate">{achievement.desc}</p>
        </div>
      </div>
    </div>
  );
};

export const SaveErrorToast = ({ show, message }: { show: boolean; message: string }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] max-w-[340px] w-[calc(100%-32px)] pointer-events-none">
      <div className="animate-pop-in bg-felt-deep border border-felt/60 rounded-2xl p-3 text-xs font-body text-cream/90 text-center shadow-2xl">
        {message}
      </div>
    </div>
  );
};

export const DailyGoalRing = ({ current, goal }: { current: number; goal: number }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(current / goal, 1));
  const offset = circumference * (1 - progress);
  const complete = progress >= 1;

  return (
    <div className="relative w-[72px] h-[72px] flex items-center justify-center shrink-0">
      <svg viewBox="0 0 72 72" className={`w-full h-full -rotate-90 ${complete ? "animate-ring-pulse" : ""}`}>
        <circle cx="36" cy="36" r={radius} stroke="#2A5662" strokeWidth="6" fill="none" />
        <circle
          cx="36" cy="36" r={radius}
          stroke={complete ? "#4DBFAE" : "#E7A93F"}
          strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1), stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <CheckCircle2 size={18} className="text-turq" />
        ) : (
          <>
            <span className="font-editorial text-xs font-black text-cream leading-none">{current}</span>
            {/* ponytail: 10px inside a 54px ring — decorative context, min-12px rule doesn't apply here */}
            <span className="text-[10px] text-cream/70 uppercase tracking-[0.05em] mt-0.5">/ {goal} XP</span>
          </>
        )}
      </div>
    </div>
  );
};
