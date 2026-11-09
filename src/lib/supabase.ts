import { AuthClient } from "@supabase/auth-js";
import { PostgrestClient } from "@supabase/postgrest-js";

// These are safe to keep in frontend code: the anon/publishable key only
// grants what Row Level Security policies in the database allow (each user
// can only read/write their own rows) — it is not a secret credential.
const SUPABASE_URL = "https://tsialjlxlhwemrkyyvjv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iVZWHDvesP-2_SrzALys8Q_7yIxbWUb";

/* The app uses only auth, tables and rpc, so it builds the client from
   auth-js and postgrest-js instead of createClient(), which also pulls in
   realtime, phoenix, storage and functions (~20 KB gzip of start-up JS).
   Settings copy createClient()'s defaults, so sessions saved by the old
   client (same storage key) stay valid. The research build keeps the full
   client: vite.config.ts aliases this file to research/supabase.ts there. */
type Storage_ = { getItem(k: string): string | null | Promise<string | null>; setItem(k: string, v: string): void | Promise<void>; removeItem(k: string): void | Promise<void> };

// fetch and storage are only passed by tests; the app uses the browser ones.
export function makeSupabase(url: string, key: string, opts: { fetch?: typeof fetch; storage?: Storage_ } = {}) {
  const fetchImpl: typeof fetch = opts.fetch ?? ((...a) => fetch(...a));
  const base = url.replace(/\/+$/, "");
  const auth = new AuthClient({
    url: `${base}/auth/v1`,
    headers: { Authorization: `Bearer ${key}`, apikey: key },
    storageKey: `sb-${new URL(base).hostname.split(".")[0]}-auth-token`,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "implicit",
    fetch: fetchImpl,
    ...(opts.storage ? { storage: opts.storage } : {}),
  });
  // Same as supabase-js fetchWithAuth: the API key always, the user's token when signed in.
  const authedFetch: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (!headers.has("apikey")) headers.set("apikey", key);
    if (!headers.has("Authorization")) {
      const { data } = await auth.getSession();
      headers.set("Authorization", `Bearer ${data.session?.access_token ?? key}`);
    }
    return fetchImpl(input, { ...init, headers });
  };
  const rest = new PostgrestClient(`${base}/rest/v1`, { fetch: authedFetch });
  return {
    auth,
    from: rest.from.bind(rest) as PostgrestClient["from"],
    rpc: rest.rpc.bind(rest) as PostgrestClient["rpc"],
  };
}

export const supabase = makeSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
