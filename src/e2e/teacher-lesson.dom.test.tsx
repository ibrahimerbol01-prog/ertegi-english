// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/* Q9: a teacher's lesson, end to end, on a faked Supabase with memory.
   Teacher creates a class and gives «Aldar Köse, A1» → a learner joins with the code →
   opens the assignment from Home → reads and takes the quiz → the teacher sees the score.

   Only the database is faked. It keeps classes, members, assignments, quiz results and
   finished levels, and answers my_classes / class_report from them in the shape the app
   reads (src/utils/classes.ts). The SQL itself (supabase/migrations) is not under test
   here: this checks that the app sends what the teacher's report needs and shows it. */

configure({ asyncUtilTimeout: 10_000 });

const TEACHER = { id: "00000000-0000-0000-0000-0000000000a1", role: "teacher", name: "Gulnar" };
const LEARNER = { id: "00000000-0000-0000-0000-0000000000b2", role: "student", name: "Aru" };
type Who = typeof TEACHER;
let who: Who = TEACHER;

type Row = Record<string, unknown>;
const db = {
  classes: [] as Row[],
  members: [] as { class_id: string; user_id: string; nickname: string; joined_at: string }[],
  assignments: [] as Row[],
  quiz_results: [] as Row[],
  story_progress: [] as Row[],
};
const now = () => new Date().toISOString();
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "Content-Type": "application/json" } });

function memberReport(classId: string) {
  return db.members.filter((m) => m.class_id === classId).map((m) => {
    const mine = db.quiz_results.filter((q) => q.user_id === m.user_id);
    const keys = [...new Set(mine.map((q) => `${q.story_id}:${q.step}`))];
    return {
      user_id: m.user_id, nickname: m.nickname, joined_at: m.joined_at, left_at: null, removed: false,
      xp: 0, streak_days: 1, last_active_date: now().slice(0, 10), words_total: 0, words_learned: 0, words_due: 0,
      steps: db.story_progress.filter((p) => p.user_id === m.user_id).map((p) => ({ story_id: p.story_id, step: p.step, completed_at: now() })),
      quizzes: keys.map((k) => {
        const rows = mine.filter((q) => `${q.story_id}:${q.step}` === k);
        const best = Math.max(...rows.map((q) => (q.score as number) / (q.total as number)));
        return { story_id: rows[0].story_id, step: rows[0].step, best, total: rows[0].total, attempts: rows.length, last_at: now() };
      }),
    };
  });
}

function rpc(name: string, args: Row) {
  switch (name) {
    case "request_teacher_role": return json("approved");
    case "create_class": {
      const c = { id: `c${db.classes.length + 1}`, name: args.p_name, code: "KT7M2Q", archived_at: null, created_at: now(), teacher_id: who.id };
      db.classes.push(c);
      return json(c);
    }
    case "join_class": {
      const c = db.classes.find((x) => x.code === args.p_code);
      if (!c) return json({ code: "P0001", message: "not_found" }, 400);
      if (!db.members.some((m) => m.class_id === c.id && m.user_id === who.id)) db.members.push({ class_id: c.id as string, user_id: who.id, nickname: who.name, joined_at: now() });
      return json({ class_id: c.id, name: c.name });
    }
    case "my_classes": return json(db.members.filter((m) => m.user_id === who.id).map((m) => {
      const c = db.classes.find((x) => x.id === m.class_id)!;
      return { class_id: c.id, name: c.name, nickname: m.nickname, archived: false, assignments: db.assignments.filter((a) => a.class_id === c.id) };
    }));
    case "class_report": return json({ members: memberReport(args.p_class as string), assignments: db.assignments.filter((a) => a.class_id === args.p_class) });
    default: return json(null);
  }
}

