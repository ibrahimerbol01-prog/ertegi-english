// CORS for the Capacitor app. The website calls the API from its own origin
// and needs none of this; the iOS and Android apps load the page from a
// local origin and call https://ertegi-english.vercel.app/api/... across origins.
// Only the app origins and the site itself are allowed; anything else gets
// no CORS headers, so a browser on another site can't read the answers.
const ALLOWED = new Set([
  "capacitor://localhost", // iOS
  "https://localhost", // Android (Capacitor default)
  "http://localhost", // Android with androidScheme "http"
  "https://ertegi-english.vercel.app",
  ...(process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
]);

/** Sets CORS headers and answers a preflight. Returns true when the request is done. */
export function cors(req, res, methods) {
  const origin = req.headers.origin;
  if (origin && ALLOWED.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", `${methods}, OPTIONS`);
    res.setHeader("Access-Control-Max-Age", "600");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
