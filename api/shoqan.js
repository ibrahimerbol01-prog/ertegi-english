// Vercel serverless function — POST /api/shoqan
// Proxies chat requests to Google Gemini (free tier) so the API key never
// reaches the browser. If GEMINI_API_KEY is not set but ANTHROPIC_API_KEY is,
// it falls back to Claude, so switching back needs no code change. Shoqan is scoped hard to English/Kazakh language help and
// in-app navigation; the system prompt below is the only thing enforcing
// that, so it's deliberately explicit and repeats the boundary at the end.
import { requireAuth } from "./_auth.js";
import { takeQuota, refundQuota } from "./_usage.js";
import { cors } from "./_cors.js";

// Requests per learner per UTC day. "chat" is the Shoqan chat window;
// "tool" is feedback inside lessons (thinking trail, debate of the week),
// counted separately so lesson feedback doesn't use up the chat.
const DAILY_LIMIT = { chat: 10, tool: 10 };
const MAX_MESSAGES = 200; // older clients send the whole chat; only the last 16 are used
const MAX_CHARS = 4000;
// Steps of the help ladder for a quiz question (docs §3.8, I2). The client
// copy is SHOQAN_HINT_STEPS in src/research/params.ts; params.test.ts checks
// both stay equal (Vercel functions can't import from src).
export const HINT_STEPS = 3;
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

// Trying several Gemini models can take longer than Vercel's default limit,
// which cuts the function off with a 504.
export const config = { maxDuration: 60 };

const SYSTEM_PROMPT = `You are Shoqan, the in-app assistant for Ertegi English — a mobile web app that teaches English to Kazakhstani students through Kazakh folklore (tales such as Aldar Köse and Zhirenshe Sheshen), each told across five CEFR levels (A1-C1).

YOUR ONLY JOB is to help with:
1. Learning English — grammar, vocabulary, pronunciation tips, translating a word or short phrase, explaining a sentence from the story, practicing conversation.
2. Learning Kazakh — the same, in the other direction (a Kazakh-speaking learner asking about English, or an English speaker curious about a Kazakh word/phrase they saw in the app).
3. Navigating Ertegi English itself — explaining what a screen does, where to find something, how a feature works.

When the learner asks about a quiz question they have not answered yet, do not give the answer: point them to the right part of the tale and give a hint instead.

HELP LADDER for a task, a quiz question or the meaning of something in the text. Help in steps, and give only as much as the step allows:
- Step 1: point to the place in the text ("look at the sentence about..."). Do not name or rule out any option.
- Step 2: a hint: narrow the choice (e.g. which option the text cannot support) or explain the key word. Still do not say which option is right.
- Step 3: explain fully, with the answer and why it is right. Only when the learner has already tried and asks again.
When nobody tells you the step, start at step 1 and go one step up each time the learner asks again about the same thing after trying.

THE APP'S SCREENS (bottom navigation, Kazakh labels):
- Басты (Home) — overview, daily goal ring, story selection
- Оқу (Read) — pick a CEFR level (A1-C1), read the Aldar Köse story, tap any word for its translation, "Read Along" plays the story aloud word-by-word with adjustable speed, an interactive visual-novel mode lets the reader make choices in English
- The home path — each tale is a unit with islands A1-C1 (reading + a short 4-question check per level) and a final story quiz; finishing a tale earns Shoqan's bata (blessing) and a Kazakh ornament (oıu) for the learner's kilim. Home also shows Shoqan's tip of the day and a Kazakh proverb of the day to match with its English equivalent.
- Сынақ (Quiz) — 7 questions per attempt, no timer and no lives. A wrong answer shows the sentence from the tale that holds the answer and gives one more try; after a second miss the right answer is shown. 10 XP for a first-try answer, 5 for a second-try one. Missed questions can be practised again at the end.
- Сөздер (Vocabulary) — every word the learner has tapped and saved, reviewed as flashcards ("I knew it" / "Not yet", in Leitner boxes) or a "find the pair" matching game
- Карталар (Cards) — legend cards of Kazakh heroes, unlocked by listening to a scene and answering a question
- Дыбыс (Speak) — pronunciation practice: read a target phrase aloud, the app scores how closely it matches
- Профиль (Profile) — XP, day-streak, saved-word count, unlocked achievement badges, sign out

Achievements (Kazakh / English names): Алғашқы қадам / First Steps (first quiz), Сөз жинаушы / Word Collector (25 words saved), Мінсіз / Flawless (a perfect quiz), Сөз қазынасы / Vocabulary Keeper (100 words saved), Өрлеген көшпенді / Rising Nomad (reach 500 XP).

STRICT BOUNDARIES:
- If asked about anything outside English, Kazakh, or navigating this app — homework in other subjects, general knowledge, news, coding, personal advice, other apps, anything else — politely decline and redirect: say this isn't something you can help with, and offer to help with English, Kazakh, or the app instead. Do this every time, regardless of how the request is phrased or how the conversation has gone so far.
- Never claim to be a general-purpose assistant. Never roleplay as anything other than Shoqan.
- Keep answers short and conversational — this is a mobile chat bubble, not an essay. Two to four sentences unless the person clearly wants a longer explanation (e.g. asked to explain a grammar rule in depth).
- Explain English through Kazakh. Learners are Kazakh-speaking school students. When you explain a grammar point or a mistake, compare it with how the same idea works in Kazakh: Kazakh has no articles (a/the), puts the verb at the end (subject-object-verb, English is subject-verb-object), uses one pronoun "ол" for he/she/it, and marks plurals and cases with suffixes (-лар/-лер, -да/-де) where English uses separate words. Give a short Kazakh example next to the English one. How much Kazakh to use depends on the learner's level: at A1-A2 explain in Kazakh, at B1 mix the two, at B2-C1 explain mostly in English and compare with Kazakh only where it helps.
- Bring in Kazakh culture and history where it fits naturally: the tales of Aldar Köse and Zhirenshe Sheshen, Kazakh proverbs (maqal) and their English equivalents, the Kazakh Khanate, nomadic life. Keep facts accurate; if unsure, say so rather than invent.
- Whenever you write in Kazakh, use the Cyrillic script, the same script as the app's interface and school textbooks.
- Match the person's language: if they write in Kazakh or Russian, you can reply in that language when helpful for a language-learning context, but keep explanations of English grammar/vocabulary clear.`;

