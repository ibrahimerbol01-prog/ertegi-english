import { ArrowRight } from "lucide-react";
import { BrandMark } from "./UIHelpers";
import { Shanyraq, Tumar, SteppeBackground, KilimStrip, QoshqarMuyiz } from "./Ornaments";
import type { DICT } from "../dict";

/* --- 1. INTRO SCREEN --- */
export function IntroScreen({ onFinish, t }: { onFinish: () => void; t: (typeof DICT)["kk"] }) {
  return (
    <div className="relative min-h-dvh w-full bg-sand flex flex-col overflow-hidden">
      <SteppeBackground />
      <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full z-[1]" />

      <div className="relative z-10 flex flex-col flex-1 px-6 pt-[max(env(safe-area-inset-top),28px)] pb-[max(env(safe-area-inset-bottom),24px)] mx-auto w-full max-w-[440px]">
        <div className="flex justify-between items-center">
          <BrandMark />
          <button onClick={onFinish} className="text-sm font-semibold text-ink-2 hover:text-ink px-2 min-h-[44px]">
            {t.skip}
          </button>
        </div>

        <div className="my-auto py-10 text-center animate-pop-in">
          <div className="relative mx-auto w-[220px] h-[220px] mb-9">
            <div className="absolute inset-0 rounded-full bg-sun-soft" />
            <div className="absolute inset-5 rounded-full bg-sky shadow-[0_8px_0_var(--color-sky-deep)] flex items-center justify-center animate-float">
              <Shanyraq className="w-28 h-28 text-white" strokeWidth={3.2} />
            </div>
            <QoshqarMuyiz className="absolute -left-3 top-6 w-14 h-8 text-felt -rotate-[18deg]" strokeWidth={4.5} />
            <QoshqarMuyiz className="absolute -right-3 bottom-8 w-14 h-8 text-jade rotate-[160deg]" strokeWidth={4.5} />
            <Tumar className="absolute right-3 top-2 w-7 h-7 text-sun-deep" strokeWidth={3} />
          </div>

          <h1 className="font-display font-black text-[40px] leading-[1.05] tracking-tight text-ink">
            Дала аңыздары<br />
            <span className="text-sky">ағылшын тілінде</span>
          </h1>
          <p className="text-[17px] text-ink-2 max-w-[320px] mx-auto leading-relaxed mt-4">
            {t.homeSubtitle}
          </p>
        </div>

        <button onClick={onFinish} className="btn w-full">
          {t.enter} <ArrowRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

