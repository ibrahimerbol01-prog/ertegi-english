// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WelcomeScreen } from "./WelcomeScreen";

/* First screen of the ordinary site, variant A (docs/product/landing-audit.md). */

const root = join(__dirname, "..", "..");
beforeEach(() => { localStorage.clear(); localStorage.setItem("ertegi_lang", "kk"); });
afterEach(() => cleanup());

describe("WelcomeScreen (DOM)", () => {
  it("the main button starts sign-up, the second one opens sign-in", () => {
    const onStart = vi.fn();
    render(<WelcomeScreen onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /бастау/i }));
    fireEvent.click(screen.getByRole("button", { name: /аккаунтым бар/i }));
    expect(onStart.mock.calls).toEqual([["signup"], ["signin"]]);
  });

  it("there is no second button that does the same as the main one (the old «Өткізіп жіберу»)", () => {
    render(<WelcomeScreen onStart={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /өткізіп жіберу|skip/i })).toBeNull();
  });

  it("switches the language kk ⇄ en and remembers it", () => {
    render(<WelcomeScreen onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "ENG" }));
    expect(screen.getByRole("button", { name: /get started/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /i have an account/i })).toBeTruthy();
    expect(localStorage.getItem("ertegi_lang")).toBe("en");
    expect(screen.getByRole("button", { name: "ENG" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("the 'what next' line says only what happens next, with no promises", () => {
    render(<WelcomeScreen onStart={vi.fn()} />);
    const line = screen.getByText(/келесі қадам/i).textContent ?? "";
    expect(line).toMatch(/тіркелу немесе кіру/);
    const dict = readFileSync(join(root, "src/dict.ts"), "utf8");
    for (const m of dict.matchAll(/wlNext: "([^"]+)"/g)) expect(m[1]).not.toMatch(/тегін|free|гарант|guarantee/i);
  });

  it("no new animation on the first screen", () => {
    expect(readFileSync(join(root, "src/components/WelcomeScreen.tsx"), "utf8")).not.toMatch(/animate-/);
  });
});
