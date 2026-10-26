import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/* Who the account is for: a learner or a teacher. Kept in the user's auth
   metadata so it follows them to any device; a local copy lets the app open
   even when that save has not reached the server yet. The role only picks
   which screens to show: the database checks class ownership on its own. */
export type Role = "student" | "teacher";
export const isRole = (v: unknown): v is Role => v === "student" || v === "teacher";

const localKey = (userId: string) => `ertegi_role_${userId}`;
const PENDING = "ertegi_role_pending";

export function roleOf(session: Session): Role | null {
  const meta = session.user.user_metadata?.role;
  if (isRole(meta)) return meta;
  try {
    const local = localStorage.getItem(localKey(session.user.id));
    return isRole(local) ? local : null;
  } catch {
    return null;
  }
}

// Before the account existed this browser opened the teacher cabinet: suggest that.
export function guessRole(userId: string): Role | null {
  try {
    return localStorage.getItem(`ertegi_is_teacher_${userId}`) === "1" ? "teacher" : null;
  } catch {
    return null;
  }
}

// Google sign-up leaves the page, so the chosen role waits here until the redirect back.
export function setPendingRole(role: Role) {
  try { localStorage.setItem(PENDING, role); } catch { /* storage blocked: the role screen asks again */ }
}
export function peekPendingRole(): Role | null {
  try {
    const v = localStorage.getItem(PENDING);
    return isRole(v) ? v : null;
  } catch {
    return null;
  }
}
export function takePendingRole(): Role | null {
  try {
    const v = localStorage.getItem(PENDING);
    localStorage.removeItem(PENDING);
    return isRole(v) ? v : null;
  } catch {
    return null;
  }
}

// True when the server has it; false means it is kept on this device only for now.
export async function saveRole(session: Session, role: Role): Promise<boolean> {
  try { localStorage.setItem(localKey(session.user.id), role); } catch { /* storage blocked */ }
  try {
    const { error } = await supabase.auth.updateUser({ data: { role } });
    return !error;
  } catch {
    return false;
  }
}

// Switching an existing role must reach the server, or another device would disagree.
export async function switchRole(session: Session, role: Role): Promise<boolean> {
  const before = roleOf(session);
  const ok = await saveRole(session, role);
  if (!ok && before) {
    try { localStorage.setItem(localKey(session.user.id), before); } catch { /* storage blocked */ }
  }
  return ok;
}
