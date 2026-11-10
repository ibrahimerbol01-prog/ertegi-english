// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProfileScreen } from "./ProfileScreen";
import { DICT } from "../../dict";

/* «Мен» (redesign Q3): heroes' cards above the stats, an empty state instead of four zeros,
   and «Профильді өзгерту» on a row of its own so it stays on one line at 360 px. */

afterEach(cleanup);
const t = DICT.kk;
const show = (over: { xp?: number; savedWordsCount?: number } = {}) => render(
  <ProfileScreen xp={0} t={t} lang="kk" userName="Айгерім" onSignOut={() => {}}
    cardsEntry={<section>Батырлар карталары</section>}
    editor={<button type="button">{t.peEdit}</button>}
    {...over} />,
);

describe("ProfileScreen (redesign Q3)", () => {
  it("a new learner sees «Деректер әлі жоқ» instead of four zero tiles", () => {
    show();
    expect(screen.getByText(t.noDataYet)).toBeTruthy();
    expect(screen.queryByText(t.streakLabel)).toBeNull();
  });

  it("with any progress the four tiles are back", () => {
    show({ xp: 30, savedWordsCount: 2 });
    expect(screen.queryByText(t.noDataYet)).toBeNull();
    expect(screen.getByText(t.streakLabel)).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
  });

  it("heroes' cards come before the stats", () => {
    show();
    const cards = screen.getByText("Батырлар карталары");
    const stats = screen.getByRole("heading", { name: "Статистика" });
    expect(cards.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("«Профильді өзгерту» sits on its own row, not in the column beside the avatar, and does not wrap", () => {
    show();
    const row = screen.getByRole("button", { name: t.peEdit }).parentElement!;
    expect(row.className).toMatch(/whitespace-nowrap/);
    expect(row.contains(screen.getByRole("heading", { level: 1 }))).toBe(false);
  });
});
