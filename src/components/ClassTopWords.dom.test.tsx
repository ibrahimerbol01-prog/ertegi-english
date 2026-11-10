// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ClassTopWords } from "./ClassTopWords";

afterEach(cleanup);
const w = (word: string, learners: number, taps = 4) => ({ word, learners, taps, misses: 0 });

describe("ClassTopWords", () => {
  it("lists the top tapped words with learner counts, and the totals-only note", () => {
    render(<ClassTopWords kk words={[w("coat", 4), w("horse", 6), w("alone", 1)]} />);
    const card = screen.getByRole("region", { name: "Сынып жиі басқан сөздер" });
    const items = within(card).getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["horse6 оқушы", "coat4 оқушы"]);
    expect(within(card).queryByText("alone")).toBeNull();
    expect(within(card).getByText("Тізім тек жинақталған сан көрсетеді, жеке оқушыны атамайды.")).toBeTruthy();
  });
  it("shows the empty state when no word has enough learners", () => {
    render(<ClassTopWords kk={false} words={[w("pair", 2)]} />);
    expect(screen.getByText("No data yet")).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
