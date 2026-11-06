// Kazakh translations of English words from Glosbe (glosbe.com/en/kk/<word>), the
// data-translation attributes of the page. Part of speech is not separated there.
// Usage: node glosbe.mjs words.json out.json   (words.json: ["adult", ...])
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const UA = "ertegi-english-translation-check/1.0 (educational project)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [wordsFile, outFile] = process.argv.slice(2);
const words = JSON.parse(readFileSync(wordsFile, "utf8"));
const done = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : {};
for (const w of words) {
  if (done[w]?.kk?.length) continue;
  const page = w.split("/")[0].trim();
  const url = `https://glosbe.com/en/kk/${encodeURIComponent(page)}`;
  let res;
  for (let i = 0; i < 4; i++) {
    res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status !== 429 && res.status < 500) break;
    await sleep(4000 * (i + 1));
  }
  const html = res.ok ? await res.text() : "";
  const kk = [...new Set([
    ...[...html.matchAll(/translation__item__pharse[^>]*>([^<]+)</g)].map((m) => m[1].trim()),
    ...[...html.matchAll(/data-translation="([^"]+)"/g)].map((m) => m[1].trim()),
  ].filter(Boolean))];
  done[w] = { ok: res.ok, url, kk };
  writeFileSync(outFile, JSON.stringify(done, null, 1));
  await sleep(2500);
}
console.log(`glosbe: ${Object.values(done).filter((d) => d.ok).length} ok, ${Object.values(done).filter((d) => d.kk?.length).length} with kk`);
