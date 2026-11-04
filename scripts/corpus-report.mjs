// npm run corpus: profile the 35 tale texts against the CEFR-J and Octanove
// vocabulary lists and write docs/corpus-profile.json, the generated table in
// docs/corpus.md and src/data/corpusMeta.ts. Run it after any change to a tale
// text or to the glossary; src/research/corpus.test.ts fails until you do.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const at = (p) => resolve(root, p);

const { module } = await runnerImport(at("src/research/corpusBuild.ts"), { root, configFile: false, logLevel: "error" });
const { spliceMarkdown } = (await runnerImport(at("src/research/corpus.ts"), { root, configFile: false, logLevel: "error" })).module;

const csvs = ["research/cefr/cefrj-vocabulary-profile-1.5.csv", "research/cefr/octanove-vocabulary-profile-c1c2-1.0.csv"]
  .map((p) => readFileSync(at(p), "utf8"));
const out = module.buildCorpus(csvs);

writeFileSync(at("docs/corpus-profile.json"), out.json);
writeFileSync(at("src/data/corpusMeta.ts"), out.meta);
const doc = readFileSync(at("docs/corpus.md"), "utf8");
writeFileSync(at("docs/corpus.md"), spliceMarkdown(doc, out.table));

for (const s of out.report.summary) {
  console.log(`${s.label}: ${s.texts} texts, ${s.wordsMean} words, coverage at label ${(s.coverageAtLabel * 100).toFixed(1)} %, 95 % below/at/above ${s.adequateBelow}/${s.adequateAt}/${s.adequateAbove}`);
}
