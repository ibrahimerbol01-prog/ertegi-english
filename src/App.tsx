import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import AuthScreen from "./AuthScreen";
import KazakhTalesApp, { IntroScreen, FontLoader, DICT } from "./KazakhTalesApp";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Shown once per visit before auth, regardless of sign-in state — this is
  // the marketing/hero landing ("BASTAU"), not part of the authenticated
  // product itself, so it doesn't need to know about sessions at all.
  const [introSeen, setIntroSeen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Google sign-in can't attach our own consent flag to the new user record
  // directly (that's Google/Supabase's metadata, not ours to fill in ahead
  // of time), so AuthScreen leaves a short-lived marker before redirecting.
  // Once a session appears back here, if that marker is present, record the
  // consent against the profile Supabase's own trigger just created.
  useEffect(() => {
    if (!session) return;
    let pending = false;
    try {
      pending = localStorage.getItem("ertegi_privacy_consent_pending") === "1";
    } catch {
      // ignore — localStorage may be unavailable
    }
    if (!pending) return;

    supabase
      .from("profiles")
      .update({ agreed_to_privacy_policy: true, privacy_agreed_at: new Date().toISOString() })
      .eq("id", session.user.id)
      .then(() => {
        try {
          localStorage.removeItem("ertegi_privacy_consent_pending");
        } catch {
          // ignore
        }
      });
  }, [session]);

  if (!introSeen) {
    return (
      <>
        <FontLoader />
        <IntroScreen onFinish={() => setIntroSeen(true)} t={DICT.kk} />
      </>
    );
  }

  if (loading) {
    return <div className="min-h-screen w-full bg-[#09090D]" />;
  }

  if (!session) {
    return (
      <>
        <FontLoader />
        <AuthScreen />
      </>
    );
  }

  return <KazakhTalesApp session={session} />;
}
