import { ArrowRight } from "lucide-react";
import { BrandMark } from "./UIHelpers";
import { Shanyraq, Tumar, SteppeBackground, KilimStrip, QoshqarMuyiz } from "./Ornaments";
import type { DICT } from "../dict";
import { RESEARCH_MODE } from "../research/mode";

/* --- 1. INTRO SCREEN --- */
function ClassicIntro({ onFinish, t }: { onFinish: () => void; t: (typeof DICT)["kk"] }) {
  return (
    <main className="relative min-h-dvh w-full bg-sand flex flex-col overflow-hidden">
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
    </main>
  );
}


/* --- Landing, variant B: copy on the left, three steps on the right --- */
function StepsIntro({ onFinish, t }: { onFinish: () => void; t: (typeof DICT)["kk"] }) {
  const steps = [
    { n: 1, title: t.step1Title, text: t.step1Text, dot: "bg-sky text-white" },
    { n: 2, title: t.step2Title, text: t.step2Text, dot: "bg-sun text-ink" },
    { n: 3, title: t.step3Title, text: t.step3Text, dot: "bg-jade text-white" },
  ];
  return (
    <main className="relative min-h-dvh w-full bg-sand flex flex-col overflow-hidden">
      <SteppeBackground />
      <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full z-[1]" />
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-[max(env(safe-area-inset-top),28px)] pb-[max(env(safe-area-inset-bottom),24px)] mx-auto w-full max-w-[1040px]">
        <div className="flex justify-between items-center">
          <BrandMark />
          <button onClick={onFinish} className="text-sm font-semibold text-ink-2 hover:text-ink px-2 min-h-[44px]">
            {t.signIn}
          </button>
        </div>
        <div className="my-auto py-8 grid gap-8 md:grid-cols-2 md:items-center">
          <div className="text-center md:text-left">
            <h1 className="font-display font-black text-[36px] md:text-[48px] leading-[1.08] tracking-tight text-ink">
              Дала аңыздары<br />
              <span className="text-sky">ағылшын тілінде</span>
            </h1>
            <p className="text-[17px] text-ink-2 max-w-[420px] mx-auto md:mx-0 leading-relaxed mt-4">{t.homeSubtitle}</p>
            <button onClick={onFinish} className="btn w-full md:w-auto md:px-10 mt-6">
              {t.enter} <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
          <ol className="flex flex-col gap-3">
            {steps.map((s) => (
              <li key={s.n} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(31,36,48,0.08)]">
                <span className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-display font-black text-lg ${s.dot}`}>{s.n}</span>
                <span>
                  <span className="block font-display font-black text-[17px] text-ink">{s.title}</span>
                  <span className="block text-[15px] text-ink-2">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}

export function IntroScreen(props: { onFinish: () => void; t: (typeof DICT)["kk"] }) {
  return RESEARCH_MODE ? <ClassicIntro {...props} /> : <StepsIntro {...props} />;
}
