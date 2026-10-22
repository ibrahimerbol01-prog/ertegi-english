/* Cover art for each tale: flat steppe scene in the app's palette with the
   tale's key motif. Drawn as SVG, so it is ours, sharp at any size and light. */

type Palette = { top: string; bottom: string; hill: string; front: string };

const P: Record<string, Palette> = {
  sky: { top: "#3CC0E0", bottom: "#0B7E9A", hill: "#0F92B3", front: "#0A6E87" },
  night: { top: "#2B3B66", bottom: "#141C36", hill: "#253459", front: "#1A2546" },
  jade: { top: "#4CCB9A", bottom: "#178A60", hill: "#1E9E6E", front: "#137551" },
  sun: { top: "#FFD36B", bottom: "#E59A00", hill: "#F0A915", front: "#D98E00" },
  felt: { top: "#F07E5A", bottom: "#B53D1A", hill: "#D24E27", front: "#A3361A" },
  dusk: { top: "#FFB36B", bottom: "#C2492A", hill: "#D9692F", front: "#9E3A1E" },
  deep: { top: "#33467A", bottom: "#0F1630", hill: "#24335C", front: "#141C36" },
};

const CREAM = "#FFF6E3";
const SUN = "#FFB81F";
const SUN_DEEP = "#D98E00";
const INK = "#1C2333";

