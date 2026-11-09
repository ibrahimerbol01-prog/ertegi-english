// npm run wordbank: build the wordbank «Сөздік қоры» (src/data/wordbank/A1.json … C2.json)
// from the sources in src/data/wordbank/config.ts and examples from our own tales.
// Run it after a change to a source, the exclusion list or a tale text;
// src/utils/wordbank.test.ts fails until you do.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";
import { readTranslations } from "./wordbank-translations.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const at = (p) => resolve(root, p);
const load = async (p) => (await runnerImport(at(p), { root, configFile: false, logLevel: "error" })).module;

const { WORDBANK_SOURCES, WORDBANK_LEVELS, WORDBANK_TRANSLATION_FILES, posGroup } = await load("src/data/wordbank/config.ts");
const { buildWordbank } = await load("src/utils/wordbankBuild.ts");
const { STORIES } = await load("src/constants.ts");
const { lemmaAs } = await load("src/research/lemmatize.ts");

const csvs = Object.fromEntries(WORDBANK_SOURCES.map((s) => [s.file, readFileSync(at(s.file), "utf8")]));
const { levels, files, excluded } = buildWordbank(csvs, STORIES, lemmaAs, WORDBANK_SOURCES, readTranslations(root, WORDBANK_TRANSLATION_FILES));

for (const l of WORDBANK_LEVELS) writeFileSync(at(`src/data/wordbank/${l}.json`), files[l]);

let total = 0;
for (const l of WORDBANK_LEVELS) {
  const g = { noun: 0, verb: 0, adjective: 0, other: 0 };
  for (const e of levels[l]) g[posGroup(e.pos)]++;
  const ex = levels[l].filter((e) => e.example).length;
  total += levels[l].length;
  console.log(`${l}: ${levels[l].length} words (nouns ${g.noun}, verbs ${g.verb}, adjectives ${g.adjective}, other ${g.other}), with a tale example ${ex}`);
}
console.log(`total ${total}; left out until the delayed test: ${excluded} rows`);
