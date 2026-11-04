import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cellFor, cleanCode, cleanNick, codeHasBadLetters, helpFlags, type Assignment, type ClassReport, type Member } from "./classes";
import { classSummaryCsv, csvCell, csvFileName, liveStreak, type ClassEvents } from "./classWork";

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

describe("streak as the learner sees it", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 4, 12)); });
  afterEach(() => vi.useRealTimers());
  it("counts today and yesterday, ends after a day off, nothing before the first day", () => {
    expect(liveStreak({ streak_days: 5, last_active_date: "2026-11-04" })).toBe(5);
    expect(liveStreak({ streak_days: 5, last_active_date: "2026-11-03" })).toBe(5);
    expect(liveStreak({ streak_days: 5, last_active_date: "2026-11-02" })).toBe(0);
    expect(liveStreak({ streak_days: 0, last_active_date: null })).toBe(0);
  });
});

// RFC 4180 reader, enough to check what Excel and Sheets will see.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r" && text[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

describe("CSV cells", () => {
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell("Aru, K")).toBe('"Aru, K"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
    expect(csvCell(" padded ")).toBe('" padded "');
    expect(csvCell("Аружан")).toBe("Аружан");
  });
  it("keeps formulas as text", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+77011234567")).toBe("'+77011234567");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell('=HYPERLINK("x","y")')).toBe(`"'=HYPERLINK(""x"",""y"")"`);
    expect(csvCell("\t=1")).toBe("'\t=1");
  });
  it("numbers and empties as they are", () => {
    expect(csvCell(0)).toBe("0");
    expect(csvCell(75)).toBe("75");
    expect(csvCell(null)).toBe("");
    expect(csvCell("")).toBe("");
  });
});

describe("class summary CSV", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 4, 12)); });
  afterEach(() => vi.useRealTimers());

  const full = (over: Partial<Member>): Member => ({
    user_id: "u", nickname: "x", joined_at: "2026-10-01T00:00:00Z", left_at: null, removed: false, xp: 0, streak_days: 0,
    last_active_date: null, words_total: 0, words_learned: 0, words_due: 0, steps: [], quizzes: [], ...over,
  });
  const report: ClassReport = {
    members: [
      full({
        user_id: "b", nickname: "=Bek, \"the\" best", xp: 120, streak_days: 3, last_active_date: "2026-11-04",
        words_total: 10, words_learned: 4, words_due: 2,
        steps: [{ story_id: "aldar_kose", step: "A1", completed_at: "2026-11-02T10:00:00Z" }],
        quizzes: [{ story_id: "aldar_kose", step: "A1", best: 0.75, total: 4, attempts: 2, last_at: "2026-11-02T10:00:00Z" }],
      }),
      full({ user_id: "a", nickname: "Аружан", xp: 40, streak_days: 6, last_active_date: "2026-10-30" }),
      // Left the class: not in the file.
      full({ user_id: "c", nickname: "Gone", left_at: "2026-11-01T00:00:00Z" }),
    ],
    assignments: [
      { id: "t2", story_id: "zhirenshe", step: "quiz", due_at: null, note: "", created_at: "2026-11-03T00:00:00Z" },
      { id: "t1", story_id: "aldar_kose", step: "A1", due_at: null, note: "", created_at: "2026-11-01T00:00:00Z" },
      // Given again: still one column.
      { id: "t3", story_id: "aldar_kose", step: "A1", due_at: null, note: "", created_at: "2026-11-04T00:00:00Z" },
    ],
  };
  const events: ClassEvents = {
    since: "2026-10-05T00:00:00Z",
    members: [{ user_id: "b", nickname: "=Bek", events: 42, by_verb: { word_tap: 40 }, active_days: 5, last_at: "2026-11-03T15:00:00Z" }],
    hard_words: [],
    hard_questions: [],
  };
  const titles: Record<string, string> = { aldar_kose: "Aldar Köse", zhirenshe: "Zhirenshe" };

  it("starts with a BOM, uses CRLF and one row per learner in the class", () => {
    const csv = classSummaryCsv(report, events, "en", (id) => titles[id]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
    const rows = parseCsv(csv.slice(1));
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.length === rows[0].length)).toBe(true);
    expect(rows[0]).toEqual([
      "Learner", "Active days (30 days)", "Last action", "Actions (30 days)", "XP", "Streak",
      "Words saved", "Words learned", "Words due", "Aldar Köse A1 %", "Zhirenshe Quiz %",
    ]);
  });

  it("fills activity from the log, progress from the report, quiz % or empty", () => {
    const rows = parseCsv(classSummaryCsv(report, events, "en", (id) => titles[id]).slice(1));
    const bek = rows.find((r) => r[0].includes("Bek"))!;
    // The nickname survives commas and quotes and can't run as a formula.
    expect(bek[0]).toBe(`'=Bek, "the" best`);
    expect(bek.slice(1)).toEqual(["5", "2026-11-03", "42", "120", "3", "10", "4", "2", "75", ""]);
    const aru = rows.find((r) => r[0] === "Аружан")!;
    // No events: empty activity, the profile's last day; the streak has ended.
    expect(aru.slice(1)).toEqual(["", "2026-10-30", "", "40", "0", "0", "0", "0", "", ""]);
  });

  it("works without the log and in Kazakh", () => {
    const rows = parseCsv(classSummaryCsv(report, null, "kk", (id) => titles[id]).slice(1));
    expect(rows[0][0]).toBe("Оқушы");
    expect(rows[0][10]).toBe("Zhirenshe Сынақ %");
    expect(rows.find((r) => r[0].includes("Bek"))!.slice(1, 4)).toEqual(["", "2026-11-04", ""]);
  });

  it("an empty class is just the header", () => {
    expect(parseCsv(classSummaryCsv({ members: [], assignments: [] }, null, "en").slice(1))).toHaveLength(1);
  });
});

describe("CSV file name", () => {
  it("keeps letters and digits, Cyrillic too, and nothing a file system dislikes", () => {
    expect(csvFileName("7А сынып", "2026-11-04")).toBe("ertegi-7А-сынып-2026-11-04.csv");
    expect(csvFileName("../evil/:*?<>|", "2026-11-04")).toBe("ertegi-evil-2026-11-04.csv");
    expect(csvFileName("   ", "2026-11-04")).toBe("ertegi-class-2026-11-04.csv");
    expect(csvFileName("a".repeat(80), "2026-11-04")).toBe(`ertegi-${"a".repeat(40)}-2026-11-04.csv`);
  });
});
