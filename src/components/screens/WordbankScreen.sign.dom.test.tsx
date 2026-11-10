// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SIGN_T } from "../signI18n";
import type { SignEntry } from "../../utils/signs";

/* The dictionary with the sign mode: a sign only where a checked recording exists,
   the sound buttons stay, the mode is remembered, and it says honestly what it has. */

const T = SIGN_T.kk;
const word = (w: string, kk: string) => ({ word: w, pos: "noun", level: "A1", source: "cefrj", example: null, kk, ru: "", tr: "human" });
vi.mock("../../data/wordbank", () => ({
  loadWordbankLevel: vi.fn(async () => [word("table", "үстел"), word("chair", "орындық"), word("camel", "түйе")]),
}));

const sign = (w: string, extra: Partial<SignEntry> = {}): SignEntry => ({
  word: w, video: { mp4: `/signs/${w}.mp4` }, language: "test sign language", signer: "signer-01", reviewedBy: "native signer", licence: "CC BY 4.0", ...extra,
});
const feed = vi.hoisted(() => ({ load: null as null | (() => Promise<Map<string, unknown>>) }));
vi.mock("../../utils/signs", async (orig) => ({
  ...(await orig<typeof import("../../utils/signs")>()),
  loadSigns: () => feed.load!(),
}));

const { default: WordbankScreen } = await import("./WordbankScreen");

const index = (...e: SignEntry[]) => new Map(e.map((x) => [x.word, x]));
beforeEach(() => {
  localStorage.clear();
  feed.load = async () => index(sign("table"), sign("camel"), sign("chair", { sample: true }));
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
});
afterEach(() => { cleanup(); });

const renderScreen = () => render(<WordbankScreen savedWords={[]} onAdd={() => {}} />);
const mode = () => screen.getByRole("switch");

describe("wordbank sign mode", () => {
  it("shows a sign button only for words that have a recording, and opens and closes the video under the word", async () => {
    feed.load = async () => index(sign("table"));
    renderScreen();
    await screen.findByText("table");
    const btn = await screen.findByRole("button", { name: `${T.show}: table` });
    expect(screen.queryByRole("button", { name: `${T.show}: chair` })).toBeNull();
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(document.querySelector("video")).not.toBeNull();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(btn);
    expect(document.querySelector("video")).toBeNull();
  });

  it("a word kept out of the learning modules never shows, so it never gets a sign even if the data has one", async () => {
    renderScreen();
    await screen.findByText("table");
    expect(screen.queryByText("camel")).toBeNull();
    expect(screen.queryByRole("button", { name: /camel/ })).toBeNull();
  });

  it("the mode keeps the sound buttons, makes the sign button a labelled one, and is remembered across a reload", async () => {
    renderScreen();
    await screen.findByText("table");
    expect(screen.getAllByRole("button", { name: /^Тыңдау:/ }).length).toBe(2);
    expect(mode().getAttribute("aria-checked")).toBe("false");
    expect(mode().textContent).toContain(T.off);
    expect(screen.getByRole("button", { name: `${T.show}: table` }).textContent).toBe(""); // icon only outside the mode
    fireEvent.click(mode());
    expect(mode().getAttribute("aria-checked")).toBe("true");
    expect(mode().textContent).toContain(T.on);
    expect(screen.getByRole("button", { name: `${T.show}: table` }).textContent).toContain(T.show); // words in the mode
    expect(screen.getAllByRole("button", { name: /^Тыңдау:/ }).length).toBe(2);
    expect(localStorage.getItem("ertegi_deaf_mode")).toBe("1");
    cleanup();
    renderScreen();
    await screen.findByText("table");
    expect(mode().getAttribute("aria-checked")).toBe("true");
  });

  it("the mode counts real recordings at this level: placeholders do not count; none yet is said plainly", async () => {
    localStorage.setItem("ertegi_deaf_mode", "1");
    renderScreen();
    await screen.findByText("table");
    expect(await screen.findByText(`${T.countLevel} 1`)).toBeTruthy(); // table; chair is a placeholder, camel is kept out
    cleanup();
    feed.load = async () => index(sign("chair", { sample: true }));
    renderScreen();
    await waitFor(() => expect(screen.getByText(T.noneLevel)).toBeTruthy());
    expect(document.querySelector("video")).toBeNull();
  });

  it("when the sign list does not load the mode says so, not that there are none, and the dictionary still works", async () => {
    localStorage.setItem("ertegi_deaf_mode", "1");
    feed.load = async () => { throw new Error("chunk failed"); };
    renderScreen();
    await screen.findByText("table");
    await waitFor(() => expect(screen.getByText(T.loadError)).toBeTruthy());
    expect(screen.queryByText(T.noneLevel)).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Тыңдау:/ }).length).toBe(2);
  });
});
