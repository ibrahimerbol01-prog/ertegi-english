// Kazakh (kk) and Russian (ru) translations of an English word from English Wiktionary,
// per part of speech, from the Translations tables of the entry (wikitext via the MediaWiki API).
// Usage: node wikt.mjs input.csv out.json   (input: id,headword,pos,...)
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const UA = "ertegi-english-translation-check/1.0 (educational project)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function wikitext(page) {
  const url = `https://en.wiktionary.org/w/api.php?action=parse&format=json&prop=wikitext&redirects=1&page=${encodeURIComponent(page)}`;
  let res;
  for (let i = 0; i < 5; i++) {
    res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status !== 429 && res.status < 500) break;
    await sleep(3000 * (i + 1));
  }
  if (!res.ok) return null;
  const j = await res.json();
  return j.parse?.wikitext?.["*"] ?? null;
}

/** English section only; for each POS header (===Noun===, ====Verb====…) the kk/ru terms in its translation tables. */
export function translations(text) {
  const en = (text.split(/^==English==\s*$/m)[1] ?? "").split(/^==[^=].*==\s*$/m)[0];
  const out = {};
  let pos = null;
  for (const line of en.split("\n")) {
    const h = line.match(/^={3,5}\s*([A-Za-z ]+?)\s*={3,5}\s*$/);
    if (h) {
      const name = h[1].toLowerCase();
      if (["noun", "verb", "adjective", "adverb", "preposition", "pronoun", "conjunction", "determiner", "interjection", "numeral", "particle", "proper noun"].includes(name)) pos = name;
      continue;
    }
    if (!pos) continue;
    const lang = line.match(/^\*\s*(Kazakh|Russian)\s*:/);
    if (!lang) continue;
    const code = lang[1] === "Kazakh" ? "kk" : "ru";
    const terms = [...line.matchAll(/\{\{tt?\+?\|(kk|ru)\|([^|}]+)/g)].map((m) => m[2].trim());
    if (!terms.length) continue;
    out[pos] ??= { kk: [], ru: [] };
    for (const t of terms) if (!out[pos][code].includes(t)) out[pos][code].push(t);
  }
  return out;
}

if (process.argv[2]) {
  const [input, outFile] = process.argv.slice(2);
  const rows = readFileSync(input, "utf8").trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
  const done = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
  const words = [...new Set(rows.map((r) => r[1]))];
  for (const w of words) {
    if (done[w]?.page) continue;
    const variants = w.split("/").map((x) => x.trim());
    let found = null, page = null;
    for (const v of variants) {
      const t = await wikitext(v);
      await sleep(700);
      if (t) { found = translations(t); page = v; break; }
    }
    done[w] = { page, tr: found };
    writeFileSync(outFile, JSON.stringify(done, null, 1));
  }
  console.log(`words ${words.length}, pages found ${Object.values(done).filter((d) => d.page).length}`);
}
