/* Shoqan, the mascot on the home screen (ordinary site only: the research build
   swaps this file for ShoqanMascot.off.tsx in vite.config.ts, so the study's
   learners all see the same app).

   His mood follows how long ago the learner last did anything: today = happy,
   one or two days = calm, three or more = cold, never upset. Missing a day never
   takes anything away from the learner. Pure SVG and CSS, no images, no 3D
   library. The drawing is an original illustration based on the historical
   Shoqan Walikhanov's appearance (officer's coat, epaulettes, moustache, journal). */
import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Lang } from "../lang";
import "./ShoqanMascot.css";

export type ShoqanMood = "happy" | "calm" | "sad";

/** Days since the learner last did something: 0 = today, null = never. */
export function moodFor(daysAway: number | null): ShoqanMood {
  if (daysAway === null) return "calm";
  if (daysAway <= 0) return "happy";
  return daysAway <= 2 ? "calm" : "sad";
}

const TEXT = {
  kk: {
    name: "Шоқан",
    say: { happy: "Керемет! Бүгін тағы бір қадам жасадық.", calm: "Сәлем! Бір ертегі оқып көрейік пе?", sad: "Мұнда суық… Мен сені күтіп отырмын. Бір қысқа ертегі?" },
    poke: { ok: ["Ха-ха, қытықтама!", "Мен осындамын!", "Ертегіге қайтайық па?"], sad: ["Брр… қолың жылы екен.", "Бір ертегі мені жылытар еді."] },
    label: { happy: "Шоқан қуанып тұр", calm: "Шоқан тыныш тұр", sad: "Шоқан тоңып тұр" },
    tap: "Шоқанға қол тигізу",
  },
  ru: {
    name: "Шокан",
    say: { happy: "Здорово! Сегодня мы сделали ещё один шаг.", calm: "Привет! Почитаем сказку?", sad: "Здесь холодно… Я тебя жду. Одну короткую сказку?" },
    poke: { ok: ["Ха-ха, щекотно!", "Я здесь!", "Вернёмся к сказке?"], sad: ["Брр… какие у тебя тёплые руки.", "Сказка бы меня согрела."] },
    label: { happy: "Шокан радуется", calm: "Шокан стоит спокойно", sad: "Шокан замёрз" },
    tap: "Потрогать Шокана",
  },
  en: {
    name: "Shoqan",
    say: { happy: "Great! One more step today.", calm: "Hi! Shall we read a tale?", sad: "It is chilly here… I am waiting for you. One short tale?" },
    poke: { ok: ["Ha, that tickles!", "I am right here!", "Back to the tale?"], sad: ["Brr… your hands are warm.", "A tale would warm me up."] },
    label: { happy: "Shoqan is happy", calm: "Shoqan stands calmly", sad: "Shoqan is cold" },
    tap: "Poke Shoqan",
  },
} as const;

// Fixed positions, so the snow and dust look the same on every render.
const SNOW = Array.from({ length: 14 }, (_, i) => ({ x: -100 + ((i * 53) % 200), r: 1.4 + (i % 3) * 0.8, dur: 6 + (i % 5), dx: (i % 2 ? 1 : -1) * (8 + (i % 4) * 5), d: -((i * 7) % 10) }));
const MOTES = Array.from({ length: 8 }, (_, i) => ({ x: -90 + ((i * 47) % 180), y: -140 + ((i * 31) % 120), r: 1.2 + (i % 3) * 0.6, dur: 5 + (i % 4), dx: (i % 2 ? 1 : -1) * 10, d: -((i * 3) % 8) }));
const SPARKS = [[-70, -250], [70, -200], [-60, -120], [76, -300], [0, -410]].map(([x, y], i) => {
  const s = 7 + (i % 3) * 3, q = s * 0.25;
  return { x, y, d: i * 0.22, path: `M0 ${-s} L${q} ${-q} L${s} 0 L${q} ${q} L0 ${s} L${-q} ${q} L${-s} 0 L${-q} ${-q} Z` };
});

