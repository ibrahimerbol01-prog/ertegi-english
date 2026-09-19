// Vercel serverless function — GET /api/azure-token
// Issues a short-lived (~10 min) Azure Speech token using the real
// subscription key, which stays server-side only. The frontend gets back
// just the token + region and uses the Azure Speech SDK directly from the
// browser for real-time pronunciation assessment — this is Microsoft's own
// recommended pattern (avoids proxying raw audio through our server).

export default async function handler(req, res) {
    try {
      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }
  
      const key = process.env.AZURE_SPEECH_KEY;
      const region = process.env.AZURE_SPEECH_REGION;
  
      if (!key || !region) {
        res.status(500).json({ error: "Server is missing its Azure Speech credentials." });
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
      });
  
      if (!upstream.ok) {
        const errText = await upstream.text();
        res.status(upstream.status).json({ error: errText });
        return;
      }
  
      const token = await upstream.text();
      res.status(200).json({ token, region });
    } catch (err) {
      // Whatever went wrong, always answer with valid JSON — never let an
      // uncaught exception fall through to Vercel's generic HTML error page,
      // which breaks the frontend's res.json() call.
      res.status(500).json({ error: String(err && err.message ? err.message : err) });
    }
  };