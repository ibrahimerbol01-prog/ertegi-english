/* Translations of the wordbank (research/wordbank-translations/). Build time
   only: scripts/wordbank-build.mjs and scripts/wordbank-apply-translations.mjs
   put the result into src/data/wordbank/A1.json. Nothing is translated here.

   Sources, lowest to highest priority (a pair is the headword, case-insensitive, and the part of speech):
   - a1-agreed.csv       headword,pos,kk,ru  two independent machine translations agreed  → tr "agreed"
   - a1-review.csv       the pairs they did not agree on                                    → tr "needs-review", no kk/ru
   - a1-arbitration.csv  id,headword,pos,kk_choice,kk_final,ru_choice,ru_final,source_url
                         (optional) a model chose with a source, neither choice "human"     → tr "ai-reviewed"
   - a1-review.csv       a person filled kk_final and ru_final                               → tr "human"
   So: human > ai-reviewed > agreed. */
import { parseCsv } from "../research/corpus";
import type { TrStatus, WordbankEntry } from "../data/wordbank/types";

export interface TranslationFiles { agreed?: string; review?: string; arbitration?: string }
export interface Translation { kk: string; ru: string; tr: TrStatus }

/** Case and apostrophes do not count: the comparison sheets wrote "a.m./a.m./am/am" and "m" for "'m". */
export const pairKey = (headword: string, pos: string) => `${headword.trim().toLowerCase().replace(/['’]/g, "")}|${pos.trim().toLowerCase()}`;

function table(csv: string, need: string[]): Record<string, string>[] {
  const [header, ...rows] = parseCsv(csv);
  const h = header.map((x) => x.trim());
  for (const c of need) if (!h.includes(c)) throw new Error(`translations: column ${c} missing (have ${h.join(", ")})`);
  return rows.map((r) => Object.fromEntries(h.map((c, i) => [c, (r[i] ?? "").trim()])));
}

export function translationMap(files: TranslationFiles): Map<string, Translation> {
  const map = new Map<string, Translation>();
  if (files.agreed) {
    for (const r of table(files.agreed, ["headword", "pos", "kk", "ru"])) {
      if (r.kk && r.ru) map.set(pairKey(r.headword, r.pos), { kk: r.kk, ru: r.ru, tr: "agreed" });
    }
  }
  const review = files.review ? table(files.review, ["headword", "pos", "kk_final", "ru_final"]) : [];
  for (const r of review) map.set(pairKey(r.headword, r.pos), { kk: "", ru: "", tr: "needs-review" });
  if (files.arbitration) {
    for (const r of table(files.arbitration, ["headword", "pos", "kk_choice", "kk_final", "ru_choice", "ru_final", "source_url"])) {
      const byModel = r.kk_choice.toLowerCase() !== "human" && r.ru_choice.toLowerCase() !== "human";
      if (byModel && r.source_url && r.kk_final && r.ru_final) map.set(pairKey(r.headword, r.pos), { kk: r.kk_final, ru: r.ru_final, tr: "ai-reviewed" });
    }
  }
  for (const r of review) if (r.kk_final && r.ru_final) map.set(pairKey(r.headword, r.pos), { kk: r.kk_final, ru: r.ru_final, tr: "human" });
  return map;
}

/** Puts kk, ru and tr on the entries of one level. A translated pair with no entry is an error. */
export function applyTranslations(entries: readonly WordbankEntry[], map: Map<string, Translation>): WordbankEntry[] {
  const keys = new Set(entries.map((e) => pairKey(e.word, e.pos)));
  const stray = [...map.keys()].filter((k) => !keys.has(k));
  if (stray.length) throw new Error(`translations: no wordbank entry for ${stray.slice(0, 10).join(", ")}${stray.length > 10 ? " …" : ""}`);
  return entries.map((e) => {
    const t = map.get(pairKey(e.word, e.pos));
    return t ? { ...e, kk: t.kk, ru: t.ru, tr: t.tr } : e;
  });
}

/** A translation the app may show and put on a card. */
export const isShown = (tr: TrStatus | undefined) => tr === "agreed" || tr === "ai-reviewed" || tr === "human";
