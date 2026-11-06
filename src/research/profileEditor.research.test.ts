import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* R4: no profile editor and no avatar in the research build (Task 12 A). */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("research build: no profile editor", () => {
  it("the app creates and mounts the editor only outside the research build, and hides the avatar there", () => {
    const app = read("src/KazakhTalesApp.tsx");
    expect(app).toContain('const ProfileEditor = RESEARCH_MODE ? null : lazy(() => import("./components/ProfileEditor"));');
    expect(app).toContain("editor={!RESEARCH_MODE && ProfileEditor ? (");
    expect(app).toMatch(/RESEARCH_MODE \? null : \(\(session\.user\.user_metadata\?\.avatar/);
  });

  it("the research build swaps the editor file for an empty stand-in", async () => {
    const cfg = read("vite.config.ts");
    const m = cfg.match(/\{ find: \/([^\n]*?ProfileEditor[^\n]*?)\/, replacement: '([^']*ProfileEditor\.off)' \}/);
    expect(m, "research alias for ProfileEditor in vite.config.ts").not.toBeNull();
    expect("./components/ProfileEditor".replace(new RegExp(m![1]), m![2])).toBe("./components/ProfileEditor.off");
    expect(read("src/components/ProfileEditor.off.tsx")).not.toMatch(/^import /m);
    expect((await import("../components/ProfileEditor.off")).default()).toBeNull();
  });
});
