// Vercel serverless function — GET /api/azure-token
// Issues a short-lived (~10 min) Azure Speech token using the real
// subscription key, which stays server-side only. The frontend gets back
// just the token + region and uses the Azure Speech SDK directly from the
// browser for real-time pronunciation assessment — this is Microsoft's own
// recommended pattern (avoids proxying raw audio through our server).
import { requireAuth } from "./_auth.js";
import { takeQuota } from "./_usage.js";

// Tokens per learner per UTC day. The app keeps a token for 8 minutes, so a
// whole day of reading aloud and pronunciation practice stays far below this;
// the limit only stops someone pulling tokens in a loop.
const DAILY_LIMIT = 300;

export default async function handler(req, res) {
    try {
      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const auth = await requireAuth(req, res);
      if (!auth) return;

      const key = (process.env.AZURE_SPEECH_KEY || "").trim();
      const region = (process.env.AZURE_SPEECH_REGION || "").trim();

      if (!key || !region) {
        console.error("[azure-token] AZURE_SPEECH_KEY or AZURE_SPEECH_REGION is not set");
        res.status(500).json({ error: "Speech is not set up on the server." });
        return;
      }

      const quota = await takeQuota(auth.admin, auth.user.id, "azure", DAILY_LIMIT);
      if (!quota.ok) {
        res.status(quota.status).json({ error: quota.status === 429 ? "Daily limit reached. Try again tomorrow." : "Speech is unavailable right now." });
        return;
      }
  
      // Note: no Content-Length header here — Node's built-in fetch (undici)
      // treats it as a "forbidden" header and throws if you set it manually;
      // it computes the correct value itself for an empty POST body.
      const upstream = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
        },
        signal: AbortSignal.timeout(10000),
      });
  
      if (!upstream.ok) {
        // Azure's answer stays in the logs, never in the browser.
        console.error(`[azure-token] Azure ${upstream.status}:`, (await upstream.text()).slice(0, 500));
        res.status(502).json({ error: "Speech service is unavailable right now." });
        return;
      }
  
      const token = await upstream.text();
      res.status(200).json({ token, region });
    } catch (err) {
      // Whatever went wrong, always answer with valid JSON — never let an
      // uncaught exception fall through to Vercel's generic HTML error page,
      // which breaks the frontend's res.json() call.
      console.error("[azure-token] failed:", err);
      res.status(500).json({ error: "Speech service is unavailable right now." });
    }
  };