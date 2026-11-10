// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

/* Quiz screen, redesign stage 5: the look changes, the logic does not. Two tries per
   question, the line from the tale after a wrong pick, the same quiz_answer events. */

const fx = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("../../utils/events", () => ({ track: fx.track }));
vi.mock("../../utils/voice", () => ({ safePlayVoice: vi.fn(), stopVoice: vi.fn() }));

const { QuizScreen } = await import("./QuizScreens");
const { DICT } = await import("../../dict");

afterEach(() => { cleanup(); fx.track.mockReset(); });

const questions = [
  { q: "What did Aldar Köse ride?", options: ["a horse", "a camel", "a donkey"], correct: 2 },
  { q: "Who was rich?", options: ["the bai", "Aldar"], correct: 0 },
  { q: "Where did they meet?", options: ["in the steppe", "in town", "at the river"], correct: 0 },
];
const tale = ["The bai was rich. Aldar Köse came to the bai riding a donkey."];

const show = () => render(
  <QuizScreen onReward={vi.fn()} t={DICT.kk} questions={questions} sourceTexts={tale} storyTitle="Aldar Köse" onExit={vi.fn()}
    eventInfo={{ story_id: "aldar_kose", level: "A1" }} />,
);
const radios = () => within(screen.getByRole("radiogroup")).getAllByRole("radio");
const sureIfAsked = () => {
  const sure = screen.queryByRole("button", { name: "Сенімдімін" });
  if (sure) fireEvent.click(sure);
};

describe("QuizScreen (redesign stage 5)", () => {
  it("header: «Жабу» 44 px and «n / total»; options are 60 px radios", () => {
    show();
    const close = screen.getByRole("button", { name: "Жабу" });
    expect(close.className).toMatch(/\bw-11\b/);
    expect(close.className).toMatch(/\bh-11\b/);
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(radios()).toHaveLength(3);
    for (const r of radios()) {
      expect(r.className).toMatch(/min-h-\[60px\]/);
      expect(r.getAttribute("aria-checked")).toBe("false");
    }
    fireEvent.click(radios()[1]);
    expect(radios()[1].getAttribute("aria-checked")).toBe("true");
  });

  it("a wrong pick: rose ✕ tile, «Әзірге дұрыс емес», the tale's line, tries left, «Тағы бір рет» back to the options", () => {
    show();
    fireEvent.click(radios()[0]);
    sureIfAsked();
    fireEvent.click(screen.getByRole("button", { name: "Тексеру" }));

    expect(radios()[0].className).toMatch(/text-rose/);
    expect((radios()[0] as HTMLButtonElement).disabled).toBe(true);
    const live = document.querySelector("[aria-live=polite]")!;
    expect(live.textContent).toContain("Әзірге дұрыс емес. Ертегіге қара:");
    expect(live.textContent).toContain("Aldar Köse came to the bai riding a donkey.");
    expect(live.querySelector("mark")?.textContent).toBe("Aldar"); // a word of the question, not the answer
    expect(live.textContent).toContain("1 мүмкіндік қалды · уақыт шектеусіз");
    expect(screen.queryByRole("button", { name: "Тексеру" })).toBeNull();

    fireEvent.click(within(live as HTMLElement).getByRole("button", { name: "Тағы бір рет" }));
    expect(document.activeElement).toBe(radios()[1]);

    // Same logic and log as before: the second try is attempt 2 with the tale's line as hint.
    fireEvent.click(radios()[2]);
    fireEvent.click(screen.getByRole("button", { name: "Тексеру" }));
    const answers = fx.track.mock.calls.filter((c) => c[0] === "quiz_answer").map((c) => c[1].result);
    expect(answers).toMatchObject([
      { correct: false, attempt: 1, choice: 0, hint: "none" },
      { correct: true, attempt: 2, choice: 2, hint: "evidence" },
    ]);
    expect(live.textContent).toContain("Дұрыс!");
    expect(screen.getByRole("button", { name: "Келесі" })).toBeTruthy();
  });

  it("a right first answer: «Дұрыс!», «Келесі», the segment turns jade", () => {
    show();
    fireEvent.click(radios()[2]);
    sureIfAsked();
    fireEvent.click(screen.getByRole("button", { name: "Тексеру" }));
    expect(document.querySelector("[aria-live=polite]")!.textContent).toContain("Дұрыс!");
    expect(document.querySelector("ol > li")!.className).toMatch(/bg-jade-ink/);
    fireEvent.click(screen.getByRole("button", { name: "Келесі" }));
    expect(screen.getByText("2 / 3")).toBeTruthy();
    expect(document.querySelectorAll("ol > li")[1].className).toMatch(/bg-ember/);
  });
});
