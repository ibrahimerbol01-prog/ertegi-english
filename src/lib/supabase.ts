import { createClient } from "@supabase/supabase-js";

// These are safe to keep in frontend code: the anon/publishable key only
// grants what Row Level Security policies in the database allow (each user
// can only read/write their own rows) — it is not a secret credential.
const SUPABASE_URL = "https://tsialjlxlhwemrkyyvjv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iVZWHDvesP-2_SrzALys8Q_7yIxbWUb";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
