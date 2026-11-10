// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/* Redesign stage 6: Practice → Words opens on the overview; «Қайталауды бастау» starts the
   existing flashcard review; ✕ goes back. Same fake Supabase as the other e2e tests, with two
   saved words: one due now, one later. */

configure({ asyncUtilTimeout: 10_000 });
const USER = "00000000-0000-0000-0000-0000000000e6";

beforeEach(() => {
  const now = Math.floor(Date.now() / 1000);
  localStorage.setItem("sb-tsialjlxlhwemrkyyvjv-auth-token", JSON.stringify({
    access_token: "e2e-jwt", refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
    user: { id: USER, aud: "authenticated", email: "practice@example.test", app_metadata: {}, user_metadata: { role: "student" }, created_at: "2026-01-01" },
  }));
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input instanceof Request ? input.url : input).replace(/^https?:\/\/[^/]+/, "");
    const body = path.startsWith("/rest/v1/saved_words")
      ? JSON.stringify([
        { word: "coat", translation: "шапан", mastery: 1, next_review_at: "2020-01-01T00:00:00Z", review_count: 1 },
        { word: "horse", translation: "ат", mastery: 1, next_review_at: "2099-01-01T00:00:00Z", review_count: 1 },
      ])
      : "[]";
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
  }));
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn() as unknown as Element["scrollTo"];
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn((q: string) => ({ matches: false, media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof window.matchMedia;
  window.HTMLMediaElement.prototype.play = vi.fn(async () => {});
  window.HTMLMediaElement.prototype.pause = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

describe("Practice → Words (redesign stage 6)", () => {
  it("overview first, then the review, and back", async () => {
    const App = (await import("../App")).default;
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Кіру" }));
    expect(await screen.findByText(/Сәлем, practice!/)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /Жаттығу$/ })[0]); // the due-count badge comes first in the name
    fireEvent.click(within(await screen.findByRole("tablist")).getByRole("tab", { name: "Сөздер" }));

    const card = await screen.findByRole("region", { name: "Бүгін қайталау" });
    await waitFor(() => expect(within(card).getByText("1")).toBeTruthy()); // one word due
    expect(screen.getAllByRole("listitem").map((li) => li.querySelector("[lang=en]")?.textContent)).toEqual(["horse", "coat"]);

    fireEvent.click(within(card).getByRole("button", { name: "Қайталауды бастау" }));
    expect(await screen.findByText("1 / 1")).toBeTruthy(); // the existing review, one card
    expect(screen.queryByRole("region", { name: "Бүгін қайталау" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Жабу" }));
    expect(await screen.findByRole("region", { name: "Бүгін қайталау" })).toBeTruthy();
  }, 30_000);
});
