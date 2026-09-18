import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || email.split("@")[0] } },
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
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) setError(oauthError.message);
    // On success the browser redirects to Google, then back — no further
    // local state change needed here; App.tsx's onAuthStateChange picks up
    // the new session automatically once the redirect completes.
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090D] px-4">
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

            {error && <p className="text-[10px] font-body text-[#B2533E] leading-relaxed">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] to-[#9A7B38] disabled:opacity-50 text-[#09090D] font-editorial font-extrabold text-xs tracking-[0.18em] uppercase gold-glow rounded-full"
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
