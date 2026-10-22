/* Kazakh ornament set (oiu-örnek). All motifs are hand-drawn inline SVG that
   inherit currentColor, so color comes from Tailwind text-* tokens. Use them
   as accents: one band or corner per card at most, never as full fills. */
import { useId } from "react";

type OrnamentProps = { className?: string; strokeWidth?: number };

/* Qoşqar müiız (ram's horn): one horn pair, the core motif of the set.
   Spirals curl outward and down from a single stem. viewBox 64×36. */
const HORN_PATH =
  "M32 34 V24 C32 14 39 6 47 6 C55 6 60 11 59 17 C58 23 51 24 49 20 C47.5 17 50 14.5 52.5 16" +
  " M32 24 C32 14 25 6 17 6 C9 6 4 11 5 17 C6 23 13 24 15 20 C16.5 17 14 14.5 11.5 16";

export const QoshqarMuyiz = ({ className = "w-8 h-5", strokeWidth = 3 }: OrnamentProps) => (
  <svg viewBox="0 0 64 36" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={HORN_PATH} />
  </svg>
);

/* Şañyraq: the yurt crown. Ring with crossed bent bars (kúldireuış) and
   short roof-pole (uyq) ticks around it. Used as the brand mark. */
export const Shanyraq = ({ className = "w-6 h-6", strokeWidth = 3 }: OrnamentProps) => {
  const clip = useId();
  const ticks = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" aria-hidden="true">
      <defs>
        <clipPath id={clip}><circle cx="32" cy="32" r="20" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="20" />
      <g clipPath={`url(#${clip})`}>
        <path d="M22 10 C28 26 28 38 22 54 M32 10 V54 M42 10 C36 26 36 38 42 54" />
        <path d="M10 22 C26 28 38 28 54 22 M10 32 H54 M10 42 C26 36 38 36 54 42" />
      </g>
      {ticks.map((a) => (
        <line key={a} x1="32" y1="5" x2="32" y2="9" transform={`rotate(${a} 32 32)`} />
      ))}
    </svg>
  );
};

/* Tūmar: triangular amulet with a crown band. Small marker for badges and
   achievements. */
export const Tumar = ({ className = "w-4 h-4", strokeWidth = 3 }: OrnamentProps) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <path d="M5 8 H27 L16 29 Z" />
    <path d="M5 8 V4 H27 V8" />
    <path d="M16 13 L20 18 L16 23 L12 18 Z" fill="currentColor" stroke="none" />
  </svg>
);

/* Horizontal band: alternating up/down horn pairs, like a syrmaq border.
   Stretches to the container width; height is set by className. */
export const OrnamentBand = ({ className = "h-3 w-full", strokeWidth = 2.6 }: OrnamentProps) => {
  const id = useId();
  return (
    <svg className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="56" height="16" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <g transform="translate(0 0.5) scale(0.4375 0.42)"><path d={HORN_PATH} /></g>
            <g transform="translate(28 15.5) scale(0.4375 -0.42)"><path d={HORN_PATH} /></g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

/* Thin rule with a horn pair centred on it. Section divider. */
export const OrnamentDivider = ({ className = "text-sun-deep/70" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-current opacity-60" />
    <QoshqarMuyiz className="w-7 h-4 shrink-0" strokeWidth={3.5} />
    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-current opacity-60" />
  </div>
);

/* Corner curl for framed cards. Rotate via the `corner` prop. */
export const OrnamentCorner = ({ className = "w-8 h-8", corner = "tl" }: { className?: string; corner?: "tl" | "tr" | "bl" | "br" }) => {
  const rot = { tl: "", tr: "scale-x-[-1]", bl: "scale-y-[-1]", br: "scale-[-1]" }[corner];
  return (
    <svg viewBox="0 0 40 40" className={`${className} ${rot}`} fill="none" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 37 V12 C3 7 7 3 12 3 H37" />
      <path d="M9 37 V18 C9 13 13 9 18 9 C23 9 25 13 23 16 C21.5 18.5 18 18 18 15.5" />
      <circle cx="3" cy="37" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="37" cy="3" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
};

/* Four corners inside a relative parent. */
export const OrnamentFrame = ({ className = "text-sun-deep/40", size = "w-7 h-7" }: { className?: string; size?: string }) => (
  <div className={`pointer-events-none absolute inset-2 ${className}`} aria-hidden="true">
    <OrnamentCorner className={`absolute top-0 left-0 ${size}`} corner="tl" />
    <OrnamentCorner className={`absolute top-0 right-0 ${size}`} corner="tr" />
    <OrnamentCorner className={`absolute bottom-0 left-0 ${size}`} corner="bl" />
    <OrnamentCorner className={`absolute bottom-0 right-0 ${size}`} corner="br" />
  </div>
);

/* Page background: warm kiiz sand with a very faint repeating horn
   lattice. Sits behind every authenticated tab and the auth screen. */
export const SteppeBackground = () => {
  const id = useId();
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
      <div className="absolute inset-0 bg-sand" />
      <svg className="absolute inset-0 w-full h-full text-sun-deep" style={{ opacity: 0.045 }}>
        <defs>
          <pattern id={id} width="96" height="96" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <g transform="translate(16 8)"><path d={HORN_PATH} /></g>
              <g transform="translate(-32 88) scale(1 -1)"><path d={HORN_PATH} /></g>
              <g transform="translate(64 88) scale(1 -1)"><path d={HORN_PATH} /></g>
            </g>
            <path d="M48 52 L54 58 L48 64 L42 58 Z" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
};

/* Kilem strip: a row of felt rhombs in the brand colours, like the woven
   edge of a syrmaq. Thin accent for card tops and section breaks. */
export const KilimStrip = ({ className = "h-2 w-full" }: { className?: string }) => {
  const id = useId();
  return (
    <svg className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="48" height="8" patternUnits="userSpaceOnUse">
          <path d="M6 0 L12 4 L6 8 L0 4 Z" fill="var(--color-sky)" />
          <path d="M18 0 L24 4 L18 8 L12 4 Z" fill="var(--color-sun)" />
          <path d="M30 0 L36 4 L30 8 L24 4 Z" fill="var(--color-felt)" />
          <path d="M42 0 L48 4 L42 8 L36 4 Z" fill="var(--color-jade)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};
