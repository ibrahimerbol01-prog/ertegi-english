import { useState } from "react";
import { supabase } from "./lib/supabase";

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
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] max-h-[80vh] glass-luxury-card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-editorial text-sm font-extrabold text-[#F8F5EE] uppercase tracking-wide">
            Privacy Policy
          </h3>
          <button onClick={onClose} className="text-[#F8F5EE]/50 hover:text-[#F8F5EE] text-xl leading-none">
            ×
          </button>
        </div>
        <div className="overflow-y-auto font-body text-[11px] text-[#F8F5EE]/70 leading-relaxed whitespace-pre-wrap pr-1">
          {PRIVACY_POLICY_TEXT}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-[#09090D] font-editorial font-bold text-[10px] tracking-widest uppercase rounded-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090D] px-4">
      {showPolicy && <PrivacyPolicyModal onClose={() => setShowPolicy(false)} />}
      <div className="w-full max-w-[380px] glass-luxury-card p-6 space-y-5">
        <div className="text-center space-y-1">
          <span className="font-editorial text-lg tracking-[0.2em] text-[#F8F5EE] uppercase font-extrabold">
            Ertegi English
          </span>
          <p className="font-body text-[11px] text-[#F8F5EE]/50">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {!confirmSent && (
          <>
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 flex items-center justify-center gap-2.5 bg-[#F8F5EE] hover:bg-white text-[#09090D] font-editorial font-bold text-xs rounded-full transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2 1.5-4.7 2.6-7.7 2.6-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.6 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z" />
              </svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#C5A059]/20" />
              <span className="text-[9px] text-[#F8F5EE]/40 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[#C5A059]/20" />
            </div>
          </>
        )}

        {confirmSent ? (
          <div className="text-center space-y-3 py-4">
            <p className="font-body text-xs text-[#F8F5EE]/80 leading-relaxed">
              Check your inbox — we sent a confirmation link to <b>{email}</b>. Confirm it, then come back and sign in.
            </p>
            <button
              onClick={() => {
                setConfirmSent(false);
                setMode("signin");
              }}
              className="text-[11px] font-editorial font-bold text-[#C5A059] uppercase tracking-wider"
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
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 bg-[#14141C] border border-[#C5A059]/20 rounded-[12px] text-xs font-body text-[#F8F5EE] placeholder:text-[#F8F5EE]/30 outline-none focus:border-[#C5A059]/60"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#14141C] border border-[#C5A059]/20 rounded-[12px] text-xs font-body text-[#F8F5EE] placeholder:text-[#F8F5EE]/30 outline-none focus:border-[#C5A059]/60"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#14141C] border border-[#C5A059]/20 rounded-[12px] text-xs font-body text-[#F8F5EE] placeholder:text-[#F8F5EE]/30 outline-none focus:border-[#C5A059]/60"
            />

            {mode === "signup" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 accent-[#C5A059] shrink-0"
                />
                <span className="text-[10px] font-body text-[#F8F5EE]/60 leading-relaxed">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowPolicy(true)}
                    className="text-[#C5A059] font-bold underline underline-offset-2"
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>
            )}

            {error && <p className="text-[10px] font-body text-[#B2533E] leading-relaxed">{error}</p>}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] disabled:opacity-40 text-[#09090D] font-editorial font-extrabold text-xs tracking-[0.18em] uppercase gold-glow rounded-full"
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        )}

        {!confirmSent && (
          <p className="text-center text-[11px] font-body text-[#F8F5EE]/50">
            {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setError(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="text-[#C5A059] font-bold"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
