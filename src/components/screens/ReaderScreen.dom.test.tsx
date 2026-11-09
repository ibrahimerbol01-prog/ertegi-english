// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { wordTap } from "../../utils/wordTap";
import { WORD_TRANSLATIONS } from "../../constants";

/* The reader's core action for the study (owner's decision 4): a tap on a word
   shows its meaning and logs word_tap. Speech and the event log are fakes. */

const fx = vi.hoisted(() => ({ track: vi.fn(), say: vi.fn() }));
vi.mock("../../utils/events", () => ({ track: fx.track }));
vi.mock("../../utils/voice", () => ({ safePlayVoice: fx.say, stopVoice: vi.fn() }));
vi.mock("../../utils/narration", () => ({
  narrate: vi.fn(async () => ({ stop: vi.fn() })), alignWords: vi.fn(() => []), bestBrowserVoice: vi.fn(() => null), primeAudio: vi.fn(),
}));
vi.mock("../../lib/supabase", () => ({ supabase: { from: () => ({ select: () => ({}) }) } }));

const { ReaderScreen } = await import("./ReaderScreen");
const { DICT } = await import("../../dict");
const { LangContext } = await import("../../lang");

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.HTMLMediaElement.prototype.play = vi.fn(async () => {});
  window.HTMLMediaElement.prototype.pause = vi.fn();
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("wordTap (pure)", () => {
  it("finds the meaning through the glossary keys and builds the word_tap event", () => {
    const g = { man: "адам", "didn't": "істемеді" };
    expect(wordTap("man's", g, "aldar_kose", "A1", false)).toEqual({
      translation: "адам",
      event: { object_type: "word", object_id: "man", story_id: "aldar_kose", level: "A1", result: { has_translation: true, during_audio: false } },
    });
    const none = wordTap("Wolf!", g, "er_tostik", "B1", true);
    expect(none.translation).toBeUndefined();
    expect(none.event).toMatchObject({ object_id: "wolf", result: { has_translation: false, during_audio: true } });
  });
});

describe("ReaderScreen (DOM)", () => {
  const open = () => render(
    <LangContext.Provider value="en">
      <ReaderScreen selectedStory="aldar_kose" setSelectedStory={vi.fn()} selectedLevel="A1" setSelectedLevel={vi.fn()}
        onQuizGate={vi.fn()} t={DICT.en} lang="en" onReward={vi.fn()} savedWords={[]} onSaveWord={vi.fn()} userId="u1" />
    </LangContext.Provider>,
  );

  it("a tap on a word logs word_tap with the tale and level, says the word and shows its meaning", () => {
    open();
    const word = screen.getAllByRole("button").find((b) => (b.textContent ?? "").trim() === "Aldar")!;
    expect(word).toBeTruthy();
    fireEvent.click(word);
    expect(fx.track).toHaveBeenCalledWith("word_tap", {
      object_type: "word", object_id: "aldar", story_id: "aldar_kose", level: "A1",
      result: { has_translation: true, during_audio: false },
    });
    expect(fx.say).toHaveBeenCalledWith("Aldar");
    expect(screen.getAllByText(WORD_TRANSLATIONS.aldar).length).toBeGreaterThan(0);
  });

  it("no other learning event is logged by just opening the tale and tapping", () => {
    open();
    fireEvent.click(screen.getAllByRole("button").find((b) => (b.textContent ?? "").trim() === "Aldar")!);
    const verbs = fx.track.mock.calls.map((c) => c[0]);
    expect(verbs.filter((v) => v === "word_tap")).toHaveLength(1);
  });
});