function Motif({ id }: { id: string }) {
  switch (id) {
    case "aldar_kose": // the rich man's coat, blown by the wind
      return (
        <g>
          <circle cx="78" cy="22" r="9" fill={SUN} />
          <path d="M14 40h12M10 48h14M16 56h10" stroke={CREAM} strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
          <path d="M38 28 50 34 62 28 77 39 71 51 64 46V77H36V46l-7 5-6-12Z" fill={CREAM} />
          <path d="M43 28 50 41 57 28" fill="none" stroke={SUN_DEEP} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M50 41V77" stroke={SUN_DEEP} strokeWidth="2" />
          <path d="M36 71h28v6H36z" fill={SUN} />
          <path d="M38 74l3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3" fill="none" stroke={SUN_DEEP} strokeWidth="1.5" />
        </g>
      );
    case "zhirenshe": // the khan's yurt and three questions under the stars
      return (
        <g>
          {[[22, 30, 13], [50, 22, 16], [78, 30, 13]].map(([x, y, s]) => (
            <text key={x} x={x} y={y} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize={s} fill={SUN}>?</text>
          ))}
          <circle cx="12" cy="12" r="1.2" fill={CREAM} /><circle cx="88" cy="14" r="1.2" fill={CREAM} /><circle cx="66" cy="10" r="1" fill={CREAM} />
          <path d="M26 60Q50 34 74 60Z" fill={CREAM} />
          <path d="M30 60h40v18H30z" fill={CREAM} />
          <path d="M50 40 36 58M50 40 64 58M50 40V58" stroke={SUN_DEEP} strokeWidth="1.6" />
          <circle cx="50" cy="41" r="3" fill="none" stroke={SUN_DEEP} strokeWidth="1.6" />
          <path d="M30 64h40" stroke="#E4572E" strokeWidth="2.5" />
          <path d="M45 66h10v12H45z" fill="#E4572E" />
        </g>
      );
    case "er_tostik": // the golden Samruk over the great tree
      return (
        <g>
          <path d="M47 50h6v30h-6z" fill="#0E5C40" />
          <circle cx="50" cy="56" r="17" fill="#137551" />
          <circle cx="38" cy="60" r="9" fill="#137551" /><circle cx="62" cy="60" r="9" fill="#137551" />
          <path d="M50 30C41 18 27 16 12 21c11 2 19 7 26 15 3-2 8-4 12-6Z" fill={SUN} />
          <path d="M50 30c9-12 23-14 38-9-11 2-19 7-26 15-3-2-8-4-12-6Z" fill={SUN} />
          <ellipse cx="50" cy="33" rx="5" ry="8" fill={SUN} />
          <circle cx="50" cy="23" r="4" fill={SUN} />
          <path d="M50 40l-4 8h8Z" fill={SUN_DEEP} />
          <path d="M53 22.5l4 1.5-4 1.5Z" fill={SUN_DEEP} />
          <path d="M18 23c8 0 14 3 20 9M82 23c-8 0-14 3-20 9" fill="none" stroke={SUN_DEEP} strokeWidth="1.2" opacity=".6" />
        </g>
      );
    case "tazsha_bala": // the bald boy "squeezes water" from a stone in front of the giant
      return (
        <g>
          <circle cx="70" cy="34" r="16" fill={P.sun.front} opacity=".55" />
          <circle cx="64" cy="31" r="2.6" fill={INK} /><circle cx="76" cy="31" r="2.6" fill={INK} />
          <path d="M60 25l7 3M80 25l-7 3" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M30 76c-4-12 4-22 16-22 10 0 16 8 14 22Z" fill="#E9DDC7" />
          <path d="M36 66c4-3 8-4 12-2M44 72c3-2 6-2 9 0" stroke="#C9B898" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {[[44, 46], [50, 40], [38, 40]].map(([x, y]) => (
            <path key={`${x}${y}`} d={`M${x} ${y - 5}c-2.5 3.5-3.5 5.5-3.5 7a3.5 3.5 0 0 0 7 0c0-1.5-1-3.5-3.5-7Z`} fill="#E1F4F9" />
          ))}
          <circle cx="20" cy="56" r="6" fill={CREAM} />
          <path d="M12 78c0-10 3-15 8-15s8 5 8 15Z" fill={CREAM} />
          <path d="M26 66l8-4" stroke={CREAM} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "ayaz_bi": // the chest that holds only his old shepherd clothes
      return (
        <g>
          <path d="M50 22v8M34 28l4 6M66 28l-4 6M24 40l7 3M76 40l-7 3" stroke={SUN} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28 50 34 36h32l6 14Z" fill="#7A3A1E" />
          <path d="M33 39h34" stroke={SUN} strokeWidth="2" />
          <path d="M30 50h40v6H30z" fill="#4A2412" />
          <path d="M40 56c0-7 5-10 10-10s10 3 10 10Z" fill="#12A3C6" />
          <path d="M43 52l-5 4M57 52l5 4" stroke="#0B7E9A" strokeWidth="2" strokeLinecap="round" />
          <path d="M26 54h48v24H26z" fill="#8E4A26" />
          <path d="M26 58h48M26 74h48" stroke={SUN} strokeWidth="2.5" />
          <rect x="46" y="62" width="8" height="8" rx="2" fill={SUN} />
          <path d="M50 64v3" stroke="#7A3A1E" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case "asan_kaigy": // Asan on his camel Zhelmaya, searching for Zheruiyk
      return (
        <g>
          <path d="M80 14a9 9 0 1 0 6 15 7 7 0 1 1-6-15Z" fill={CREAM} />
          <circle cx="66" cy="20" r="1.3" fill={CREAM} /><circle cx="20" cy="18" r="1.1" fill={CREAM} />
          <path
            d="M22 72l2-12c0-5 3-9 8-10 2-6 7-7 10-2 3-6 8-6 10 0h6c3-3 4-7 6-11l2-4c2-2 5-1 6 1l-1 4c-2 3-3 7-5 12l-2 4v18h-3l-1-12h-5l-2 12h-3l-1-12H35l-2 12h-3l-1-10-3 10Z"
            fill={INK}
          />
          <path d="M44 44c0-6 2-9 5-9s5 3 5 9" fill={INK} />
          <circle cx="49" cy="33" r="3" fill={INK} />
          <path d="M45 31h8l-4-6Z" fill={INK} />
        </g>
      );
    case "alpamys": // the bow, the deep pit and the star of hope
      return (
        <g>
          <path d="M50 8l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill={SUN} />
          <circle cx="50" cy="20" r="14" fill={SUN} opacity=".15" />
          <path d="M30 38Q50 66 70 38" fill="none" stroke={CREAM} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M30 38Q50 46 70 38" fill="none" stroke={CREAM} strokeWidth="1.2" opacity=".8" />
          <path d="M50 64V34" stroke={SUN} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M50 30l-4 6h8Z" fill={SUN} />
          <path d="M46 64l4-4 4 4" fill="none" stroke={SUN} strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="50" cy="83" rx="22" ry="6" fill="#070B18" />
          <ellipse cx="50" cy="82" rx="16" ry="3.5" fill={SUN} opacity=".18" />
        </g>
      );
    default:
      return <circle cx="50" cy="40" r="12" fill={SUN} />;
  }
}

const PALETTE_FOR: Record<string, keyof typeof P> = {
  aldar_kose: "sky",
  zhirenshe: "night",
  er_tostik: "jade",
  tazsha_bala: "sun",
  ayaz_bi: "felt",
  asan_kaigy: "dusk",
  alpamys: "deep",
};

// `wide` widens the scene sideways for banner slots, so the motif keeps its full height.
export function StoryCover({ id, className = "", wide = false }: { id: string; className?: string; wide?: boolean }) {
  const p = P[PALETTE_FOR[id] || "sky"];
  const gid = `cover-${id}`;
  return (
    <svg viewBox={wide ? "-60 0 220 100" : "0 0 100 100"} className={className} role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.top} />
          <stop offset="1" stopColor={p.bottom} />
        </linearGradient>
      </defs>
      <rect x="-60" width="220" height="100" fill={`url(#${gid})`} />
      <path d="M-60 72Q-32 62 0 76Q24 64 50 72T100 68Q130 62 160 72V100H-60Z" fill={p.hill} />
      <path d="M-60 84Q-24 78 0 86Q30 78 60 85T100 82Q132 76 160 84V100H-60Z" fill={p.front} />
      <Motif id={id} />
    </svg>
  );
}
