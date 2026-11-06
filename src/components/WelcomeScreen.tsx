import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "./UIHelpers";
import { Shanyraq, Tumar, SteppeBackground, KilimStrip, QoshqarMuyiz } from "./Ornaments";
import { DICT } from "../dict";
import { loadLang, saveLang, type Lang } from "../lang";

/* The first screen of the ORDINARY site (docs/product/landing-audit.md, variant A).
   The research site keeps IntroScreen.tsx unchanged (App.tsx chooses by RESEARCH_MODE).
   Changes from IntroScreen: language switch, the main button fits a 360×640 screen,
   a second button for people who already have an account (it opens sign-in, not
   sign-up), and one honest line about what comes next. No new animation. */
export function WelcomeScreen({ onStart }: { onStart: (mode: "signup" | "signin") => void }) {
  const [lang, setLangState] = useState<Lang>(loadLang);
  const t = DICT[lang];
  const setLang = (l: Lang) => { setLangState(l); saveLang(l); };

  return (
    <div className="relative min-h-dvh w-full bg-sand flex flex-col overflow-hidden">
      <SteppeBackground />
      <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full z-[1]" />

      <div className="relative z-10 flex flex-col flex-1 px-6 pt-[max(env(safe-area-inset-top),28px)] pb-[max(env(safe-area-inset-bottom),24px)] mx-auto w-full max-w-[440px]">
        <div className="flex justify-between items-center gap-3">
          <BrandMark />
          <div className="segmented w-[104px]" role="group" aria-label={t.wlLanguage}>
            <button aria-pressed={lang === "kk"} onClick={() => setLang("kk")}>ҚАЗ</button>
            <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>ENG</button>
          </div>
        </div>

        <div className="my-auto py-8 [@media(max-height:700px)]:py-4 text-center">
          <div className="relative mx-auto w-[220px] h-[220px] mb-9 [@media(max-height:700px)]:w-[140px] [@media(max-height:700px)]:h-[140px] [@media(max-height:700px)]:mb-5">
            <div className="absolute inset-0 rounded-full bg-sun-soft" />
            <div className="absolute inset-[9%] rounded-full bg-sky shadow-[0_8px_0_var(--color-sky-deep)] flex items-center justify-center">
              <Shanyraq className="w-1/2 h-1/2 text-white" strokeWidth={3.2} />
            </div>
            <QoshqarMuyiz className="absolute -left-3 top-[11%] w-[25%] h-[15%] text-felt -rotate-[18deg]" strokeWidth={4.5} />
            <QoshqarMuyiz className="absolute -right-3 bottom-[15%] w-[25%] h-[15%] text-jade rotate-[160deg]" strokeWidth={4.5} />
            <Tumar className="absolute right-3 top-1 w-7 h-7 text-sun-deep" strokeWidth={3} />
          </div>

          <h1 className="font-display font-black text-[40px] [@media(max-height:700px)]:text-[34px] leading-[1.05] tracking-tight text-ink">
            Дала аңыздары<br />
            <span className="text-sky">ағылшын тілінде</span>
          </h1>
          <p className="text-[17px] text-ink-2 max-w-[320px] mx-auto leading-relaxed mt-4 [@media(max-height:700px)]:mt-2">
            {t.homeSubtitle}
          </p>
        </div>

        <button onClick={() => onStart("signup")} className="btn w-full">
          {t.enter} <ArrowRight size={18} strokeWidth={3} />
        </button>
        <button onClick={() => onStart("signin")} className="btn btn-ghost w-full mt-3">
          {t.wlHaveAccount}
        </button>
        <p className="text-sm text-ink-2 text-center mt-3">{t.wlNext}</p>
      </div>
    </div>
  );
}
