/* Builds a short fill-in-the-blank quiz from one level's text, so every
   CEFR level gets its own check without hand-written questions. */

type Question = { type: "fillblank"; sentence: string; options: string[]; correct: number };

const STOP = new Set([
  "there", "their", "these", "those", "which", "where", "while", "about", "after", "before",
  "would", "could", "should", "because", "every", "other", "being", "himself", "herself",
]);

// Small seeded PRNG: the same level always gives the same quiz.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function buildLevelQuiz(text: string, count = 4): Question[] {
  const sentences = text.match(/[^.!?]+[.!?]+["”]?/g)?.map((s) => s.trim()) ?? [];
  // Skip names and sentence starters: any word the text ever capitalises.
  const capitalised = new Set((text.match(/\b[A-Z][a-z]+/g) ?? []).map((w) => w.toLowerCase()));
  const isCandidate = (w: string) => w.length >= 4 && /^[a-z]+$/.test(w) && !STOP.has(w) && !capitalised.has(w);
  const pool = [...new Set(text.toLowerCase().match(/[a-z]+/g) ?? [])].filter(isCandidate);
  const rand = rng(text.length);

  const used = new Set<string>();
  const questions: Question[] = [];
  // Spread questions across the story, then fill gaps from the rest.
  const step = Math.max(1, Math.floor(sentences.length / count));
  const order = [...sentences.filter((_, i) => i % step === 0), ...sentences.filter((_, i) => i % step !== 0)];
  for (const sentence of order) {
    if (questions.length >= count) break;
    const words = (sentence.match(/[A-Za-z]+/g) ?? []).filter((w) => isCandidate(w) && !used.has(w));
    if (!words.length) continue;
    const answer = words.reduce((a, b) => (b.length > a.length ? b : a));
    used.add(answer);

    const distractors = pool
      .filter((w) => w !== answer)
      .sort((a, b) => Math.abs(a.length - answer.length) - Math.abs(b.length - answer.length) || rand() - 0.5)
      .slice(0, 6)
      .sort(() => rand() - 0.5)
      .slice(0, 3);
    if (distractors.length < 3) continue;

    const options = [...distractors];
    const correct = Math.floor(rand() * 4);
    options.splice(correct, 0, answer);
    questions.push({ type: "fillblank", sentence: sentence.replace(new RegExp(`\\b${answer}\\b`), "___"), options, correct });
  }
  return questions;
}
