import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FONTS_LINK, nonBlockingFonts } from "../vite.config";
import { loadFonts } from "./loadFonts";

/* Fonts no longer block the first paint in the ordinary build (Lighthouse
   render-blocking); the research build keeps index.html as it is. */

const root = join(__dirname, "..");
const indexHtml = readFileSync(join(root, "index.html"), "utf8");

const fakeDoc = (withPreload: boolean) => {
  const head: { children: { rel: string; href: string }[]; appendChild: (el: { rel: string; href: string }) => void } = {
    children: [], appendChild(el) { this.children.push(el); },
  };
  const pre = { href: "https://fonts.googleapis.com/css2?family=Inter" };
  return {
    head,
    querySelector: () => (withPreload ? pre : null),
    createElement: () => ({ rel: "", href: "" }),
  } as unknown as Document & { head: typeof head };
};

describe("non-blocking fonts (ordinary build)", () => {
  it("index.html has the one Google Fonts stylesheet the build rewrites", () => {
    expect(indexHtml.split(FONTS_LINK).length - 1).toBe(1);
  });

  it("the ordinary build preloads it instead, keeps a <noscript> fallback and adds no inline script (CSP script-src 'self')", () => {
    const out = nonBlockingFonts(indexHtml);
    const withoutNoscript = out.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
    expect(withoutNoscript).not.toContain(FONTS_LINK);
    expect(out).toContain('<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Nunito:wght@700;800;900&amp;display=swap" data-fonts />'.replace(/&amp;/g, "&"));
    expect(out).toContain(`<noscript>${FONTS_LINK}</noscript>`);
    expect(out).not.toMatch(/\son(load|error)=/);
  });

  it("fails loudly if index.html changes the link, instead of silently doing nothing", () => {
    expect(() => nonBlockingFonts("<html></html>")).toThrow(/FONTS_LINK/);
  });

  it("loadFonts turns the preload into a stylesheet with the same address", () => {
    const doc = fakeDoc(true);
    expect(loadFonts(doc)).toBe(true);
    expect(doc.head.children).toEqual([{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter" }]);
    expect(loadFonts(fakeDoc(false))).toBe(false);
    expect(loadFonts(undefined)).toBe(false);
  });

  it("the plugin leaves index.html untouched in the research build", () => {
    const cfg = readFileSync(join(root, "vite.config.ts"), "utf8");
    expect(cfg).toContain("transformIndexHtml: (html: string) => (research ? html : nonBlockingFonts(html))");
  });
});

describe("robots.txt", () => {
  it("exists and is a valid robots file (Lighthouse SEO: before, the SPA fallback served index.html)", () => {
    const robots = readFileSync(join(root, "public", "robots.txt"), "utf8");
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).not.toMatch(/</);
  });
});
