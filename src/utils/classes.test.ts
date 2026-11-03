import { describe, expect, it } from "vitest";
import { cellFor, cleanCode, cleanNick, codeHasBadLetters, helpFlags, type Assignment, type Member } from "./classes";

describe("class codes as people type them", () => {
  it.each([
    ["kt7m2q", "KT7M2Q"],
    ["kt7-m2q", "KT7M2Q"],
    ["КТ7М2Q", "KT7M2Q"], // Cyrillic look-alikes from a Kazakh keyboard
    ["Code: KT7M2Q", "KT7M2Q"],
    ["https://ertegi-english.vercel.app/?class=KT7M2Q", "KT7M2Q"],
  ])("%s → %s", (typed, code) => expect(cleanCode(typed)).toBe(code));

  it("flags letters a code never has", () => {
    expect(codeHasBadLetters("KT7M2Q")).toBe(false);
    expect(codeHasBadLetters("KT0M1Q")).toBe(true);
  });
});

describe("nicknames", () => {
  it("removes invisible characters and odd spaces", () => {
    expect(cleanNick("  Ai​gerim  K ")).toBe("Aigerim K");
    expect(cleanNick("ㅤ")).toBe("");
  });
});

const member = (over: Partial<Member> = {}): Member =>
  ({ steps: [], quizzes: [], last_active_date: "2026-11-03", ...over }) as Member;
const task = (over: Partial<Assignment> = {}): Assignment =>
  ({ id: "a1", story_id: "aldar_kose", step: "A1", due_at: "2026-11-05T18:59:59.000Z", note: "", ...over }) as Assignment;
const now = new Date("2026-11-04T12:00:00Z");

describe("teacher grid cells", () => {
  it("open before the date, overdue after it", () => {
    expect(cellFor(member(), task(), now).status).toBe("open");
    expect(cellFor(member(), task(), new Date("2026-11-06T00:00:00Z")).status).toBe("overdue");
  });
  it("done only with a passed quiz (60%)", () => {
    const steps = [{ story_id: "aldar_kose", step: "A1", completed_at: "2026-11-04T10:00:00Z" }];
    const quiz = (best: number) => [{ story_id: "aldar_kose", step: "A1", best, total: 4, attempts: 1, last_at: "2026-11-04T10:00:00Z" }];
    expect(cellFor(member({ steps, quizzes: quiz(0.75) } as Partial<Member>), task(), now)).toMatchObject({ status: "done", score: 75 });
    expect(cellFor(member({ steps, quizzes: quiz(0.6) } as Partial<Member>), task(), now).status).toBe("done");
    expect(cellFor(member({ steps, quizzes: quiz(0.5) } as Partial<Member>), task(), now).status).toBe("open");
  });
  it("late when finished after the date", () => {
    const steps = [{ story_id: "aldar_kose", step: "A1", completed_at: "2026-11-07T10:00:00Z" }];
    expect(cellFor(member({ steps } as Partial<Member>), task(), now).status).toBe("late");
  });
  it("the same level given twice is one problem", () => {
    const flags = helpFlags(member(), [task({ due_at: "2026-01-01T00:00:00Z" }), task({ id: "a2", due_at: "2026-01-02T00:00:00Z" })]);
    expect(flags.find((f) => f.kind === "overdue")?.detail).toBe(1);
  });
});
