// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/* Error states a learner meets without network (docs/error-states.md, findings 1, 3, 4).
   Same setup as flow.dom.test.tsx: a saved session and a fake fetch. Here the fake can
   fail chosen tables, as a dropped connection or a server error would. */

configure({ asyncUtilTimeout: 10_000 });

const USER = "00000000-0000-0000-0000-0000000000e3";
let failing: (path: string) => boolean = () => false;
let profileRow: Record<string, unknown> | null = null;

const setOnline = (value: boolean) => {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => value });
  window.dispatchEvent(new Event(value ? "online" : "offline"));
};

beforeEach(() => {
  failing = () => false;
  profileRow = null;
  const now = Math.floor(Date.now() / 1000);
  localStorage.setItem("sb-tsialjlxlhwemrkyyvjv-auth-token", JSON.stringify({
    access_token: "e2e-jwt", refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
    user: { id: USER, aud: "authenticated", email: "err@example.test", app_metadata: {}, user_metadata: { role: "student" }, created_at: "2026-01-01" },
  }));
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input instanceof Request ? input.url : input).replace(/^https?:\/\/[^/]+/, "");
    if (failing(path)) throw new TypeError("Failed to fetch");
    const body = path.startsWith("/rest/v1/profiles") && profileRow ? JSON.stringify(profileRow) : "[]";
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
  }));
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn() as unknown as Element["scrollTo"];
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn((q: string) => ({ matches: false, media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); setOnline(true); });

const start = async () => {
  const App = (await import("../App")).default;
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Бастау" }));
  expect(await screen.findByText(/Сәлем, err!/)).toBeTruthy();
};

// The saved words: a "Сөздер" tab in the 7-tab navigation, "Жаттығу" → "Сөздер" in the 5-tab one (redesign stage 2).
const openSavedWords = async () => {
  const old = screen.queryAllByRole("button", { name: "Сөздер" });
  if (old.length) { fireEvent.click(old[0]); return; }
  fireEvent.click(screen.getAllByRole("button", { name: "Жаттығу" })[0]);
  const kinds = await screen.findByRole("tablist");
  fireEvent.click(within(kinds).getByRole("tab", { name: "Сөздер" }));
};

describe("error states", () => {
  it("offline: a banner says so, and unread saved words are not shown as zero", async () => {
    setOnline(false);
    failing = (p) => p.startsWith("/rest/v1/");
    await start();

    expect(screen.getByRole("status").textContent).toMatch(/^Желі жоқ\./);

    await openSavedWords();
    expect((await screen.findByRole("alert")).textContent).toMatch(/Сақталған сөздер жүктелмеді/);
    expect(screen.queryByText(/Әзірге сөз сақталмаған/)).toBeNull();

    // The network is back: the banner goes and the (empty) list loads on the next retry.
    failing = () => false;
    setOnline(true);
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(await screen.findByText(/Әзірге сөз сақталмаған/, {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.queryByText(/Сақталған сөздер жүктелмеді/)).toBeNull();
  }, 30_000);

  it("a failed achievement write shows no error toast", async () => {
    // One quiz done unlocks the first achievement right after loading; its write fails.
    profileRow = { id: USER, xp: 50, quizzes_completed: 1, perfect_quizzes: 0, streak_days: 0, last_active_date: null };
    let achievementWrites = 0;
    failing = (p) => p.startsWith("/rest/v1/user_achievements") && ++achievementWrites > 1; // the read passes
    await start();

    await waitFor(() => expect(achievementWrites).toBeGreaterThanOrEqual(4), { timeout: 8000 }); // 1 read + 3 tries
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.queryByText(/Деректер сақталмады/)).toBeNull();
  }, 30_000);
});
