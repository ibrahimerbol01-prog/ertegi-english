// Shared auth helper for Vercel serverless functions.
// Requires SUPABASE_URL + SUPABASE_SERVICE_KEY env vars (set in Vercel dashboard).
import { createClient } from "@supabase/supabase-js";

// Validates Bearer token from Authorization header.
// Returns { user, admin } on success; writes 401 + returns null on failure.
export async function requireAuth(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Missing Authorization header." });
    return null;
  }
  // Trimmed: a key pasted into Vercel with a trailing space or newline fails.
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!url || !key) {
    console.error("[auth] SUPABASE_URL or SUPABASE_SERVICE_KEY is not set");
    res.status(500).json({ error: "Server is missing its Supabase settings." });
    return null;
  }
  const admin = createClient(url, key);
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) {
    console.error("[auth] token rejected:", error?.message);
    res.status(401).json({ error: "Unauthorized." });
    return null;
  }
  return { user, admin };
}
