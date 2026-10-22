import { useState } from "react";
import { supabase } from "./lib/supabase";
import { Shanyraq, SteppeBackground, KilimStrip } from "./components/Ornaments";
import { Sheet } from "./components/UIHelpers";

const PRIVACY_POLICY_TEXT = `
Last updated: 2026

WHAT WE COLLECT
- Account info: your email address and, if you sign in with Google, your
  Google account name and email.
- Learning data: words you save, quiz results, XP, streak, and unlocked
  achievements — all tied to your account so your progress is yours alone.

WHY WE COLLECT IT
Solely to run Ertegi English: to let you sign in, keep your vocabulary and
progress saved between visits, and show your own stats back to you. We do
not use your data for advertising, and we do not sell it to anyone.

WHERE IT'S STORED
Your data is stored with Supabase (a managed database provider) under
industry-standard access controls. Only you can read or change your own
saved words, XP, and achievements — enforced at the database level, not
just in the app's interface.

THIRD PARTIES
If you choose "Continue with Google," Google handles the sign-in itself;
we only receive your name and email to create your account. We don't share
your learning data with Google, Meta, or any advertiser.

IF YOU'RE UNDER 18
Ertegi English is built for students. If you're a minor, please use this
app with a parent or teacher's awareness, the same as any other school
software you use.

YOUR RIGHTS
You can delete your saved words at any time inside the app, and you can
request full account deletion by contacting the developer. Signing out
ends your session immediately; your data stays only until you ask for it
to be removed.

CONTACT
Questions about this policy or your data — reach out to the Ertegi English
team through the contact listed on the project's submission page.
`.trim();

function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} label="Privacy Policy">
      <div className="p-6 pt-4 flex flex-col">
        <h3 className="font-display text-xl font-black text-ink mb-3">Privacy Policy</h3>
        <div className="max-h-[55dvh] overflow-y-auto text-sm text-ink-2 leading-relaxed whitespace-pre-wrap pr-1">
          {PRIVACY_POLICY_TEXT}
        </div>
        <button onClick={onClose} className="btn w-full mt-5">Close</button>
      </div>
    </Sheet>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // Only account creation is gated on consent — signing back in as an
  // existing user never is, since they already agreed once at sign-up.
  const consentRequired = mode === "signup";
  const canSubmit = !consentRequired || agreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please agree to the Privacy Policy to create an account.");
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
            data: {
              display_name: displayName || email.split("@")[0],
              agreed_to_privacy_policy: true,
            },
          },
        });
        if (signUpError) throw signUpError;
        setConfirmSent(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!agreed) {
      setError("Please agree to the Privacy Policy first — check the box below.");
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
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center bg-sand px-4 py-10 overflow-hidden">
      <SteppeBackground />
      {showPolicy && <PrivacyPolicyModal onClose={() => setShowPolicy(false)} />}
      <div className="relative z-10 w-full max-w-[400px] card overflow-hidden px-6 pt-10 pb-7 space-y-5">
        <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full" />
        <div className="text-center">
          <span className="mx-auto w-16 h-16 rounded-[20px] bg-sky flex items-center justify-center shadow-[0_5px_0_var(--color-sky-deep)]">
            <Shanyraq className="w-11 h-11 text-white" strokeWidth={4} />
          </span>
          <h1 className="large-title mt-5">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-[15px] text-ink-2 mt-1.5">Ertegi English · Kazakh tales, English fluency</p>
        </div>

        {!confirmSent && (
          <>
            <button onClick={handleGoogleSignIn} className="btn btn-ghost w-full normal-case tracking-normal text-ink">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.5-4.7 2.6-7.7 2.6-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.6 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-line" />
              <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-line" />
            </div>
          </>
        )}

        {confirmSent ? (
          <div className="text-center space-y-4 py-2">
            <p className="text-[15px] text-ink-2 leading-relaxed">
              Check your inbox — we sent a confirmation link to <b className="text-ink">{email}</b>. Confirm it, then come back and sign in.
            </p>
            <button
              onClick={() => {
                setConfirmSent(false);
                setMode("signin");
              }}
              className="btn btn-ghost w-full"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="field"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password (min 6 characters)"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />

            {mode === "signup" && (
              <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-[var(--color-sky)] shrink-0"
                />
                <span className="text-sm text-ink-2 leading-relaxed">
                  I agree to the{" "}
                  <button type="button" onClick={() => setShowPolicy(true)} className="text-sky font-semibold">
                    Privacy Policy
                  </button>
                </span>
              </label>
            )}

            {error && <p className="text-sm text-felt-deep bg-felt-soft rounded-xl px-3 py-2.5 leading-relaxed">{error}</p>}

            <button type="submit" disabled={loading || !canSubmit} className="btn w-full !mt-5">
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}

        {!confirmSent && (
          <p className="text-center text-[15px] text-ink-2">
            {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setError(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="text-sky font-bold"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
