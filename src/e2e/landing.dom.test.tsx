// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, within } from "@testing-library/react";
import { WORD_TRANSLATIONS } from "../constants";

/* Redesign stage 7: the landing and "Тіркелусіз оқып көру". No saved session here, as
   for a first visitor. Every network call is recorded: a guest must not reach the
   database (no profile, no saved words, no learning_events). */

configure({ asyncUtilTimeout: 10_000 });

let calls: { method: string; path: string }[] = [];

beforeEach(() => {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push({ method: init?.method ?? (input instanceof Request ? input.method : "GET"), path: url.replace(/^https?:\/\/[^/]+/, "") });
    return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
  }));
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn((q: string) => ({ matches: false, media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

const start = async () => {
  const App = (await import("../App")).default;
  render(<App />);
  await screen.findByRole("heading", { level: 1, name: /Таныс ертегі\./ });
};

describe("landing", () => {
  it("shows the hero and a sample whose words open their glossary meaning", async () => {
    await start();
    expect(screen.getByText("Біз үшін — кішкентай қадам, Қазақстан үшін — үлкен мүмкіндік")).toBeTruthy();
    expect(screen.getByText("Жаңа тіл.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Тіркелусіз оқып көру/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Сынып коды бар ма? Қосылу" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Шынайы айтамыз" })).toBeTruthy();

    // The meaning comes from the reader's glossary, not from text written for the landing.
    fireEvent.click(await screen.findByRole("button", { name: "clever" }));
    const live = document.querySelector("[aria-live=polite]")!;
    expect(live.textContent).toContain(WORD_TRANSLATIONS.clever);
    expect(screen.getByRole("button", { name: "clever" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("guest reading: the A1 tale, a sign-up offer on save, and no database calls", async () => {
    await start();
    fireEvent.click(screen.getByRole("button", { name: /Тіркелусіз оқып көру/ }));

    const tale = await screen.findByRole("article");
    expect(tale.textContent).toMatch(/^Aldar Köse is a poor man\./);
    fireEvent.click(within(tale).getAllByRole("button", { name: "coat." })[0]);
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText(WORD_TRANSLATIONS.coat)).toBeTruthy();

    // Saving a word asks to create an account; "Кейін" keeps reading.
    fireEvent.click(within(sheet).getByRole("button", { name: /Сөздігіме/ }));
    const ask = await screen.findByRole("dialog", { name: "Прогресті сақтау үшін аккаунт аш" });
    fireEvent.click(within(ask).getByRole("button", { name: "Кейін" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("article")).toBeTruthy();

    // Nothing went to the database: no REST call at all (profiles, saved words, learning_events).
    expect(calls.filter((c) => c.path.startsWith("/rest/v1/"))).toEqual([]);

    // "Аккаунт ашу" leads to the sign-up form.
    fireEvent.click(within(tale).getAllByRole("button", { name: "horse." })[0]);
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Сөздігіме/ }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Прогресті сақтау үшін аккаунт аш" })).getByRole("button", { name: "Аккаунт ашу" }));
    expect(await screen.findByRole("heading", { name: /Аккаунт аш/ })).toBeTruthy();
  }, 30_000);
});
