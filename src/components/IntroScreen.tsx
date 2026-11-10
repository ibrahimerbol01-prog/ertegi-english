import { ArrowRight } from "lucide-react";
import { BrandMark } from "./UIHelpers";
import { Shanyraq, Tumar, SteppeBackground, KilimStrip, QoshqarMuyiz } from "./Ornaments";
import { lazy, Suspense, useState } from "react";
import { DICT } from "../dict";
import { RESEARCH_MODE } from "../research/mode";

const PrivacyPolicySheet = lazy(() => import("./PrivacyPolicy").then((m) => ({ default: m.PrivacyPolicySheet })));
const DICT_EN = DICT.en;
// The sample looks words up in the full glossary: its own chunk, so the landing stays light.
const TapSample = __ERTEGI_RESEARCH__ ? () => null : lazy(() => import("./LandingSample"));

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


/* --- Landing (redesign stage 7, "Шаңырақ 2.0"): night hero with the main action, a live
   "tap a word" sample from the real glossary, three steps, teachers, an honest note, footer.
   Two columns from 1024 px. The research build keeps ClassicIntro: no guest mode there. --- */
function Landing({ onFinish, onTry, t }: { onFinish: () => void; onTry?: () => void; t: (typeof DICT)["kk"] }) {
  const [showPolicy, setShowPolicy] = useState(false);
  const steps = [
    { n: 1, title: t.step1Title, text: t.step1Text },
    { n: 2, title: t.step2Title, text: t.step2Text },
    { n: 3, title: t.step3Title, text: t.step3Text },
  ];
  return (
    <div className="min-h-dvh w-full bg-sand flex flex-col">
      <main className="flex-1">
        <section className="bg-night text-white">
          <div className="mx-auto w-full max-w-[1120px] px-5 md:px-8 pt-[max(env(safe-area-inset-top),20px)] pb-10 lg:pb-14">
            <div className="flex justify-between items-center gap-3">
              <span className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-[12px] bg-ember flex items-center justify-center" aria-hidden="true">
                  <Shanyraq className="w-6 h-6 text-white" strokeWidth={4.5} />
                </span>
                <span className="font-display font-black text-[17px] tracking-[0.02em] leading-none">ERTEGI ENGLISH</span>
              </span>
              <button type="button" onClick={onFinish} className="btn btn-sm btn-night border-2 border-white/30">
                {t.signIn}
              </button>
            </div>
            <div className="mt-10 lg:mt-14 grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[15px] font-bold leading-snug text-sun max-w-[460px]">{t.landingBadge}</p>
                <h1 className="mt-3 font-display font-black text-[40px] md:text-[52px] leading-[1.05] tracking-tight">
                  {t.landingTitle1}<br />
                  <span className="text-ember-soft">{t.landingTitle2}</span>
                </h1>
                <p className="mt-4 text-[17px] leading-relaxed text-white/85 max-w-[460px]">{t.landingSub}</p>
                <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3 [&>button]:whitespace-nowrap">
                  {onTry && (
                    <button type="button" onClick={onTry} className="btn btn-ember min-h-[56px] px-6">
                      {t.tryWithoutSignup} <ArrowRight size={18} strokeWidth={3} aria-hidden="true" />
                    </button>
                  )}
                  <button type="button" onClick={onFinish} className="btn btn-night border-2 border-white/30 min-h-[56px] px-6">
                    {t.haveClassCode}
                  </button>
                </div>
              </div>
              <Suspense fallback={<div className="min-h-[220px] rounded-[24px] bg-card/10" />}>
                <TapSample t={t} />
              </Suspense>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1120px] px-5 md:px-8 py-10 grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="three-steps">
            <h2 id="three-steps" className="font-display font-black text-[26px] text-ink">{t.threeSteps}</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {steps.map((s) => (
                <li key={s.n} className="flex items-center gap-4 bg-card rounded-[22px] p-4 shadow-[var(--elev-1)]">
                  <span className="shrink-0 w-11 h-11 rounded-full bg-ember-soft text-ember-ink flex items-center justify-center font-display font-black text-lg" aria-hidden="true">{s.n}</span>
                  <span>
                    <span className="block font-display font-black text-[17px] text-ink">{s.title}</span>
                    <span className="block text-[15px] text-ink-2">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <div className="flex flex-col gap-6">
            <section aria-labelledby="for-teachers" className="bg-card rounded-[22px] p-5 shadow-[var(--elev-1)]">
              <h2 id="for-teachers" className="font-display font-black text-[22px] text-ink">{t.forTeachers}</h2>
              <p lang="en" className="mt-2 text-[15px] text-ink-2 leading-relaxed">{t.teachersText}</p>
            </section>
            <section aria-labelledby="honest" className="bg-night text-white rounded-[22px] p-5">
              <h2 id="honest" className="font-display font-black text-[22px]">{t.honestTitle}</h2>
              <p className="mt-2 text-[15px] text-white/85 leading-relaxed">{t.honestText}</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-[1120px] px-5 md:px-8 py-4 pb-[max(env(safe-area-inset-bottom),16px)] flex flex-wrap gap-x-6 gap-y-1 items-center">
          <span className="text-[13px] text-ink-2">Ertegi English</span>
          <button type="button" onClick={() => setShowPolicy(true)} className="text-[15px] font-semibold text-sky-ink underline underline-offset-4 min-h-[44px]">
            {t.privacyPolicy}
          </button>
        </div>
      </footer>
      {showPolicy && (
        <Suspense fallback={null}>
          <PrivacyPolicySheet lang={t === DICT_EN ? "en" : "kk"} onClose={() => setShowPolicy(false)} />
        </Suspense>
      )}
    </div>
  );
}

export function IntroScreen(props: { onFinish: () => void; onTry?: () => void; t: (typeof DICT)["kk"] }) {
  return RESEARCH_MODE ? <ClassicIntro onFinish={props.onFinish} t={props.t} /> : <Landing {...props} />;
}
