/* Builds every corpus output from the app's own tales and glossary. Shared by
   scripts/corpus-report.mjs (writes the files) and corpus.test.ts (checks
   they are up to date). Research only: the app never imports this. */
import { STORIES, WORD_TRANSLATIONS } from "../constants";
import { CONTENT_HASH, CONTENT_VERSION } from "../data/contentVersion";
import { buildLexicon, buildReport, metaSource, reportJson, reportMarkdown, type StoryInput } from "./corpus";
import { lemmatize } from "./lemmatize";

/** csvs: the vocabulary profiles in research/cefr/. */
export function buildCorpus(csvs: string[]) {
  const report = buildReport(STORIES as StoryInput[], {
    lex: buildLexicon(csvs), lemmatize, glossary: WORD_TRANSLATIONS,
    contentVersion: CONTENT_VERSION, contentHash: CONTENT_HASH,
  });
  return { report, json: reportJson(report), table: reportMarkdown(report), meta: metaSource(report) };
}
