// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SignVideoCard from "./SignVideoCard";
import { SIGN_T } from "./signI18n";
import type { SignEntry } from "../utils/signs";

/* The sign video card: controls, silence, one video at a time, honest source line.
   jsdom has no media engine, so play/pause are spies. */

const T = SIGN_T.kk;
const entry: SignEntry = {
  word: "table",
  video: { mp4: "/signs/table.mp4", webm: "/signs/table.webm", poster: "/signs/table.jpg" },
  language: "test sign language",
  signer: "signer-01",
  reviewedBy: "native signer",
  licence: "CC BY 4.0",
};

let play: ReturnType<typeof vi.spyOn>;
const media = (reduce = false) => {
  window.matchMedia = ((q: string) => ({ matches: reduce, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
};

beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  media();
});
afterEach(() => { cleanup(); });

const video = () => document.querySelector("video") as HTMLVideoElement;
const lastSource = () => document.querySelector("source:last-of-type") as HTMLElement;

describe("SignVideoCard", () => {
  it("is a silent, looping, unpreloaded video, mp4 first and webm after it, with the full source line", () => {
    render(<SignVideoCard entry={entry} word="table" meaning="үстел" />);
    const v = video();
    expect(v.muted).toBe(true);
    expect(v.loop).toBe(true);
    expect(v.getAttribute("preload")).toBe("none");
    expect(v.getAttribute("poster")).toBe("/signs/table.jpg");
    expect([...v.querySelectorAll("source")].map((s) => s.getAttribute("src"))).toEqual(["/signs/table.mp4", "/signs/table.webm"]);
    const line = screen.getByText(/signer-01/).textContent ?? "";
    for (const part of ["test sign language", "signer-01", "native signer", "CC BY 4.0"]) expect(line).toContain(part);
    expect(screen.getByText("үстел")).toBeTruthy();
    expect(screen.queryByText(T.sample)).toBeNull();
  });

  it("does not start by itself; autoPlay starts it, also with reduced motion, but then it does not loop", () => {
    render(<SignVideoCard entry={entry} word="table" />);
    expect(play).not.toHaveBeenCalled();
    cleanup();
    render(<SignVideoCard entry={entry} word="table" autoPlay />);
    expect(play).toHaveBeenCalledTimes(1);
    cleanup();
    play.mockClear();
    media(true);
    render(<SignVideoCard entry={entry} word="table" autoPlay />);
    expect(play).toHaveBeenCalledTimes(1);
    expect(video().loop).toBe(false);
  });

  it("Slow sets 0.5× and back, Mirror flips the picture; the pressed state is in the name of the control's state and on screen", () => {
    render(<SignVideoCard entry={entry} word="table" />);
    const slow = screen.getByRole("button", { name: new RegExp(T.slow.replace(/[()×.]/g, "\\$&")) });
    const mirror = screen.getByRole("button", { name: T.mirror });
    expect(slow.getAttribute("aria-pressed")).toBe("false");
    const icon = (b: HTMLElement) => b.querySelector("svg")?.getAttribute("class") ?? "";
    const before = icon(slow);
    fireEvent.click(slow);
    expect(video().playbackRate).toBe(0.5);
    expect(slow.getAttribute("aria-pressed")).toBe("true");
    expect(icon(slow)).not.toBe(before); // a check mark appears: state is not shown by colour alone
    fireEvent.click(slow);
    expect(video().playbackRate).toBe(1);
    fireEvent.click(mirror);
    expect(video().style.transform).toBe("scaleX(-1)");
    expect(mirror.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(mirror);
    expect(video().style.transform).toBe("");
  });

  it("Replay rewinds and plays; Play/Pause follows the video's own events", () => {
    render(<SignVideoCard entry={entry} word="table" />);
    const v = video();
    v.currentTime = 3;
    fireEvent.click(screen.getByRole("button", { name: T.replay }));
    expect(v.currentTime).toBe(0);
    expect(play).toHaveBeenCalled();
    fireEvent.play(v);
    expect(screen.getByRole("button", { name: T.pause })).toBeTruthy();
    fireEvent.pause(v);
    expect(screen.getByRole("button", { name: T.play })).toBeTruthy();
  });

  it("a pause or a blocked start while loading is not a broken video; a real refusal is", async () => {
    render(<SignVideoCard entry={entry} word="table" />);
    play.mockRejectedValueOnce(Object.assign(new Error("interrupted"), { name: "AbortError" }));
    fireEvent.click(screen.getByRole("button", { name: T.play }));
    await Promise.resolve(); await Promise.resolve();
    expect(screen.queryByRole("alert")).toBeNull();
    play.mockRejectedValueOnce(Object.assign(new Error("blocked"), { name: "NotAllowedError" }));
    fireEvent.click(screen.getByRole("button", { name: T.play }));
    await Promise.resolve(); await Promise.resolve();
    expect(screen.queryByRole("alert")).toBeNull();
    play.mockRejectedValueOnce(Object.assign(new Error("bad media"), { name: "NotSupportedError" }));
    fireEvent.click(screen.getByRole("button", { name: T.play }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  });

  it("only the last source failing fails the video; retry brings the player back, keeps Slow, resets Play/Pause and focuses the first control", () => {
    render(<SignVideoCard entry={entry} word="table" />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp("Баяу") })); // slow on
    fireEvent.play(video());
    fireEvent.error(document.querySelector("source") as HTMLElement); // first source: browser moves on
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.error(lastSource());
    expect(screen.getByRole("alert").textContent).toContain(T.error);
    expect(document.querySelector("video")).toBeNull();
    // a decode error of the video itself is a failure too
    fireEvent.click(screen.getByRole("button", { name: T.retry }));
    fireEvent.error(video());
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: T.retry }));
    expect(document.querySelector("video")).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(video().playbackRate).toBe(0.5);
    expect(screen.getByRole("button", { name: T.play })).toBeTruthy(); // not "Pause"
    expect(document.activeElement).toBe(screen.getByRole("button", { name: T.play }));
  });

  it("only one sign plays at a time", () => {
    render(<><SignVideoCard entry={entry} word="table" /><SignVideoCard entry={{ ...entry, word: "chair" }} word="chair" /></>);
    const [a, b] = [...document.querySelectorAll("video")] as HTMLVideoElement[];
    Object.defineProperty(a, "paused", { configurable: true, value: false });
    const pauseA = vi.spyOn(a, "pause");
    fireEvent.play(b);
    expect(pauseA).toHaveBeenCalled();
  });

  it("a placeholder is badged and shows no signer or licence, only that it is not a sign", () => {
    render(<SignVideoCard entry={{ ...entry, sample: true }} word="table" />);
    expect(screen.getByText(T.sample)).toBeTruthy();
    expect(screen.getByText(T.sampleNote)).toBeTruthy();
    expect(screen.queryByText(/signer-01/)).toBeNull();
  });
});
