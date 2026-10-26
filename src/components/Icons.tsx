/* Ertegi's own illustrated icons. Flat shapes with a darker side for depth and
   a soft highlight, the way Duolingo and Headspace draw theirs, with nomad
   details: a yurt with its shanyraq, a cup with ram-horn handles, a taqiya,
   a round batyr shield. Line icons from lucide stay for small UI glyphs
   (close, arrows, check); these are for places that name a feature.

   Every icon is decorative (aria-hidden): the text next to it carries the
   meaning. `muted` draws the same shape in greys for inactive tabs, dark
   enough to keep 3:1 contrast on the sand background (WCAG 1.4.11). */

type P = { size?: number; muted?: boolean; className?: string };

// Brand colours from index.css, and the greys an inactive icon uses instead.
const C = {
  sky: "var(--color-sky)", skyDeep: "var(--color-sky-deep)", skySoft: "var(--color-sky-soft)",
  sun: "var(--color-sun)", sunDeep: "var(--color-sun-deep)", sunSoft: "var(--color-sun-soft)",
  felt: "var(--color-felt)", feltDeep: "var(--color-felt-deep)",
  jade: "var(--color-jade)", jadeDeep: "var(--color-jade-deep)",
  night: "var(--color-night)", ink: "var(--color-ink)", card: "var(--color-card)",
  skin: "#F2C29B", skinDeep: "#D99E72",
};
const GREY = { base: "#8A8F99", deep: "#666C77", soft: "#E3DDD2", light: "#F4F0E8" };
const pick = (muted: boolean | undefined, color: string, tone: keyof typeof GREY = "base") => (muted ? GREY[tone] : color);

const Svg = ({ size = 28, className = "", children, box = 32 }: { size?: number; className?: string; children: React.ReactNode; box?: number }) => (
  <svg width={size} height={size} viewBox={`0 0 ${box} ${box}`} className={className} aria-hidden="true" focusable="false">
    {children}
  </svg>
);

const shine = "rgba(255,255,255,0.55)";

