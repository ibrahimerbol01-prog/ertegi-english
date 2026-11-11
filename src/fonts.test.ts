import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { seoPlugin } from "../vite-seo.ts";

/* Self-hosted fonts (owner's decision 3): no request to Google Fonts, every face
   points at a file in public/fonts, Kazakh letters are covered, the research build
   loads the same fonts (main.tsx imports fonts.css in every build). */

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const css = read("src/fonts.css");
const faces = [...css.matchAll(/@font-face \{([^}]+)\}/g)].map((m) => m[1]);
const field = (f: string, k: string) => f.match(new RegExp(`${k}: ([^;]+);`))?.[1].trim() ?? "";

/** Code points covered by a CSS unicode-range ("U+0400-045F, U+0490-0491"). */
const covers = (range: string, cp: number) => range.split(",").some((part) => {
  const [a, b] = part.trim().replace(/^U\+/i, "").split("-").map((x) => parseInt(x, 16));
  return cp >= a && cp <= (b ?? a);
});
const KAZAKH = "АӘБВГҒДЕЁЖЗИЙКҚЛМНҢОӨПРСТУҰҮФХҺЦЧШЩЪЫІЬЭЮЯаәбвгғдеёжзийкқлмнңоөпрстуұүфхһцчшщъыіьэюя";

describe("self-hosted fonts", () => {
  it("nothing in the site asks Google Fonts any more", () => {
    const srcFiles = (dir: string): string[] => readdirSync(join(root, dir)).flatMap((n) => {
      const p = join(dir, n);
      return statSync(join(root, p)).isDirectory() ? srcFiles(p) : [relative(root, join(root, p)).replace(/\\/g, "/")];
    });
    const files = ["index.html", "vite.config.ts", "vercel.json", ...srcFiles("src").filter((f) => /\.(ts|tsx|css|html)$/.test(f) && !f.endsWith(".test.ts"))];
    const hits = files.filter((f) => /fonts\.(googleapis|gstatic)\.com/.test(read(f)));
    expect(hits).toEqual([]);
  });

  it("every face is Inter or Nunito, swaps, has a unicode-range and a file in public/fonts", () => {
    expect(faces.length).toBeGreaterThan(0);
    for (const f of faces) {
      expect(["'Inter'", "'Nunito'"]).toContain(field(f, "font-family"));
      expect(field(f, "font-display")).toBe("swap");
      expect(field(f, "unicode-range")).not.toBe("");
      const url = f.match(/url\(([^)]+)\)/)![1];
      expect(url).toMatch(/^\/fonts\/[a-z-]+\.woff2$/);
      expect(existsSync(join(root, "public", url)), url).toBe(true);
    }
  });

  it("the weights the UI uses are there: Inter 400–700, Nunito 700–900", () => {
    const weights = (fam: string) => new Set(faces.filter((f) => field(f, "font-family") === `'${fam}'`).map((f) => field(f, "font-weight")));
    for (const w of ["400", "500", "600", "700"]) expect(weights("Inter")).toContain(w);
    for (const w of ["700", "800", "900"]) expect(weights("Nunito")).toContain(w);
  });

  it("every letter of the Kazakh alphabet is covered in both families", () => {
    for (const fam of ["Inter", "Nunito"]) {
      const ranges = faces.filter((f) => field(f, "font-family") === `'${fam}'`).map((f) => field(f, "unicode-range"));
      const missing = [...KAZAKH].filter((ch) => !ranges.some((r) => covers(r, ch.codePointAt(0)!)));
      expect(missing, fam).toEqual([]);
    }
  });

  it("the licences ship with the fonts", () => {
    for (const f of ["OFL-Inter.txt", "OFL-Nunito.txt"]) expect(read(`public/fonts/${f}`)).toMatch(/SIL OPEN FONT LICENSE/i);
  });

  it("every build loads them the same way (no research-only branch), and the CSP allows only own fonts", () => {
    expect(read("src/main.tsx")).toMatch(/^import '\.\/fonts\.css'$/m);
    const csp = read("vercel.json").match(/"Content-Security-Policy[^"]*",\s*"value": "([^"]+)"/)![1];
    expect(csp).toMatch(/font-src 'self';/);
  });
});

describe("robots.txt", () => {
  // The build writes robots.txt and sitemap.xml (vite-seo.ts); before that, the SPA fallback served index.html for them.
  it("is a valid robots file with a sitemap line, and the study build closes the whole site", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-"));
    const cwd = process.cwd();
    try {
      process.chdir(dir);
      for (const research of [false, true]) {
        (seoPlugin({ research }).closeBundle as () => void)();
        const robots = readFileSync(join(dir, "dist/robots.txt"), "utf8");
        expect(robots).toMatch(/^User-agent: \*$/m);
        expect(robots).not.toMatch(/</);
        if (research) expect(robots).toMatch(/^Disallow: \/$/m);
        else {
          expect(robots).toMatch(/^Sitemap: https:\/\/\S+\/sitemap\.xml$/m);
          expect(readFileSync(join(dir, "dist/sitemap.xml"), "utf8")).toMatch(/<loc>https:\/\/\S+\/<\/loc>/);
        }
      }
    } finally {
      process.chdir(cwd);
    }
  });
});
