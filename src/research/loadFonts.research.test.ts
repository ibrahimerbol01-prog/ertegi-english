import { describe, expect, it, vi } from "vitest";

/* R4: in the research build the font loading stays as it was (blocking link in
   index.html); loadFonts does nothing there. */

vi.mock("./mode", () => ({ RESEARCH_MODE: true, STUDY_ID: "ertegi-stage0-test" }));
const { loadFonts } = await import("../loadFonts");

describe("research build: fonts unchanged", () => {
  it("loadFonts adds nothing, even if a preload were there", () => {
    const appended: unknown[] = [];
    const doc = {
      head: { appendChild: (el: unknown) => appended.push(el) },
      querySelector: () => ({ href: "https://fonts.googleapis.com/css2" }),
      createElement: () => ({}),
    } as unknown as Document;
    expect(loadFonts(doc)).toBe(false);
    expect(appended).toEqual([]);
  });
});
