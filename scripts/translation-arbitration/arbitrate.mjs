// Blind arbitration of two translations (v1, v2) against English Wiktionary.
// Per word and language: v1 / v2 / both if the dictionary has that variant for the
// same part of speech; human otherwise (no guessing). Writes a1-arbitration.csv format.
// Usage: node arbitrate.mjs input.csv wikt.json out.csv
import { readFileSync, writeFileSync } from "node:fs";

const [input, wiktFile, outFile, glosbeFile] = process.argv.slice(2);
const wikt = JSON.parse(readFileSync(wiktFile, "utf8"));
const glosbe = glosbeFile ? JSON.parse(readFileSync(glosbeFile, "utf8")) : {};

function parseCsv(csv) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (q) { if (c === '"' && csv[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && csv[i + 1] === "\n") i++; row.push(f); f = ""; if (row.some((x) => x)) rows.push(row); row = []; }
    else f += c;
  }
  row.push(f); if (row.some((x) => x)) rows.push(row);
  return rows;
}
const cell = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

const norm = (s) => s.normalize("NFD").replace(/́/g, "").normalize("NFC").toLowerCase().replace(/ё/g, "е").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
const parts = (s) => s.split(/[;/,]/).map(norm).filter(Boolean);
const POS = { noun: "noun", verb: "verb", adjective: "adjective", adverb: "adverb", preposition: "preposition", pronoun: "pronoun", conjunction: "conjunction", determiner: "determiner", interjection: "interjection", number: "numeral", "modal auxiliary": "verb" };

const [header, ...rows] = parseCsv(readFileSync(input, "utf8"));
const H = Object.fromEntries(header.map((h, i) => [h, i]));
const out = [["id", "headword", "pos", "kk_choice", "kk_final", "ru_choice", "ru_final", "source_url", "comment"]];
const stats = { kk: {}, ru: {} };
for (const r of rows) {
  const get = (k) => (r[H[k]] ?? "").trim();
  const word = get("headword"), pos = get("pos");
  const w = wikt[word];
  const sec = w?.tr?.[POS[pos] ?? pos] ?? null;
  const notes = [];
  const used = new Set();
  const g = glosbe[word];
  const decide = (lang) => {
    const a = get(`${lang}_v1`), b = get(`${lang}_v2`);
    let dict = (sec?.[lang] ?? []).map(norm);
    let src = "wikt";
    if (!dict.length && lang === "kk" && g?.kk?.length) { dict = g.kk.map(norm); src = "glosbe"; }
    if (!dict.length) { notes.push(`${lang}: ${w?.page ? `в Wiktionary нет перевода для «${pos}»` : "страница Wiktionary не найдена"}${lang === "kk" ? ", в Glosbe тоже нет" : ""}`); return ["human", ""]; }
    const pick = (c, v) => { used.add(src); if (src === "glosbe") notes.push(`kk: по Glosbe (без учёта части речи)`); return [c, v]; };
    const ina = parts(a).some((x) => dict.includes(x)), inb = parts(b).some((x) => dict.includes(x));
    if (ina && inb) return pick("both", a);
    if (ina) return pick("v1", a);
    if (inb) return pick("v2", b);
    notes.push(`${lang}: ни один вариант не в ${src === "glosbe" ? "Glosbe" : "Wiktionary"} (там: ${(src === "glosbe" ? g.kk : sec[lang]).slice(0, 4).join("; ")})`);
    return ["human", ""];
  };
  const [kc, kf] = decide("kk");
  const [rc, rf] = decide("ru");
  stats.kk[kc] = (stats.kk[kc] ?? 0) + 1; stats.ru[rc] = (stats.ru[rc] ?? 0) + 1;
  const urls = [];
  if (used.has("wikt") && w?.page) urls.push(`https://en.wiktionary.org/wiki/${encodeURIComponent(w.page.replace(/ /g, "_"))}#English`);
  if (used.has("glosbe")) urls.push(g.url);
  const url = urls.join(" ");
  out.push([get("id"), word, pos, kc, kf, rc, rf, url, notes.join(" | ") || "kk и ru подтверждены Wiktionary"]);
}
writeFileSync(outFile, out.map((r) => r.map(cell).join(",")).join("\n") + "\n");
const both = out.slice(1).filter((r) => r[3] !== "human" && r[5] !== "human").length;
console.log(`rows ${rows.length}; kk ${JSON.stringify(stats.kk)}; ru ${JSON.stringify(stats.ru)}; both languages decided: ${both}`);
