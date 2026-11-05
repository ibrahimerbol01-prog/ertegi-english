import { lazy, Suspense, useState } from "react";
import { supabase } from "./lib/supabase";
import { Shanyraq, SteppeBackground, KilimStrip } from "./components/Ornaments";
import { loadLang, saveLang, type Lang } from "./lang";
import { RolePicker } from "./components/RolePicker";
import { clearPendingRole, setPendingRole, type Role } from "./utils/role";
import { peekPendingClass } from "./utils/classes";
import { orChunkError } from "./utils/lazyChunk";

// The policy text is its own chunk: it loads when someone opens it.
const PrivacyPolicySheet = lazy(() => orChunkError(import("./components/PrivacyPolicy").then((m) => m.PrivacyPolicySheet)));

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signup");
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [agreed, setAgreed] = useState(false);
  // A class link means a learner; otherwise the person picks.
  const [role, setRole] = useState<Role | null>(() => (peekPendingClass() ? "student" : null));
  const [showPolicy, setShowPolicy] = useState(false);
  const [lang, setLangState] = useState<Lang>(loadLang);
  const kk = lang === "kk";
  const tr = (kkText: string, enText: string) => (kk ? kkText : enText);
  const setLang = (l: Lang) => {
    setLangState(l);
    saveLang(l);
  };

  // Only account creation is gated on consent — signing back in as an
  // existing user never is, since they already agreed once at sign-up.
  const consentRequired = mode === "signup";
  const forgot = mode === "forgot";
  const canSubmit = !consentRequired || agreed;

  const roleMissing = tr("Алдымен таңда: оқушысың ба, мұғалімсің бе?", "First pick: are you a learner or a teacher?");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      setError(null);
      setLoading(true);
      // The same answer whether or not the address has an account: nobody can probe who is registered.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setLoading(false);
      if (resetError) { setError(resetError.message); return; }
      setResetSent(true);
      return;
    }
    if (mode === "signup" && !role) {
      setError(roleMissing);
      return;
    }
    if (!canSubmit) {
      setError(tr("Аккаунт ашу үшін құпиялылық саясатына келісу керек.", "Please agree to the Privacy Policy to create an account."));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // The confirmation link brings the learner back to this site (the study site has its own address).
            emailRedirectTo: window.location.origin,
            data: {
              display_name: displayName || email.split("@")[0],
              agreed_to_privacy_policy: true,
              role,
            },
          },
        });
        if (signUpError) throw signUpError;
        setConfirmSent(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || tr("Бірдеңе дұрыс болмады. Қайта байқап көр.", "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // In sign-in mode there is no checkbox: the note under the button says that continuing means agreeing.
    if (mode === "signup" && !role) {
      setError(roleMissing);
      return;
    }
    if (mode === "signup" && !agreed) {
      setError(tr("Алдымен құпиялылық саясатына келіс: төмендегі белгіні қой.", "Please agree to the Privacy Policy first — check the box below."));
      return;
    }
    setError(null);
    // Google's OAuth flow doesn't let us attach our own consent metadata to
    // the new user record directly, so we leave a short-lived marker here;
    // App.tsx checks for it right after the redirect back and records the
    // consent against the freshly-created profile.
    try {
      localStorage.setItem("ertegi_privacy_consent_pending", "1");
    } catch {
      // localStorage can be unavailable (private browsing etc.) — non-fatal
    }
    // Signing in to an existing account never carries a role from an earlier, abandoned sign-up.
    if (mode === "signup" && role) setPendingRole(role); else clearPendingRole();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center bg-sand px-4 py-10 overflow-hidden">
      <SteppeBackground />
      {showPolicy && <Suspense fallback={null}><PrivacyPolicySheet lang={lang} onClose={() => setShowPolicy(false)} /></Suspense>}
      <div className="relative z-10 w-full max-w-[400px] card overflow-hidden px-6 pt-10 pb-7 space-y-5">
        <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full" />
        <div className="absolute top-4 right-4 segmented w-[104px]" role="group" aria-label={tr("Тіл", "Language")}>
          <button aria-pressed={kk} onClick={() => setLang("kk")}>ҚАЗ</button>
          <button aria-pressed={!kk} onClick={() => setLang("en")}>ENG</button>
        </div>
        <div className="text-center">
          <span className="mx-auto w-16 h-16 rounded-[20px] bg-sky flex items-center justify-center shadow-[0_5px_0_var(--color-sky-deep)]">
            <Shanyraq className="w-11 h-11 text-white" strokeWidth={4} />
          </span>
          <h1 className="large-title mt-5">{forgot ? tr("Құпиясөзді қалпына келтіру", "Reset your password") : mode === "signin" ? tr("Қайта қош келдің", "Welcome back") : tr("Аккаунт аш", "Create your account")}</h1>
          <p className="text-[15px] text-ink-2 mt-1.5">{tr("Ertegi English · қазақ ертегілері арқылы ағылшын тілі", "Ertegi English · Kazakh tales, English fluency")}</p>
        </div>

        {!confirmSent && !forgot && mode === "signup" && (
          <RolePicker value={role} onChange={(r) => { setRole(r); if (error === roleMissing) setError(null); }} kk={kk} />
        )}

        {!confirmSent && !forgot && (
          <>
            <button onClick={handleGoogleSignIn} className="btn btn-ghost w-full normal-case tracking-normal text-ink">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.5-4.7 2.6-7.7 2.6-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.6 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              {tr("Google арқылы кіру", "Continue with Google")}
            </button>
            {mode === "signin" && (
              <p className="-mt-1 text-xs text-ink-2 text-center leading-relaxed">
                {tr("Google арқылы кірсең,", "By continuing with Google you agree to the")}{" "}
                <button type="button" onClick={() => setShowPolicy(true)} className="text-sky-deep font-semibold underline underline-offset-2 py-2 -my-2">
                  {tr("құпиялылық саясатымен", "Privacy Policy")}
                </button>
                {kk && " келісесің"}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-line" />
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">{tr("немесе", "or")}</span>
              <div className="flex-1 h-px bg-line" />
            </div>
          </>
        )}

        {forgot ? (
          resetSent ? (
            <div className="text-center space-y-4 py-2">
              <p className="text-[15px] text-ink-2 leading-relaxed">
                {kk ? (
                  <>Егер <b className="text-ink">{email}</b> мекенжайымен аккаунт болса, құпиясөзді жаңартуға арналған сілтеме жіберілді. Поштаңды («Спам» бумасын да) тексер.</>
                ) : (
                  <>If there is an account for <b className="text-ink">{email}</b>, we sent a link to choose a new password. Check your inbox (and the spam folder).</>
                )}
              </p>
              <button onClick={() => { setResetSent(false); setMode("signin"); }} className="btn btn-ghost w-full">{tr("Кіруге оралу", "Back to sign in")}</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-[15px] text-ink-2 leading-relaxed">{tr("Поштаңды жаз, құпиясөзді жаңартатын сілтеме жібереміз.", "Enter your email and we will send you a link to choose a new password.")}</p>
              <label className="block">
                <span className="text-xs font-semibold text-ink-2 mb-1 block">{tr("Электрондық пошта", "Email")}</span>
                <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error || undefined} aria-describedby={error ? "auth-error" : undefined} className="field" />
              </label>
              {error && <p id="auth-error" role="alert" className="text-sm text-felt-deep bg-felt-soft rounded-xl px-3 py-2.5 leading-relaxed">{error}</p>}
              <button type="submit" disabled={loading} className="btn w-full !mt-5">{loading ? tr("Күте тұр...", "Please wait...") : tr("Сілтеме жіберу", "Send the link")}</button>
              <button type="button" onClick={() => { setError(null); setMode("signin"); }} className="btn btn-ghost w-full">{tr("Кіруге оралу", "Back to sign in")}</button>
            </form>
          )
        ) : confirmSent ? (
          <div className="text-center space-y-4 py-2">
            <p className="text-[15px] text-ink-2 leading-relaxed">
              {kk ? (
                <>Поштаңды тексер: <b className="text-ink">{email}</b> мекенжайына растау сілтемесі жіберілді. Растап, қайта кел де, кір.</>
              ) : (
                <>Check your inbox — we sent a confirmation link to <b className="text-ink">{email}</b>. Confirm it, then come back and sign in.</>
              )}
            </p>
            <button
              onClick={() => {
                setConfirmSent(false);
                setMode("signin");
              }}
              className="btn btn-ghost w-full"
            >
              {tr("Кіруге оралу", "Back to sign in")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <label className="block">
                <span className="text-xs font-semibold text-ink-2 mb-1 block">{tr("Атың", "Your name")}</span>
                <input
                  type="text"
                  autoComplete="given-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="field"
                />
              </label>
            )}
            <label className="block">
              <span className="text-xs font-semibold text-ink-2 mb-1 block">{tr("Электрондық пошта", "Email")}</span>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? "auth-error" : undefined}
                className="field"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-2 mb-1 block">{tr("Құпиясөз", "Password")}</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error || undefined}
                aria-describedby={`auth-pass-hint${error ? " auth-error" : ""}`}
                className="field"
              />
              <span id="auth-pass-hint" className="text-xs text-ink-2 mt-1 block">{tr("Кемінде 6 таңба", "At least 6 characters")}</span>
              {mode === "signin" && (
                <button type="button" onClick={() => { setError(null); setMode("forgot"); }} className="text-sky-deep text-sm font-semibold underline underline-offset-2 mt-1 py-2 -my-1">
                  {tr("Құпиясөзді ұмыттың ба?", "Forgot your password?")}
                </button>
              )}
            </label>

            {mode === "signup" && (
              <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-[var(--color-sky)] shrink-0"
                />
                <span className="text-sm text-ink-2 leading-relaxed">
                  {tr("Мен", "I agree to the")}{" "}
                  <button type="button" onClick={() => setShowPolicy(true)} className="text-sky-deep font-semibold underline underline-offset-2 py-2 -my-2">
                    {tr("құпиялылық саясатымен", "Privacy Policy")}
                  </button>
                  {kk && " келісемін"}
                </span>
              </label>
            )}

            {error && <p id="auth-error" role="alert" className="text-sm text-felt-deep bg-felt-soft rounded-xl px-3 py-2.5 leading-relaxed">{error}</p>}

            {/* Not disabled without consent: pressing it says what is missing. */}
            <button type="submit" disabled={loading} className="btn w-full !mt-5">
              {loading ? tr("Күте тұр...", "Please wait...") : mode === "signin" ? tr("Кіру", "Sign in") : tr("Аккаунт ашу", "Create account")}
            </button>
          </form>
        )}

        {!confirmSent && !forgot && (
          <p className="text-center text-[15px] text-ink-2">
            {mode === "signin" ? tr("Аккаунтың жоқ па?", "No account yet?") : tr("Аккаунтың бар ма?", "Already have an account?")}{" "}
            <button
              onClick={() => {
                setError(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="text-sky-deep font-bold inline-flex items-center min-h-[44px] px-1"
            >
              {mode === "signin" ? tr("Тіркелу", "Sign up") : tr("Кіру", "Sign in")}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
