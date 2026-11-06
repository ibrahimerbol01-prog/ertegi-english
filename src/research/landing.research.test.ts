import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* R4: the research site keeps its first screen exactly as before (Task 13). */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("research build: first screen unchanged", () => {
  it("App shows IntroScreen in the research build and WelcomeScreen only on the ordinary site", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/return RESEARCH_MODE\s*\?\s*<IntroScreen onFinish=\{\(\) => setIntroSeen\(true\)\} t=\{DICT\[loadLang\(\)\]\} \/>\s*:\s*<WelcomeScreen /);
  });

  it("IntroScreen itself is untouched: one action for both buttons, the old texts", () => {
    const intro = read("src/components/IntroScreen.tsx");
    expect(intro.match(/onClick=\{onFinish\}/g)?.length).toBe(2);
    expect(intro).toContain("{t.skip}");
    expect(intro).toContain("{t.enter}");
    expect(intro).not.toMatch(/WelcomeScreen|wlNext|wlHaveAccount/);
  });

  it("the research build's sign-in form still opens on sign-up by default", () => {
    expect(read("src/AuthScreen.tsx")).toContain('initialMode = "signup"');
    expect(read("src/App.tsx")).toContain('useState<"signup" | "signin">("signup")');
  });
});