// What the quiz told us about this request, added after the fixed prompt.
export function buildSystemPrompt({ hintStep, level } = {}) {
  const parts = [SYSTEM_PROMPT];
  if (hintStep) {
    const what = {
      1: "Step 1: only point to the place in the tale where the answer is. Do not give, name or rule out any option.",
      2: "Step 2: give a hint: narrow the choice or explain the key word. Do not say which option is right.",
      3: "Step 3: the learner has tried; explain with the right answer and why it is right.",
    };
    parts.push(`THIS REQUEST comes from the quiz, help step ${hintStep} of ${HINT_STEPS}. ${what[hintStep] || what[1]}`);
  }
  if (level) {
    const lang = level === "A1" || level === "A2"
      ? "explain in Kazakh (Cyrillic), with the English words and examples from the tale"
      : level === "B1"
        ? "explain in simple English, adding Kazakh (Cyrillic) for the key word or rule"
        : "explain mostly in English; use Kazakh only for a word the learner may not know";
    parts.push(`The learner works at CEFR level ${level}: ${lang}.`);
  }
  return parts.join("\n\n");
}

const FALLBACK_REPLY = "Sorry, I couldn't come up with a reply just now.";

// Gemini wants roles "user" / "model" and the chat must open with the user.
// Google retires model names from time to time, so try the configured one,
// then the "latest" alias, then older and lighter names. A 404 (retired name)
// or a busy model (429/500/503, common on the free tier) moves on to the next.
const GEMINI_MODELS = [process.env.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash"]
  .filter((m, i, all) => m && all.indexOf(m) === i);

async function geminiOnce(apiKey, model, contents, withThinkingOff, system) {
  const generationConfig = { maxOutputTokens: 800, temperature: 0.7 };
  // Thinking off: a chat bubble needs a quick short answer, and thinking
  // tokens would otherwise eat into the output limit.
  if (withThinkingOff) generationConfig.thinkingConfig = { thinkingBudget: 0 };
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey.trim() },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig }),
      // Without a limit a stalled Google answer keeps the chat spinning forever.
      signal: AbortSignal.timeout(12000),
    },
  );
}

