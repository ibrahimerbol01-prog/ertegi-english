// Reads the translation files of each wordbank level (paths in src/data/wordbank/config.ts,
// WORDBANK_TRANSLATION_FILES). A file that is not there yet is skipped: a1-arbitration.csv
// appears only after the arbitration task.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readTranslations(root, files) {
  const out = {};
  for (const [level, kinds] of Object.entries(files)) {
    out[level] = {};
    for (const [kind, p] of Object.entries(kinds)) {
      const at = resolve(root, p);
      if (existsSync(at)) out[level][kind] = readFileSync(at, "utf8");
    }
  }
  return out;
}
