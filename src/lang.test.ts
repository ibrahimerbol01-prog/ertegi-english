// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { loadLang, pick, saveLang, toLang } from "./lang";

describe("interface language", () => {
  afterEach(() => localStorage.clear());

  it("toLang accepts kk, ru, en and falls back to Kazakh", () => {
    expect(toLang("ru")).toBe("ru");
    expect(toLang("en")).toBe("en");
    expect(toLang("kk")).toBe("kk");
    expect(toLang("de")).toBe("kk");
    expect(toLang(null)).toBe("kk");
  });

  it("saves and restores Russian and sets <html lang>", () => {
    saveLang("ru");
    expect(loadLang()).toBe("ru");
    expect(document.documentElement.lang).toBe("ru");
  });

  it("pick returns the text of the current language", () => {
    expect(pick("kk", "а", "б", "в")).toBe("а");
    expect(pick("ru", "а", "б", "в")).toBe("б");
    expect(pick("en", "а", "б", "в")).toBe("в");
  });
});
