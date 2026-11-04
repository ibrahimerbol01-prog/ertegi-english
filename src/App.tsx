import { lazy, Suspense, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import AuthScreen from "./AuthScreen";
import { IntroScreen } from "./components/IntroScreen";
import { DICT } from "./dict";
import { loadLang } from "./lang";
import { capturePendingClass, peekPendingClass } from "./utils/classes";
import { RoleScreen } from "./components/RolePicker";
import { ACCOUNT_DELETED_EVENT } from "./utils/account";
import { clearPendingRole, guessRole, peekPendingRole, roleOf, saveRole, switchRole, takePendingRole, type Role } from "./utils/role";

// The app itself (tales, dictionary, all screens) is a separate file: the
// intro and sign-in show without it, and it starts loading in the background
// while the learner is still on them.
const loadApp = () => import("./KazakhTalesApp");
const KazakhTalesApp = lazy(loadApp);
const blank = <div className="min-h-dvh w-full bg-sand" />;
// Its chunk is already loaded by the time it shows: the delete window lives in the same file.
const AccountDeletedScreen = lazy(() => import("./components/DeleteAccount").then((m) => ({ default: m.AccountDeletedScreen })));

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
  // Set when the account was just deleted: a goodbye screen instead of the sign-in form.
  const [accountDeleted, setAccountDeleted] = useState(false);

  useEffect(() => {
    const onDeleted = () => setAccountDeleted(true);
    window.addEventListener(ACCOUNT_DELETED_EVENT, onDeleted);
    return () => window.removeEventListener(ACCOUNT_DELETED_EVENT, onDeleted);
  }, []);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => { void loadApp(); });
  }, []);

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
      .select("id")
      .then(({ data, error }) => {
        // Keep the marker until the consent is really on the profile, so the
        // next visit tries again instead of losing it.
        if (error || !data?.length) return;
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

  if (accountDeleted) {
    return (
      <Suspense fallback={blank}>
        <AccountDeletedScreen lang={loadLang()} onDone={() => setAccountDeleted(false)} />
      </Suspense>
    );
  }

  if (loading) return blank;

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

  return (
    <Suspense fallback={blank}>
      <KazakhTalesApp key={role} session={session} role={role} onRoleChange={changeRole} />
    </Suspense>
  );
}
