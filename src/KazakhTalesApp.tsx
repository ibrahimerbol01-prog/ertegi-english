import { useState, useRef, useEffect } from "react";
import {
  Pause, Mic, MicOff, ChevronRight, BookOpen, Trophy, 
  Home as HomeIcon, Play, ArrowRight, CheckCircle2, Globe, Video, ArrowLeft, Sparkles, User, Share2, Flame, Volume2, X, Download, Compass, Layers, LogOut
} from "lucide-react";
import { supabase } from "./lib/supabase";

/* ============================================================================
   ROBUST NOMADIC ETHNO-LUXURY DESIGN SYSTEM & SAFE HOOKS
   ========================================================================== */
export const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    /* Cinzel stays for the hero wordmark and story titles — it carries the
       steppe/heritage identity. Everything else moves to a system-first
       stack (San Francisco on Apple devices) for that native Apple feel. */
    .font-editorial { font-family: 'Cinzel', serif; }
    .font-body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Plus Jakarta Sans', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    * { -webkit-tap-highlight-color: transparent; }

    /* --- Apple-style continuous corner radius tokens --- */
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

    /* Softer, more diffuse "Apple elevation" glow instead of a hard neon glow */
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

    /* Apple-style tactile press feedback on every button — the single
       highest-leverage change for making the UI feel "native". */
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

    /* Quiz answer feedback — a quick, tactile confirmation the instant the
       result is known, before the eye even reaches the text feedback below.
       Correct: a soft outward pulse. Wrong: a short horizontal shake, the
       universal "no" gesture, kept small so it reads as a nudge not a jolt. */
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

    /* Achievement banner — slides down from the top, distinct from the
       full-screen level-up modal so it never competes for the same space. */
    @keyframes achievement-slide {
      0% { opacity: 0; transform: translateY(-16px) scale(0.97); }
      12% { opacity: 1; transform: translateY(0) scale(1); }
      88% { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(-10px) scale(0.98); }
    }
    .animate-achievement { animation: achievement-slide 2.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
  `}</style>
);

/* ----------------------------------------------------------------------------
   NOTE ON PERSISTENCE:
   localStorage/sessionStorage are NOT reliable inside Claude Artifacts / some
   sandboxed preview environments (they throw or silently no-op). Since this
   component needs to run both in your own Vite/VS Code project AND may be
   previewed elsewhere, we swap persisted state for plain in-memory React
   state. If you specifically want persistence in your OWN Vite app (outside
   Claude), you can safely re-add localStorage there — see the commented
   version at the bottom of this file.
---------------------------------------------------------------------------- */
const useSafeState = (initialValue: any) => useState(initialValue);

// Fail-safe Voice Synthesizer with browser checks
const safePlayVoice = (text: string, onFallback?: (msg?: string) => void) => {
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

/* ----------------------------------------------------------------------------
   VIDEO ASSETS
   These paths assume a Vite (or CRA) project where the `public/` folder is
   at the PROJECT ROOT (sibling of `src/`), NOT inside `src/`:

     project-root/
       public/
         intro.mp4
         home.mp4
         story.mp4
         quiz.mp4
         speak.mp4
       src/
         App.jsx
         main.jsx

   Vite resolves "/story.mp4" against that root `public/` folder. If your
   `public/` folder is nested inside `src/public/`, move it up one level:

     mv src/public ./public

   then restart the dev server (Ctrl+C, then `npm run dev`).
---------------------------------------------------------------------------- */
const BG_VIDEO_ASSETS = {
  intro: "/home.mp4",
  home: "/home.mp4",
  read: "/story.mp4",
  quiz: "/quiz.mp4",
  speak: "/speak.mp4",
  profile: "/home.mp4",
};

const WORD_TRANSLATIONS = {
  aldar: "Алдар (аты)",
  kose: "Көсе (лақап аты)",
  is: "болып табылады",
  a: "бір",
  poor: "кедей",
  man: "адам",
  he: "ол",
  has: "бар",
  no: "жоқ",
  coat: "шапан / сырт киім",
  horse: "ат / жылқы",
  but: "бірақ",
  very: "өте",
  clever: "тапқыр / айлакер",
  one: "бір",
  day: "күн",
  sees: "көреді",
  rich: "бай",
  on: "үстінде",
  road: "жол",
  does: "жасайды",
  not: "жоқ",
  have: "ие болу",
  meets: "кездестіреді",
  dusty: "шаң басқан",
  famous: "әйгілі",
  his: "оның",
  cleverness: "тапқырлығы",
  owns: "иелік етеді",
  while: "кезінде",
  walking: "серуендеу",
  extremely: "шамадан тыс",
  proud: "тәкаппар",
  although: "қарамастан",
  clothes: "киімдер",
  renowned: "аты шыққан",
  across: "бойында",
  steppe: "ұлы дала",
  sharp: "өткір",
  wit: "ұшқыр ақыл",
  afternoon: "күндіз",
  wanders: "кезеді",
  lonely: "жалғыз",
  comes: "келеді",
  arrogant: "менмен",
  wealthy: "дәулетті",
  riding: "мініп келе жатқан",
  fine: "сәнді",
  despite: "қарамастан",
  possessing: "ие болу",
  earned: "жинады",
  reputation: "бедел",
  cunning: "қулық",
  silver: "күміс",
  tongue: "тіл",
  scorching: "ыстық",
  trudges: "аяғын басып келеді",
  deserted: "бос",
  fate: "тағдыр",
  delivers: "жеткізеді",
  encounter: "кездесу",
  insufferably: "шыдамыссыз",
  merchant: "көпес",

  // --- Added for the expanded story (all remaining words) ---
  wants: "қалайды",
  an: "бір (артикль)",
  idea: "ой / идея",
  looks: "қарайды",
  shouts: "айқайлайды",
  wolf: "қасқыр",
  scared: "қорыққан",
  jumps: "секіреді",
  down: "төмен",
  runs: "жүгіреді",
  away: "алысқа",
  fast: "жылдам",
  drops: "түсіріп жібереді",
  ground: "жер",
  takes: "алады",
  puts: "киеді",
  now: "қазір",
  rides: "мінеді",
  home: "үйге",
  tells: "айтып береді",
  friends: "достары",
  story: "әңгіме",
  laugh: "күледі",
  they: "олар",
  love: "жақсы көреді",
  tricks: "айлалар",
  or: "немесе",
  wearing: "киіп алған",
  beautiful: "әдемі",
  that: "сол",
  really: "шынымен",
  so: "сондықтан",
  thinks: "ойлайды",
  of: "-ның",
  plan: "жоспар",
  points: "нұсқайды",
  behind: "артында",
  hungry: "аш",
  coming: "келе жатқан",
  afraid: "қорыққан",
  off: "-дан түседі",
  back: "артқа",
  as: "ретінде",
  can: "мүмкіндігі бар",
  panic: "үрей",
  picks: "алады (жерден)",
  up: "жоғары",
  to: "-ға",
  laughing: "күліп",
  quietly: "тыныш",
  when: "қашан",
  villagers: "ауыл тұрғындары",
  hear: "естиді",
  too: "да",
  praise: "мақтайды",
  for: "үшін",
  trick: "айла",
  along: "бойымен",
  thick: "қалың",
  decides: "шешім қабылдайды",
  himself: "өзі",
  with: "-мен",
  over: "арқылы",
  shoulder: "иық",
  frightened: "қорыққан",
  expression: "кейіп",
  pack: "тобыр",
  wolves: "қасқырлар",
  running: "жүгіріп келе жатқан",
  toward: "қарай",
  them: "оларды",
  immediately: "дереу",
  from: "-дан",
  heavy: "ауыр",
  faster: "жылдамырақ",
  disappears: "жоғалады",
  looking: "қарап",
  calmly: "сабырмен",
  climbs: "мінеді",
  onto: "үстіне",
  feeling: "сезініп",
  pleased: "риза",
  evening: "кеш",
  neighbors: "көршілер",
  everyone: "барлығы",
  outsmarted: "тапқырлықпен жеңілді",
  by: "арқылы",
  nothing: "ештеңе",
  wrapped: "оранған",
  magnificent: "керемет",
  deserves: "лайық",
  far: "алыс",
  more: "көбірек",
  than: "-ға қарағанда",
  owner: "иесі",
  within: "ішінде",
  moments: "сәттер",
  invented: "ойлап тапты",
  feigning: "жалған көрсетіп",
  terror: "үрей",
  glances: "көз тастайды",
  cries: "айқайлайды",
  racing: "жарысып келе жатқан",
  convinced: "сенімді",
  performance: "ойын",
  leaps: "секіреді",
  tears: "жыртады",
  unhindered: "кедергісіз",
  sprints: "жүгіреді",
  without: "-сыз",
  backward: "артқа қарай",
  glance: "көз қарас",
  leaving: "қалдырып",
  both: "екеуі де",
  gathers: "жинайды",
  abandoned: "тасталған",
  mounts: "мінеді",
  leisurely: "асықпай",
  thoroughly: "түбегейлі",
  amused: "көңілденген",
  easily: "оңай",
  wealth: "байлық",
  separated: "бөлінген",
  foolishness: "ақымақтық",
  later: "кейінірек",
  recounts: "қайта айтып береді",
  tale: "ертегі",
  whole: "бүкіл",
  roars: "гүрілдейді",
  expense: "есебінен",
  neither: "не бірі, не екіншісі",
  resplendent: "жарқыраған",
  mounted: "мінген",
  upon: "үстінде",
  ever: "әрдайым",
  alert: "сергек",
  opportunity: "мүмкіндік",
  resolves: "шешім қабылдайды",
  vain: "мақтаншақ",
  conceived: "ойлап тапты",
  ingenious: "тапқыр",
  scheme: "айла-шарғы",
  adopting: "қабылдап",
  pure: "таза",
  ravenous: "өте аш",
  bearing: "беттеп келе жатқан",
  open: "ашық",
  overcome: "жеңілген",
  flings: "лақтырады",
  lighten: "жеңілдету",
  flight: "қашу",
  flees: "қашады",
  suppressing: "тежеп",
  retrieves: "қайтарып алады",
  unhurried: "асықпай",
  marveling: "таңданып",
  pride: "мақтаныш",
  good: "жақсы",
  sense: "ақыл-парасат",
  fire: "от",
  entire: "бүкіл",
  erupts: "жарылады",
  legend: "аңыз",
  trickster: "тапқыр алаяқ",
  grows: "өседі",
  little: "аздап",
  larger: "үлкенірек",
  still: "әлі де",

  // --- Final pass: words missed on the first sweep, verified programmatically ---
  and: "және",
  at: "-да",
  be: "болу",
  big: "үлкен",
  him: "оны",
  how: "қалай",
  in: "-де",
  it: "ол (зат есім)",
  its: "оның",
  koses: "Көсенің",
  laughs: "күледі",
  laughter: "күлкі",
  look: "қара!",
  mans: "адамның",
  merchants: "көпестің",
  most: "ең",
  much: "көп",
  nor: "де емес",
  once: "бір рет",
  out: "сыртқа",
  pace: "қарқын",
  panics: "үрейленеді",
  parted: "айырылды",
  run: "жүгіру",
  steppes: "дала",
  such: "мұндай",
  the: "анықтауыш артикль",
  village: "ауыл",
  warm: "жылы",
  was: "болды",
  wasted: "далада қалды (бекерге кетті)"
};

export const DICT = {
  kk: {
    skip: "ÖTKİZİP JÏBERŪ",
    enter: "BASTAU",
    greeting: "ARMISIN, OQUŞY",
    homeSubtitle: "Qazaq fol'klory men dala añyzdary negızınde jasatylğan innovaciälyq EdTech platformasy.",
    collectionTitle: "AÑYZDAR JINAĞY",
    startReading: "OQUDY BASTAU",
    quizTitle: "Tekseru sūragy",
    checkAnswer: "JAUAPTY TEKSERU",
    tryAgain: "Qaita baiqap köru",
    speakTitle: "Aıtylym jattyğuy",
    speakSubtitle: "Tömendegi söılemdı daustap oqyñyz:",
    recording: "DAUS JAZYLÝDA...",
    pressMic: "MIKROFONDI BASYP SÖILEÑIZ",
    accuracy: "DƏL'DİK",
    greatIntonation: "Öte jaqsy intonaciä! +15 XP qosyldy.",
    navHome: "BASTY",
    navRead: "OQÝ",
    navQuiz: "SYNAQ",
    navSpeak: "DYBYS",
    navProfile: "PROFIL",
    takeQuiz: "SYNAQTAN ÖTU",
    correctMsg: "DŪRYS! +25 XP JINALDY 🔥",
    wrongMsg: "QATE! PARAGRAPHTY QAITA OQYP ŞYĞYÑYZ",
    storyDesc: "Aldar Köse men baıdyñ şapany turaly ailakerlik pen tapqyrlyq añyzy.",
    sceneAnimation: "CINEMATIC VISUAL SCENE",
    selectLevelTitle: "DEÑGEIDİ TAÑDAÑYZ",
    selectLevelSub: "Ağılşyn tilı deñgeııñızge saqtaıynsha mətındı tañdañyz:",
    changeLevel: "DEÑGEI",
    profileTitle: "OQUŞY PROFILİ",
    totalXpLabel: "JINALĞAN XP",
    streakLabel: "ÜZILMEITIN KÜNDER",
    startDateLabel: "BASTALĞAN KÜN",
    levelStatus: "MƏRTEBE: ERTEGI ENGLISH AMBASSADOR",
    shareBuklet: "MURA BUKLETİN AŞU",
    bukletHeader: "QAZAQSTAN MURA PASSPORTY",
    closeBuklet: "JABU",
    downloadBuklet: "BÝKLETKİ JÝKTEÝ",
    tapWordHint: "Sözge basyp audarmasyn qarañyz zhəne dauspen oqyñyz.",
    interactiveChoiceTitle: "INTERAKTIVTI TAÑDAU (VISUAL NOVEL)",
    choicePrompt: "Aldar Köse osy zhғdaıda ne isteui kerek?",
    artifactUnlocked: "JANA MURA ARTEFAKTY AŞYLMDY! 🏛️"
  },
  en: {
    skip: "SKIP INTRO",
    enter: "EXPLORE TALES",
    greeting: "WELCOME LEARNER",
    homeSubtitle: "An innovative EdTech platform bridging Kazakh steppe folklore and global English learning.",
    collectionTitle: "HERITAGE TALES",
    startReading: "START READING",
    quizTitle: "Comprehension Check",
    checkAnswer: "CONFIRM ANSWER",
    tryAgain: "Try again",
    speakTitle: "Pronunciation Coach",
    speakSubtitle: "Read the following sentence aloud:",
    recording: "RECORDING IN PROGRESS...",
    pressMic: "TAP MICROPHONE TO SPEAK",
    accuracy: "ACCURACY",
    greatIntonation: "Flawless intonation! +15 XP added.",
    navHome: "HOME",
    navRead: "READ",
    navQuiz: "QUIZ",
    navSpeak: "SPEAK",
    navProfile: "PROFILE",
    takeQuiz: "TAKE QUIZ",
    correctMsg: "EXCELLENT! +25 XP GAINED 🔥",
    wrongMsg: "INCORRECT! RE-READ THE PARAGRAPH",
    storyDesc: "A tale of wit and cleverness featuring Aldar Kose and the rich man's coat.",
    sceneAnimation: "CINEMATIC SCENE",
    selectLevelTitle: "SELECT DIFFICULTY",
    selectLevelSub: "Choose your target English level to unlock the tailored text:",
    changeLevel: "LEVEL",
    profileTitle: "LEARNER PASSPORT",
    totalXpLabel: "TOTAL XP EARNED",
    streakLabel: "ACTIVE STREAK",
    startDateLabel: "MEMBER SINCE",
    levelStatus: "RANK: ERTEGI ENGLISH AMBASSADOR",
    shareBuklet: "GENERATE HERITAGE BOOKLET",
    bukletHeader: "KAZAKHSTAN HERITAGE PASSPORT",
    closeBuklet: "CLOSE",
    downloadBuklet: "DOWNLOAD BOOKLET",
    tapWordHint: "Tap any word to see its translation and hear the voice audio.",
    interactiveChoiceTitle: "INTERACTIVE STORY BRANCH",
    choicePrompt: "What should Aldar Kose do in this situation?",
    artifactUnlocked: "NEW CULTURAL ARTEFACT UNLOCKED! 🏛️"
  }
};

const BackgroundVideo = ({ src, opacity = 50, videoKey }: any) => {
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

/* ----------------------------------------------------------------------------
   XP TOAST — immediate positive feedback on any reward. Immediate, visible
   feedback loops are what make reinforcement learning "stick" psychologically
   (operant conditioning: the reward must be felt right after the action).
---------------------------------------------------------------------------- */
const XpToast = ({ toast }: any) => {
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

/* ----------------------------------------------------------------------------
   LEVEL UP MODAL — a rare, larger reward fired only when crossing a 100-XP
   rank threshold. Unpredictable, intermittent big rewards (vs. constant small
   ones) are the strongest known driver of sustained engagement (variable
   reinforcement schedules).
---------------------------------------------------------------------------- */
const LevelUpModal = ({ show, rank, onClose }: any) => {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);
  // Keep the latest onClose in a ref so the timer effect below only needs to
  // depend on `show` — avoids restarting the confetti animation every time
  // the parent re-renders with a fresh inline onClose function.
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

const KazakhOrnament = ({ className = "w-6 h-6 text-amber-200" }: any) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 C30 25, 10 30, 10 50 C10 70, 30 75, 50 95 C70 75, 90 70, 90 50 C90 30, 70 25, 50 5 Z M50 25 C40 38, 30 40, 30 50 C30 60, 40 62, 50 75 C60 62, 70 60, 70 50 C70 40, 60 38, 50 25 Z" />
  </svg>
);

/* ----------------------------------------------------------------------------
   ACHIEVEMENTS — a small badge system layered on top of the existing XP/
   vocabulary/quiz state. Each entry's `check` reads directly from the same
   stats the rest of the app already tracks (xp, saved words, quiz results),
   so unlocking never needs its own duplicate bookkeeping — the main wrapper
   just re-evaluates every check() whenever those stats change.
   -------------------------------------------------------------------------- */
const ACHIEVEMENTS = [
  {
    id: "quiz_first",
    icon: "🎯",
    title: "First Steps",
    desc: "Complete your first quiz",
    check: (s: any) => s.quizzesCompleted >= 1,
  },
  {
    id: "words_25",
    icon: "📚",
    title: "Word Collector",
    desc: "Save 25 words to your vocabulary bank",
    check: (s: any) => s.savedWordsCount >= 25,
  },
  {
    id: "quiz_perfect",
    icon: "🏆",
    title: "Flawless",
    desc: "Score 100% on a quiz",
    check: (s: any) => s.perfectQuizzes >= 1,
  },
  {
    id: "words_100",
    icon: "🏺",
    title: "Vocabulary Keeper",
    desc: "Save 100 words to your vocabulary bank",
    check: (s: any) => s.savedWordsCount >= 100,
  },
  {
    id: "level_5",
    icon: "⭐",
    title: "Rising Nomad",
    desc: "Reach Level 5 (500 XP)",
    check: (s: any) => s.xp >= 500,
  },
];

// Top-of-screen banner for a newly unlocked badge — deliberately NOT a
// full-screen modal like LevelUpModal, so it never blocks the screen the
// person was already on and can't collide with the level-up celebration.
const AchievementBanner = ({ achievement, onDone }: any) => {
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

const LEVEL_DETAILS = [
  { id: "A1", title: "BEGINNER", desc: "Karapayım so'zder men qysqa so'ylemler", badge: "A1" },
  { id: "A2", title: "ELEMENTARY", desc: "Negızgı leksika men qatynas frazalary", badge: "A2" },
  { id: "B1", title: "INTERMEDIATE", desc: "Añyz ben süjet terıñdıgı, bai grammatika", badge: "B1" },
  { id: "B2", title: "UPPER-INT", desc: "Kürdelı leksika men bayau stil'lık oylar", badge: "B2" },
  { id: "C1", title: "ADVANCED", desc: "Tolıq etno-poetika men akademialyq til", badge: "C1" },
];

const STORY = {
  title: "ALDAR KÖSE & THE RICH MAN'S COAT",
  sceneLabel: "CHAPTER I · STEPPE LEGENDS",
  levels: {
    A1: "Aldar Kose is a poor man. He has no coat. He has no horse. But he is very clever. One day he sees a rich man on the road. The rich man has a big warm coat. Aldar Kose wants the coat. He has an idea. He looks behind the rich man. He shouts, \"Look! A wolf!\" The rich man is scared. He jumps down. He runs away fast. He drops his warm coat on the ground. Aldar Kose takes the coat. He puts it on. Now he is warm. He rides the horse home. He tells his friends the story. They laugh and laugh. They love his clever tricks.",
    A2: "Aldar Kose is a poor but very clever man. He does not have a coat or a horse. One day, he meets a rich man on the dusty road. The rich man is riding a fine horse and wearing a beautiful warm coat. Aldar Kose really wants that coat, so he thinks of a clever plan. He points behind the rich man and shouts, \"Look! A hungry wolf is coming!\" The rich man is very afraid. He jumps off his horse and runs away as fast as he can. In his panic, he drops his warm coat on the ground. Aldar Kose picks up the coat and puts it on. He rides the horse back to his village, laughing quietly. When the villagers hear the story, they laugh too and praise Aldar Kose for his clever trick.",
    B1: "Aldar Kose is a poor man, but he is famous for his cleverness. He owns no coat and no horse. One day, while walking along a dusty road, he meets an extremely rich and proud man riding a fine horse and wearing a thick, warm coat. Aldar Kose decides that he wants that coat for himself, so he comes up with a clever plan. He looks over the rich man's shoulder with a frightened expression and shouts that a pack of hungry wolves is running toward them. The rich man panics immediately. He jumps down from his horse, drops his heavy coat so that he can run faster, and disappears down the road without looking back. Aldar Kose calmly picks up the warm coat, puts it on, and climbs onto the horse. He rides back to his village feeling very pleased with himself. That evening, he tells the story to his neighbors, and everyone laughs at how the proud rich man was outsmarted by a poor but clever man.",
    B2: "Although Aldar Kose owns nothing but the clothes on his back, he is renowned across the steppe for his sharp wit. One dusty afternoon, as he wanders along a lonely road, he comes across an arrogant, wealthy man riding a fine horse and wrapped in a magnificent, thick coat. Aldar Kose immediately decides that he deserves that coat far more than its owner does, and within moments he has invented a plan. Feigning terror, he glances over the rich man's shoulder and cries out that a pack of wolves is racing toward them across the steppe. Convinced by Aldar Kose's performance, the wealthy man panics, leaps from his horse, and tears off his coat so that he can run unhindered. He sprints away without a backward glance, leaving both horse and coat behind. Aldar Kose calmly gathers the abandoned coat, puts it on, mounts the horse, and rides home at a leisurely pace, thoroughly amused by how easily wealth can be separated from foolishness. When he later recounts the tale to his neighbors, the whole village roars with laughter at the rich man's expense.",
    C1: "Despite possessing neither coat nor horse, Aldar Kose has earned a reputation across the steppe for his cunning wit and silver tongue. One scorching afternoon, as he trudges along a dusty, deserted road, fate delivers him an encounter with an insufferably wealthy merchant, resplendent in a magnificent coat and mounted upon a fine horse. Aldar Kose, ever alert to opportunity, resolves at once that such a coat is wasted on so vain a man, and within moments he has conceived an ingenious scheme. Adopting an expression of pure terror, he glances over the merchant's shoulder and cries that a ravenous pack of wolves is bearing down upon them across the open steppe. Thoroughly convinced, the merchant is overcome with panic; he flings himself from his horse, tears off his heavy coat to lighten his flight, and flees down the road without so much as a backward glance. Aldar Kose, suppressing his laughter, calmly retrieves the abandoned coat, mounts the merchant's horse, and rides home at an unhurried pace, marveling at how easily pride and wealth can be parted from good sense. That evening, as he recounts the tale by the fire, the entire village erupts in laughter, and Aldar Kose's legend as the steppe's most cunning trickster grows a little larger still.",
  },
};

/* ============================================================================
   1. INTRO SCREEN
   ========================================================================== */
export function IntroScreen({ onFinish, t }: any) {
  return (
    <div className="relative min-h-screen w-full bg-[#09090D] flex flex-col justify-between p-6 overflow-hidden animate-pop-in">
      <BackgroundVideo src={BG_VIDEO_ASSETS.intro} opacity={60} videoKey="intro-bg" />

      <div className="relative z-10 flex justify-between items-center pt-4">
        <div className="flex items-center gap-2.5">
          <KazakhOrnament className="w-6 h-6 text-[#C5A059]" />
          <span className="font-editorial text-lg tracking-[0.2em] text-[#F8F5EE] uppercase font-extrabold">Ertegi English</span>
        </div>
        <button 
          onClick={onFinish}
          className="text-[10px] font-editorial uppercase tracking-[0.15em] text-[#C5A059] hover:text-[#F8F5EE] px-3.5 py-1.5 border border-[#C5A059]/30 bg-black/50 backdrop-blur-md transition-all"
        >
          {t.skip}
        </button>
      </div>

      <div className="relative z-10 space-y-4 my-auto text-center px-4 animate-float">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 terracotta-badge text-[9px] tracking-[0.2em]">
          <Sparkles size={10} /> QAZAQSTAN EDTECH INITIATIVE
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#F8F5EE] leading-tight uppercase tracking-wide">
          DALA AÑYZDARY <br />
          <span className="text-[#C5A059] drop-shadow-[0_0_20px_rgba(197,160,89,0.4)]">AĞYLŞYN TİLİNDE</span>
        </h1>
        <p className="font-body text-xs text-[#F8F5EE]/80 max-w-xs mx-auto leading-relaxed">
          {t.homeSubtitle}
        </p>
      </div>

      <div className="relative z-10 pb-6">
        <button
          onClick={onFinish}
          className="rounded-full w-full py-4 bg-gradient-to-r from-[#C5A059] via-[#9A7B38] to-[#C5A059] hover:brightness-110 text-[#09090D] font-editorial font-extrabold text-xs tracking-[0.2em] uppercase gold-glow transition-all flex items-center justify-center gap-2"
        >
          {t.enter} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   2. HOME SCREEN
   ========================================================================== */
/* ----------------------------------------------------------------------------
   DAILY GOAL RING — visualizes progress toward a session XP target.
   Goal-gradient effect (Hull, 1932 / Kivetz et al. 2006): motivation and
   effort increase measurably as a person perceives themselves getting
   closer to a goal. Seeing the ring fill in is what drives that perception.
---------------------------------------------------------------------------- */
const DailyGoalRing = ({ current, goal }: any) => {
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

function HomeScreen({ onStartRead, t, sessionXp = 0, dailyGoal = 50 }: any) {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="relative glass-luxury-card p-5 border-l-2 border-l-[#C5A059] overflow-hidden min-h-[140px]">
        <BackgroundVideo src={BG_VIDEO_ASSETS.home} opacity={35} videoKey="home-hero" />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 gold-badge text-[8px]">HERITAGE · QAZAQSTAN</span>
          <KazakhOrnament className="w-5 h-5 text-[#C5A059]" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-editorial text-xl font-bold text-[#F8F5EE] uppercase tracking-wide">
              {t.greeting}
            </h2>
            <p className="font-body text-xs text-[#F8F5EE]/80 mt-1 leading-relaxed">
              {t.homeSubtitle}
            </p>
          </div>
          <DailyGoalRing current={sessionXp} goal={dailyGoal} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-editorial text-[11px] tracking-[0.18em] text-[#C5A059] uppercase">{t.collectionTitle}</h3>
          <span className="text-[9px] text-[#C5A059] font-bold bg-[#14141C] px-2.5 py-1 border border-[#C5A059]/30">
            1/10 UNLOCKED
          </span>
        </div>

        <div 
          onClick={onStartRead}
          className="group relative glass-luxury-card glass-card-hover p-4 cursor-pointer transition-all duration-300"
        >
          <div className="relative h-48 w-full overflow-hidden mb-4 border border-[#C5A059]/30 bg-[#121218]">
            {!videoError ? (
              <video 
                autoPlay loop muted playsInline
                src={BG_VIDEO_ASSETS.read}
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover contrast-110 saturate-100 group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#1E1810] to-[#0A0A0E]">
                <KazakhOrnament className="w-12 h-12 text-[#C5A059]/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090D] via-[#09090D]/30 to-transparent opacity-90 pointer-events-none" />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="gold-badge text-[8px] px-2 py-0.5">ADAPTIVE A1–C1</span>
              <span className="bg-[#09090D]/90 border border-[#C5A059]/40 text-[#C5A059] text-[8px] px-2 py-0.5 font-bold flex items-center gap-1">
                <Video size={10} /> CINEMATIC
              </span>
            </div>
          </div>

          <h4 className="font-editorial text-base font-extrabold text-[#F8F5EE] uppercase tracking-wide">{STORY.title}</h4>
          <p className="font-body text-xs text-[#F8F5EE]/70 mt-1 leading-relaxed">
            {t.storyDesc}
          </p>

          <button className="rounded-full mt-4 w-full py-3.5 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] hover:brightness-110 text-[#09090D] font-editorial font-bold text-xs tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 gold-glow">
            <Play size={13} fill="currentColor" /> {t.startReading}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. READER SCREEN WITH INTERACTIVE CHOICE
   ========================================================================== */
function ReaderScreen({ selectedLevel, setSelectedLevel, onQuizGate, t, onReward, savedWords, onSaveWord }: any) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState("");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* --------------------------------------------------------------------------
     READ ALONG — the text slowly narrates itself word-by-word, highlighting
     and auto-scrolling to whichever word is currently being spoken, like a
     karaoke/audiobook read-along. This trains reading pace and pronunciation
     simultaneously, and is one of the most effective ways to build reading
     fluency (paired listening + visual tracking).
     -------------------------------------------------------------------------- */
  const [isReadAlongPlaying, setIsReadAlongPlaying] = useState(false);
  const [readAlongTokenIndex, setReadAlongTokenIndex] = useState<number | null>(null);
  const isPlayingRef = useRef(false);
  const wordRefs = useRef<Record<number, HTMLElement | null>>({});

  // Reading speed for Read-Along. 0.65 stays the default "deliberate pace"
  // this feature was built for; the ref mirrors the state so the recursive
  // speakWordAt() timer chain always reads the current speed even mid-story,
  // instead of capturing a stale value from when playback started.
  const READ_SPEEDS = [
    { key: "slow", label: "0.5×", rate: 0.5 },
    { key: "normal", label: "0.65×", rate: 0.65 },
    { key: "fast", label: "0.85×", rate: 0.85 },
    { key: "fluent", label: "1×", rate: 1 },
  ];
  const [readSpeed, setReadSpeed] = useState(0.65);
  const readSpeedRef = useRef(0.65);
  useEffect(() => {
    readSpeedRef.current = readSpeed;
  }, [readSpeed]);

  // Auto-scroll so the currently-highlighted word always stays in view.
  // Placed above the early return (unlike the level-select screen) so this
  // hook always runs in the same order on every render — required by the
  // Rules of Hooks. It's a no-op whenever readAlongTokenIndex is null.
  useEffect(() => {
    if (readAlongTokenIndex !== null && wordRefs.current[readAlongTokenIndex]) {
      wordRefs.current[readAlongTokenIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [readAlongTokenIndex]);

  // Stop any in-progress narration when the level changes or the screen
  // unmounts, so audio never keeps playing over a different screen/level.
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      try { window.speechSynthesis.cancel(); } catch (e) {}
    };
  }, [selectedLevel]);

  if (!selectedLevel) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="border-b border-[#C5A059]/20 pb-3 flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 terracotta-badge text-[8px]">PHASE 01 · LEVEL SELECT</span>
            <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">{t.selectLevelTitle}</h2>
          </div>
          <KazakhOrnament className="w-5 h-5 text-[#C5A059]" />
        </div>

        <p className="font-body text-xs text-[#F8F5EE]/70">{t.selectLevelSub}</p>

        <div className="space-y-2.5 pt-2">
          {LEVEL_DETAILS.map((lvl) => (
            <div
              key={lvl.id}
              onClick={() => setSelectedLevel(lvl.id)}
              className="group glass-luxury-card glass-card-hover p-4 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 gold-badge text-[9px]">{lvl.badge}</span>
                  <h3 className="font-editorial text-xs font-bold text-[#F8F5EE] uppercase tracking-wider">{lvl.title}</h3>
                </div>
                <p className="font-body text-[11px] text-[#F8F5EE]/70">{lvl.desc}</p>
              </div>
              <ChevronRight size={16} className="text-[#C5A059] group-hover:translate-x-1 transition-transform" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const text = STORY.levels[selectedLevel as keyof typeof STORY.levels];
  const tokens = text.split(/(\s+)/);
  const wordIndices = tokens.reduce((acc: number[], tok: string, i: number) => {
    if (/[a-zA-Z]/.test(tok)) acc.push(i);
    return acc;
  }, [] as number[]);

  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
    setActiveWord(word);
    setTranslation(WORD_TRANSLATIONS[cleanWord as keyof typeof WORD_TRANSLATIONS] || "Аудармасы әзірге жоқ");
    safePlayVoice(word);
  };

  // Speaks one word, then chains to the next when it finishes — this gives
  // precise word-by-word timing without depending on flaky browser
  // "boundary event" support, and degrades gracefully with a timer fallback
  // if speech synthesis isn't available at all.
  const speakWordAt = (pos: number) => {
    if (!isPlayingRef.current) return;
    if (pos >= wordIndices.length) {
      isPlayingRef.current = false;
      setIsReadAlongPlaying(false);
      return;
    }
    const tokenIdx = wordIndices[pos];
    setReadAlongTokenIndex(tokenIdx);
    const word = tokens[tokenIdx];
    const rate = readSpeedRef.current;
    // Both fallback paths (no speechSynthesis support, or a mid-word error)
    // need to respect the chosen speed too, not just the primary TTS path —
    // otherwise "0.5×" would still fly by at the old fixed pace whenever the
    // browser's voice engine hiccups.
    const fallbackAdvance = () => {
      if (isPlayingRef.current) setTimeout(() => speakWordAt(pos + 1), Math.max(280, word.length * 90) / rate);
    };
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(word);
        utter.rate = rate; // user-selected pace — 0.65 remains the "deliberate" default
        utter.pitch = 0.6;
        utter.lang = "en-US";
        utter.onend = () => {
          if (isPlayingRef.current) setTimeout(() => speakWordAt(pos + 1), 150 / rate);
        };
        utter.onerror = fallbackAdvance;
        window.speechSynthesis.speak(utter);
      } else {
        fallbackAdvance();
      }
    } catch (err) {
      fallbackAdvance();
    }
  };

  const handleToggleReadAlong = () => {
    if (isReadAlongPlaying) {
      isPlayingRef.current = false;
      setIsReadAlongPlaying(false);
      try { window.speechSynthesis.cancel(); } catch (e) {}
    } else {
      isPlayingRef.current = true;
      setIsReadAlongPlaying(true);
      let startPos = 0;
      if (readAlongTokenIndex !== null) {
        const idx = wordIndices.indexOf(readAlongTokenIndex);
        startPos = idx >= 0 && idx < wordIndices.length - 1 ? idx + 1 : 0;
      }
      speakWordAt(startPos);
    }
  };

  const handleRestartReadAlong = () => {
    isPlayingRef.current = false;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    setReadAlongTokenIndex(null);
    setIsReadAlongPlaying(false);
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="px-5 pb-6 space-y-4 animate-pop-in relative">
      <div className="flex items-center justify-between border-b border-[#C5A059]/20 pb-3">
        <div>
          <p className="font-editorial text-[9px] tracking-[0.18em] text-[#C5A059] uppercase">{STORY.sceneLabel}</p>
          <h1 className="font-editorial text-sm font-extrabold text-[#F8F5EE] uppercase tracking-wide">{STORY.title}</h1>
        </div>

        <button
          onClick={() => setSelectedLevel(null)}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#14141C] border border-[#C5A059]/30 text-[9px] font-editorial text-[#C5A059] uppercase hover:border-[#C5A059] transition-all"
        >
          <ArrowLeft size={10} /> {selectedLevel} · {t.changeLevel}
        </button>
      </div>

      <div className="relative border border-[#C5A059]/30 bg-[#09090D] overflow-hidden h-44">
        {!videoError ? (
          <video
            ref={videoRef}
            autoPlay loop muted playsInline
            src={BG_VIDEO_ASSETS.read}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover opacity-90 contrast-110 saturate-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#14141C]">
            <KazakhOrnament className="w-10 h-10 text-[#C5A059]/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090D] via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-[#09090D]/80 border border-[#C5A059]/30 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
          <span className="font-editorial text-[8px] text-[#F8F5EE] uppercase tracking-[0.15em]">
            {t.sceneAnimation}
          </span>
        </div>

        {!videoError && (
          <button
            onClick={toggleVideo}
            className="absolute bottom-2.5 right-2.5 p-2 bg-[#09090D]/80 border border-[#C5A059]/40 text-[#C5A059] hover:border-[#C5A059] transition-all"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
        )}
      </div>

      <div className="px-3 py-1.5 bg-[#14141C] border border-[#C5A059]/20 flex items-center justify-between text-[10px] text-[#F8F5EE]/80">
        <span className="flex items-center gap-1"><Volume2 size={12} className="text-[#C5A059]" /> {t.tapWordHint}</span>
        {activeWord && (
          <button onClick={() => safePlayVoice(activeWord)} className="text-[#C5A059] underline font-bold">
            🔊 Re-read
          </button>
        )}
      </div>

      {/* READ ALONG control bar — plays the story word-by-word at a slow,
          deliberate pace while the current word is highlighted and scrolled
          into view below, like a karaoke/audiobook read-along. */}
      <div className="glass-luxury-card p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleToggleReadAlong}
            className={`flex items-center gap-2 px-3.5 py-2 text-[10px] font-editorial font-bold uppercase tracking-wider rounded-full transition-all ${
              isReadAlongPlaying
                ? "bg-[#B2533E] text-[#F8F5EE]"
                : "bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] gold-glow"
            }`}
          >
            {isReadAlongPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
            {isReadAlongPlaying ? "Pause Read-Along" : "Read Along"}
          </button>

          <div className="flex-1 min-w-0 text-right">
            {readAlongTokenIndex !== null ? (
              <>
                <span className="text-[9px] text-[#F8F5EE]/50 uppercase tracking-widest block">Now reading</span>
                <span className="font-editorial text-xs font-bold text-[#C5A059] truncate block">
                  "{tokens[readAlongTokenIndex]}"
                </span>
              </>
            ) : (
              <span className="text-[9px] text-[#F8F5EE]/40 italic">Tap play to follow along</span>
            )}
          </div>

          {readAlongTokenIndex !== null && (
            <button onClick={handleRestartReadAlong} className="text-[#F8F5EE]/40 hover:text-[#F8F5EE]" title="Restart from the beginning">
              <ArrowLeft size={13} />
            </button>
          )}
        </div>

        {/* Speed selector — changes take effect on the next word, even
            mid-playback, since speakWordAt() always reads readSpeedRef. */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#C5A059]/15">
          <span className="text-[8px] text-[#F8F5EE]/40 uppercase tracking-widest pr-1">Speed</span>
          {READ_SPEEDS.map((s) => (
            <button
              key={s.key}
              onClick={() => setReadSpeed(s.rate)}
              className={`px-2.5 py-1 text-[9px] font-editorial font-bold rounded-full transition-all ${
                readSpeed === s.rate
                  ? "bg-[#C5A059] text-[#09090D]"
                  : "bg-[#14141C] text-[#F8F5EE]/50 border border-[#C5A059]/20 hover:text-[#F8F5EE]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {activeWord && (
        <div className="glass-luxury-card p-3 border border-[#C5A059] flex items-center justify-between gap-2 animate-pop-in">
          <div className="min-w-0">
            <span className="text-[9px] text-[#C5A059] uppercase tracking-widest block">SELECTED WORD</span>
            <span className="font-editorial text-sm font-extrabold text-[#F8F5EE]">"{activeWord}"</span>
            <span className="text-xs text-[#C5A059] font-medium ml-2">→ {translation}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(() => {
              const cleanWord = activeWord.replace(/[^a-zA-Z]/g, "").toLowerCase();
              const alreadySaved = savedWords && savedWords.some((w: any) => w.word === cleanWord);
              return (
                <button
                  onClick={() => !alreadySaved && onSaveWord && onSaveWord(cleanWord, translation)}
                  disabled={alreadySaved}
                  className={`px-2.5 py-1.5 text-[9px] font-editorial font-bold uppercase tracking-wider border transition-all ${
                    alreadySaved
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/30"
                      : "border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/15"
                  }`}
                >
                  {alreadySaved ? "✓ SAVED" : "+ MY WORDS"}
                </button>
              );
            })()}
            <button onClick={() => setActiveWord(null)} className="text-[#F8F5EE]/50 hover:text-[#F8F5EE]">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="glass-luxury-card p-5 leading-relaxed relative border-[#C5A059]/30 max-h-[320px] overflow-y-auto">
        <p className="font-body text-sm text-[#F8F5EE] leading-7">
          {tokens.map((tok: string, i: number) => {
            const isWord = /[a-zA-Z]/.test(tok);
            if (!isWord) return <span key={i} className="text-[#F8F5EE]/50">{tok}</span>;
            const isCurrentlyRead = i === readAlongTokenIndex;
            return (
              <span key={i} className="relative inline-block mx-0.5">
                <span
                  ref={(el) => { wordRefs.current[i] = el; }}
                  onClick={() => handleWordClick(tok)}
                  className={`px-1 py-0.5 rounded font-semibold cursor-pointer transition-all duration-300 ${
                    isCurrentlyRead
                      ? "bg-[#C5A059] text-[#09090D] shadow-[0_2px_10px_-2px_rgba(197,160,89,0.6)]"
                      : "text-[#F8F5EE] hover:text-[#C5A059] hover:bg-[#C5A059]/15 border-b border-[#C5A059]/40"
                  }`}
                >
                  {tok}
                </span>
              </span>
            );
          })}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowChoiceModal(true)}
          className="flex-1 py-3.5 bg-[#14141C] border border-[#C5A059] text-[#C5A059] font-editorial font-bold text-[10px] tracking-widest uppercase hover:bg-[#C5A059]/10 transition-all flex items-center justify-center gap-2"
        >
          <Compass size={14} /> {t.interactiveChoiceTitle}
        </button>
        <button
          onClick={onQuizGate}
          className="flex-1 py-3.5 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-extrabold text-[10px] tracking-widest uppercase gold-glow flex items-center justify-center gap-1.5"
        >
          {t.takeQuiz} <ChevronRight size={14} />
        </button>
      </div>

      {showChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-pop-in">
          <div className="w-full max-w-[360px] bg-[#0E0E14] border-2 border-[#C5A059] p-5 rounded-lg shadow-2xl space-y-4 text-center relative">
            <button onClick={() => setShowChoiceModal(false)} className="absolute top-3 right-3 text-[#C5A059]">
              <X size={18} />
            </button>

            <KazakhOrnament className="w-7 h-7 mx-auto text-[#C5A059]" />
            <h3 className="font-editorial text-sm font-black text-[#F8F5EE] uppercase tracking-wider">{t.interactiveChoiceTitle}</h3>
            <p className="font-body text-xs text-[#F8F5EE]/80">{t.choicePrompt}</p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setChoiceMade(true);
                  onReward(20);
                  setShowChoiceModal(false);
                }}
                className="w-full p-3 bg-[#14141C] border border-[#C5A059]/40 hover:border-[#C5A059] text-left font-body text-xs text-[#F8F5EE] transition-all"
              >
                ✨ A) Use a clever joke to trick the wealthy merchant
              </button>
              <button
                onClick={() => {
                  setChoiceMade(true);
                  onReward(10);
                  setShowChoiceModal(false);
                }}
                className="w-full p-3 bg-[#14141C] border border-[#C5A059]/40 hover:border-[#C5A059] text-left font-body text-xs text-[#F8F5EE] transition-all"
              >
                🛡️ B) Walk past him proudly without saying a word
              </button>
            </div>

            {choiceMade && (
              <p className="text-[10px] text-emerald-400 font-editorial uppercase tracking-widest">
                {t.artifactUnlocked}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   3.5 FLASHCARDS SCREEN — SPACED REPETITION FOR SAVED VOCABULARY
   This is the core learning engine: words the student tapped while reading
   get collected here and reviewed as flip-cards. "I knew it" / "Still
   learning" adjusts each word's review count — words marked "still learning"
   resurface more often, which is how real spaced repetition works.
   ========================================================================== */
/* ============================================================================
   3.6 MATCHING GAME — classic Duolingo pair-matching exercise. Tap a word,
   then tap its translation. This forces rapid recognition (vs. slower
   recall in flashcards) and adds variety, which keeps repeated vocabulary
   review from feeling monotonous — a big reason Duolingo mixes exercise
   types instead of repeating the same drill.
   ========================================================================== */
function MatchingGame({ savedWords, onReward }: any) {
  const GRID_SIZE = 6; // 6 words = 12 tiles, fits a mobile screen cleanly
  const [round, setRound] = useState(0);
  const [tiles, setTiles] = useState<any[]>([]);
  const [selectedTile, setSelectedTile] = useState<any>(null);
  const [matchedIds, setMatchedIds] = useState<any[]>([]);
  const [wrongPair, setWrongPair] = useState<any[]>([]);
  const [roundComplete, setRoundComplete] = useState(false);

  const buildRound = () => {
    if (!savedWords || savedWords.length < 3) return;
    const shuffled = [...savedWords].sort(() => Math.random() - 0.5).slice(0, Math.min(GRID_SIZE, savedWords.length));
    const wordTiles = shuffled.map((w, i) => ({ tileId: `w-${i}`, pairId: i, text: w.word, kind: "word" }));
    const transTiles = shuffled.map((w, i) => ({ tileId: `t-${i}`, pairId: i, text: w.translation, kind: "translation" }));
    const combined = [...wordTiles, ...transTiles].sort(() => Math.random() - 0.5);
    setTiles(combined);
    setMatchedIds([]);
    setSelectedTile(null);
    setWrongPair([]);
    setRoundComplete(false);
  };

  useEffect(() => {
    buildRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, savedWords.length]);

  const handleTileTap = (tile: any) => {
    if (matchedIds.includes(tile.pairId) || wrongPair.length > 0) return;

    if (!selectedTile) {
      setSelectedTile(tile);
      return;
    }
    if (selectedTile.tileId === tile.tileId) {
      setSelectedTile(null);
      return;
    }
    if (selectedTile.pairId === tile.pairId && selectedTile.kind !== tile.kind) {
      // Correct match
      const newMatched = [...matchedIds, tile.pairId];
      setMatchedIds(newMatched);
      setSelectedTile(null);
      onReward(4);
      if (newMatched.length === tiles.length / 2) {
        setTimeout(() => setRoundComplete(true), 400);
      }
    } else {
      // Wrong match — briefly flash red, then reset selection
      setWrongPair([selectedTile.tileId, tile.tileId]);
      setTimeout(() => {
        setWrongPair([]);
        setSelectedTile(null);
      }, 500);
    }
  };

  if (!savedWords || savedWords.length < 3) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="border-b border-white/[0.06] pb-3">
          <span className="px-2 py-0.5 terracotta-badge text-[8px]">MATCHING GAME</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">FIND THE PAIR</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-2">
          <Layers className="mx-auto text-[#C5A059]/50" size={28} />
          <p className="font-body text-xs text-[#F8F5EE]/70 leading-relaxed">
            Save at least 3 words while reading to unlock the matching game.
          </p>
        </div>
      </div>
    );
  }

  if (roundComplete) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="border-b border-white/[0.06] pb-3">
          <span className="px-2 py-0.5 gold-badge text-[8px]">MATCHING GAME</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">FIND THE PAIR</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-3">
          <Trophy className="mx-auto text-[#C5A059]" size={28} />
          <p className="font-editorial text-sm font-bold text-[#F8F5EE] uppercase">All Matched!</p>
          <p className="font-body text-xs text-[#F8F5EE]/70">Great recognition speed.</p>
          <button
            onClick={() => setRound((r) => r + 1)}
            className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-bold text-[10px] tracking-widest uppercase gold-glow rounded-full"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-4 animate-pop-in">
      <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
        <div>
          <span className="px-2 py-0.5 gold-badge text-[8px]">MATCHING GAME</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">FIND THE PAIR</h2>
        </div>
        <span className="text-[10px] text-[#C5A059] font-bold bg-[#14141C] px-2.5 py-1 rounded-full border border-[#C5A059]/30">
          {matchedIds.length} / {tiles.length / 2}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => {
          const isMatched = matchedIds.includes(tile.pairId);
          const isSelected = selectedTile?.tileId === tile.tileId;
          const isWrong = wrongPair.includes(tile.tileId);
          let style = "border-[#C5A059]/25 bg-[#14141C]/80 text-[#F8F5EE]";
          if (isMatched) style = "border-emerald-500/40 bg-emerald-950/30 text-emerald-400/50 opacity-50";
          else if (isWrong) style = "border-red-500/80 bg-red-950/40 text-red-300";
          else if (isSelected) style = "border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059]";

          return (
            <button
              key={tile.tileId}
              disabled={isMatched}
              onClick={() => handleTileTap(tile)}
              className={`p-3.5 border font-body text-xs font-semibold text-center min-h-[56px] flex items-center justify-center transition-all ${style}`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   3.7 FLASHCARDS SCREEN — SPACED REPETITION FOR SAVED VOCABULARY
   Words the student tapped while reading get collected here and reviewed as
   flip-cards. "Again/Hard/Good/Easy" adjusts each word's mastery — weaker
   words resurface first, which is how real spaced repetition works.
   ========================================================================== */
function FlashcardsScreen({ savedWords, onUpdateWord }: any) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  // Duolingo-style "Practice" shortcut: when on, the review queue is
  // filtered to only words the learner is still shaky on (mastery < 2),
  // instead of cycling through everything including words already mastered.
  const [practiceWeakOnly, setPracticeWeakOnly] = useState(false);

  if (!savedWords || savedWords.length === 0) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="border-b border-[#C5A059]/20 pb-3">
          <span className="px-2 py-0.5 terracotta-badge text-[8px]">VOCABULARY BANK</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">MY WORDS</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-2">
          <BookOpen className="mx-auto text-[#C5A059]/50" size={28} />
          <p className="font-body text-xs text-[#F8F5EE]/70 leading-relaxed">
            No words saved yet. While reading, tap any word and hit
            <span className="text-[#C5A059] font-bold"> "+ MY WORDS" </span>
            to add it here for review.
          </p>
        </div>
      </div>
    );
  }

  // Words still being learned surface first (real SRS priority ordering).
  // "Practice Weak Words" narrows the queue to only mastery < 2 — a focused
  // drill instead of re-reviewing words already comfortably known.
  const baseQueue = practiceWeakOnly ? savedWords.filter((w: any) => (w.mastery || 0) < 2) : savedWords;
  const queue = [...baseQueue].sort((a, b) => (a.mastery || 0) - (b.mastery || 0));

  if (practiceWeakOnly && queue.length === 0) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="border-b border-[#C5A059]/20 pb-3 flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 gold-badge text-[8px]">VOCABULARY BANK</span>
            <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">MY WORDS</h2>
          </div>
          <button
            onClick={() => setPracticeWeakOnly(false)}
            className="text-[9px] font-editorial text-[#C5A059] font-bold uppercase"
          >
            Show All
          </button>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-2">
          <Trophy className="mx-auto text-emerald-400" size={28} />
          <p className="font-body text-xs text-[#F8F5EE]/70">No weak words right now — everything is well mastered. Nice work!</p>
        </div>
      </div>
    );
  }

  if (sessionDone || index >= queue.length) {
    return (
      <div className="px-5 pb-6 space-y-4 animate-pop-in">
        <div className="border-b border-[#C5A059]/20 pb-3">
          <span className="px-2 py-0.5 gold-badge text-[8px]">VOCABULARY BANK</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">MY WORDS</h2>
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-3">
          <Trophy className="mx-auto text-[#C5A059]" size={28} />
          <p className="font-editorial text-sm font-bold text-[#F8F5EE] uppercase">Review Complete</p>
          <p className="font-body text-xs text-[#F8F5EE]/70">You reviewed {queue.length} word{queue.length !== 1 ? "s" : ""} this session.</p>
          <button
            onClick={() => { setIndex(0); setFlipped(false); setSessionDone(false); }}
            className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-bold text-[10px] tracking-widest uppercase gold-glow"
          >
            Review Again
          </button>
        </div>

        <div className="glass-luxury-card p-3 space-y-1.5">
          <span className="font-editorial text-[9px] tracking-[0.15em] text-[#C5A059] uppercase block mb-1">All Saved Words ({queue.length})</span>
          {queue.map((w) => (
            <div key={w.word} className="flex items-center justify-between text-xs px-2 py-1.5 bg-[#14141C] border border-[#C5A059]/15">
              <span className="text-[#F8F5EE] font-semibold">{w.word}</span>
              <div className="flex items-center gap-2">
                <span className="text-[#C5A059]">{w.translation}</span>
                <span className="flex gap-0.5" title="Mastery level">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${i < (w.mastery || 0) ? "bg-emerald-400" : "bg-[#F8F5EE]/15"}`}
                    />
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const current = queue[index];

  const handleReviewResult = (rating: string) => {
    onUpdateWord(current.word, rating);
    setFlipped(false);
    if (index + 1 >= queue.length) setSessionDone(true);
    else setIndex(index + 1);
  };

  return (
    <div className="px-5 pb-6 space-y-4 animate-pop-in">
      <div className="border-b border-[#C5A059]/20 pb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="px-2 py-0.5 gold-badge text-[8px]">VOCABULARY BANK</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">MY WORDS</h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setPracticeWeakOnly((v) => !v);
              setIndex(0);
              setFlipped(false);
              setSessionDone(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-editorial font-bold uppercase tracking-wider rounded-full border transition-all ${
              practiceWeakOnly
                ? "bg-[#B2533E] border-[#B2533E] text-[#F8F5EE]"
                : "border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059]/10"
            }`}
            title="Only review words you're still shaky on"
          >
            <Flame size={9} /> Weak Only
          </button>
          <span className="text-[10px] text-[#C5A059] font-bold bg-[#14141C] px-2.5 py-1 rounded-full border border-[#C5A059]/30">
            {index + 1} / {queue.length}
          </span>
        </div>
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="glass-luxury-card p-10 text-center cursor-pointer min-h-[180px] flex flex-col items-center justify-center gap-2 gold-glow"
      >
        {!flipped ? (
          <>
            <span className="text-[9px] text-[#C5A059]/70 uppercase tracking-widest">Tap to reveal</span>
            <span className="font-editorial text-2xl font-black text-[#F8F5EE] uppercase">{current.word}</span>
          </>
        ) : (
          <>
            <span className="text-[9px] text-[#C5A059]/70 uppercase tracking-widest">Translation</span>
            <span className="font-editorial text-xl font-bold text-[#C5A059]">{current.translation}</span>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); safePlayVoice(current.word); }}
          className="mt-2 text-[#C5A059]/80 hover:text-[#C5A059]"
        >
          <Volume2 size={16} />
        </button>
      </div>

      {!flipped && (
        <p className="text-center text-[10px] text-[#F8F5EE]/40 font-body">
          Try to recall the meaning before flipping — active recall builds stronger memory than re-reading.
        </p>
      )}

      {flipped && (
        <div className="space-y-2 animate-pop-in">
          <p className="text-center text-[9px] text-[#F8F5EE]/50 uppercase tracking-widest">How well did you know it?</p>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => handleReviewResult("again")}
              className="py-3 bg-[#14141C] border border-red-500/60 text-red-400 font-editorial font-bold text-[9px] tracking-wide uppercase hover:bg-red-500/10 transition-all"
            >
              Again
            </button>
            <button
              onClick={() => handleReviewResult("hard")}
              className="py-3 bg-[#14141C] border border-[#B2533E]/70 text-[#B2533E] font-editorial font-bold text-[9px] tracking-wide uppercase hover:bg-[#B2533E]/10 transition-all"
            >
              Hard
            </button>
            <button
              onClick={() => handleReviewResult("good")}
              className="py-3 bg-[#14141C] border border-[#C5A059] text-[#C5A059] font-editorial font-bold text-[9px] tracking-wide uppercase hover:bg-[#C5A059]/10 transition-all"
            >
              Good
            </button>
            <button
              onClick={() => handleReviewResult("easy")}
              className="py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-[#F8F5EE] font-editorial font-bold text-[9px] tracking-wide uppercase transition-all"
            >
              Easy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   4. QUIZ SCREEN
   ========================================================================== */
function QuizScreen({ onReward, t, onQuizFinish }: any) {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // --- HEARTS (LIVES) SYSTEM — Duolingo's core stakes mechanic. Losing a
  // heart on a wrong answer makes each choice feel consequential, which
  // measurably increases attention during the exercise (loss aversion).
  const MAX_HEARTS = 3;
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [outOfHearts, setOutOfHearts] = useState(false);

  // --- PER-QUESTION TIMER + SPEED BONUS — a countdown per question that
  // both raises the stakes (like hearts) and rewards decisive, confident
  // answers with bonus XP. Running out of time counts as a miss (same as a
  // wrong answer) rather than silently skipping, so the timer has real
  // consequences instead of being cosmetic.
  const QUESTION_TIME = 15; // seconds
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [timedOut, setTimedOut] = useState(false);

  // Mixed question types, exactly like a real Duolingo lesson: standard
  // comprehension (mcq) plus fill-in-the-blank pulled straight from the
  // story text, which forces closer, more careful re-reading.
  const questions = [
    {
      type: "mcq",
      q: "Why was Aldar Kose famous across the steppe?",
      options: ["His rich golden coat", "His sharp wit and cleverness", "His large army of horses", "His castle in the mountains"],
      correct: 1
    },
    {
      type: "mcq",
      q: "What did Aldar Kose NOT own?",
      options: ["A coat and a horse", "A house and land", "Books and gold", "Sheep and camels"],
      correct: 0
    },
    {
      type: "fillblank",
      sentence: "Aldar Kose shouted, \"Look! A ___ is coming!\"",
      options: ["merchant", "wolf", "horse", "villager"],
      correct: 1
    },
    {
      type: "mcq",
      q: "What trick did Aldar Kose use to get the coat?",
      options: ["He offered to buy it", "He challenged the man to a race", "He shouted that wolves were coming", "He asked the man's wife for it"],
      correct: 2
    },
    {
      type: "fillblank",
      sentence: "The rich man jumped off his horse and ___ away as fast as he could.",
      options: ["walked", "ran", "rode", "crawled"],
      correct: 1
    },
    {
      type: "mcq",
      q: "What did the rich man do when he panicked?",
      options: ["He hid behind a rock", "He dropped his coat and ran away", "He fought off the wolves", "He called for help"],
      correct: 1
    },
    {
      type: "mcq",
      q: "How did the story end?",
      options: ["The rich man caught Aldar Kose", "Aldar Kose lost the horse too", "Aldar Kose rode home and the village laughed at the story", "The wolves really did appear"],
      correct: 2
    },
  ];

  const question = questions[qIndex];

  const handleCheck = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === question.correct) {
      // Speed bonus: up to +5 XP on top of the base 10, scaled by how much
      // time was left when the answer was locked in — a near-instant answer
      // earns close to the full bonus, one that just beats the buzzer earns
      // almost none. Rewards confidence without punishing careful reading.
      const speedBonus = Math.max(0, Math.round((timeLeft / QUESTION_TIME) * 5));
      onReward(10 + speedBonus);
      setCorrectCount((c) => c + 1);
    } else {
      setHearts((h) => {
        const next = Math.max(h - 1, 0);
        if (next === 0) setOutOfHearts(true);
        return next;
      });
    }
  };

  // Fires when the countdown hits zero before an answer was submitted —
  // treated the same as a wrong answer (heart lost), but flagged as a
  // timeout so the feedback panel can say "time's up" instead of "wrong".
  const handleTimeout = () => {
    if (submitted) return;
    setSubmitted(true);
    setTimedOut(true);
    setHearts((h) => {
      const next = Math.max(h - 1, 0);
      if (next === 0) setOutOfHearts(true);
      return next;
    });
  };

  const handleNext = () => {
    if (outOfHearts) return;
    if (qIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setQIndex(qIndex + 1);
      setSelected(null);
      setSubmitted(false);
      setTimedOut(false);
      setTimeLeft(QUESTION_TIME);
    }
  };

  const handleRestart = () => {
    setQIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrectCount(0);
    setFinished(false);
    setHearts(MAX_HEARTS);
    setOutOfHearts(false);
    setTimedOut(false);
    setTimeLeft(QUESTION_TIME);
  };

  // Countdown itself — ticks once per second while a question is live, and
  // stops the moment it's submitted (by answer or by timeout) so it never
  // keeps running under the feedback panel.
  useEffect(() => {
    if (submitted || finished || outOfHearts) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const id = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, submitted, finished, outOfHearts]);

  // Report each completed attempt (win or lose) up to the parent so it can
  // track "first quiz" / "perfect quiz" achievements — fires once per
  // transition into the finished screen, including after a restart.
  useEffect(() => {
    if (finished && onQuizFinish) {
      onQuizFinish(correctCount, questions.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const HeartsRow = () => (
    <div className="flex items-center gap-1">
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <Flame
          key={i}
          size={13}
          className={i < hearts ? "text-[#B2533E] fill-[#B2533E]" : "text-[#F8F5EE]/15"}
        />
      ))}
    </div>
  );

  if (outOfHearts) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-pop-in">
        <div className="border-b border-white/[0.06] pb-3 flex justify-between items-center">
          <div>
            <span className="px-2 py-0.5 terracotta-badge text-[8px]">QUIZ MODULE</span>
            <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">{t.quizTitle}</h2>
          </div>
          <HeartsRow />
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-3">
          <Flame className="mx-auto text-[#B2533E]" size={30} />
          <p className="font-editorial text-sm font-bold text-[#F8F5EE] uppercase">Out of Hearts</p>
          <p className="font-body text-xs text-[#F8F5EE]/70">
            You've run out of hearts for this attempt. Re-read the story to refresh your memory, then try again from the start.
          </p>
          <button
            onClick={handleRestart}
            className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-bold text-[10px] tracking-widest uppercase gold-glow"
          >
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const passed = correctCount >= Math.ceil(questions.length * 0.6);
    return (
      <div className="px-5 pb-6 space-y-5 animate-pop-in">
        <div className="border-b border-white/[0.06] pb-3 flex justify-between items-center">
          <div>
            <span className="px-2 py-0.5 gold-badge text-[8px]">QUIZ MODULE</span>
            <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">{t.quizTitle}</h2>
          </div>
          <Trophy className="text-[#C5A059] w-5 h-5" />
        </div>
        <div className="glass-luxury-card p-6 text-center space-y-3">
          <Trophy className={`mx-auto ${passed ? "text-[#C5A059]" : "text-[#F8F5EE]/40"}`} size={30} />
          <p className="font-editorial text-lg font-black text-[#F8F5EE]">{correctCount} / {questions.length}</p>
          <p className="font-body text-xs text-[#F8F5EE]/70">
            {passed ? "Great comprehension! You understood the story well." : "Re-read the story and try again — comprehension takes practice."}
          </p>
          <button
            onClick={handleRestart}
            className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-bold text-[10px] tracking-widest uppercase gold-glow"
          >
            {t.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="border-b border-white/[0.06] pb-3 flex justify-between items-center">
        <div>
          <span className="px-2 py-0.5 gold-badge text-[8px]">QUIZ MODULE</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">{t.quizTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          <HeartsRow />
          <span className="text-[10px] text-[#C5A059] font-bold bg-[#14141C] px-2.5 py-1 rounded-full border border-[#C5A059]/30">
            {qIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Per-question countdown — thins and reddens as time runs low, doubling
          as the visual source for the speed bonus (faster answer = more bar
          left = bigger bonus). Freezes once submitted. */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#14141C] rounded-full overflow-hidden border border-[#C5A059]/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              timeLeft <= 5 ? "bg-[#B2533E]" : "bg-gradient-to-r from-[#C5A059] to-[#9A7B38]"
            }`}
            style={{ width: `${Math.max(0, (timeLeft / QUESTION_TIME) * 100)}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold tabular-nums w-5 text-right ${timeLeft <= 5 ? "text-[#B2533E]" : "text-[#F8F5EE]/50"}`}>
          {Math.max(0, timeLeft)}s
        </span>
      </div>

      <div className="glass-luxury-card p-5 space-y-4">
        {question.type === "fillblank" ? (
          <>
            <span className="text-[9px] text-[#C5A059] uppercase tracking-widest font-bold block">FILL IN THE BLANK</span>
            <p className="font-body text-sm font-semibold text-[#F8F5EE] leading-relaxed">
              {(question.sentence || "").split("___")[0]}
              <span className="inline-block min-w-[54px] border-b-2 border-[#C5A059] mx-1 text-center text-[#C5A059]">
                {submitted && selected !== null ? question.options[selected] : "\u00A0"}
              </span>
              {(question.sentence || "").split("___")[1]}
            </p>
          </>
        ) : (
          <p className="font-body text-xs font-semibold text-[#F8F5EE] leading-relaxed">{question.q}</p>
        )}

        <div className="space-y-2">
          {question.options.map((opt, idx) => {
            let style = "border-[#C5A059]/20 bg-[#14141C]/80 text-[#F8F5EE]/80 hover:border-[#C5A059]/50";
            let anim = "";
            if (selected === idx) style = "border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059] font-bold";
            if (submitted) {
              if (idx === question.correct) {
                style = "border-emerald-500/80 bg-emerald-950/50 text-emerald-300 font-bold";
                anim = "animate-answer-correct";
              } else if (selected === idx) {
                style = "border-red-500/80 bg-red-950/50 text-red-300";
                anim = "animate-answer-wrong";
              }
            }

            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => setSelected(idx)}
                className={`w-full text-left p-3.5 border font-body text-xs transition-all flex items-center justify-between ${style} ${anim}`}
              >
                <span>{opt}</span>
                {submitted && idx === question.correct && <CheckCircle2 size={15} className="text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {!submitted ? (
        <button
          onClick={handleCheck}
          disabled={selected === null}
          className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] disabled:opacity-40 text-[#09090D] font-editorial font-extrabold text-xs tracking-[0.18em] uppercase gold-glow rounded-full"
        >
          {t.checkAnswer}
        </button>
      ) : (
        <div className="p-4 border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-md text-center space-y-2 animate-pop-in">
          <p className="font-editorial text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
            {timedOut ? "⏱ Time's Up" : selected === question.correct ? t.correctMsg : t.wrongMsg}
          </p>
          <button
            onClick={handleNext}
            className="text-[10px] font-editorial text-[#C5A059] font-bold uppercase hover:text-[#F8F5EE] flex items-center justify-center gap-1 mx-auto"
          >
            {qIndex + 1 >= questions.length ? "See Results" : "Next Question"} <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   5. SPEAK SCREEN
   ========================================================================== */
// Normalizes two phrases into word tokens and scores how closely they match
// (order-sensitive, word-by-word) — good enough for pronunciation practice
// without needing a paid speech-scoring API.
function scoreTranscript(said: string, target: string): number {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const saidWords = clean(said);
  const targetWords = clean(target);
  if (targetWords.length === 0) return 0;

  // Levenshtein distance over the word arrays (not characters) — robust to
  // one dropped/extra word without tanking the whole score.
  const m = saidWords.length;
  const n = targetWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (saidWords[i - 1] === targetWords[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const distance = dp[m][n];
  const similarity = Math.max(0, 1 - distance / Math.max(m, n));
  return Math.round(similarity * 100);
}

function SpeakScreen({ onReward, t }: any) {
  const [recording, setRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const targetPhrase = "He is renowned across the steppe for his sharp wit.";

  const SpeechRecognitionCtor =
    typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

  const toggleRecord = () => {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }

    if (!SpeechRecognitionCtor) {
      setSpeechError("Speech recognition isn't supported in this browser — try Chrome on desktop or Android.");
      return;
    }

    setSpeechError(null);
    setScore(null);
    setTranscript("");

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setRecording(true);

    recognition.onresult = (event: any) => {
      const said = event.results[0][0].transcript as string;
      setTranscript(said);
      const pct = scoreTranscript(said, targetPhrase);
      setScore(pct);
      if (pct >= 50) onReward(Math.round(5 + (pct / 100) * 15)); // 5–20 XP scaled by accuracy
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") setSpeechError("Didn't catch that — try speaking a bit louder.");
      else if (event.error === "not-allowed" || event.error === "service-not-allowed")
        setSpeechError("Microphone access was blocked — allow it in your browser's site settings and try again.");
      else setSpeechError("Something went wrong with speech recognition. Please try again.");
    };

    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const feedbackMessage =
    score === null
      ? ""
      : score >= 90
      ? t.greatIntonation
      : score >= 70
      ? "Good — close to the target. Listen again and try once more."
      : "Keep practicing — tap the quote to hear it again, then try to match it closely.";

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="border-b border-[#C5A059]/20 pb-3 flex justify-between items-center">
        <div>
          <span className="px-2 py-0.5 terracotta-badge text-[8px]">SPEECH EVALUATION</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">{t.speakTitle}</h2>
        </div>
        <Mic className="text-[#C5A059] w-5 h-5" />
      </div>

      <div className="glass-luxury-card p-6 text-center space-y-3">
        <p className="font-body text-xs text-[#F8F5EE]/70">{t.speakSubtitle}</p>
        <blockquote className="font-editorial text-sm font-bold text-[#C5A059] uppercase tracking-wide leading-relaxed cursor-pointer" onClick={() => safePlayVoice(targetPhrase)}>
          "{targetPhrase}" 🔊
        </blockquote>
      </div>

      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        <button
          onClick={toggleRecord}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            recording
              ? "bg-[#B2533E] text-[#F8F5EE] animate-pulse shadow-[0_0_30px_rgba(178,83,62,0.6)]"
              : "bg-[#14141C] border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#09090D] gold-glow"
          }`}
        >
          {recording ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        <span className="font-editorial text-[9px] tracking-[0.18em] text-[#C5A059] uppercase">
          {recording ? t.recording : t.pressMic}
        </span>
      </div>

      {speechError && (
        <div className="glass-luxury-card p-4 text-center space-y-1 animate-pop-in border-[#B2533E]/40">
          <p className="font-body text-xs text-[#B2533E]">{speechError}</p>
        </div>
      )}

      {score !== null && (
        <div className="glass-luxury-card p-4 text-center space-y-1.5 animate-pop-in border-emerald-500/30">
          <p className="font-editorial text-xl font-extrabold text-emerald-400">{score}% {t.accuracy}</p>
          {transcript && <p className="font-body text-[10px] text-[#F8F5EE]/50 italic">You said: "{transcript}"</p>}
          <p className="font-body text-xs text-[#F8F5EE]/90">{feedbackMessage}</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   6. PROFILE & PASSPORT SCREEN WITH CULTURAL ARTIFACTS
   ========================================================================== */
function ProfileScreen({ xp, t, savedWordsCount = 0, unlockedAchievements = [], userName = "Learner", onSignOut, streakDays = 0 }: any) {
  const [showBuklet, setShowBuklet] = useState(false);

  return (
    <div className="px-5 pb-6 space-y-5 animate-pop-in">
      <div className="border-b border-[#C5A059]/20 pb-3 flex justify-between items-center">
        <div>
          <span className="px-2 py-0.5 gold-badge text-[8px]">USER PASSPORT</span>
          <h2 className="font-editorial text-base font-bold text-[#F8F5EE] uppercase mt-1">{t.profileTitle}</h2>
        </div>
        <button
          onClick={onSignOut}
          title="Sign out"
          className="flex items-center gap-1 text-[9px] font-editorial font-bold text-[#F8F5EE]/50 hover:text-[#B2533E] uppercase tracking-wider"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <div className="glass-luxury-card p-5 text-center space-y-3 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C5A059]/15 rounded-full blur-xl pointer-events-none" />
        
        <div className="w-20 h-20 mx-auto rounded-full border-2 border-[#C5A059] p-1 bg-[#14141C] flex items-center justify-center shadow-lg gold-glow animate-float">
          <span className="font-editorial text-2xl font-black text-[#C5A059]">II</span>
        </div>

        <div>
          <h3 className="font-editorial text-lg font-extrabold text-[#F8F5EE] uppercase tracking-wide">{userName}</h3>
          <p className="font-body text-[11px] text-[#C5A059] uppercase tracking-widest mt-0.5">{t.levelStatus}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#C5A059]/20">
          <div className="bg-[#14141C]/90 p-2.5 border border-[#C5A059]/20">
            <span className="text-[9px] text-[#F8F5EE]/60 block">{t.totalXpLabel}</span>
            <span className="font-editorial text-sm font-extrabold text-[#C5A059]">{xp} XP</span>
          </div>
          <div className="bg-[#14141C]/90 p-2.5 border border-[#C5A059]/20">
            <span className="text-[9px] text-[#F8F5EE]/60 block">{t.streakLabel}</span>
            <span className="font-editorial text-sm font-extrabold text-amber-400 flex items-center justify-center gap-1"><Flame size={13} /> {streakDays}d</span>
          </div>
          <div className="bg-[#14141C]/90 p-2.5 border border-[#C5A059]/20">
            <span className="text-[9px] text-[#F8F5EE]/60 block">WORDS SAVED</span>
            <span className="font-editorial text-sm font-extrabold text-[#F8F5EE] flex items-center justify-center gap-1"><Layers size={13} className="text-[#C5A059]" /> {savedWordsCount}</span>
          </div>
        </div>
      </div>

      <div className="glass-luxury-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-editorial text-xs font-bold text-[#C5A059] uppercase tracking-wider">🏛️ HERITAGE ARTEFACTS VAULT</h4>
          <span className="text-[9px] text-[#F8F5EE]/50">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchievements.includes(a.id);
            return (
              <div
                key={a.id}
                title={a.desc}
                className={`p-2.5 bg-[#14141C] border ${unlocked ? "border-[#C5A059]/40" : "border-[#C5A059]/20 opacity-50"}`}
              >
                <span className="text-xl">{a.icon}</span>
                <span className={`block font-editorial text-[8px] mt-1 ${unlocked ? "text-[#F8F5EE]" : "text-[#F8F5EE]/50"}`}>
                  {a.title.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setShowBuklet(true)}
        className="rounded-full w-full py-4 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-extrabold text-xs tracking-[0.18em] uppercase gold-glow flex items-center justify-center gap-2"
      >
        <Share2 size={16} /> {t.shareBuklet}
      </button>

      {showBuklet && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-pop-in">
          <div className="w-full max-w-[380px] bg-[#0E0E14] border-2 border-[#C5A059] p-6 rounded-lg shadow-2xl relative space-y-5 text-center">
            
            <button 
              onClick={() => setShowBuklet(false)}
              className="absolute top-4 right-4 text-[#C5A059] hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-1 pt-2">
              <KazakhOrnament className="w-8 h-8 mx-auto text-[#C5A059]" />
              <span className="font-editorial text-[10px] tracking-[0.25em] text-[#C5A059] uppercase block">{t.bukletHeader}</span>
              <h3 className="font-editorial text-lg font-black text-[#F8F5EE] uppercase tracking-wider">ERTEGI ENGLISH DIPLOMA</h3>
            </div>

            <div className="relative w-28 h-28 mx-auto my-3 rounded-full border-4 border-[#C5A059] p-1 bg-gradient-to-b from-[#1C1C24] to-[#0A0A0E] shadow-[0_0_25px_rgba(197,160,89,0.3)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#14141C] flex items-center justify-center border border-[#C5A059]/50 overflow-hidden">
                <span className="font-editorial text-3xl font-black text-[#C5A059]">II</span>
              </div>
              <span className="absolute -bottom-2 bg-[#C5A059] text-[#0E0E14] font-editorial font-extrabold text-[8px] px-2 py-0.5 uppercase tracking-widest">
                PASSPORT
              </span>
            </div>

            <div className="space-y-2 bg-[#14141C] p-3.5 border border-[#C5A059]/30 text-left text-xs font-body text-[#F8F5EE]">
              <div className="flex justify-between border-b border-[#C5A059]/20 pb-1.5">
                <span className="text-[#F8F5EE]/60">Learner:</span>
                <span className="font-bold text-[#C5A059]">{userName}</span>
              </div>
              <div className="flex justify-between border-b border-[#C5A059]/20 pb-1.5">
                <span className="text-[#F8F5EE]/60">Active Streak:</span>
                <span className="font-bold text-amber-400">🔥 {streakDays} Days</span>
              </div>
              <div className="flex justify-between border-b border-[#C5A059]/20 pb-1.5">
                <span className="text-[#F8F5EE]/60">Total XP:</span>
                <span className="font-bold text-[#C5A059]">{xp} XP</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={async () => {
                  // Real share: the browser's native share sheet (WhatsApp,
                  // Telegram, Messages, copy link, etc.) when available,
                  // falling back to a clipboard copy everywhere else — no
                  // more fake alert(), this actually leaves the app.
                  const shareText = `🏆 ${userName} is learning English through Kazakh folklore on Ertegi English!\n${xp} XP • ${streakDays}-day streak • ${unlockedAchievements.length}/${ACHIEVEMENTS.length} badges unlocked`;
                  const shareUrl = window.location.href;
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: "Ertegi English — My Progress", text: shareText, url: shareUrl });
                    } else {
                      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                      alert("Copied to clipboard — paste it anywhere to share!");
                    }
                  } catch (err) {
                    // AbortError fires when the user just closes the native
                    // share sheet without picking anything — not a real error.
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-black text-[10px] tracking-widest uppercase gold-glow flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> {t.downloadBuklet}
              </button>
              <button
                onClick={() => setShowBuklet(false)}
                className="px-4 py-3 bg-[#14141C] border border-[#C5A059]/40 text-[#F8F5EE] font-editorial font-bold text-[10px] uppercase"
              >
                {t.closeBuklet}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   MAIN APP WRAPPER
   ========================================================================== */
export default function KazakhTalesApp({ session }: any) {
  const userId: string = session.user.id;
  const userEmail: string = session.user.email || "";
  const [displayName, setDisplayName] = useState<string>(
    session.user.user_metadata?.display_name || userEmail.split("@")[0] || "Learner"
  );
  // Gates the first render of app content until the person's saved progress
  // has actually come back from Supabase — otherwise we'd briefly flash the
  // default xp/words and then jarringly overwrite them a moment later.
  const [dataLoaded, setDataLoaded] = useState(false);

  const [stage, setStage] = useSafeState("main");
  const [tab, setTab] = useState("home");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [xp, setXp] = useSafeState(0);
  const [lang, setLang] = useSafeState("kk");
  // Real day-streak: streakDays is the count, lastActiveDateRef tracks the
  // last calendar date (YYYY-MM-DD) the person did something XP-worthy.
  // Both are persisted to profiles.streak_days / profiles.last_active_date
  // and only ever recomputed via checkAndUpdateStreak() below.
  const [streakDays, setStreakDays] = useState(0);
  const lastActiveDateRef = useRef<string | null>(null);
  // Personal vocabulary bank: words tapped while reading, with a simple
  // mastery counter (0-5) that drives spaced-repetition ordering and
  // confidence-based review in FlashcardsScreen.
  const [savedWords, setSavedWords] = useSafeState([]);
  const [wordsMode, setWordsMode] = useState("cards"); // "cards" | "match"

  // Session-scoped XP toward today's goal — drives the goal-gradient ring
  // on the home screen. Resets naturally each time the app reloads, which is
  // fine here since we intentionally don't persist state across sessions.
  const [sessionXp, setSessionXp] = useState(0);
  const DAILY_GOAL = 50;

  // Floating "+XP" toast state, keyed so each pop restarts the animation.
  const [xpToast, setXpToast] = useState<{ amount: number; key: number } | null>(null);
  const xpToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rank-up (level-up) celebration, fired when total XP crosses a 100-point
  // threshold. prevXpRef tracks the last known xp so we can detect the
  // crossing inside an effect without re-triggering on every render.
  const prevXpRef = useRef(xp);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpRank, setLevelUpRank] = useState(0);

  // Achievement/badge tracking. Quiz completions come in via onQuizFinish
  // (called from QuizScreen); everything else is derived from state the app
  // already has (xp, savedWords.length). unlockedAchievements persists which
  // badges have already fired so a stat staying above its threshold doesn't
  // re-trigger the celebration banner on every render.
  const [quizzesCompleted, setQuizzesCompleted] = useState(0);
  const [perfectQuizzes, setPerfectQuizzes] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [achievementQueue, setAchievementQueue] = useState<
    { id: string; icon: string; title: string; desc: string; check: (s: any) => boolean }[]
  >([]);

  const t = DICT[lang as keyof typeof DICT];

  // Load this person's saved progress from Supabase once on mount: their
  // profile row (xp, quiz stats), their saved vocabulary, and their
  // unlocked badges. If the profile row isn't there yet (the sign-up
  // trigger runs async), fall back to sane defaults rather than blocking.
  useEffect(() => {
    let cancelled = false;

    const loadUserData = async () => {
      const [profileRes, wordsRes, achievementsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("saved_words").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
      ]);

      if (cancelled) return;

      if (profileRes.data) {
        setXp(profileRes.data.xp ?? 0);
        setQuizzesCompleted(profileRes.data.quizzes_completed ?? 0);
        setPerfectQuizzes(profileRes.data.perfect_quizzes ?? 0);
        setStreakDays(profileRes.data.streak_days ?? 0);
        lastActiveDateRef.current = profileRes.data.last_active_date ?? null;
        if (profileRes.data.display_name) setDisplayName(profileRes.data.display_name);
      }
      if (wordsRes.data) {
        setSavedWords(
          wordsRes.data.map((row: any) => ({ word: row.word, translation: row.translation, mastery: row.mastery }))
        );
      }
      if (achievementsRes.data) {
        setUnlockedAchievements(achievementsRes.data.map((row: any) => row.achievement_id));
      }
      setDataLoaded(true);
    };

    loadUserData().catch(() => setDataLoaded(true)); // don't hard-block the app on a network hiccup

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  // Real day-streak logic. Called every time the person does something
  // XP-worthy (reading, a quiz, flashcards, saving a word, speaking) — not
  // just on app open — so opening the app alone never counts, only actual
  // engagement does. Same-day calls are free (no-op after the first).
  //
  // - today already logged → do nothing
  // - last active was exactly yesterday → streak continues, +1
  // - last active was any earlier day, or never → streak resets to 1
  //   (this is what makes a 24h+ gap with no activity break the streak)
  const checkAndUpdateStreak = () => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
    if (lastActiveDateRef.current === today) return;

    let nextStreak = 1;
    if (lastActiveDateRef.current) {
      const prevDate = new Date(lastActiveDateRef.current + "T00:00:00Z");
      const todayDate = new Date(today + "T00:00:00Z");
      const diffDays = Math.round((todayDate.getTime() - prevDate.getTime()) / 86400000);
      if (diffDays === 1) nextStreak = streakDays + 1;
      // diffDays > 1 (or negative/odd clock skew) → streak resets to 1
    }

    lastActiveDateRef.current = today;
    setStreakDays(nextStreak);
    supabase
      .from("profiles")
      .update({ streak_days: nextStreak, last_active_date: today })
      .eq("id", userId)
      .then(() => {});
  };

  const addXp = (amount: number) => {
    if (!amount) return;
    setXp((prev: number) => {
      const next = prev + amount;
      // Fire-and-forget: keeps XP updates snappy in the UI; a failed write
      // here just means next session re-syncs from whatever's on the server.
      supabase.from("profiles").update({ xp: next }).eq("id", userId).then(() => {});
      return next;
    });
    setSessionXp((prev: number) => prev + amount);
    checkAndUpdateStreak();

    setXpToast({ amount, key: Date.now() + Math.random() });
    if (xpToastTimer.current) clearTimeout(xpToastTimer.current);
    xpToastTimer.current = setTimeout(() => setXpToast(null), 1300);
  };

  const handleQuizFinish = (correctCount: number, total: number) => {
    setQuizzesCompleted((c: number) => {
      const next = c + 1;
      supabase.from("profiles").update({ quizzes_completed: next }).eq("id", userId).then(() => {});
      return next;
    });
    if (correctCount === total) {
      setPerfectQuizzes((c: number) => {
        const next = c + 1;
        supabase.from("profiles").update({ perfect_quizzes: next }).eq("id", userId).then(() => {});
        return next;
      });
    }
  };

  // Detect rank-up threshold crossings whenever xp changes.
  useEffect(() => {
    const prevRank = Math.floor(prevXpRef.current / 100);
    const newRank = Math.floor(xp / 100);
    if (newRank > prevRank) {
      setLevelUpRank(newRank);
      setShowLevelUp(true);
    }
    prevXpRef.current = xp;
  }, [xp]);

  // Re-check every achievement whenever a stat it depends on changes, and
  // queue up any newly-crossed ones for the banner. Checking the full list
  // each time (instead of wiring a bespoke effect per badge) keeps adding
  // future achievements a one-line change to the ACHIEVEMENTS array above.
  useEffect(() => {
    const stats = { xp, savedWordsCount: savedWords.length, quizzesCompleted, perfectQuizzes };
    const newlyUnlocked = ACHIEVEMENTS.filter(
      (a) => !unlockedAchievements.includes(a.id) && a.check(stats)
    );
    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements((prev) => [...prev, ...newlyUnlocked.map((a) => a.id)]);
      setAchievementQueue((prev) => [...prev, ...newlyUnlocked]);
      // Persist each newly-crossed badge. Duplicate-safe: the table has a
      // unique (user_id, achievement_id) constraint, so a re-fired effect
      // (e.g. React strict-mode double-invoke) just no-ops on conflict.
      newlyUnlocked.forEach((a) => {
        supabase
          .from("user_achievements")
          .upsert({ user_id: userId, achievement_id: a.id }, { onConflict: "user_id,achievement_id" })
          .then(() => {});
      });
    }
  }, [xp, savedWords.length, quizzesCompleted, perfectQuizzes]);

  // Clean up the XP toast timer on unmount to avoid a dangling setState call.
  useEffect(() => {
    return () => {
      if (xpToastTimer.current) clearTimeout(xpToastTimer.current);
    };
  }, []);

  const handleSaveWord = (word: string, translation: string) => {
    setSavedWords((prev: any[]) => {
      if (prev.some((w: any) => w.word === word)) return prev;
      addXp(5); // small reward for building vocabulary, reinforces the habit
      supabase
        .from("saved_words")
        .upsert({ user_id: userId, word, translation, mastery: 0 }, { onConflict: "user_id,word" })
        .then(() => {});
      return [...prev, { word, translation, mastery: 0 }];
    });
  };

  // Confidence-based mastery update (SM-2-lite). Rating is one of
  // "again" | "hard" | "good" | "easy" from the flashcard review buttons.
  const handleUpdateWordMastery = (word: string, rating: string) => {
    setSavedWords((prev: any[]) =>
      prev.map((w: any) => {
        if (w.word !== word) return w;
        const current = w.mastery || 0;
        let next = current;
        if (rating === "again") next = 0;
        else if (rating === "hard") next = Math.max(current - 1, 0);
        else if (rating === "good") next = Math.min(current + 1, 5);
        else if (rating === "easy") next = Math.min(current + 2, 5);
        supabase.from("saved_words").update({ mastery: next }).eq("user_id", userId).eq("word", word).then(() => {});
        return { ...w, mastery: next };
      })
    );
    if (rating === "good") addXp(3);
    if (rating === "easy") addXp(5);
  };

  // Profile tab intentionally has NO video — static gradient background only.
  const isProfileTab = tab === "profile";
  const currentVideoBg = BG_VIDEO_ASSETS[tab as keyof typeof BG_VIDEO_ASSETS] || BG_VIDEO_ASSETS.home;

  if (!dataLoaded) {
    return <div className="min-h-screen w-full bg-[#09090D]" />;
  }

  if (stage === "intro") {
    return <IntroScreen onFinish={() => setStage("main")} t={t} />;
  }

  return (
    <div className="relative min-h-screen bg-[#09090D] font-body flex items-center justify-center sm:py-6 sm:px-3 text-[#F8F5EE] overflow-hidden">
      <FontLoader />

      <LevelUpModal show={showLevelUp} rank={levelUpRank} onClose={() => setShowLevelUp(false)} />
      <AchievementBanner
        achievement={achievementQueue[0] || null}
        onDone={() => setAchievementQueue((prev) => prev.slice(1))}
      />

      {!isProfileTab && (
        <BackgroundVideo src={currentVideoBg} opacity={50} videoKey={tab} />
      )}
      {isProfileTab && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#14100C] to-[#09090D]" style={{ zIndex: 0 }} />
      )}

      <div className="relative z-10 w-full h-full sm:h-auto sm:max-w-[420px] bg-[#09090D]/75 backdrop-blur-xl shadow-2xl border border-[#C5A059]/30 overflow-hidden flex flex-col min-h-screen sm:min-h-[780px]">
        
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#C5A059]/20 bg-[#09090D]/85 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <KazakhOrnament className="w-5 h-5 text-[#C5A059]" />
            <span className="font-editorial text-sm font-extrabold tracking-[0.2em] text-[#F8F5EE] uppercase">Ertegi English</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setLang(lang === "kk" ? "en" : "kk")}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-[#C5A059]/30 bg-[#14141C] text-[9px] font-editorial font-bold tracking-wider hover:border-[#C5A059] transition-all"
            >
              <Globe size={11} className="text-[#C5A059]" />
              <span className={lang === "kk" ? "text-[#C5A059]" : "text-[#F8F5EE]/40"}>QAZ</span>
              <span className="text-[#F8F5EE]/20">|</span>
              <span className={lang === "en" ? "text-[#C5A059]" : "text-[#F8F5EE]/40"}>ENG</span>
            </button>

            <span className="relative px-2.5 py-0.5 gold-badge text-[9px] gold-glow">
              {xp} XP
              <XpToast toast={xpToast} />
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-4">
          {tab === "home" && <HomeScreen onStartRead={() => setTab("read")} t={t} sessionXp={sessionXp} dailyGoal={DAILY_GOAL} />}
          {tab === "read" && (
            <ReaderScreen 
              selectedLevel={selectedLevel} 
              setSelectedLevel={setSelectedLevel} 
              onQuizGate={() => setTab("quiz")} 
              t={t} 
              onReward={addXp}
              savedWords={savedWords}
              onSaveWord={handleSaveWord}
            />
          )}
          {tab === "quiz" && (
            <QuizScreen onReward={addXp} t={t} selectedLevel={selectedLevel} onQuizFinish={handleQuizFinish} />
          )}
          {tab === "words" && (
            <div className="animate-pop-in">
              <div className="px-5 pt-1 pb-3">
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#14141C] rounded-full border border-white/[0.06]">
                  <button
                    onClick={() => setWordsMode("cards")}
                    className={`py-2 text-[9px] font-editorial font-bold uppercase tracking-wider rounded-full transition-all ${
                      wordsMode === "cards" ? "bg-[#C5A059] text-[#09090D]" : "text-[#F8F5EE]/50"
                    }`}
                  >
                    Flashcards
                  </button>
                  <button
                    onClick={() => setWordsMode("match")}
                    className={`py-2 text-[9px] font-editorial font-bold uppercase tracking-wider rounded-full transition-all ${
                      wordsMode === "match" ? "bg-[#C5A059] text-[#09090D]" : "text-[#F8F5EE]/50"
                    }`}
                  >
                    Matching Game
                  </button>
                </div>
              </div>
              {wordsMode === "cards" ? (
                <FlashcardsScreen savedWords={savedWords} onUpdateWord={handleUpdateWordMastery} t={t} />
              ) : (
                <MatchingGame savedWords={savedWords} onReward={addXp} t={t} />
              )}
            </div>
          )}
          {tab === "speak" && <SpeakScreen onReward={addXp} t={t} />}
          {tab === "profile" && (
            <ProfileScreen
              xp={xp}
              t={t}
              savedWordsCount={savedWords.length}
              unlockedAchievements={unlockedAchievements}
              userName={displayName}
              onSignOut={handleSignOut}
              streakDays={streakDays}
            />
          )}
        </div>

        <div className="px-3 pb-3 pt-1.5 border-t border-white/[0.06] bg-[#09090D]/90 backdrop-blur-2xl">
          <div className="grid grid-cols-6 gap-1">
            {[
              { id: "home", label: t.navHome, icon: HomeIcon },
              { id: "read", label: t.navRead, icon: BookOpen },
              { id: "quiz", label: t.navQuiz, icon: Trophy },
              { id: "words", label: "WORDS", icon: Layers },
              { id: "speak", label: t.navSpeak, icon: Mic },
              { id: "profile", label: t.navProfile, icon: User },
            ].map((tItem) => {
              const active = tab === tItem.id;
              return (
                <button
                  key={tItem.id}
                  onClick={() => setTab(tItem.id)}
                  className="relative flex flex-col items-center justify-center gap-1 py-2"
                >
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-300 ${
                      active ? "bg-[#C5A059] text-[#09090D] shadow-[0_4px_14px_-2px_rgba(197,160,89,0.55)]" : "text-[#F8F5EE]/45"
                    }`}
                  >
                    <tItem.icon size={15} />
                    {tItem.id === "words" && savedWords.length > 0 && (
                      <span className="absolute -top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#B2533E] text-[7px] text-[#F8F5EE] flex items-center justify-center font-bold ring-2 ring-[#09090D]">
                        {savedWords.length}
                      </span>
                    )}
                  </span>
                  <span className={`font-editorial text-[7px] tracking-[0.1em] uppercase transition-colors ${active ? "text-[#C5A059] font-bold" : "text-[#F8F5EE]/35"}`}>
                    {tItem.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   OPTIONAL: localStorage version for your OWN Vite project (outside Claude).
   If you want progress/xp/lang to survive a page refresh in your real app,
   replace useSafeState above with this hook instead. Do NOT use this inside
   Claude Artifacts — only in your local VS Code / deployed Vite app.

   const usePersistedState = (key, initialValue) => {
     const [state, setState] = useState(() => {
       try {
         const item = window.localStorage.getItem(key);
         return item ? JSON.parse(item) : initialValue;
       } catch {
         return initialValue;
       }
     });
     useEffect(() => {
       try {
         window.localStorage.setItem(key, JSON.stringify(state));
       } catch {}
     }, [key, state]);
     return [state, setState];
   };
---------------------------------------------------------------------------- */
