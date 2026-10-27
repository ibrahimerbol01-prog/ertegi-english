import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import AuthScreen from "./AuthScreen";
import KazakhTalesApp from "./KazakhTalesApp";
import { IntroScreen } from "./components/Screens";
import { DICT } from "./constants";
import { loadLang } from "./lang";
import { capturePendingClass, peekPendingClass } from "./utils/classes";
import { RoleScreen } from "./components/RolePicker";
import { clearPendingRole, guessRole, peekPendingRole, roleOf, saveRole, switchRole, takePendingRole, type Role } from "./utils/role";

// A class link (?class=CODE) is remembered before the intro and sign-in, then offered after.
capturePendingClass();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Shown once per visit before auth, regardless of sign-in state — this is
  // the marketing/hero landing ("BASTAU"), not part of the authenticated
  // product itself, so it doesn't need to know about sessions at all.
  const [introSeen, setIntroSeen] = useState(false);
  // Bumped after a role is saved on this device only, so the app re-reads it.
  const [, setRoleTick] = useState(0);

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

  // A role chosen on the Google sign-up form, or one that only reached this
  // device, is sent to the account once a session is here.
  useEffect(() => {
    if (!session) return;
    const meta = session.user.user_metadata?.role;
    if (meta === "student" || meta === "teacher") { takePendingRole(); return; }
    // A role kept on this device was picked here on purpose: it wins over a pending one.
    const pending = takePendingRole();
    const role = roleOf(session) ?? pending;
    if (role) saveRole(session, role).then(() => setRoleTick((n) => n + 1));
  }, [session]);

  const pickRole = async (role: Role) => {
    if (!session) return;
    await saveRole(session, role);
    setRoleTick((n) => n + 1);
  };
  const changeRole = async (role: Role) => {
    if (!session) return false;
    const ok = await switchRole(session, role);
    setRoleTick((n) => n + 1);
    return ok;
  };

  if (!introSeen) {
    return (
      <IntroScreen onFinish={() => setIntroSeen(true)} t={DICT[loadLang()]} />
    );
  }

  if (loading) {
    return <div className="min-h-dvh w-full bg-sand" />;
  }

  if (!session) {
    return (
      <AuthScreen />
    );
  }

  const role = roleOf(session) ?? peekPendingRole();
  if (!role) {
    return (
      <RoleScreen
        initial={peekPendingClass() ? "student" : guessRole(session.user.id)}
        onPick={pickRole}
        onSignOut={() => { clearPendingRole(); supabase.auth.signOut(); }}
      />
    );
  }

  return <KazakhTalesApp key={role} session={session} role={role} onRoleChange={changeRole} />;
}
