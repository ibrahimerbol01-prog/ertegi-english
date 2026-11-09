import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* R4: no placement check in the research build (Task 12 B). */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("research build: no placement check", () => {
  it("the app creates and mounts it only outside the research build", () => {
    const app = read("src/KazakhTalesApp.tsx");
    expect(app).toContain('const PlacementCheck = RESEARCH_MODE ? null : lazy(() => import("./components/PlacementCheck"));');
    expect(app.match(/placement=\{!RESEARCH_MODE && PlacementCheck/g)?.length).toBe(2);
  });

  it("the research build swaps the file for an empty stand-in", async () => {
    const cfg = read("vite.config.ts");
    const m = cfg.match(/\{ find: \/([^\n]*?PlacementCheck[^\n]*?)\/, replacement: '([^']*PlacementCheck\.off)' \}/);
    expect(m, "research alias for PlacementCheck in vite.config.ts").not.toBeNull();
    expect("./components/PlacementCheck".replace(new RegExp(m![1]), m![2])).toBe("./components/PlacementCheck.off");
    expect(read("src/components/PlacementCheck.off.tsx")).not.toMatch(/^import /m);
    expect((await import("../components/PlacementCheck.off")).default()).toBeNull();
  });
});
