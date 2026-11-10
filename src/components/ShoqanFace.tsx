/* Shoqan's face for round avatars (the chat button, chat header, home tip,
   Thinking Trail, and WeekWords). It is the same original illustration as the
   home-screen mascot, cropped to the head and shoulders, with interactive tap/hover
   animations (spring bounce, wave, wink/happy eyes, moustache wiggle, sparkles). */
import { useState } from "react";
import "./ShoqanFace.css";

const BURST = [
  { x: -34, y: -26, r: -25, heart: true, d: 0 },
  { x: -16, y: -42, r: 12, heart: false, d: 0.04 },
  { x: 14, y: -44, r: -18, heart: true, d: 0.08 },
  { x: 34, y: -28, r: 22, heart: false, d: 0.12 },
  { x: 40, y: -6, r: 35, heart: true, d: 0.16 },
  { x: -40, y: -4, r: -35, heart: false, d: 0.2 },
];
const HEART = "M0 4 C-9 -3 -6 -10 0 -5 C6 -10 9 -3 0 4 Z";
const STAR = "M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z";

export default function ShoqanFace({ label = "" }: { label?: string }) {
  const [pokes, setPokes] = useState(0);
  const cls = pokes ? (pokes % 2 ? "shqf-poke-a" : "shqf-poke-b") : "";

  return (
    <svg
      viewBox="-68 -398 136 148"
      onClick={() => setPokes((n) => n + 1)}
      className={`shq-face ${cls} block w-full h-full cursor-pointer select-none`}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id="shqf-skin" cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#FBDDBA" /><stop offset=".6" stopColor="#EFC094" /><stop offset="1" stopColor="#D49C70" /></radialGradient>
        <linearGradient id="shqf-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE6F2" /><stop offset="1" stopColor="#EEF8FA" /></linearGradient>
        <linearGradient id="shqf-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F0C44A" /><stop offset="1" stopColor="#B9861C" /></linearGradient>
      </defs>
      <rect x="-120" y="-460" width="240" height="260" fill="url(#shqf-bg)" />
      <g className="shq-face-rig">
        <g className="shq-face-float">
          <path d="M-70 -230 L-54 -262 Q0 -276 54 -262 L70 -230 Z" fill="#4A5B43" />
          <path d="M-26 -266 Q0 -250 26 -266 L26 -278 Q0 -264 -26 -278 Z" fill="#B3262E" />
          <path d="M-26 -266 Q0 -250 26 -266" stroke="#E3B04B" strokeWidth="1.6" fill="none" />
          <g className="shq-face-epL" transform="rotate(-14 -46 -258)"><path d="M-66 -262 L-30 -270 L-26 -248 L-62 -242 Z" fill="url(#shqf-gold)" stroke="#8C6414" strokeWidth="1" /><circle cx="-34" cy="-258" r="4.2" fill="#B3262E" /></g>
          <g className="shq-face-epR" transform="rotate(14 46 -258)"><path d="M66 -262 L30 -270 L26 -248 L62 -242 Z" fill="url(#shqf-gold)" stroke="#8C6414" strokeWidth="1" /><circle cx="34" cy="-258" r="4.2" fill="#B3262E" /></g>
          <g className="shq-face-head" transform="scale(.84 1)">
            <path d="M-13 -290 H13 V-264 Q0 -256 -13 -264 Z" fill="url(#shqf-skin)" />
            <ellipse cx="-39" cy="-312" rx="6" ry="10" fill="url(#shqf-skin)" /><ellipse cx="39" cy="-312" rx="6" ry="10" fill="url(#shqf-skin)" />
            <path d="M-37 -312 Q-37 -318 -37 -320 Q-38 -292 -23 -272 Q-9 -258 0 -258 Q9 -258 23 -272 Q38 -292 37 -320 Q40 -368 0 -368 Q-40 -368 -37 -320 Z" fill="url(#shqf-skin)" />
            <ellipse className="shq-face-blush" cx="-22" cy="-298" rx="7" ry="4.5" fill="#F08A80" opacity=".3" /><ellipse className="shq-face-blush" cx="22" cy="-298" rx="7" ry="4.5" fill="#F08A80" opacity=".3" />
            <path d="M-3 -324 Q-6 -310 -6 -304 Q-3 -300 0 -300 Q3 -300 6 -304" stroke="#A8693F" strokeWidth="1.6" fill="none" opacity=".6" strokeLinecap="round" />
            <g className="shq-face-eyes">
              <path d="M-24 -318 Q-15 -325 -6 -318 Q-15 -311 -24 -318 Z M24 -318 Q15 -325 6 -318 Q15 -311 24 -318 Z" fill="#F6F3EC" />
              <circle cx="-15" cy="-318" r="5" fill="#2B1B12" /><circle cx="15" cy="-318" r="5" fill="#2B1B12" />
              <circle cx="-13.2" cy="-319.8" r="1.5" fill="#FFFFFF" /><circle cx="16.8" cy="-319.8" r="1.5" fill="#FFFFFF" />
              <path d="M-25 -318 Q-15 -327 -5 -318 M25 -318 Q15 -327 5 -318" stroke="#2B1B12" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </g>
            <g className="shq-face-eyes-happy">
              <path d="M-24 -317 Q-15 -328 -6 -317 M24 -317 Q15 -328 6 -317" stroke="#2B1B12" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
            <path className="shq-face-brows" d="M-29 -331 Q-17 -337 -4 -332 M29 -331 Q17 -337 4 -332" stroke="#17130F" strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <path className="shq-face-mouth-calm" d="M-9 -286 Q0 -280 9 -286" stroke="#7A3B2E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <g className="shq-face-mouth-open">
              <path d="M-12 -288 Q0 -268 12 -288 Q0 -284 -12 -288 Z" fill="#7A1F1F" />
              <path d="M-10 -287 Q0 -283 10 -287 L9 -284 Q0 -281 -9 -284 Z" fill="#FFFFFF" />
              <ellipse cx="0" cy="-276" rx="4.8" ry="2.6" fill="#E5736A" />
            </g>
            <path className="shq-face-stache" d="M-18 -293 Q-9 -299 0 -295 Q9 -299 18 -293 Q18 -290 14 -289 Q8 -293 0 -292 Q-8 -293 -14 -289 Q-18 -290 -18 -293 Z" fill="#17130F" />
            <path d="M-40 -318 Q-44 -376 0 -377 Q44 -376 40 -318 Q38 -340 30 -350 Q14 -362 -10 -358 Q-26 -352 -34 -340 Q-38 -330 -40 -318 Z" fill="#17130F" />
            <path d="M-24 -368 Q-8 -374 14 -370 M10 -362 Q24 -358 32 -348" stroke="#5A5046" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".85" />
          </g>
          <g className="shq-face-hand">
            <rect x="-56" y="-274" width="16" height="22" rx="4" fill="#4A5B43" />
            <rect x="-57" y="-278" width="18" height="7" rx="2" fill="#B3262E" stroke="#E3B04B" strokeWidth="1" />
            <circle cx="-48" cy="-286" r="8.5" fill="url(#shqf-skin)" />
            <path d="M-53 -290 Q-48 -295 -43 -290" stroke="#D49C70" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
      {pokes > 0 && (
        <g key={pokes} className="shq-face-burst" transform="translate(0 -330)">
          {BURST.map((b, i) => (
            <g
              key={i}
              className="shq-face-bp"
              style={{
                ["--bx" as string]: `${b.x}px`,
                ["--by" as string]: `${b.y}px`,
                ["--br" as string]: `${b.r}deg`,
                animationDelay: `${b.d}s`,
              }}
            >
              <path d={b.heart ? HEART : STAR} fill={b.heart ? "#E5736A" : "#FFC93C"} />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
