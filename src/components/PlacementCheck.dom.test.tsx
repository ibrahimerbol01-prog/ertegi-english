// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import placementFile from "../data/placement.json";
import type { PlacementItem } from "../utils/placement";
import PlacementCheck from "./PlacementCheck";

/* Placement check as a learner meets it (Task 12 B). Nothing leaves the device. */

const items = (placementFile as { items: PlacementItem[] }).items;
const root = join(__dirname, "..", "..");
beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

const answerAll = (known: (i: PlacementItem) => boolean) => {
  for (const it of items) {
    expect(screen.getByText(it.word)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: known(it) ? "I know it" : "I don't know" }));
  }
};

describe("PlacementCheck (DOM)", () => {
  it("home: offered with Start and Later; Later hides it for good on the home screen", () => {
    const { unmount } = render(<PlacementCheck userId="u1" lang="en" place="home" onRead={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /later/i }));
    expect(screen.queryByText(/check your level/i)).toBeNull();
    unmount();
    render(<PlacementCheck userId="u1" lang="en" place="home" onRead={vi.fn()} />);
    expect(screen.queryByText(/check your level/i)).toBeNull();
  });

  it("profile: still offered after a skip, so it can be taken any time", () => {
    localStorage.setItem("ertegi_placement_u1", JSON.stringify({ skipped: "2026-11-06T00:00:00Z" }));
    render(<PlacementCheck userId="u1" lang="en" place="profile" onRead={vi.fn()} />);
    expect(screen.getByRole("button", { name: /start/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /later/i })).toBeNull();
  });

  it("20 words one by one, then an estimate that is not a diagnosis and a way to start reading", () => {
    const onRead = vi.fn();
    render(<PlacementCheck userId="u1" lang="en" place="home" onRead={onRead} />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    answerAll((i) => !i.pseudo && (i.level === "A1" || i.level === "A2"));
    expect(screen.getByText("About A2")).toBeTruthy();
    expect(screen.getByText(/rough estimate, not an exam/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /read a tale at a2/i }));
    expect(onRead).toHaveBeenCalledWith("A2");
    expect(JSON.parse(localStorage.getItem("ertegi_placement_u1")!).done.level).toBe("A2");
  });

  it("saying yes to made-up words gets a note to try again; it can be retaken", () => {
    render(<PlacementCheck userId="u1" lang="en" place="profile" onRead={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    answerAll(() => true);
    expect(screen.getByRole("note").textContent).toMatch(/made-up words/i);
    fireEvent.click(screen.getByRole("button", { name: /take it again/i }));
    expect(screen.getByText("1 / 20")).toBeTruthy();
  });

  it("logs no learning event and sends nothing", () => {
    const src = readFileSync(join(root, "src/components/PlacementCheck.tsx"), "utf8") + readFileSync(join(root, "src/utils/placement.ts"), "utf8");
    expect(src).not.toMatch(/track\(|supabase|fetch\(/);
  });
});
