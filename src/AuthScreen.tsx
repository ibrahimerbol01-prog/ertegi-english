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
