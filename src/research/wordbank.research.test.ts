import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement, type FunctionComponent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/* R4: the wordbank «Сөздік қоры» does not exist in the research build: no
   button, no screen, no data. The build flag is mocked here (tests run as the
   ordinary build, vitest.config.ts). */

vi.mock("./mode", () => ({ RESEARCH_MODE: true, STUDY_ID: "ertegi-stage0-test" }));

const { FlashcardsScreen, MatchingGame, WordsHeader } = await import("../components/screens/WordsScreens");
const { LangContext } = await import("../lang");
const { DICT } = await import("../dict");
const { RESEARCH_MODE } = await import("./mode");

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const html = <P extends object>(lang: "kk" | "en", node: FunctionComponent<P>, props: P) =>
  renderToStaticMarkup(createElement(LangContext.Provider, { value: lang }, createElement(node, props)));
const srcFiles = (dir = "src"): string[] => readdirSync(join(root, dir)).flatMap((n) => {
  const p = join(dir, n);
  return statSync(join(root, p)).isDirectory() ? srcFiles(p) : /\.(ts|tsx)$/.test(n) ? [relative(root, join(root, p)).replace(/\\/g, "/")] : [];
});

describe("research build: no wordbank", () => {
  it("the mock really is the research build", () => expect(RESEARCH_MODE).toBe(true));

  it("the words tab has no wordbank button, in both languages, on every words screen", () => {
    for (const lang of ["kk", "en"] as const) {
      const words = [{ word: "horse", translation: "ат", mastery: 0, nextReviewAt: null }, { word: "wolf", translation: "қасқыр" }, { word: "bird", translation: "құс" }];
      for (const h of [
        html(lang, FlashcardsScreen, { savedWords: [], onReview: () => {}, lang, mode: "cards", setMode: () => {} }),
        html(lang, FlashcardsScreen, { savedWords: words, onReview: () => {}, lang, mode: "cards", setMode: () => {} }),
        html(lang, MatchingGame, { savedWords: words, onReward: () => {}, mode: "match", setMode: () => {} }),
        // Even if the mode were "bank" somehow, the header shows no wordbank.
        html(lang, WordsHeader, { mode: "bank", setMode: () => {} }),
      ]) {
        expect(h).not.toContain(DICT[lang].wbTab);
        expect(h).not.toContain(DICT[lang].wbTitle);
      }
    }
  });

  it("the app never creates or mounts the screen in the research build", () => {
    const app = read("src/KazakhTalesApp.tsx");
    expect(app).toContain('const WordbankScreen = RESEARCH_MODE ? null : lazy(() => import("./components/screens/WordbankScreen"));');
    expect(app).toMatch(/\{!RESEARCH_MODE && WordbankScreen && wordsMode === "bank" \? \(\s*<WordbankScreen /);
    expect(app.match(/<WordbankScreen /g)?.length).toBe(1);
  });

  it("the data and the screen are reached only through the lazy import: no static import anywhere in the app", () => {
    const app = srcFiles().filter((f) => !/\.test\.tsx?$/.test(f));
    const importsScreen = app.filter((f) => /from ["'][^"']*\/WordbankScreen["']/.test(read(f)));
    expect(importsScreen).toEqual([]);
    const importsData = app.filter((f) => /from ["'][^"']*data\/wordbank["']/.test(read(f)));
    expect(importsData).toEqual(["src/components/screens/WordbankScreen.tsx"]);
    // The JSON files are imported only by the lazy loaders.
    const importsJson = app.filter((f) => /(import\(|from )["'][^"']*[A-C][12]\.json["']/.test(read(f)));
    expect(importsJson).toEqual(["src/data/wordbank/index.ts"]);
    expect(read("src/data/wordbank/index.ts")).not.toMatch(/^import .*\.json/m);
  });

  it("the research build swaps the screen for an empty stand-in, so neither it nor the word lists are emitted", async () => {
    const cfg = read("vite.config.ts");
    const m = cfg.match(/\? \[\{ find: \/(.+?WordbankScreen\$)\/, replacement: '(.+?)' \}/);
    expect(m, "research alias for WordbankScreen in vite.config.ts").not.toBeNull();
    const imp = read("src/KazakhTalesApp.tsx").match(/lazy\(\(\) => import\("(.+?WordbankScreen)"\)\)/)![1];
    expect(imp.replace(new RegExp(m![1]), m![2])).toBe("./components/screens/WordbankScreen.off");
    const off = read("src/components/screens/WordbankScreen.off.tsx");
    expect(off).not.toMatch(/^import /m);
    expect((await import("../components/screens/WordbankScreen.off")).default()).toBeNull();
  });
});