export default function ShoqanMascot({ daysAway, lang }: { daysAway: number | null; lang: Lang }) {
  const T = TEXT[lang];
  const mood = moodFor(daysAway);
  const uid = useId().replace(/:/g, "");
  const [gaze, setGaze] = useState({ x: 0, y: 0, r: 0 });
  const [pokes, setPokes] = useState(0);
  const [poked, setPoked] = useState(false);
  const [pokeIdx, setPokeIdx] = useState(0);

  // First action of the day while the app is open: a little celebration.
  const prev = useRef(daysAway);
  useEffect(() => {
    if (prev.current !== null && prev.current > 0 && daysAway === 0) { setPokes((n) => n + 1); setPoked(false); }
    prev.current = daysAway;
  }, [daysAway]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    if (!b.width || !b.height) return;
    const dx = (e.clientX - (b.left + b.width * 0.3)) / (b.width / 2);
    const dy = (e.clientY - (b.top + b.height * 0.3)) / (b.height / 2);
    const cl = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    const x = Math.round(cl(dx * 3, 2.6) * 2) / 2, y = Math.round(cl(dy * 2.4, 1.8) * 2) / 2, r = Math.round(cl(dx * 4, 3));
    setGaze((g) => (g.x === x && g.y === y && g.r === r ? g : { x, y, r }));
  };
  const lookAtYurt = mood === "sad" && gaze.x === 0 && gaze.y === 0;
  const gx = lookAtYurt ? -2.4 : gaze.x;
  const hr = lookAtYurt ? -3 : gaze.r;

  const lines = mood === "sad" ? T.poke.sad : T.poke.ok;
  const say = poked ? lines[pokeIdx % lines.length] : T.say[mood];
  const poke = () => { setPokes((n) => n + 1); setPoked(true); setPokeIdx((i) => (i + 1) % 3); };
  const g = (id: string) => `url(#${uid}-${id})`;

  return (
    <section
      aria-label={T.name}
      onPointerMove={onMove}
      onPointerLeave={() => setGaze({ x: 0, y: 0, r: 0 })}
      className={`shq shq-m-${mood} ${pokes ? (pokes % 2 ? "shq-poke-a" : "shq-poke-b") : ""} relative overflow-hidden rounded-2xl border-2 border-line flex items-stretch gap-3`}
      style={{ ["--gx" as string]: `${gx}px`, ["--gy" as string]: `${gaze.y}px`, ["--hr" as string]: `${hr}deg`, background: mood === "sad" ? "linear-gradient(#CFE3EE,#9DBBCB)" : mood === "happy" ? "linear-gradient(#FFE7A6,#FFF6D8)" : "linear-gradient(#BFE6F2,#EEF8FA)" }}
    >
      <div className="relative shrink-0 w-[132px] sm:w-[160px]">
        <svg viewBox="-110 -440 220 460" className="block w-full h-auto" role="img" aria-label={T.label[mood]}>
          <defs>
          <radialGradient id={`${uid}-gSkin`} cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#FBDDBA"/><stop offset=".6" stopColor="#EFC094"/><stop offset="1" stopColor="#D49C70"/></radialGradient>
          <linearGradient id={`${uid}-gCoat`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#63765A"/><stop offset=".5" stopColor="#4A5B43"/><stop offset="1" stopColor="#2F3B2B"/></linearGradient>
          <linearGradient id={`${uid}-gGold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F0C44A"/><stop offset="1" stopColor="#B9861C"/></linearGradient>
          <linearGradient id={`${uid}-gBoot`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A3A26"/><stop offset="1" stopColor="#241508"/></linearGradient>
          <linearGradient id={`${uid}-gBook`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E0602F"/><stop offset="1" stopColor="#A33A16"/></linearGradient>
          </defs>
          <g className="shq-sun"><circle cx="72" cy="-372" r="30" fill="#FFE08A" opacity=".5" /><circle cx="72" cy="-372" r="17" fill="#FFC93C" /></g>
          <g className="shq-moon"><circle cx="72" cy="-372" r="16" fill="#F4F1E4" /><circle cx="79" cy="-378" r="14" fill="#9DBBCB" /></g>
          <ellipse cx="0" cy="2" rx="106" ry="15" fill="#7DB955" />
          <ellipse className="shq-snowcover" cx="0" cy="2" rx="106" ry="15" fill="#EEF4F8" />
          <g className="shq-motes" fill="#FFE08A">
            {MOTES.map((m, i) => <circle key={i} className="shq-mote" cx={m.x} cy={m.y} r={m.r} style={{ ["--d" as string]: `${m.dur}s`, ["--dx" as string]: `${m.dx}px`, animationDelay: `${m.d}s` }} />)}
          </g>
          <ellipse className="shq-shadow" cx="0" cy="4" rx="60" ry="8" fill="#1B2F1A" opacity=".28" />
          <g><path className="shq-cast" d="M-50 2 L-120 14 L-80 20 L40 10 Z" fill="#1B2F1A" opacity=".18"/><g className="shq-figpoke">
          <g className="shq-hover"><g className="shq-shiver">

          <path d="M-40 -96 L-44 -52 H-14 L-8 -96 Z M40 -96 L44 -52 H14 L8 -96 Z" fill="#3A4536"/>
          <g className="shq-bootL"><path d="M-46 -78 H-16 V-18 Q-16 -4 -30 -2 L-58 -2 Q-65 -6 -58 -14 L-46 -20 Z" fill={g("gBoot")}/><path d="M-42 -72 Q-38 -46 -40 -26" stroke="#FFFFFF" strokeWidth="2" opacity=".18" fill="none" strokeLinecap="round"/></g>
          <path d="M46 -78 H16 V-18 Q16 -4 30 -2 L58 -2 Q65 -6 58 -14 L46 -20 Z" fill={g("gBoot")}/><path d="M42 -72 Q38 -46 40 -26" stroke="#FFFFFF" strokeWidth="2" opacity=".18" fill="none" strokeLinecap="round"/>
          <path d="M-58 -2 H-30 M58 -2 H30" stroke="#120A05" strokeWidth="3" strokeLinecap="round"/>
          <path d="M-42 -74 Q-38 -40 -40 -24 M42 -74 Q38 -40 40 -24" stroke="#8A6040" strokeWidth="2" fill="none" opacity=".6"/>

          <g className="shq-breathe">
          <g className="shq-hem">
          <path d="M-52 -258 Q0 -272 52 -258 L62 -170 Q66 -120 70 -90 Q0 -80 -70 -90 Q-66 -120 -62 -170 Z" fill={g("gCoat")}/>
          <path d="M-52 -258 Q0 -272 52 -258 L62 -170 Q66 -120 70 -90 Q0 -80 -70 -90 Q-66 -120 -62 -170 Z" fill="#8FA7B5" className="shq-coat-cold"/>
          <path d="M-28 -186 Q-34 -130 -46 -92 M30 -186 Q38 -130 48 -90 M-10 -170 Q-12 -130 -8 -88 M12 -170 Q16 -130 20 -86" stroke="#1F2A1D" strokeWidth="2" fill="none" opacity=".35"/>
          <path d="M0 -254 Q2 -170 0 -86" stroke="#1F2A1D" strokeWidth="2.4" fill="none" opacity=".55"/>
          <path d="M-4 -252 Q-2 -170 -4 -86 M4 -252 Q6 -170 4 -86" stroke="#6F8267" strokeWidth="1" fill="none" opacity=".7"/>
          <path d="M-69 -92 Q0 -82 69 -92" stroke="#2A3527" strokeWidth="3" fill="none" opacity=".55"/>
          </g>
          <path d="M52 -258 L62 -170 Q66 -120 70 -90" stroke="#FFE7A6" strokeWidth="2.4" fill="none" opacity=".55" strokeLinecap="round"/>
          <g fill="#D9A441" stroke="#7A5612" strokeWidth="1">
          <circle cx="0" cy="-236" r="3.4"/><g fill="#FFFFFF" opacity=".7"><circle cx="-1" cy="-237" r=".9"/><circle cx="-1" cy="-215" r=".9"/><circle cx="-1" cy="-193" r=".9"/><circle cx="-1" cy="-171" r=".9"/><circle cx="-1" cy="-149" r=".9"/><circle cx="-1" cy="-127" r=".9"/><circle cx="-1" cy="-105" r=".9"/></g><circle cx="0" cy="-214" r="3.4"/><circle cx="0" cy="-192" r="3.4"/><circle cx="0" cy="-170" r="3.4"/><circle cx="0" cy="-148" r="3.4"/><circle cx="0" cy="-126" r="3.4"/><circle cx="0" cy="-104" r="3.4"/>
          </g>
          <path d="M-26 -266 Q0 -250 26 -266 L26 -278 Q0 -264 -26 -278 Z" fill="#B3262E"/>
          <path d="M-26 -266 Q0 -250 26 -266" stroke="#E3B04B" strokeWidth="1.6" fill="none"/>
          <path d="M-7 -253 L-26 -258 M7 -253 L26 -258" stroke="#8E1B22" strokeWidth="2" fill="none"/>
          <g transform="rotate(-14 -46 -258)"><path d="M-66 -262 L-30 -270 L-26 -248 L-62 -242 Z" fill={g("gGold")} stroke="#8C6414" strokeWidth="1"/><circle cx="-34" cy="-258" r="4.2" fill="#B3262E" stroke="#8C6414" strokeWidth="1"/><path d="M-66 -262 L-62 -242 M-61 -263 L-57 -243 M-56 -265 L-52 -245" stroke="#8C6414" strokeWidth="1" opacity=".7"/></g>
          <g transform="rotate(14 46 -258)"><path d="M66 -262 L30 -270 L26 -248 L62 -242 Z" fill={g("gGold")} stroke="#8C6414" strokeWidth="1"/><circle cx="34" cy="-258" r="4.2" fill="#B3262E" stroke="#8C6414" strokeWidth="1"/><path d="M66 -262 L62 -242 M61 -263 L57 -243 M56 -265 L52 -245" stroke="#8C6414" strokeWidth="1" opacity=".7"/></g>

          <g className="shq-look"><g className="shq-nod">
          <path d="M-13 -290 H13 V-264 Q0 -256 -13 -264 Z" fill={g("gSkin")}/>
          <path d="M-13 -274 Q0 -264 13 -274 V-268 Q0 -258 -13 -268 Z" fill="#B97B55" opacity=".5"/>
          <ellipse cx="-39" cy="-312" rx="6" ry="10" fill={g("gSkin")}/><ellipse cx="39" cy="-312" rx="6" ry="10" fill={g("gSkin")}/>
          <path d="M-37 -312 Q-37 -318 -37 -320 Q-40 -296 -26 -276 Q-10 -262 0 -262 Q10 -262 26 -276 Q40 -296 37 -320 Q40 -368 0 -368 Q-40 -368 -37 -320 Z" fill={g("gSkin")}/>
          <path d="M-37 -312 Q-40 -296 -26 -276 Q-10 -262 0 -262 Q10 -262 26 -276 Q40 -296 37 -312 Q30 -276 0 -270 Q-30 -276 -37 -312 Z" fill="#B97B55" opacity=".2"/>
          <path d="M30 -330 Q42 -300 28 -276 Q38 -296 36 -322 Z" fill="#9A5F3C" opacity=".22"/>
          <ellipse cx="-22" cy="-306" rx="9" ry="6" fill="#FFE9CC" opacity=".35"/><ellipse cx="22" cy="-306" rx="9" ry="6" fill="#FFE9CC" opacity=".22"/>
          <path d="M-33 -298 Q-28 -284 -16 -278 M33 -298 Q28 -284 16 -278" stroke="#B97B55" strokeWidth="5" fill="none" opacity=".2" strokeLinecap="round"/>
          <ellipse cx="-15" cy="-327" rx="12" ry="4" fill="#B97B55" opacity=".2"/><ellipse cx="15" cy="-327" rx="12" ry="4" fill="#B97B55" opacity=".2"/>
          <ellipse className="shq-blush" cx="-24" cy="-298" rx="9" ry="5.5" fill="#F08A80"/>
          <ellipse className="shq-blush" cx="24" cy="-298" rx="9" ry="5.5" fill="#F08A80"/>
          <path d="M-3 -324 Q-6 -310 -6 -304 Q-3 -300 0 -300 Q3 -300 6 -304" stroke="#A8693F" strokeWidth="1.6" fill="none" opacity=".6" strokeLinecap="round"/>
          <path d="M-4 -322 Q-7 -310 -7 -305" stroke="#FFE9CC" strokeWidth="2" fill="none" opacity=".4" strokeLinecap="round"/>
          <circle className="shq-nose-red" cx="1" cy="-304" r="4.4" fill="#E5736A"/>
          <path d="M-26 -324 Q-15 -332 -4 -325 M26 -324 Q15 -332 4 -325" stroke="#A8693F" strokeWidth="1.2" fill="none" opacity=".55" strokeLinecap="round"/>
          <g className="shq-eyes-lid"><g className="shq-blink shq-eyes-open">
          <path d="M-24 -318 Q-15 -325 -6 -318 Q-15 -311 -24 -318 Z" fill="#F6F3EC"/>
          <path d="M24 -318 Q15 -325 6 -318 Q15 -311 24 -318 Z" fill="#F6F3EC"/>
          <g className="shq-glance"><circle cx="-15" cy="-318" r="5" fill="#2B1B12"/><circle cx="15" cy="-318" r="5" fill="#2B1B12"/>
          <circle cx="-15" cy="-318" r="2.2" fill="#0F0805"/><circle cx="15" cy="-318" r="2.2" fill="#0F0805"/>
          <circle cx="-13.2" cy="-319.8" r="1.5" fill="#FFFFFF"/><circle cx="16.8" cy="-319.8" r="1.5" fill="#FFFFFF"/></g>
          <path d="M-25 -318 Q-15 -327 -5 -318 M25 -318 Q15 -327 5 -318" stroke="#2B1B12" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
          <path d="M-24 -316 Q-15 -311 -6 -316 M24 -316 Q15 -311 6 -316" stroke="#B97B55" strokeWidth="1" fill="none" opacity=".5"/>
          </g></g>
          <g className="shq-eyes-happy"><path d="M-24 -317 Q-15 -328 -6 -317 M24 -317 Q15 -328 6 -317" stroke="#2B1B12" strokeWidth="3" fill="none" strokeLinecap="round"/></g>
          <path className="shq-browL" d="M-29 -331 Q-17 -337 -4 -332" stroke="#17130F" strokeWidth="3.6" fill="none" strokeLinecap="round"/>
          <path className="shq-browR" d="M29 -331 Q17 -337 4 -332" stroke="#17130F" strokeWidth="3.6" fill="none" strokeLinecap="round"/>
          <path className="shq-mouth-calm" d="M-9 -286 Q0 -282 9 -286" stroke="#7A3B2E" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
          <g className="shq-mouth-open"><path d="M-12 -288 Q0 -267 12 -288 Q0 -284 -12 -288 Z" fill="#7A1F1F"/><path d="M-10 -287 Q0 -283 10 -287 L9 -284 Q0 -281 -9 -284 Z" fill="#FFFFFF"/><ellipse cx="0" cy="-275" rx="5" ry="2.8" fill="#E5736A"/></g>
          <path className="shq-mouth-sad" d="M-8 -282 Q0 -288 8 -282" stroke="#7A3B2E" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
          <path d="M-20 -294 Q-10 -301 0 -297 Q10 -301 20 -294 Q21 -289 16 -287 Q9 -292 0 -292 Q-9 -292 -16 -287 Q-21 -289 -20 -294 Z" fill="#17130F"/>
          <path d="M-20 -297 Q-10 -302 -1 -298 M20 -297 Q10 -302 1 -298" stroke="#5A5046" strokeWidth="1.2" fill="none" opacity=".8" strokeLinecap="round"/>
          <path d="M-41 -316 Q-47 -378 -2 -378 Q45 -378 41 -316 Q41 -338 28 -350 Q10 -360 -2 -346 Q-6 -358 -22 -354 Q-37 -346 -41 -316 Z" fill="#17130F"/>
          <path d="M-26 -366 Q-10 -374 12 -370 M8 -360 Q24 -358 34 -346 M-34 -350 Q-24 -360 -14 -362" stroke="#5A5046" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".85"/>
          <path d="M-41 -332 Q-43 -310 -39 -298 L-36 -322 Z M41 -332 Q43 -310 39 -298 L36 -322 Z" fill="#17130F"/>
          </g></g>

          <g className="shq-armL"><g className="shq-waveL">
          <circle cx="-56" cy="-244" r="14" fill={g("gCoat")}/>
          <path d="M-67 -244 L-69 -164 L-43 -164 L-45 -244 Z" fill={g("gCoat")}/>
          <rect x="-70" y="-172" width="28" height="12" rx="2" fill="#B3262E" stroke="#E3B04B" strokeWidth="1.2"/>
          <circle cx="-56" cy="-152" r="10" fill={g("gSkin")}/>
          </g></g>
          <g className="shq-armR">
          <circle cx="56" cy="-244" r="14" fill={g("gCoat")}/>
          <path d="M45 -244 L43 -164 L69 -164 L67 -244 Z" fill={g("gCoat")}/>
          <rect x="42" y="-172" width="28" height="12" rx="2" fill="#B3262E" stroke="#E3B04B" strokeWidth="1.2"/>
          <g className="shq-book"><rect x="46" y="-176" width="36" height="46" rx="4" fill={g("gBook")} stroke="#6E2A0E" strokeWidth="1.2"/>
          <rect x="78" y="-174" width="4" height="42" rx="1.5" fill="#F6EBD4"/><rect className="shq-pageflip" x="46" y="-174" width="32" height="42" rx="2" fill="#FBF4E4" opacity=".92"/>
          <polygon points="64,-160 70,-153 64,-146 58,-153" fill="#FFC93C" stroke="#7A4B0E" strokeWidth="1"/>
          <path d="M54 -130 V-118 L58 -123 L62 -118 V-130" fill="#FFC93C"/></g>
          <circle cx="56" cy="-152" r="10" fill={g("gSkin")}/>
          <path d="M47 -152 Q56 -140 65 -152" stroke="#C48C62" strokeWidth="2" fill="none"/>
          </g>
          </g>
          <g className="shq-breath"><ellipse className="shq-puff" cx="12" cy="-282" rx="9" ry="6" fill="#EAF6FB"/><ellipse className="shq-puff" style={{ animationDelay: "1.6s" }} cx="14" cy="-282" rx="8" ry="5" fill="#EAF6FB"/></g>
          </g></g>
          </g></g>
          <g className="shq-sparkles" fill="#FFC93C">
            {SPARKS.map((s, i) => <g key={i} transform={`translate(${s.x} ${s.y})`}><path className="shq-tw" style={{ animationDelay: `${s.d}s` }} d={s.path} /></g>)}
          </g>
          <g className="shq-snow" fill="#FFFFFF">
            {SNOW.map((s, i) => <circle key={i} className="shq-snowf" cx={s.x} cy={-440} r={s.r} opacity=".9" style={{ ["--d" as string]: `${s.dur}s`, ["--dx" as string]: `${s.dx}px`, animationDelay: `${s.d}s` }} />)}
          </g>
        </svg>
        <button type="button" onClick={poke} aria-label={T.tap} className="absolute inset-0 w-full h-full bg-transparent border-0 cursor-pointer rounded-2xl" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-4 pr-4">
        <p className="eyebrow mb-1">{T.name}</p>
        <p className="font-display font-extrabold text-ink text-[16px] leading-snug" aria-live="polite">{say}</p>
      </div>
    </section>
  );
}
