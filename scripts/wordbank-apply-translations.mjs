// node scripts/wordbank-apply-translations.mjs: put the translations of every level in
// WORDBANK_TRANSLATION_FILES (src/data/wordbank/config.ts; A1 now, A2 when its files arrive):
// research/wordbank-translations/ (a1-agreed.csv, a1-review.csv, a1-arbitration.csv
// if it exists) into src/data/wordbank/A1.json. Run it after a person fills
// kk_final / ru_final in a1-review.csv, or when a1-arbitration.csv arrives.
// `npm run wordbank` applies them too, so the two never disagree.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";
import { readTranslations } from "./wordbank-translations.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const at = (p) => resolve(root, p);
const load = async (p) => (await runnerImport(at(p), { root, configFile: false, logLevel: "error" })).module;

const { WORDBANK_SOURCES, WORDBANK_TRANSLATION_FILES } = await load("src/data/wordbank/config.ts");
const { buildWordbank } = await load("src/utils/wordbankBuild.ts");
const { STORIES } = await load("src/constants.ts");
const { lemmaAs } = await load("src/research/lemmatize.ts");

const translations = readTranslations(root, WORDBANK_TRANSLATION_FILES);
const csvs = Object.fromEntries(WORDBANK_SOURCES.map((s) => [s.file, readFileSync(at(s.file), "utf8")]));
const { levels, files } = buildWordbank(csvs, STORIES, lemmaAs, WORDBANK_SOURCES, translations);

for (const level of Object.keys(WORDBANK_TRANSLATION_FILES)) {
  // A level whose translation files are not there yet is left exactly as it is.
  if (!Object.keys(translations[level]).length) { console.log(`${level}: no translation files yet, ${level}.json unchanged`); continue; }
  writeFileSync(at(`src/data/wordbank/${level}.json`), files[level]);
  const n = { agreed: 0, "ai-reviewed": 0, human: 0, "needs-review": 0, none: 0 };
  for (const e of levels[level]) n[e.tr ?? "none"]++;
  const used = Object.keys(translations[level]).join(", ") || "none";
  console.log(`${level}: ${levels[level].length} words; agreed ${n.agreed}, ai-reviewed ${n["ai-reviewed"]}, human ${n.human}, needs-review ${n["needs-review"]}, no translation ${n.none} (files: ${used})`);
}
