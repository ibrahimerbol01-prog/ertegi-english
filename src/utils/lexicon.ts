// Adaptive vocabulary: every word in the tales gets the CEFR level of the
// easiest text it first appears in. The learner's level is read from what
// they have read and mastered, and each day brings new words at that level
// plus a couple from the next one (i+1), so an A2 learner drifts toward B1.
import { STORIES, WORD_TRANSLATIONS } from "../constants";
import type { SavedWord } from "../types";

export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];

export interface LexWord {
  word: string;
  level: Level;
  translation: string;
  example: string;
}

// Grammar words and very short tokens are not worth a daily slot.
const STOP = new Set(
  ("the a an and or but so because if then than that this these those there here is are was were be been being am " +
    "has have had do does did not no yes to of in on at by for from with into onto over under up down out off " +
    "he she it they we you i me him her them us my his its our their your what who whom which when where why how " +
    "can could will would shall should may might must very too also just only all any some each every one two three " +
    "as about again ever never still yet such own same other another more most much many few " +
    "before after while until during through across along behind around soon now later once").split(" ")
);

// Prefer the base form: skip "decides" or "walked" when "decide" or "walk" is in the dictionary.
const BASE_ENDINGS: [RegExp, string][] = [[/ies$/, "y"], [/es$/, ""], [/s$/, ""], [/ed$/, ""], [/ed$/, "e"], [/ing$/, ""], [/ing$/, "e"]];
const hasBase = (word: string) => BASE_ENDINGS.some(([re, rep]) => {
  const base = word.replace(re, rep);
  return re.test(word) && base.length >= 3 && !STOP.has(base) && WORD_TRANSLATIONS[base] !== undefined;
});

const isLexical = (word: string, translation: string) =>
  word.length >= 3 && !STOP.has(word) && !word.includes("'") && !hasBase(word) &&
  !/(аты|есім|артикль|көмекші)/.test(translation);

let bankCache: LexWord[] | null = null;
export function wordBank(): LexWord[] {
  if (bankCache) return bankCache;
  const seen = new Map<string, LexWord>();
  for (const level of LEVELS) {
    for (const story of STORIES) {
      const text = (story.levels as Record<string, string>)[level] || "";
      const sentences = text.match(/[^.!?]+[.!?]+["”]?/g) ?? [text];
      for (const raw of sentences) {
        const sentence = raw.trim();
        for (const token of sentence.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []) {
          if (seen.has(token)) continue;
          const translation = WORD_TRANSLATIONS[token];
          if (!translation || !isLexical(token, translation)) continue;
          seen.set(token, { word: token, level, translation, example: sentence });
        }
      }
    }
  }
  bankCache = [...seen.values()];
  return bankCache;
}

/* Words the learner marked "I know it", kept per user. */
const knownKey = (userId?: string) => `ertegi_known_${userId || "guest"}`;
export function loadKnown(userId?: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(knownKey(userId)) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
export function markKnown(userId: string | undefined, word: string) {
  const all = new Set(loadKnown(userId));
  all.add(word);
  try { localStorage.setItem(knownKey(userId), JSON.stringify([...all])); } catch { /* storage blocked */ }
}

export interface LevelStat { level: Level; pool: number; mastered: number; goal: number; done: boolean }
export interface LearnerProfile {
  level: Level;
  next: Level | null;
  stats: LevelStat[];
  progressToNext: number; // 0..1
  totalKnown: number;
}

// A word counts as mastered once the learner says they know it or has
// reviewed it successfully at least twice.
const MASTERED_AT = 2;

export function analyseLearner(savedWords: SavedWord[], known: string[], progress: Set<string>): LearnerProfile {
  const bank = wordBank();
  const mastered = new Set([...known, ...savedWords.filter((w) => (w.mastery ?? 0) >= MASTERED_AT).map((w) => w.word)]);

  const stats: LevelStat[] = LEVELS.map((level) => {
    const pool = bank.filter((w) => w.level === level);
    const m = pool.filter((w) => mastered.has(w.word)).length;
    const goal = Math.max(1, Math.min(25, Math.ceil(pool.length * 0.6)));
    return { level, pool: pool.length, mastered: m, goal, done: m >= goal };
  });

  // Reading a level text counts as being at that level.
  const readIdx = Math.max(-1, ...LEVELS.map((l, i) => ([...progress].some((p) => p.endsWith(`:${l}`)) ? i : -1)));
  const vocabIdx = stats.findIndex((s) => !s.done);
  const idx = Math.max(readIdx, vocabIdx === -1 ? LEVELS.length - 1 : vocabIdx, 0);
  const level = LEVELS[idx];
  const cur = stats[idx];

  return {
    level,
    next: LEVELS[idx + 1] ?? null,
    stats,
    progressToNext: Math.min(1, cur.mastered / cur.goal),
    totalKnown: mastered.size,
  };
}

// Small seeded shuffle so the day's words stay put across reloads.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
const hash = (str: string) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export const dayIndex = () => Math.floor(Date.now() / 86400000);

/* Five words a day: three at the learner's level, two from the next one. */
export function dailyWords(profile: LearnerProfile, seen: Set<string>, userId: string | undefined, day = dayIndex()): LexWord[] {
  const rand = seeded(hash(`${userId || "guest"}:${day}`));
  const fresh = (level: Level | null) => {
    const pool = wordBank().filter((w) => w.level === level && !seen.has(w.word));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  };
  const here = fresh(profile.level);
  const stretch = fresh(profile.next);
  const picks = [...here.slice(0, 3), ...stretch.slice(0, 2)];
  // Top up from whichever pool still has words.
  for (const w of [...here.slice(3), ...stretch.slice(2), ...LEVELS.flatMap((l) => fresh(l))]) {
    if (picks.length >= 5) break;
    if (!picks.some((p) => p.word === w.word)) picks.push(w);
  }
  return picks;
}