beforeEach(() => {
  for (const k of Object.keys(db) as (keyof typeof db)[]) db[k].length = 0;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input instanceof Request ? input.url : input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const rpcName = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)/)?.[1];
    if (rpcName) return rpc(rpcName, body);
    const table = url.pathname.match(/^\/rest\/v1\/(\w+)/)?.[1];
    if (!table) return json({});
    const rows = (Array.isArray(body) ? body : [body]) as Row[];
    if (method === "POST" && table === "assignments") { for (const r of rows) db.assignments.push({ id: `a${db.assignments.length + 1}`, created_at: now(), note: "", due_at: null, ...r }); return json([], 201); }
    if (method === "POST" && (table === "quiz_results" || table === "story_progress")) { for (const r of rows) db[table].push({ user_id: who.id, ...r }); return json([], 201); }
    if (method === "GET" && table === "classes") return json(db.classes.filter((c) => c.teacher_id === who.id));
    if (method === "GET" && table === "profiles") {
      const p = { id: who.id, display_name: who.name, role: who.role, xp: 0, streak_days: 0 };
      return json((init?.headers && new Headers(init.headers).get("Accept")?.includes("vnd.pgrst.object")) ? p : [p]);
    }
    return json([]);
  }));
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn() as unknown as Element["scrollTo"];
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = vi.fn((q: string) => ({ matches: false, media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof window.matchMedia;
  window.HTMLMediaElement.prototype.play = vi.fn(async () => {});
  window.HTMLMediaElement.prototype.pause = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

// Sign in as `as`: a saved session, a fresh copy of the app (the Supabase client keeps its session in memory).
async function signIn(as: Who) {
  cleanup();
  localStorage.clear();
  who = as;
  const t = Math.floor(Date.now() / 1000);
  localStorage.setItem("sb-tsialjlxlhwemrkyyvjv-auth-token", JSON.stringify({
    access_token: `jwt-${as.role}`, refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: t + 3600,
    user: { id: as.id, aud: "authenticated", email: `${as.name.toLowerCase()}@example.test`, app_metadata: {}, user_metadata: { role: as.role, display_name: as.name }, created_at: "2026-01-01" },
  }));
  vi.resetModules();
  const App = (await import("../App")).default;
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Кіру" }));
}
const button = (re: RegExp) => {
  const b = screen.queryAllByRole("button").find((x) => re.test(x.textContent?.trim() ?? ""));
  if (!b) throw new Error(`no button ${re}`);
  return b;
};

describe("a teacher's lesson (Q9)", () => {
  it("class → code → assignment → the learner's quiz → the teacher sees the score", async () => {
    // 1. Teacher: a class and an assignment «Aldar Köse · A1».
    await signIn(TEACHER);
    fireEvent.change(await screen.findByLabelText("Жаңа сынып"), { target: { value: "7A" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ашу$/ }));
    // A new class opens at once, with its join code.
    expect(await screen.findByText("KT7M2Q")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Тапсырмалар" }));
    fireEvent.click(await screen.findByRole("button", { name: "A1" }));
    fireEvent.click(screen.getByRole("button", { name: /Тапсырма беру/ }));
    await waitFor(() => expect(db.assignments).toHaveLength(1));
    expect(db.assignments[0]).toMatchObject({ class_id: "c1", story_id: "aldar_kose", step: "A1" });

    // 2. Learner: joins with the code from Me.
    await signIn(LEARNER);
    expect(await screen.findByText(/Сәлем, Aru!/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Мен" })[0]);
    fireEvent.click(await waitFor(() => button(/Сыныпқа кодпен қосылу/)));
    fireEvent.change(await screen.findByLabelText("Сынып коды"), { target: { value: "kt7-m2q" } });
    fireEvent.click(screen.getByRole("button", { name: "Қосылу" }));
    await waitFor(() => expect(db.members).toHaveLength(1));

    // 3. The assignment on Home opens the tale at A1; the quiz from the end of the tale.
    fireEvent.click(screen.getAllByRole("button", { name: "Басты" })[0]);
    const tasks = await screen.findByRole("region", { name: /тапсырма|Тапсырма/ }).catch(() => screen.findByLabelText(/тапсырма/i));
    fireEvent.click(await waitFor(() => within(tasks as HTMLElement).getAllByRole("button").find((b) => /Aldar Köse/.test(b.textContent ?? ""))!));
    fireEvent.click(await waitFor(() => button(/^Сынақтан өту/)));
    fireEvent.click(await screen.findByRole("button", { name: "Бастау" }));
    for (let step = 0; step < 30 && !screen.queryByText(/Сынақ өтті|Сабақ аяқталды|Аз қалды/); step++) {
      const skip = screen.queryAllByRole("button").find((b) => b.textContent?.trim() === "Өткізу");
      if (skip) { fireEvent.click(skip); continue; }
      const next = screen.queryAllByRole("button").find((b) => /^(Келесі|Жалғастыру|Нәтижені көру)$/.test(b.textContent?.trim() ?? ""));
      if (next) { fireEvent.click(next); continue; }
      const opt = [...document.querySelectorAll("[role=radiogroup] button.tile[role=radio]")].find((b) => !(b as HTMLButtonElement).disabled);
      if (!opt) { await new Promise((r) => setTimeout(r, 50)); continue; }
      fireEvent.click(opt);
      const sure = screen.queryAllByRole("button").find((b) => b.textContent?.trim() === "Сенімдімін");
      if (sure) fireEvent.click(sure);
      fireEvent.click(button(/^Тексеру$/));
    }
    await waitFor(() => expect(db.quiz_results).toHaveLength(1));
    const result = db.quiz_results[0];
    expect(result).toMatchObject({ user_id: LEARNER.id, story_id: "aldar_kose", step: "A1", total: 4 });

    // 4. Teacher: the class grid shows Aru's score on that assignment.
    await signIn(TEACHER);
    fireEvent.click(await screen.findByRole("button", { name: /7A/ }));
    const pct = `${Math.round(((result.score as number) / (result.total as number)) * 100)}%`;
    const row = (await screen.findByText("Aru", { selector: "th *, th" })).closest("tr")!;
    await waitFor(() => expect(row.textContent).toContain(pct));
  }, 60_000);
});
