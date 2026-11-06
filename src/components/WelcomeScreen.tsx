import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "./UIHelpers";
import { SteppeBackground, KilimStrip } from "./Ornaments";
import { StoryCover } from "./StoryCover";
import { PREVIEW_TALE } from "../data/previewTale";
import { DICT } from "../dict";
import { loadLang, saveLang, type Lang } from "../lang";

/* The first screen of the ORDINARY site (docs/product/landing-audit.md, variant B: variant A + a tale preview).
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
          {/* Variant B: a real tale instead of an abstract emblem. Title and levels are
              the app's own (WelcomeScreen.dom.test.tsx checks them against STORIES). */}
          <figure className="mx-auto w-full max-w-[300px] card overflow-hidden mb-7 [@media(max-height:700px)]:mb-4 text-left">
            <StoryCover id={PREVIEW_TALE.id} className="w-full h-[120px] [@media(max-height:700px)]:h-[80px]" wide />
            <figcaption className="px-4 py-3">
              <p lang="en" className="font-display font-extrabold text-[15px] text-ink leading-snug">{PREVIEW_TALE.title}</p>
              <p className="text-sm text-ink-2 mt-0.5">{t.wlLevels}</p>
            </figcaption>
          </figure>

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
