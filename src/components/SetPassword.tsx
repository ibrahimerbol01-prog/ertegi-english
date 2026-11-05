import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { Shanyraq, SteppeBackground, KilimStrip } from "./Ornaments";
import type { Lang } from "../lang";

export const MIN_PASSWORD = 6;

/* The page a learner lands on from the "reset password" e-mail: Supabase has
   already signed them in with a recovery session (event PASSWORD_RECOVERY,
   App.tsx); here they choose the new password. Shown before everything else. */
export function SetPasswordScreen({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const kk = lang === "kk";
  const tr = (a: string, b: string) => (kk ? a : b);
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) { setError(tr(`Кемінде ${MIN_PASSWORD} таңба`, `At least ${MIN_PASSWORD} characters`)); return; }
    if (password !== again) { setError(tr("Құпиясөздер сәйкес емес", "The passwords do not match")); return; }
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message || tr("Бірдеңе дұрыс болмады. Қайта байқап көр.", "Something went wrong. Please try again.")); return; }
    setSaved(true);
  };

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center bg-sand px-4 py-10 overflow-hidden">
      <SteppeBackground />
      <div className="relative z-10 w-full max-w-[400px] card overflow-hidden px-6 pt-10 pb-7 space-y-5">
        <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full" />
        <div className="text-center">
          <span className="mx-auto w-16 h-16 rounded-[20px] bg-sky flex items-center justify-center shadow-[0_5px_0_var(--color-sky-deep)]">
            <Shanyraq className="w-11 h-11 text-white" strokeWidth={4} />
          </span>
          <h1 className="large-title mt-5">{saved ? tr("Құпиясөз жаңартылды", "Password updated") : tr("Жаңа құпиясөз", "Choose a new password")}</h1>
        </div>
        {saved ? (
          <button className="btn w-full" onClick={onDone}>{tr("Жалғастыру", "Continue")}</button>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-ink-2 mb-1 block">{tr("Жаңа құпиясөз", "New password")}</span>
              <input type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} className="field" aria-describedby={error ? "pw-error" : undefined} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-2 mb-1 block">{tr("Құпиясөзді қайтала", "Repeat the password")}</span>
              <input type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" value={again}
                onChange={(e) => setAgain(e.target.value)} className="field" />
            </label>
            {error && <p id="pw-error" role="alert" className="text-sm text-felt-deep bg-felt-soft rounded-xl px-3 py-2.5 leading-relaxed">{error}</p>}
            <button type="submit" disabled={loading} className="btn w-full !mt-5">{loading ? tr("Күте тұр...", "Please wait...") : tr("Сақтау", "Save")}</button>
          </form>
        )}
      </div>
    </div>
  );
}
