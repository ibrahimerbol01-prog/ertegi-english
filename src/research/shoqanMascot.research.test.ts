import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* R4: no mascot in the research build (an animated character that reacts to
   activity would be one more variable between the study's learners). */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("research build: no Shoqan mascot", () => {
  it("the app creates and mounts it only outside the research build", () => {
    const app = read("src/KazakhTalesApp.tsx");
    expect(app).toContain('const ShoqanMascot = RESEARCH_MODE ? null : lazy(() => import("./components/ShoqanMascot"));');
    expect(app.match(/mascot=\{!RESEARCH_MODE && ShoqanMascot/g)?.length).toBe(1);
  });

  it("the research build swaps the file for an empty stand-in", async () => {
    const cfg = read("vite.config.ts");
    const m = cfg.match(/\{ find: \/([^\n]*?ShoqanMascot[^\n]*?)\/, replacement: '([^']*ShoqanMascot\.off)' \}/);
    expect(m, "research alias for ShoqanMascot in vite.config.ts").not.toBeNull();
    expect("./components/ShoqanMascot".replace(new RegExp(m![1]), m![2])).toBe("./components/ShoqanMascot.off");
    expect(read("src/components/ShoqanMascot.off.tsx")).not.toMatch(/^import /m);
    expect((await import("../components/ShoqanMascot.off")).default()).toBeNull();
  });
});