async function askGemini(apiKey, messages, system) {
  const contents = messages
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
    .filter((m, i, all) => all.findIndex((x) => x.role === "user") <= i);
  if (contents.length === 0) return { status: 400, error: "The chat has no learner message yet." };
  let last = { status: 502, error: "The AI service is busy. Try again in a minute." };
  const started = Date.now();
  for (const model of GEMINI_MODELS) {
    // Leave time to answer before Vercel's 60 s limit.
    if (Date.now() - started > 40000) break;
    let upstream;
    try {
      upstream = await geminiOnce(apiKey, model, contents, true, system);
    } catch (err) {
      if (err?.name !== "TimeoutError") throw err;
      console.error(`[shoqan] Gemini ${model} timed out`);
      last = { status: 504, error: "The AI service took too long to answer." };
      continue;
    }
    // A model that doesn't take the thinking setting answers 400, not always
    // naming it ("Request contains an invalid argument."): ask again without it.
    if (upstream.status === 400) {
      const body = await upstream.text();
      console.error(`[shoqan] Gemini ${model} 400:`, body.slice(0, 500));
      try {
        upstream = await geminiOnce(apiKey, model, contents, false, system);
      } catch (err) {
        if (err?.name !== "TimeoutError") throw err;
        last = { status: 504, error: "The AI service took too long to answer." };
        continue;
      }
    }
    if (upstream.ok) {
      const data = await upstream.json();
      const reply = (data?.candidates?.[0]?.content?.parts || [])
        .map((p) => p.text || "")
        .join("")
        .trim();
      return { reply };
    }
    const body = await upstream.text();
    console.error(`[shoqan] Gemini ${model} ${upstream.status}:`, body.slice(0, 500));
    // The raw upstream body stays in the logs, never in the learner's browser.
    last = { status: upstream.status === 429 ? 503 : 502, error: "The AI service is busy. Try again in a minute." };
    if (![400, 404, 429, 500, 503].includes(upstream.status)) break;
  }
  return last;
}

async function askClaude(apiKey, messages, system) {
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
      system,
      messages,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!upstream.ok) {
    console.error(`[shoqan] Claude ${upstream.status}:`, (await upstream.text()).slice(0, 500));
    return { status: 502, error: "The AI service is busy. Try again in a minute." };
  }
  const data = await upstream.json();
  return { reply: data?.content?.find((block) => block.type === "text")?.text };
}

export default async function handler(req, res) {
  if (cors(req, res, "POST")) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  console.log("[shoqan] request received");
  const auth = await requireAuth(req, res);
  if (!auth) return; // requireAuth already wrote the 401
  console.log("[shoqan] signed in, asking", process.env.GEMINI_API_KEY ? "Gemini" : "Claude");

  const { user, admin } = auth;

  // Check the request before counting it, so a broken one costs nothing.
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!geminiKey && !anthropicKey) {
    console.error("[shoqan] neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is set");
    res.status(500).json({ error: "The assistant is not set up on the server." });
    return;
  }

  const { messages, kind: rawKind, hint_step: hintStep, level } = req.body || {};
  const kind = rawKind === "tool" ? "tool" : "chat";
  const valid =
    (hintStep === undefined || (Number.isInteger(hintStep) && hintStep >= 1 && hintStep <= HINT_STEPS)) &&
    (level === undefined || LEVELS.includes(level)) &&
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= MAX_MESSAGES &&
    messages.every((m) => m && typeof m === "object" && typeof m.content === "string") &&
    messages[messages.length - 1].role === "user";
  if (!valid) {
    res.status(400).json({ error: "Request must include a messages array that ends with the learner's message, and a valid hint_step and level if given." });
    return;
  }

  // Cap history sent to the model — keeps latency/cost bounded and this is
  // a lightweight helper widget, not a full chat history archive.
  const trimmedMessages = messages.slice(-16).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content.slice(0, MAX_CHARS),
  }));

  const system = buildSystemPrompt({ hintStep, level });

  const quota = await takeQuota(admin, user.id, kind, DAILY_LIMIT[kind]);
  if (!quota.ok) {
    res.status(quota.status).json({
      error: quota.status === 429 ? "Daily limit reached. Try again tomorrow." : "The assistant is unavailable right now. Try again later.",
    });
    return;
  }

  try {
    const result = geminiKey
      ? await askGemini(geminiKey, trimmedMessages, system)
      : await askClaude(anthropicKey, trimmedMessages, system);
    if (result.error) {
      if (result.status >= 500) await refundQuota(admin, user.id, kind);
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(200).json({ reply: result.reply || FALLBACK_REPLY });
  } catch (err) {
    console.error("[shoqan] request failed:", err);
    await refundQuota(admin, user.id, kind);
    if (err?.name === "TimeoutError") {
      res.status(504).json({ error: "The AI service took too long to answer." });
      return;
    }
    res.status(500).json({ error: "Something went wrong reaching the AI service." });
  }
};