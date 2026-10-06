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
  const admin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Unauthorized." });
    return null;
  }
  return { user, admin };
}
