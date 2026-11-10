// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/* docs/error-states.md, finding 2: a word saved without network used to live in memory only
   and was gone after a reload. Now it waits on the device and goes up when it can.
   Same setup as flow.dom.test.tsx; the fake fetch can refuse writes to saved_words. */

configure({ asyncUtilTimeout: 10_000 });

const USER = "00000000-0000-0000-0000-0000000000f2";
const OUTBOX = `ertegi_word_outbox_${USER}`;
let writesFail = true;
let posted: string[] = [];

beforeEach(() => {
  writesFail = true;
  posted = [];
  const now = Math.floor(Date.now() / 1000);
  localStorage.setItem("sb-tsialjlxlhwemrkyyvjv-auth-token", JSON.stringify({
    access_token: "e2e-jwt", refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
    user: { id: USER, aud: "authenticated", email: "outbox@example.test", app_metadata: {}, user_metadata: { role: "student" }, created_at: "2026-01-01" },
  }));
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input instanceof Request ? input.url : input).replace(/^https?:\/\/[^/]+/, "");
    if (path.startsWith("/rest/v1/saved_words") && init?.method === "POST") {
      if (writesFail) throw new TypeError("Failed to fetch");
      const rows = JSON.parse(String(init.body)) as { word: string }[];
      posted.push(...rows.map((r) => r.word));
      return new Response(JSON.stringify(rows.map((r) => ({ word: r.word }))), { status: 201, headers: { "Content-Type": "application/json" } });
    }
    return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
  }));
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn() as unknown as Element["scrollTo"];
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn((q: string) => ({ matches: false, media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof window.matchMedia;
  window.HTMLMediaElement.prototype.play = vi.fn(async () => {});
  window.HTMLMediaElement.prototype.pause = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

const button = (re: RegExp) => {
  const b = screen.getAllByRole("button").find((x) => re.test(x.textContent?.trim() ?? ""));
  if (!b) throw new Error(`no button ${re}`);
  return b;
};
const start = async () => {
  const App = (await import("../App")).default;
  render(<App />);
  // The landing's way in: «Бастау» before redesign stage 7, «Кіру» after.
  fireEvent.click(await waitFor(() => button(/^(Бастау|Кіру)$/)));
  expect(await screen.findByText(/Сәлем, outbox!/)).toBeTruthy();
};
// The library: «Оқу» in the 7-tab navigation, «Ертегілер» in the 5-tab one.
const openLibrary = () => fireEvent.click(screen.getAllByRole("button", { name: /^(Оқу|Ертегілер)$/ })[0]);
const queued = () => JSON.parse(localStorage.getItem(OUTBOX) || "[]").map((w: { word: string }) => w.word);

describe("word saved without network", () => {
  it("waits on the device, survives a reload, and goes up when writes work again", async () => {
    await start();
    openLibrary();
    fireEvent.click(await waitFor(() => button(/^I тарау.*Aldar Köse & the Rich/)));
    fireEvent.click(await waitFor(() => button(/^A1/)));
    const word = await waitFor(() => {
      const w = [...document.querySelectorAll('[role="button"]')].find((b) => b.textContent?.trim() === "Aldar");
      if (!w) throw new Error("no word");
      return w;
    });
    fireEvent.click(word);
    const sheet = await screen.findByRole("dialog", { name: "Сөз" });
    // «Сөздігіме» before redesign stage 4, «Сөздікке қосу» after.
    fireEvent.click(within(sheet).getByRole("button", { name: /Сөздігіме|Сөздікке қосу/ }));

    // Not sent, but kept on the device, and no "not saved" toast for a word that only waits.
    await waitFor(() => expect(queued()).toEqual(["aldar"]));
    await new Promise((r) => setTimeout(r, 300));
    expect(posted).toEqual([]);
    expect(screen.queryByText(/Деректер сақталмады/)).toBeNull();

    // Two more failed sends (the network flickers): on the third in a row the old toast says so.
    window.dispatchEvent(new Event("online"));
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.queryByText(/Деректер сақталмады/)).toBeNull();
    window.dispatchEvent(new Event("online"));
    expect(await screen.findByText(/Деректер сақталмады/)).toBeTruthy();
    expect(queued()).toEqual(["aldar"]);

    // A reload while writes still fail: the word is still in the learner's list.
    cleanup();
    vi.resetModules();
    await start();
    await waitFor(() => expect(screen.getByText(/^1 сөз сақталды/)).toBeTruthy());
    expect(queued()).toEqual(["aldar"]);

    // The network is back: the word goes up once and leaves the queue.
    writesFail = false;
    window.dispatchEvent(new Event("online"));
    await waitFor(() => expect(posted).toEqual(["aldar"]));
    await waitFor(() => expect(queued()).toEqual([]));
  }, 40_000);
});
