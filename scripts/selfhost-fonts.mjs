// Turns the Google Fonts CSS into self-hosted fonts: keeps the latin, latin-ext,
// cyrillic and cyrillic-ext faces (Kazakh letters are in cyrillic-ext), downloads
// each woff2 once into public/fonts/, writes src/fonts.css with local URLs.
// Usage: node selfhost-fonts.mjs google.css repoRoot
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [cssFile, root] = process.argv.slice(2);
const css = readFileSync(cssFile, "utf8");
const KEEP = ["cyrillic-ext", "cyrillic", "latin-ext", "latin"];
const blocks = [...css.matchAll(/\/\* ([a-z-]+) \*\/\s*(@font-face \{[^}]+\})/g)];
mkdirSync(join(root, "public", "fonts"), { recursive: true });
const files = new Map();
const out = ["/* Self-hosted fonts (Inter, Nunito; SIL Open Font License 1.1, see public/fonts/OFL-Inter.txt, OFL-Nunito.txt).",
  "   Subsets: latin, latin-ext, cyrillic, cyrillic-ext (Kazakh letters). Built from the Google Fonts CSS",
  "   by scripts/selfhost-fonts.mjs; the browser downloads only the subsets a page uses (unicode-range). */", ""];
for (const [, subset, face] of blocks) {
  if (!KEEP.includes(subset)) continue;
  const family = face.match(/font-family: '([^']+)'/)[1];
  const url = face.match(/url\((https:[^)]+)\)/)[1];
  const name = `${family.toLowerCase()}-${subset}.woff2`;
  if (!files.has(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    writeFileSync(join(root, "public", "fonts", name), Buffer.from(await res.arrayBuffer()));
    files.set(url, name);
  }
  out.push(`/* ${family} ${subset} */`, face.replace(url, `/fonts/${files.get(url)}`), "");
}
writeFileSync(join(root, "src", "fonts.css"), out.join("\n"));
console.log(`faces ${out.filter((l) => l.startsWith("@font-face")).length}, files ${files.size}: ${[...files.values()].join(" ")}`);
