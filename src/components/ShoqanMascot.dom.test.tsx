// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import ShoqanMascot, { moodFor } from "./ShoqanMascot";

afterEach(cleanup);

describe("moodFor", () => {
  it("today is happy, one or two days calm, three or more cold, never null is calm", () => {
    expect(moodFor(0)).toBe("happy");
    expect(moodFor(1)).toBe("calm");
    expect(moodFor(2)).toBe("calm");
    expect(moodFor(3)).toBe("sad");
    expect(moodFor(30)).toBe("sad");
    expect(moodFor(null)).toBe("calm");
  });
});

describe("ShoqanMascot (DOM)", () => {
  it("shows the cold Shoqan after a long break, and he never scolds", () => {
    render(<ShoqanMascot daysAway={5} lang="en" />);
    expect(screen.getByRole("img", { name: /cold/i })).toBeTruthy();
    expect(screen.getByText(/waiting for you/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/lost|failed|streak/i);
  });

  it("is happy on a day with activity", () => {
    render(<ShoqanMascot daysAway={0} lang="kk" />);
    expect(screen.getByRole("img", { name: /қуанып/i })).toBeTruthy();
  });

  it("answers a tap with a line of his own", () => {
    render(<ShoqanMascot daysAway={1} lang="en" />);
    expect(screen.getByText(/Shall we read a tale/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /poke shoqan/i }));
    expect(screen.queryByText(/Shall we read a tale/i)).toBeNull();
    expect(screen.getByText(/tickles|right here|Back to the tale/i)).toBeTruthy();
  });
});
