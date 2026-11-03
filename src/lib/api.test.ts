import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("API address", () => {
  it("stays relative on the website", async () => {
    vi.stubEnv("VITE_API_BASE", "");
    const { apiUrl } = await import("./api");
    expect(apiUrl("/api/shoqan")).toBe("/api/shoqan");
  });
  it("points at the site from the app build", async () => {
    vi.stubEnv("VITE_API_BASE", "https://ertegi-english.vercel.app/");
    const { apiUrl } = await import("./api");
    expect(apiUrl("/api/shoqan")).toBe("https://ertegi-english.vercel.app/api/shoqan");
    expect(apiUrl("api/azure-token")).toBe("https://ertegi-english.vercel.app/api/azure-token");
  });
});
