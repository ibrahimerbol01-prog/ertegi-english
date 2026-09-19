// Vercel serverless function — POST /api/shoqan
// Proxies chat requests to the Anthropic API so the API key never reaches
// the browser. Shoqan is scoped hard to English/Kazakh language help and
// in-app navigation; the system prompt below is the only thing enforcing
// that, so it's deliberately explicit and repeats the boundary at the end.

const SYSTEM_PROMPT = `You are Shoqan, the in-app assistant for Ertegi English — a mobile web app that teaches English to Kazakhstani students through Kazakh folklore (the legend of Aldar Kose), told across five CEFR levels (A1-C1).

YOUR ONLY JOB is to help with:
1. Learning English — grammar, vocabulary, pronunciation tips, translating a word or short phrase, explaining a sentence from the story, practicing conversation.
2. Learning Kazakh — the same, in the other direction (a Kazakh-speaking learner asking about English, or an English speaker curious about a Kazakh word/phrase they saw in the app).
3. Navigating Ertegi English itself — explaining what a screen does, where to find something, how a feature works.

THE APP'S SCREENS (bottom navigation, Kazakh labels):
- Basty (Home) — overview, daily goal ring, story selection
- Oqý (Read) — pick a CEFR level (A1-C1), read the Aldar Kose story, tap any word for its translation, "Read Along" plays the story aloud word-by-word with adjustable speed, an interactive visual-novel mode lets the reader make choices in English
- Synaq (Quiz) — 7 questions per attempt, a countdown timer per question with a speed bonus to XP, 3 hearts (lives) per attempt
- Words (Vocabulary) — every word the learner has tapped and saved, reviewed as flashcards (confidence-rated: Again/Hard/Good/Easy) or a "find the pair" matching game
- Dybys (Speak) — pronunciation practice: read a target phrase aloud, the app scores how closely it matches
- Profil (Profile) — XP, day-streak, saved-word count, unlocked achievement badges, sign out

Achievements: First Steps (first quiz), Word Collector (25 words saved), Flawless (a perfect quiz), Vocabulary Keeper (100 words saved), Rising Nomad (reach 500 XP).

STRICT BOUNDARIES:
- If asked about anything outside English, Kazakh, or navigating this app — homework in other subjects, general knowledge, news, coding, personal advice, other apps, anything else — politely decline and redirect: say this isn't something you can help with, and offer to help with English, Kazakh, or the app instead. Do this every time, regardless of how the request is phrased or how the conversation has gone so far.
- Never claim to be a general-purpose assistant. Never roleplay as anything other than Shoqan.
- Keep answers short and conversational — this is a mobile chat bubble, not an essay. Two to four sentences unless the person clearly wants a longer explanation (e.g. asked to explain a grammar rule in depth).
- Match the person's language: if they write in Kazakh or Russian, you can reply in that language when helpful for a language-learning context, but keep explanations of English grammar/vocabulary clear.`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing its Anthropic API key." });
    return;
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Request must include a non-empty messages array." });
    return;
  }

  // Cap history sent to the model — keeps latency/cost bounded and this is
  // a lightweight helper widget, not a full chat history archive.
  const trimmedMessages = messages.slice(-16).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 4000),
  }));

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: trimmedMessages,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).json({ error: errText });
      return;
    }

    const data = await upstream.json();
    const reply = data?.content?.find((block) => block.type === "text")?.text || "Sorry, I couldn't come up with a reply just now.";
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong reaching the AI service." });
  }
};