/* Home: a yurt with its shanyraq crown and a felt door. */
export const IconYurt = ({ size, muted, className }: P) => (
  <Svg size={size} className={className}>
    <ellipse cx="16" cy="28.6" rx="12" ry="1.5" fill={pick(muted, C.skyDeep, "deep")} opacity=".18" />
    <rect x="5" y="17" width="22" height="11" rx="2.4" fill={pick(muted, C.skySoft, "light")} />
    <path d="M16 17h11v8.6a2.4 2.4 0 0 1-2.4 2.4H16z" fill={pick(muted, C.sky, "soft")} opacity=".45" />
    <path d="M3.4 18.2C5.6 10 10.4 5.2 16 5.2s10.4 4.8 12.6 13z" fill={pick(muted, C.sky)} />
    <path d="M16 5.2c5.6 0 10.4 4.8 12.6 13H16z" fill={pick(muted, C.skyDeep, "deep")} opacity=".45" />
    <rect x="3.4" y="16.6" width="25.2" height="3.2" rx="1.6" fill={pick(muted, C.sun, "deep")} />
    <path d="M6 18.2l1.6-1 1.6 1 1.6-1 1.6 1 1.6-1 1.6 1 1.6-1 1.6 1 1.6-1 1.6 1 1.6-1 1.6 1 1.6-1" fill="none" stroke={pick(muted, C.sunDeep, "light")} strokeWidth=".9" strokeLinejoin="round" />
    <path d="M12.6 28v-4.6a3.4 3.4 0 0 1 6.8 0V28z" fill={pick(muted, C.felt, "deep")} />
    <path d="M16 20.1v7.9" stroke={pick(muted, C.feltDeep, "base")} strokeWidth=".9" />
    <circle cx="16" cy="5.6" r="2.7" fill={pick(muted, C.sun, "deep")} />
    <path d="M14.2 5.6h3.6M16 3.8v3.6" stroke={pick(muted, C.sunDeep, "light")} strokeWidth=".9" strokeLinecap="round" />
    <path d="M7.4 14.6c1.6-3.6 4-6 7-7" fill="none" stroke={shine} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/* Read: an open book with a felt bookmark. */
export const IconBook = ({ size, muted, className }: P) => (
  <Svg size={size} className={className}>
    <path d="M3 9.5h26v15.8a2.2 2.2 0 0 1-2.2 2.2H18.6L16 29l-2.6-1.5H5.2A2.2 2.2 0 0 1 3 25.3z" fill={pick(muted, C.skyDeep, "deep")} />
    <path d="M5 7.4c4.3-1 8.3-.5 11 1.7v17.2c-2.7-1.8-6.7-2.3-11-1.4z" fill={pick(muted, C.card, "light")} />
    <path d="M27 7.4c-4.3-1-8.3-.5-11 1.7v17.2c2.7-1.8 6.7-2.3 11-1.4z" fill={pick(muted, C.skySoft, "soft")} />
    <path d="M16 9.1v17.2" stroke={pick(muted, C.skyDeep, "deep")} strokeWidth=".8" opacity=".35" />
    <path d="M7.6 12.2c2.2-.4 4.4-.1 6 .7M7.6 15.4c2.2-.4 4.4-.1 6 .7M7.6 18.6c2.2-.4 4.4-.1 6 .7" fill="none" stroke={pick(muted, C.sky)} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M18.4 12.9c1.6-.8 3.8-1.1 6-.7M18.4 16.1c1.6-.8 3.8-1.1 6-.7M18.4 19.3c1.6-.8 3.8-1.1 6-.7" fill="none" stroke={pick(muted, C.sky)} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
    <path d="M22.2 7.3v6.4l1.7-1.3 1.7 1.3V7" fill={pick(muted, C.felt, "deep")} />
  </Svg>
);

/* Quiz: a cup with ram-horn (қошқар мүйіз) handles on a dark plinth. */
export const IconTrophy = ({ size, muted, className }: P) => (
  <Svg size={size} className={className}>
    <path d="M10.6 7.2C6.4 6.4 5 9.8 6.6 12c1.1 1.5 3.1 1.3 3.4-.1M21.4 7.2c4.2-.8 5.6 2.6 4 4.8-1.1 1.5-3.1 1.3-3.4-.1" fill="none" stroke={pick(muted, C.sunDeep, "deep")} strokeWidth="2.3" strokeLinecap="round" />
    <path d="M9.6 4.4h12.8v6.4a6.4 6.4 0 0 1-12.8 0z" fill={pick(muted, C.sun)} />
    <path d="M16 4.4h6.4v6.4A6.4 6.4 0 0 1 16 17.2z" fill={pick(muted, C.sunDeep, "deep")} opacity=".4" />
    <path d="M16 6.6l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill={pick(muted, C.sunSoft, "light")} />
    <rect x="14.3" y="16.8" width="3.4" height="4" fill={pick(muted, C.sunDeep, "deep")} />
    <rect x="10.4" y="20.4" width="11.2" height="3" rx="1.3" fill={pick(muted, C.sun)} />
    <rect x="8.6" y="23" width="14.8" height="5.2" rx="1.8" fill={pick(muted, C.night, "deep")} />
    <path d="M11.4 25.6h9.2" stroke={pick(muted, C.sun, "soft")} strokeWidth="1.1" strokeLinecap="round" strokeDasharray="1.6 1.4" />
    <path d="M11.6 6.6v3.6" stroke={shine} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/* Words: a fanned stack of word cards. */
export const IconCards = ({ size, muted, className }: P) => (
  <Svg size={size} className={className}>
    <rect x="4.6" y="8.6" width="13.4" height="18" rx="3" transform="rotate(-14 11.3 17.6)" fill={pick(muted, C.jade, "soft")} />
    <rect x="8.4" y="6.8" width="13.4" height="18" rx="3" transform="rotate(-4 15.1 15.8)" fill={pick(muted, C.sun, "base")} />
    <rect x="12.6" y="6" width="14.6" height="20.4" rx="3.2" fill={pick(muted, C.sky)} />
    <rect x="12.6" y="22.6" width="14.6" height="3.8" rx="1.9" fill={pick(muted, C.skyDeep, "deep")} opacity=".5" />
    <rect x="14.6" y="8" width="10.6" height="13.6" rx="2" fill={pick(muted, C.card, "light")} />
    <path d="M17.2 18.8l2.7-8 2.7 8M18.2 16h3.4" fill="none" stroke={pick(muted, C.skyDeep, "deep")} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/* Legend cards: a round batyr shield with a golden boss. */
export const IconShield = ({ size, muted, className }: P) => (
  <Svg size={size} className={className}>
    <circle cx="16" cy="16.4" r="12.6" fill={pick(muted, C.feltDeep, "deep")} />
    <circle cx="16" cy="15.6" r="12" fill={pick(muted, C.felt)} />
    <circle cx="16" cy="15.6" r="8.6" fill="none" stroke={pick(muted, C.sun, "soft")} strokeWidth="1.2" strokeDasharray="2.2 1.8" />
    {[0, 90, 180, 270].map((a) => (
      <path key={a} d="M16 5.4c1.2 0 1.9 1 1.4 1.8-.4.7-1.4.5-1.4-.2" fill="none" stroke={pick(muted, C.sun, "light")} strokeWidth="1.1" strokeLinecap="round" transform={`rotate(${a} 16 15.6)`} />
    ))}
    <circle cx="16" cy="15.6" r="4.4" fill={pick(muted, C.sun, "light")} />
    <circle cx="16.8" cy="16.4" r="3" fill={pick(muted, C.sunDeep, "base")} opacity=".45" />
    <circle cx="14.7" cy="14.3" r="1.2" fill="#fff" opacity=".8" />
    <path d="M7.2 10.6c1.4-2.6 3.8-4.4 6.6-5" fill="none" stroke={shine} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/* Speak: a studio microphone. */
export const IconMic = ({ size, muted, className }: P) => (
  <Svg size={size} className={className}>
    <path d="M8 14.4a8 8 0 0 0 16 0" fill="none" stroke={pick(muted, C.jadeDeep, "deep")} strokeWidth="2.4" strokeLinecap="round" />
    <rect x="14.8" y="21.6" width="2.4" height="4.4" fill={pick(muted, C.jadeDeep, "deep")} />
    <rect x="10" y="25.6" width="12" height="3.2" rx="1.6" fill={pick(muted, C.jadeDeep, "deep")} />
    <rect x="11" y="3.4" width="10" height="15.4" rx="5" fill={pick(muted, C.jade)} />
    <path d="M16 3.4a5 5 0 0 1 5 5v5.4a5 5 0 0 1-5 5z" fill={pick(muted, C.jadeDeep, "deep")} opacity=".35" />
    <path d="M11 9.6h10M11 12.6h10" stroke={pick(muted, C.jadeDeep, "deep")} strokeWidth="1" opacity=".5" />
    <path d="M13.3 6.2v5" stroke={shine} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/* Profile: a learner in a taqiya and a shapan. */
export const IconLearner = ({ size, muted, className }: P) => (
  <Svg size={size} className={className}>
    <path d="M4.8 29c0-6 4.8-9.6 11.2-9.6S27.2 23 27.2 29z" fill={pick(muted, C.sky)} />
    <path d="M16 19.4c6.4 0 11.2 3.6 11.2 9.6H16z" fill={pick(muted, C.skyDeep, "deep")} opacity=".4" />
    <path d="M12.6 19.9L16 24l3.4-4.1" fill="none" stroke={pick(muted, C.sun, "light")} strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="16" cy="12.6" r="6.2" fill={pick(muted, C.skin, "soft")} />
    <path d="M16 6.4a6.2 6.2 0 0 1 0 12.4z" fill={pick(muted, C.skinDeep, "base")} opacity=".3" />
    <circle cx="13.7" cy="13.6" r=".95" fill={pick(muted, C.ink, "deep")} />
    <circle cx="18.3" cy="13.6" r=".95" fill={pick(muted, C.ink, "deep")} />
    <path d="M14.6 16.1c.9.6 1.9.6 2.8 0" fill="none" stroke={pick(muted, C.ink, "deep")} strokeWidth=".9" strokeLinecap="round" />
    <path d="M9.6 11.4C9.6 6.6 12.6 4 16 4s6.4 2.6 6.4 7.4c-2.4-1.4-10.4-1.4-12.8 0z" fill={pick(muted, C.felt, "deep")} />
    <path d="M12.2 8.2h.01M16 6.8h.01M19.8 8.2h.01" stroke={pick(muted, C.sun, "light")} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

/* Streak: a three-layer flame. */
export const IconFlame = ({ size = 18, muted, className }: P) => (
  <Svg size={size} className={className}>
    <path d="M16 2.8c1.5 5.2 7.6 7.6 7.6 15.8 0 5.6-3.5 10-7.6 10s-7.6-4-7.6-9.2c0-4.4 2.5-6.6 3.6-9.4 1 2.4 2 3.4 3 3.8-.5-4.4 0-7.8 1-11z" fill={pick(muted, C.felt)} />
    <path d="M16 2.8c1.5 5.2 7.6 7.6 7.6 15.8 0 5.6-3.5 10-7.6 10z" fill={pick(muted, C.feltDeep, "deep")} opacity=".3" />
    <path d="M16 13.4c1 3.6 4.1 4.7 4.1 8.9 0 2.8-1.9 4.9-4.1 4.9s-4.1-1.9-4.1-4.4c0-2.7 2-3.8 2.7-5.8.6 1.2 1.1 1.6 1.6 1.7-.4-1.7-.5-3.4-.2-5.3z" fill={pick(muted, C.sun, "soft")} />
    <ellipse cx="16" cy="24" rx="2" ry="2.5" fill={pick(muted, C.sunSoft, "light")} />
  </Svg>
);

/* XP: a lightning bolt. */
export const IconBolt = ({ size = 18, muted, className }: P) => (
  <Svg size={size} className={className}>
    <path d="M18.6 2.6L6.8 18h7.8l-2.2 11.4L25.2 13h-7.8z" fill={pick(muted, C.sun)} stroke={pick(muted, C.sunDeep, "deep")} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M17.4 13h7.8L12.4 29.4l2.2-11.4z" fill={pick(muted, C.sunDeep, "deep")} opacity=".35" />
    <path d="M15.8 6.6l-5 6.6" stroke={shine} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

/* History: an old scroll. */
export const IconScroll = ({ size, muted, className }: P) => (
  <Svg size={size} className={className}>
    <rect x="7" y="7" width="18" height="19" rx="1.6" fill={pick(muted, C.sunSoft, "light")} />
    <path d="M7 22.4h18V26H7z" fill={pick(muted, C.sun, "soft")} opacity=".5" />
    <rect x="4.6" y="4.4" width="22.8" height="4.4" rx="2.2" fill={pick(muted, C.sunDeep, "deep")} />
    <rect x="4.6" y="24.4" width="22.8" height="4.4" rx="2.2" fill={pick(muted, C.sunDeep, "deep")} />
    <circle cx="6.8" cy="6.6" r="1.2" fill={pick(muted, C.sun, "base")} />
    <circle cx="6.8" cy="26.6" r="1.2" fill={pick(muted, C.sun, "base")} />
    <path d="M10.4 12.4h11.2M10.4 15.6h11.2M10.4 18.8h7" stroke={pick(muted, C.sunDeep, "base")} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="21.4" cy="19.6" r="2.2" fill={pick(muted, C.felt, "deep")} />
  </Svg>
);

/* Achievements: a medallion with a felt ribbon and a kilim ring of dots. */
const BADGE_COLORS = {
  sky: [C.sky, C.skyDeep, C.skySoft],
  jade: [C.jade, C.jadeDeep, "var(--color-jade-soft)"],
  sun: [C.sun, C.sunDeep, C.sunSoft],
  felt: [C.felt, C.feltDeep, "var(--color-felt-soft)"],
  night: [C.night, "#121a31", "#DCE2F2"],
} as const;

const GLYPHS: Record<string, (fg: string, accent: string) => React.ReactNode> = {
  // First steps: an arrow in the centre of a target.
  target: (fg, accent) => (
    <>
      <circle cx="32" cy="31" r="10.5" fill={fg} />
      <circle cx="32" cy="31" r="6.8" fill={accent} />
      <circle cx="32" cy="31" r="3.2" fill={fg} />
      <path d="M33 30l9.6-9.6M40 19.4l3.6-.4-.4 3.6" fill="none" stroke={fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Word collector: an open book.
  book: (fg, accent) => (
    <>
      <path d="M20 23.4c4.4-1.2 8.8-.6 12 1.6v16.4c-3.2-2-7.6-2.6-12-1.4zM44 23.4c-4.4-1.2-8.8-.6-12 1.6v16.4c3.2-2 7.6-2.6 12-1.4z" fill={fg} />
      <path d="M23.4 28c2.2-.4 4.4-.1 6 .7M23.4 31.4c2.2-.4 4.4-.1 6 .7M34.6 28.7c1.6-.8 3.8-1.1 6-.7M34.6 32.1c1.6-.8 3.8-1.1 6-.7" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  // Flawless: a crown.
  crown: (fg, accent) => (
    <>
      <path d="M20.5 38.6l-1.8-13 7.2 5.4L32 21.4l6.1 9.6 7.2-5.4-1.8 13z" fill={fg} strokeLinejoin="round" />
      <rect x="20.5" y="38.6" width="23" height="3.6" rx="1.6" fill={fg} />
      <circle cx="32" cy="33.6" r="2.2" fill={accent} />
      <circle cx="25.4" cy="35" r="1.4" fill={accent} />
      <circle cx="38.6" cy="35" r="1.4" fill={accent} />
    </>
  ),
  // Vocabulary keeper: a dowry chest (сандық).
  chest: (fg, accent) => (
    <>
      <path d="M20 29.4c0-5.4 24-5.4 24 0z" fill={fg} />
      <rect x="20" y="29" width="24" height="13" rx="2.2" fill={fg} />
      <path d="M20 31.4h24M25.6 25.6V42M38.4 25.6V42" stroke={accent} strokeWidth="1.5" />
      <rect x="29.6" y="31" width="4.8" height="5.4" rx="1.2" fill={accent} />
    </>
  ),
  // Rising nomad: the sun rising over the steppe.
  sunrise: (fg, accent) => (
    <>
      <path d="M22.4 35.4a9.6 9.6 0 0 1 19.2 0z" fill={fg} />
      <path d="M32 20.6v3.2M21.6 25l2.2 2.2M42.4 25l-2.2 2.2M17.6 35.4h3M43.4 35.4h3" stroke={fg} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17.4 41.6c4.2-3.4 8.6-3.4 13-1 4.4 2.4 9.6 2.4 16.2-1.2" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
};

export const Badge = ({ glyph, color, locked, size = 64, className = "" }: {
  glyph: keyof typeof GLYPHS | string;
  color: keyof typeof BADGE_COLORS | string;
  locked?: boolean;
  size?: number;
  className?: string;
}) => {
  const [base, deep, soft] = locked ? [GREY.base, GREY.deep, GREY.light] : BADGE_COLORS[color as keyof typeof BADGE_COLORS] ?? BADGE_COLORS.sun;
  const draw = GLYPHS[glyph] ?? GLYPHS.target;
  return (
    <Svg size={size} box={64} className={className}>
      {/* Ribbon tails behind the medallion. */}
      <path d="M21 44l-5 16 7-3.6 4.4 6.2L31 47z" fill={locked ? GREY.deep : C.feltDeep} />
      <path d="M43 44l5 16-7-3.6-4.4 6.2L33 47z" fill={locked ? GREY.base : C.felt} />
      <circle cx="32" cy="32.8" r="26" fill={deep} />
      <circle cx="32" cy="31" r="25" fill={base} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <circle key={i} cx={32 + Math.cos(a) * 21.4} cy={31 + Math.sin(a) * 21.4} r="1.3" fill={soft} opacity=".85" />;
      })}
      <circle cx="32" cy="31" r="17.6" fill={soft} />
      {draw(locked ? GREY.base : deep, locked ? GREY.light : (color === "sun" ? C.felt : C.sun))}
      <path d="M13.6 22.6c2.6-6 8-10 14.4-11" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".45" />
      {locked && (
        <g>
          <circle cx="50" cy="49" r="8.6" fill={C.card} />
          <circle cx="50" cy="49" r="7" fill={GREY.deep} />
          <rect x="46.4" y="48.4" width="7.2" height="5.2" rx="1.2" fill="#fff" />
          <path d="M47.8 48.4v-1.6a2.2 2.2 0 0 1 4.4 0v1.6" fill="none" stroke="#fff" strokeWidth="1.5" />
        </g>
      )}
    </Svg>
  );
};
