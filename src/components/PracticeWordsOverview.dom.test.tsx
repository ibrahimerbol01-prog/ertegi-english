// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

const say = vi.hoisted(() => vi.fn());
vi.mock("../utils/voice", () => ({ safePlayVoice: say, stopVoice: vi.fn() }));

const { PracticeWordsOverview } = await import("./PracticeWordsOverview");
const { MAX_MASTERY } = await import("../utils/progress");
const { wordState } = await import("../utils/wordState");

afterEach(() => { cleanup(); say.mockReset(); });

const words = [
  { word: "coat", translation: "шапан", mastery: 0, nextReviewAt: null },
  { word: "horse", translation: "ат", mastery: MAX_MASTERY, nextReviewAt: "2099-01-01T00:00:00Z" },
  { word: "clever", translation: "айлакер", mastery: 2, nextReviewAt: null },
];
const show = (due: number, onStart = vi.fn()) => {
  render(<PracticeWordsOverview savedWords={words} dueCount={due} lang="kk" onStart={onStart} mode="cards" setMode={vi.fn()} />);
  return onStart;
};

describe("wordState", () => {
  it("is known only at MAX_MASTERY", () => {
    expect(wordState({ word: "a", translation: "", mastery: MAX_MASTERY })).toBe("known");
    expect(wordState({ word: "a", translation: "", mastery: MAX_MASTERY - 1 })).toBe("learning");
    expect(wordState({ word: "a", translation: "" })).toBe("learning");
  });
});

describe("PracticeWordsOverview (redesign stage 6)", () => {
  it("night card with the due count and «Қайталауды бастау», which starts the review", () => {
    const onStart = show(2);
    const card = screen.getByRole("region", { name: "Бүгін қайталау" });
    expect(card.className).toMatch(/bg-night/);
    expect(within(card).getByText("2")).toBeTruthy();
    fireEvent.click(within(card).getByRole("button", { name: "Қайталауды бастау" }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("nothing due: the count is 0 and there is no start button", () => {
    show(0);
    expect(screen.queryByRole("button", { name: "Қайталауды бастау" })).toBeNull();
  });

  it("two counters from mastery (no «Жаңа»: no saved date)", () => {
    show(1);
    expect(screen.getByText("Үйреніп жүрмін", { selector: "div > p" }).previousElementSibling!.textContent).toBe("2");
    expect(screen.getByText("Білемін", { selector: "div > p" }).previousElementSibling!.textContent).toBe("1");
    expect(screen.queryByText("Жаңа")).toBeNull();
  });

  it("the list: latest first, 48 px listen, word, translation, state chip", () => {
    show(1);
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((r) => r.querySelector("[lang=en]")!.textContent)).toEqual(["clever", "horse", "coat"]);
    const listen = within(rows[1]).getByRole("button", { name: "Тыңдау: horse" });
    expect(listen.className).toMatch(/\bw-12\b/);
    expect(listen.className).toMatch(/\bh-12\b/);
    fireEvent.click(listen);
    expect(say).toHaveBeenCalledWith("horse");
    expect(within(rows[1]).getByText("ат")).toBeTruthy();
    expect(within(rows[1]).getByText("Білемін")).toBeTruthy();
    expect(within(rows[0]).getByText("Үйреніп жүрмін")).toBeTruthy();
  });
});
