// node scripts/placement-build.mjs: the items of the placement check (Task 12 B),
// src/data/placement.json. Real words: 3 per level A1–C1 from our wordbank
// (CEFR-J / Octanove), nouns, verbs and adjectives only, a word of our tales
// where the level has one, never a target word of the study. Pseudowords: our own,
// marked for a teacher to check. Deterministic: same files, same items.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { EXCLUDED_UNTIL_DELAYED_TEST } = (await runnerImport(resolve(root, "src/data/wordbank/config.ts"), { root, configFile: false, logLevel: "error" })).module;
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const PER_LEVEL = 3;
// Not English words; not the study's pseudowords (placement.test.ts checks both). To check by a teacher.
const PSEUDOWORDS = ["flimber", "drostle", "quandrel", "brintish", "mepsy"];

const items = [];
// A spelling seen at a lower level ("man" is A1 as a noun, C1 as a verb) would be "known" by any beginner.
const seen = new Set();
for (const level of LEVELS) {
  const all = JSON.parse(readFileSync(resolve(root, `src/data/wordbank/${level}.json`), "utf8"));
  const words = all
    .filter((e) => ["noun", "verb", "adjective"].includes(e.pos) && /^[a-z]+$/.test(e.word) && !EXCLUDED_UNTIL_DELAYED_TEST.includes(e.word) && !seen.has(e.word));
  for (const e of all) for (const v of e.word.toLowerCase().split("/")) seen.add(v.trim());
  const fromTales = words.filter((e) => e.example);
  const pool = (fromTales.length >= PER_LEVEL * 4 ? fromTales : words).sort((a, b) => a.word.localeCompare(b.word));
  // Evenly spread over the alphabet, so the pick does not depend on one letter.
  for (let i = 0; i < PER_LEVEL; i++) {
    const e = pool[Math.floor(((i + 0.5) * pool.length) / PER_LEVEL)];
    items.push({ id: `${level}-${i + 1}`, word: e.word, level, pos: e.pos, pseudo: false, from_tale: !!e.example });
  }
}
PSEUDOWORDS.forEach((w, i) => items.push({ id: `P-${i + 1}`, word: w, level: null, pos: null, pseudo: true, from_tale: false }));

// Interleave so levels and pseudowords are mixed, in a fixed order.
const order = [0, 15, 3, 6, 16, 1, 9, 4, 17, 12, 7, 2, 18, 10, 5, 13, 19, 8, 11, 14];
const out = { version: "placement-v1", sample: true, note: "Draft: rule and pseudowords to be checked by a teacher (docs/product/profile-and-placement.md).", items: order.map((i) => items[i]) };
writeFileSync(resolve(root, "src/data/placement.json"), JSON.stringify(out, null, 1) + "\n");
console.log(out.items.map((i) => `${i.id}:${i.word}`).join(" "));
