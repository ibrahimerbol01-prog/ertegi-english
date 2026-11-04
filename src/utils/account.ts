/* Account deletion: the parts that do not need React or the Supabase client,
   so they can be tested in node. The modal in components/DeleteAccount.tsx
   wires them to the real client. */

/** Kept after deletion: the interface language is a device setting, not
    personal data, and the "account deleted" screen should stay in it. */
export const KEEP_KEYS = new Set(["ertegi_lang"]);
/** App keys that do not start with "ertegi_". */
const EXTRA_KEYS = new Set(["shoqan_bubble_pos"]);
/** Supabase keeps the session as sb-<project>-auth-token (plus -code-verifier for OAuth). */
const SUPABASE_KEY = /^sb-.+-auth-token(-code-verifier)?$/;

type KeyStore = Pick<Storage, "length" | "key" | "removeItem">;

/** Every key the app wrote on this device: progress caches, drafts, cards,
    class cache, quiz outbox, pending markers, the session token. Guest keys
    ("…_guest…") go too: on this device they belong to the same person. */
export function appStorageKeys(store: KeyStore): string[] {
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (!k || KEEP_KEYS.has(k)) continue;
    if (k.startsWith("ertegi_") || EXTRA_KEYS.has(k) || SUPABASE_KEY.test(k)) keys.push(k);
  }
  return keys;
}

/** Removes the app's keys; returns how many went. Blocked storage removes nothing and does not throw. */
export function clearAppStorage(store?: KeyStore | null): number {
  let s: KeyStore | null | undefined = store;
  try {
    if (s === undefined) s = typeof localStorage === "undefined" ? null : localStorage;
    if (!s) return 0;
    // Collect first: removing while walking by index skips keys.
    const keys = appStorageKeys(s);
    for (const k of keys) s.removeItem(k);
    return keys.length;
  } catch {
    return 0;
  }
}

export type DeleteFailure = "offline" | "unavailable" | "session" | "failed";

/** Shape of a Supabase/PostgREST error (only the fields we read). */
export interface RpcError { message?: string; code?: string; status?: number; details?: string; hint?: string }

/** Turns the rpc error into what the learner is told.
    offline: no network; nothing reached the server.
    unavailable: the migration is not applied (PGRST202 / 404 / 42883) or the
      function lacks rights on the server (42501): ask a teacher or admin.
    session: the sign-in expired; sign in again and retry.
    failed: anything else; retry is safe because the function is all-or-nothing. */
export function classifyDeleteError(err: RpcError | null | undefined, online = true): DeleteFailure {
  if (!online) return "offline";
  const code = err?.code ?? "";
  const status = err?.status ?? 0;
  const text = `${err?.message ?? ""} ${err?.details ?? ""}`;
  if (code === "PGRST202" || code === "42883" || status === 404 || /could not find the function/i.test(text)) return "unavailable";
  if (code === "42501") return "unavailable";
  if (code === "PGRST301" || code === "PGRST303" || status === 401 || /jwt|not_signed_in/i.test(text)) return "session";
  if (status === 0 && /fetch|network|load failed|timed? ?out|abort/i.test(text)) return "offline";
  if (/failed to fetch|networkerror|load failed/i.test(text)) return "offline";
  return "failed";
}

export interface DeleteDeps {
  /** Calls public.delete_my_account(); resolves with the Supabase result shape. */
  rpc: () => PromiseLike<{ error: RpcError | null; status?: number }>;
  /** Ends the session on this device only (the server session went with the user). */
  signOut: () => PromiseLike<unknown>;
  storage?: KeyStore | null;
  online?: () => boolean;
  /** Runs after the server deleted the account, before sign-out, so the app
      can switch to the goodbye screen without flashing the sign-in form. */
  onDeleted?: () => void;
}

export type DeleteResult = { ok: true; removedKeys: number } | { ok: false; reason: DeleteFailure };

/** Deletes on the server first; the device is cleared only after the server
    said yes, so a failed attempt leaves everything as it was. */
export async function deleteAccount(deps: DeleteDeps): Promise<DeleteResult> {
  const online = deps.online ?? (() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  if (!online()) return { ok: false, reason: "offline" };
  let res: { error: RpcError | null; status?: number };
  try {
    res = await deps.rpc();
  } catch (e) {
    // fetch itself threw (no network, CORS, abort).
    return { ok: false, reason: classifyDeleteError({ message: e instanceof Error ? e.message : String(e), status: 0 }, online()) };
  }
  if (res.error) {
    return { ok: false, reason: classifyDeleteError({ ...res.error, status: res.error.status ?? res.status }, online()) };
  }
  const removedKeys = clearAppStorage(deps.storage);
  try { deps.onDeleted?.(); } catch { /* a UI callback must not undo a finished deletion */ }
  try { await deps.signOut(); } catch { /* the user is gone on the server; the local token is already removed */ }
  return { ok: true, removedKeys };
}

/** The word typed to confirm. Accepted in any case, with or without Kazakh
    letters (a Russian keyboard has no Ө or І), and in either interface language. */
const CONFIRM_WORDS = ["ОШИРУ", "DELETE", "УДАЛИТЬ"];
export function isConfirmWord(input: string): boolean {
  const norm = input.trim().toUpperCase()
    .replace(/Ө/g, "О").replace(/І/g, "И")
    .replace(/Ұ|Ү/g, "У").replace(/Ә/g, "А").replace(/Ё/g, "Е");
  return CONFIRM_WORDS.includes(norm);
}

/** Fired on window once the account is gone, so App can show the goodbye
    screen even though the signed-in tree unmounts. */
export const ACCOUNT_DELETED_EVENT = "ertegi:account-deleted";
