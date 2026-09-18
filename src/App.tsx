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
