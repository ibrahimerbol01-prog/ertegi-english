import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSignIndex, findSign, loadSigns, readDeafMode, safeMediaUrl, signKey, validSign } from "./signs";

const REF = "tsialjlxlhwemrkyyvjv";
const good = {
  word: "Table",
  video: { mp4: "/signs/table.mp4", webm: "/signs/table.webm", poster: "/signs/table.jpg" },
  language: "test sign language",
  signer: "signer-01",
  reviewedBy: "native signer",
  licence: "CC BY 4.0",
};

describe("sign entries", () => {
  it("accepts a complete entry and indexes it by lower-case headword", () => {
    expect(validSign(good)).toBe(true);
    expect(buildSignIndex({ entries: [good] }).get("table")?.signer).toBe("signer-01");
  });

  it("drops an entry that does not name the language, who signed it, who checked it, or the licence", () => {
    for (const k of ["language", "signer", "reviewedBy", "licence", "word"] as const) {
      expect(validSign({ ...good, [k]: "  " }), k).toBe(false);
      const copy: Record<string, unknown> = { ...good };
      delete copy[k];
      expect(validSign(copy), `${k} missing`).toBe(false);
    }
    expect(validSign({ ...good, pos: " " })).toBe(false);
    expect(buildSignIndex({ entries: [{ ...good, reviewedBy: "" }] }).size).toBe(0);
  });

  it("takes each video only from our own site or our own public storage, with the right file type for its field", () => {
    expect(safeMediaUrl("/signs/a.mp4", "mp4")).toBe(true);
    expect(safeMediaUrl("/signs/a.webm", "webm")).toBe(true);
    expect(safeMediaUrl("/signs/a.png", "poster")).toBe(true);
    expect(safeMediaUrl(`https://${REF}.supabase.co/storage/v1/object/public/signs/a.webm`, "webm")).toBe(true);
    for (const bad of [
      "//evil.example/a.mp4",
      "https://evil.example/a.mp4",
      `http://${REF}.supabase.co/storage/v1/object/public/a.mp4`,
      "https://otherproject.supabase.co/storage/v1/object/public/a.mp4", // another Supabase project
      `https://${REF}.supabase.co/storage/v1/object/sign/a.mp4`, // not the public path
      "javascript:alert(1)",
      "/signs/../secret.mp4",
      "/signs/%2e%2e/secret.mp4",
      "/signs/A.MP4",
      "/signs/a.exe",
      "/signs/a.jpg", // a picture in the mp4 field
      "data:video/mp4;base64,AAAA",
      "",
      42,
      null,
    ]) expect(safeMediaUrl(bad, "mp4"), String(bad)).toBe(false);
    expect(safeMediaUrl("/signs/a.mp4", "poster")).toBe(false); // a video in the poster field
    expect(validSign({ ...good, video: { mp4: "https://evil.example/a.mp4" } })).toBe(false);
    expect(validSign({ ...good, video: { mp4: "/signs/a.mp4", poster: "//evil.example/p.jpg" } })).toBe(false);
    expect(validSign({ ...good, video: { mp4: "/signs/a.mp4", webm: "/signs/a.mp4" } })).toBe(false);
  });

  it("ignores junk in the list without throwing", () => {
    expect(buildSignIndex({ entries: [null, 7, "x", {}, [], good] }).size).toBe(1);
  });

  it("a sign made for a part of speech wins over a general one; the first of a duplicate wins", () => {
    const general = { ...good, word: "table", signer: "general" };
    const verb = { ...good, word: "table", pos: "verb", signer: "verb-sign" };
    const dup = { ...general, signer: "later" };
    const idx = buildSignIndex({ entries: [general, verb, dup] });
    expect(idx.size).toBe(2);
    expect(findSign(idx, "Table", "verb")?.signer).toBe("verb-sign");
    expect(findSign(idx, "table", "noun")?.signer).toBe("general");
    expect(findSign(idx, "table")?.signer).toBe("general");
    expect(findSign(idx, "chair", "noun")).toBeUndefined();
    expect(findSign(null, "table")).toBeUndefined();
    expect(signKey(" Table ", " Verb ")).toBe("table|verb");
  });

  it("the shipped data file loads, and every entry in it is valid", async () => {
    const file = (await import("../data/signs.json")).default as { schema: number; entries: unknown[] };
    expect(file.schema).toBe(1);
    expect(Array.isArray(file.entries)).toBe(true);
    for (const e of file.entries) expect(validSign(e), JSON.stringify(e)).toBe(true);
    expect(await loadSigns()).toBeInstanceOf(Map);
  });
});

describe("deaf mode setting", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());
  it("is off until switched on, and survives a reload", () => {
    expect(readDeafMode()).toBe(false);
    localStorage.setItem("ertegi_deaf_mode", "1");
    expect(readDeafMode()).toBe(true);
  });
  it("is off, not a crash, when the browser blocks storage", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readDeafMode()).toBe(false);
  });
});
