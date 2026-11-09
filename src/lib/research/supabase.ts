/* The research build (VITE_RESEARCH_MODE=1) uses this full createClient() in place of
   ../supabase.ts (alias in vite.config.ts), so the frozen study build stays as it was. */
import { createClient } from "@supabase/supabase-js";

// These are safe to keep in frontend code: the anon/publishable key only
// grants what Row Level Security policies in the database allow (each user
// can only read/write their own rows) — it is not a secret credential.
const SUPABASE_URL = "https://tsialjlxlhwemrkyyvjv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iVZWHDvesP-2_SrzALys8Q_7yIxbWUb";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
