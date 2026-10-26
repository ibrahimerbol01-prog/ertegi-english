/* Finds the sentence in a tale that answers a quiz question, so a wrong answer
   can point the learner back to the text instead of only saying "wrong". */

type Question = { type?: string; q?: string; sentence?: string; options: string[]; correct: number };

const STOP = new Set([
  "what", "when", "where", "which", "who", "whom", "whose", "why", "how", "does", "did", "the", "and", "that",
  "this", "with", "from", "into", "they", "them", "their", "there", "have", "has", "had", "was", "were", "been",
  "his", "her", "him", "she", "not", "for", "but", "very", "story", "tale", "about", "most", "main", "because",
  "than", "then", "also", "just", "some", "only", "will", "would", "could", "said", "says", "one", "all", "any",
]);
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");
// Accents are folded so "Köse" and "Kose" count as the same name.
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const keywords = (s: string) =>
  [...new Set((fold(s).toLowerCase().match(/[a-z]+/g) ?? []).filter((w) => w.length >= 3 && !STOP.has(w)).map(stem))];

export function findEvidence(question: Question, texts: string[]): string | null {
  const answer = question.options[question.correct];
  // A gap-fill question is its own evidence: the sentence with the gap filled.
  if (question.sentence?.includes("___")) return question.sentence.replace("___", answer);

  // "What did he NOT own?" has no sentence that proves it.
  if (/\bNOT\b/.test(question.q ?? "")) return null;
  const wanted = keywords(`${question.q ?? ""} ${answer}`);
  const answerWords = keywords(answer);
  // Names in the question (Tazsha, the khan's Ayaz) must appear, or the sentence is about someone else.
  const names = keywords(fold(question.q ?? "").match(/\b[A-Z][a-z]+/g)?.filter((w, i) => i > 0 || !/^(What|Why|Who|How|When|Where|Which)$/.test(w)).join(" ") ?? "");
  let best: { text: string; score: number } | null = null;
  for (const text of texts) {
    for (const raw of text.match(/[^.!?]+[.!?]+["”]?/g) ?? []) {
      if (raw.trim().endsWith("?")) continue;
      const have = new Set(keywords(raw));
      // Most of the answer has to be in the sentence, not one shared word like "coat".
      const covered = answerWords.filter((w) => have.has(w)).length;
      if (!covered || covered < answerWords.length / 2) continue;
      if (names.length && !names.some((w) => have.has(w))) continue;
      // Words from the right answer count double: the sentence must support it, not only echo the question.
      const score = wanted.filter((w) => have.has(w)).length + answerWords.filter((w) => have.has(w)).length;
      if (!best || score > best.score) best = { text: raw.trim(), score };
    }
  }
  // Too weak a match would point at the wrong place; better to show nothing.
  return best && best.score >= 3 ? best.text : null;
}
