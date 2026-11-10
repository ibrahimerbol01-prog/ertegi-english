// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QUIZ_LEVEL_UNLOCK_SHARE } from "../research/params";

/* End-to-end path of a learner: sign-in → tale → quiz → wordbank (Q2.3).
   No live account (owner's decision): the session is put where the Supabase
   client keeps it, and the network is a fake that answers every REST call with
   an empty table and records what the app sends. The real App, client and
   screens run; only fetch, speech and layout APIs jsdom lacks are stubbed. */

// The app and its screens load lazily; under a full parallel run that can take seconds.
configure({ asyncUtilTimeout: 10_000 });

const USER = "00000000-0000-0000-0000-0000000000e2";
type Call = { method: string; path: string; auth: string | null; body: unknown };
let calls: Call[] = [];

beforeEach(() => {
  calls = [];
  const now = Math.floor(Date.now() / 1000);
  localStorage.setItem("sb-tsialjlxlhwemrkyyvjv-auth-token", JSON.stringify({
    access_token: "e2e-jwt", refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
    user: { id: USER, aud: "authenticated", email: "e2e@example.test", app_metadata: {}, user_metadata: { role: "student" }, created_at: "2026-01-01" },
  }));
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    let body: unknown = init?.body;
    try { body = typeof body === "string" ? JSON.parse(body) : body; } catch { /* not JSON */ }
    calls.push({ method: init?.method ?? "GET", path: url.replace(/^https?:\/\/[^/]+/, ""), auth: new Headers(init?.headers).get("Authorization"), body });
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
  if (!b) throw new Error(`no button ${re}`); // so waitFor keeps trying
  return b;
};
const rest = (method: string, table: string) => calls.filter((c) => c.method === method && c.path.startsWith(`/rest/v1/${table}`));
const rows = (c: Call) => (Array.isArray(c.body) ? c.body : [c.body]) as Record<string, unknown>[];

describe("learner path with a faked Supabase", () => {
  it("sign-in → tale → word → quiz → wordbank", async () => {
    const App = (await import("../App")).default;
    render(<App />);

    // Sign-in: the saved session is picked up; the home screen greets the user.
    // The landing (redesign stage 7): "Кіру" goes on; with a session that is the app itself.
    fireEvent.click(await screen.findByRole("button", { name: "Кіру" }));
    expect(await screen.findByText(/Сәлем, e2e!/)).toBeTruthy();
    await waitFor(() => expect(rest("GET", "profiles").length).toBeGreaterThan(0));
    for (const c of calls.filter((c) => c.path.startsWith("/rest/v1/"))) expect(c.auth, c.path).toBe("Bearer e2e-jwt");

    // Tale: the Ертегілер tab → Aldar Köse → A1 → the text is there.
    fireEvent.click(screen.getAllByRole("button", { name: "Ертегілер" })[0]);
    fireEvent.click(await waitFor(() => button(/^I тарау.*Aldar Köse & the Rich/)));
    fireEvent.click(await waitFor(() => button(/^A1/)));
    const word = await waitFor(() => {
      const w = [...document.querySelectorAll('[role="button"]')].find((b) => b.textContent?.trim() === "Aldar");
      if (!w) throw new Error("no word");
      return w;
    });

    // A tap on a word opens its card with the translation.
    fireEvent.click(word);
    const sheet = await screen.findByRole("dialog", { name: "Сөз" });
    expect(within(sheet).getByText("aldar")).toBeTruthy();
    fireEvent.keyDown(sheet, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    // Quiz: from the tale to the setup, then four questions to the result.
    fireEvent.click(button(/^Сынақтан өту/));
    fireEvent.click(await screen.findByRole("button", { name: "Бастау" }));
    expect(await screen.findByText("1 / 4")).toBeTruthy();
    // Pick the first open option; a wrong pick rules it out and allows another try.
    for (let step = 0; step < 20 && !screen.queryByText("Сынақ өтті"); step++) {
      const next = screen.queryAllByRole("button").find((b) => /^(Келесі|Жалғастыру|Нәтижені көру)$/.test(b.textContent?.trim() ?? ""));
      if (next) { fireEvent.click(next); continue; }
      // Options are radios since redesign stage 5 (were aria-pressed buttons); same pick.
      const opt = [...document.querySelectorAll("[role=radiogroup] button.tile[role=radio]")].find((b) => !(b as HTMLButtonElement).disabled);
      if (!opt) { await new Promise((r) => setTimeout(r, 50)); continue; }
      fireEvent.click(opt);
      const sure = screen.queryAllByRole("button").find((b) => b.textContent?.trim() === "Сенімдімін");
      if (sure) fireEvent.click(sure);
      fireEvent.click(button(/^Тексеру$/));
    }
    expect(await screen.findByText("Сынақ өтті")).toBeTruthy();

    // What the quiz saved: the result, the level as done, and the study events.
    await waitFor(() => expect(rest("POST", "quiz_results").length).toBe(1));
    const result = rows(rest("POST", "quiz_results")[0])[0];
    expect(result).toMatchObject({ story_id: "aldar_kose", total: 4 });
    expect(result.score).toBeGreaterThanOrEqual(0);
    // The level counts as done only with enough right answers (KazakhTalesApp handleQuizFinish).
    const passed = (result.score as number) >= Math.ceil(4 * QUIZ_LEVEL_UNLOCK_SHARE);
    await waitFor(() => expect(rest("POST", "story_progress").some((c) => rows(c)[0].story_id === "aldar_kose" && rows(c)[0].step === result.step)).toBe(passed));
    window.dispatchEvent(new Event("pagehide")); // the event log is sent on leaving the page (or after 15 s)
    await waitFor(() => expect(rest("POST", "learning_events").length).toBeGreaterThan(0));
    const events = rest("POST", "learning_events").flatMap(rows);
    expect(events.find((e) => e.verb === "word_tap")).toMatchObject({ object_type: "word", object_id: "aldar" });
    for (const e of events) expect(e.user_id, String(e.verb)).toBe(USER);
    // The study events of this path, in the order the learner made them (docs/events.md).
    const verbs = events.map((e) => e.verb);
    const order = ["session_start", "story_open", "word_tap", "quiz_answer", "quiz_complete", "level_complete"];
    expect(order.every((v) => verbs.includes(v))).toBe(true);
    expect(order.map((v) => verbs.indexOf(v))).toEqual(order.map((v) => verbs.indexOf(v)).sort((a, b) => a - b));

    // Wordbank: the Сөздік tab → the wordbank of A1 (five-tab navigation).
    fireEvent.click(screen.getAllByRole("button", { name: "Сөздік" })[0]);
    fireEvent.click(await waitFor(() => button(/^Сөздік қоры$/)));
    expect(await screen.findByRole("group", { name: "Деңгей" })).toBeTruthy();
    expect(await screen.findByText("action", {}, { timeout: 5000 })).toBeTruthy();

    // Practice: one tab for review, speaking and the quiz, switched inside; the hero cards open from Me.
    fireEvent.click(screen.getAllByRole("button", { name: /Жаттығу/ })[0]);
    const kinds = await screen.findByRole("tablist", { name: "Жаттығу түрі" });
    expect(within(kinds).getAllByRole("tab").map((x) => x.textContent)).toEqual(["Сөздер", "Айтылым", "Тест"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Мен" })[0]);
    expect(await screen.findByRole("button", { name: /Батырлар карталары/ })).toBeTruthy();
    for (const c of calls.filter((c) => c.path.startsWith("/rest/v1/"))) expect(c.auth, c.path).toBe("Bearer e2e-jwt");
  }, 60_000);
});
