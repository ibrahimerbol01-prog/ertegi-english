import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement, type FunctionComponent, type PropsWithChildren, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStudyCode, writeStudyCode } from "./studyCode";
import { writeAssent } from "./assent";
import assentFile from "../data/studyAssent.json";

/* Research contour, stage 0: the screens as the research build renders them.
   The build flag is mocked (tests run as the ordinary build, vitest.config.ts);
   screens are rendered to HTML in node, so what a learner would see is checked
   without a browser. Effects do not run in this render, so the parts that live
   in effects (EventsOn, the app's own setEventsUser) are checked in the source. */

vi.mock("./mode", () => ({ RESEARCH_MODE: true, STUDY_ID: "ertegi-stage0-test" }));
vi.mock("../lib/supabase", () => ({
  supabase: { from: () => ({ upsert: async () => ({ error: null }), select: () => ({}) }), rpc: async () => ({ data: null, error: null }) },
}));

const { StudyGate } = await import("./StudyGate");
const { HomeScreen } = await import("../components/screens/HomeScreen");
const { QuizScreen } = await import("../components/screens/QuizScreens");
const { default: TestScreen } = await import("./test/TestScreen");
const { LangContext } = await import("../lang");
const { DICT, STORIES } = await import("../constants");
const { RESEARCH_MODE } = await import("./mode");

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const ASSENT = assentFile as unknown as { version: string; texts: Record<"kk" | "ru", { title: string; declinedTitle: string }> };
const CODE = makeStudyCode(572);
const CHILD = "APP-BEHIND-THE-GATE";
const Gate = StudyGate as FunctionComponent<PropsWithChildren<{ userId: string; lang: "kk" | "en" }>>;

const html = (node: ReactNode, lang: "kk" | "en" = "kk") =>
  renderToStaticMarkup(createElement(LangContext.Provider, { value: lang }, node));
const gate = (uid: string) => html(createElement(Gate, { userId: uid, lang: "kk" }, createElement("main", null, CHILD)));
/** What a learner sees, without markup; Shoqan in both scripts. */
const text = (h: string) => h.replace(/<[^>]+>/g, " ");
const SHOQAN = /shoqan|шоқан/i;

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  fetchSpy = vi.fn(async () => new Response("{}"));
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("research contour: the gate keeps the app (and its events) closed until yes (item 1)", () => {
  it("the mock really is the research build", () => expect(RESEARCH_MODE).toBe(true));

  it("no participant code: only the code form, the app is not rendered", () => {
    const h = gate("g1");
    expect(h).not.toContain(CHILD);
    expect(h).toContain("ERT-0000");
  });

  it("code but no answer yet: only the assent text, the app is not rendered", () => {
    writeStudyCode(localStorage, "g2", CODE);
    const h = gate("g2");
    expect(h).not.toContain(CHILD);
    expect(h).toContain(ASSENT.texts.kk.title.slice(0, 20));
  });

  it("answer no: the declined screen, the app is not rendered", () => {
    writeStudyCode(localStorage, "g3", CODE);
    writeAssent(localStorage, "g3", { version: ASSENT.version, answer: "no", at: "", sample: true });
    const h = gate("g3");
    expect(h).not.toContain(CHILD);
    expect(h).toContain(ASSENT.texts.kk.declinedTitle.slice(0, 20));
  });

  it("a yes to an older text version does not count: asked again, the app is not rendered", () => {
    writeStudyCode(localStorage, "g4", CODE);
    writeAssent(localStorage, "g4", { version: `${ASSENT.version}-old`, answer: "yes", at: "", sample: true });
    expect(gate("g4")).not.toContain(CHILD);
  });

  it("a yes to the current text opens the app", () => {
    writeStudyCode(localStorage, "g5", CODE);
    writeAssent(localStorage, "g5", { version: ASSENT.version, answer: "yes", at: "", sample: true });
    expect(gate("g5")).toContain(CHILD);
  });

  it("only the gate switches events on: EventsOn wraps the app only on yes, the app's own switch is off in the research build", () => {
    const g = read("src/research/StudyGate.tsx");
    expect(g).toMatch(/if \(status === "yes"\) return <EventsOn userId=\{userId\}>\{children\}<\/EventsOn>;/);
    expect(g.match(/setEventsUser\(/g)?.length).toBe(2); // on (userId) and off (null) inside EventsOn only
    expect(g).toMatch(/setEventsUser\(userId\);\s*return \(\) => setEventsUser\(null\);/);
    const app = read("src/KazakhTalesApp.tsx");
    expect(app).toMatch(/useEffect\(\(\) => \{\s*if \(RESEARCH_MODE\) return;\s*setEventsUser\(/);
    expect(app).toContain("return RESEARCH_MODE && !teacher ? <StudyGate userId={userId} lang={lang}>{app}</StudyGate> : app;");
    // Nothing else in the app switches the event log on.
    const callers = srcFiles().filter((f) => !f.endsWith(".test.ts") && /setEventsUser\(/.test(read(f))).sort();
    expect(callers).toEqual(["src/KazakhTalesApp.tsx", "src/research/StudyGate.tsx"]);
  });
});

function srcFiles(dir = "src"): string[] {
  return readdirSync(join(root, dir)).flatMap((n) => {
    const p = join(dir, n);
    return statSync(join(root, p)).isDirectory() ? srcFiles(p) : /\.(ts|tsx)$/.test(n) ? [relative(root, join(root, p)).replace(/\\/g, "/")] : [];
  });
}

describe("research contour: no Shoqan (item 3)", () => {
  const home = (lang: "kk" | "en") => html(createElement(HomeScreen, {
    onStartRead: () => {}, onStartQuiz: () => {}, t: DICT[lang], lang, userId: "s1", userName: "Aigerim",
  }), lang);

  it("the home screen has no Shoqan tip, avatar or ask button, in both languages", () => {
    for (const lang of ["kk", "en"] as const) {
      const h = home(lang);
      expect(text(h)).not.toMatch(SHOQAN);
      expect(h).not.toContain("shoqan-avatar");
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("the quiz has no 'ask Shoqan' button", () => {
    const story = STORIES.find((s) => s.id === "er_tostik")!;
    const questions = (story as unknown as { quizQuestions: unknown[] }).quizQuestions;
    expect(questions.length).toBeGreaterThan(0);
    for (const lang of ["kk", "en"] as const) {
      const h = html(createElement(QuizScreen, { onReward: () => {}, t: DICT[lang], questions: questions as never, storyTitle: "Er Tostik" }), lang);
      expect(h).toContain("button");
      expect(text(h)).not.toMatch(SHOQAN);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("every component that calls /api/shoqan or opens Shoqan is mounted only behind !RESEARCH_MODE", () => {
    const files = srcFiles().filter((f) => !f.endsWith(".test.ts"));
    const callers = files.filter((f) => /\/api\/shoqan/.test(read(f)));
    expect(callers.sort()).toEqual(["src/components/ShoqanChat.tsx", "src/components/ThinkingTrail.tsx", "src/components/WeekWords.tsx"]);
    const mounted: Record<string, string> = { ShoqanChat: "src/components/ShoqanChat.tsx", TrailButton: "src/components/ThinkingTrail.tsx", WeekWordsCard: "src/components/WeekWords.tsx" };
    for (const [name, home] of Object.entries(mounted)) {
      for (const f of files.filter((x) => x !== home)) {
        const lines = read(f).split("\n");
        lines.forEach((line, i) => {
          if (!new RegExp(`<${name}[\\s/>]`).test(line)) return;
          // The mount or the fragment it sits in opens with {!RESEARCH_MODE && … within the lines just above.
          const above = lines.slice(Math.max(0, i - 6), i + 1).join("\n");
          expect(above, `${f}:${i + 1} mounts <${name}> without !RESEARCH_MODE`).toMatch(/\{!RESEARCH_MODE && /);
        });
      }
    }
    // Every place that opens the chat from outside is gated too.
    for (const f of files) {
      const lines = read(f).split("\n");
      lines.forEach((line, i) => {
        if (!/onClick=\{askShoqan\}|new CustomEvent[^(]*\("shoqan:open"/.test(line) || f === "src/components/ShoqanChat.tsx") return;
        if (/const askShoqan/.test(lines.slice(Math.max(0, i - 12), i).join("\n"))) return; // the handler itself; its buttons are checked
        const above = lines.slice(Math.max(0, i - 8), i + 1).join("\n");
        expect(above, `${f}:${i + 1} opens Shoqan without !RESEARCH_MODE`).toMatch(/!RESEARCH_MODE/);
      });
    }
  });
});

describe("research contour: the test screen gives no XP and no hints (item 4)", () => {
  it("renders for an enrolled learner without XP, hints or Shoqan", () => {
    writeStudyCode(localStorage, "t1", CODE);
    for (const lang of ["kk", "en"] as const) {
      const h = html(createElement(TestScreen, { userId: "t1", lang }), lang);
      expect(h).toContain(CODE);
      expect(text(h)).not.toMatch(/\bXP\b/);
      expect(text(h)).not.toMatch(SHOQAN);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("has no way to award XP or ask for help: no reward prop, no XP or hint code, no Shoqan", () => {
    const src = read("src/research/test/TestScreen.tsx");
    expect(src).toMatch(/export default function TestScreen\(\{ userId, lang \}: \{ userId: string; lang: Lang \}\)/);
    for (const banned of [/onReward/, /addXp/, /_XP\b/, /research\/params/, /hintLadder/, /evidence/, /shoqan/i, /safePlayVoice/, /setTimeout|setInterval/]) {
      expect(src, `TestScreen.tsx must not use ${banned}`).not.toMatch(banned);
    }
    // The app mounts it with the learner and the language only, never for a teacher.
    expect(read("src/KazakhTalesApp.tsx")).toContain('{RESEARCH_MODE && TestScreen && tab === "test" && !teacher && <TestScreen userId={userId} lang={lang} />}');
  });

  it("shows no right/wrong after an answer: the answer handler only records and moves on", () => {
    const src = read("src/research/test/TestScreen.tsx");
    const handler = src.slice(src.indexOf("const answer = (choice"), src.indexOf("return (", src.indexOf("const answer = (choice")));
    expect(handler).not.toMatch(/setStatus|correct\s*\?|tile-correct|tile-wrong|btn-jade|btn-felt/);
    expect(src).not.toMatch(/tile-correct|tile-wrong|animate-answer/);
  });
});

describe("research contour: other checks for clean data (item 5)", () => {
  it("the ordinary build cannot reach the test screen: the alias swaps testEntry for the empty stand-in", async () => {
    const cfg = read("vite.config.ts");
    // vite.config.ts has several aliases (test screen, wordbank): take the one for testEntry.
    const m = cfg.match(/find: \/([^\n]*?testEntry[^\n]*?)\/, replacement: '([^']+)'/);
    expect(m).not.toBeNull();
    const re = new RegExp(m![1]);
    const imp = read("src/KazakhTalesApp.tsx").match(/import \{ TestScreen \} from "(.+?)";/)![1];
    expect(imp.replace(re, m![2])).toBe("./research/testEntry.off");
    expect((await import("./testEntry.off")).TestScreen).toBeNull();
  });

  it("a teacher is never tracked in the research build", () => {
    const app = read("src/KazakhTalesApp.tsx");
    // The gate (the only switch in the research build) is not used for a teacher.
    expect(app).toContain("RESEARCH_MODE && !teacher ? <StudyGate");
  });

  it("a mistyped or tampered code is not stamped on events", async () => {
    const { readStudyCode, researchContext, studyCodeKey } = await import("./studyCode");
    localStorage.setItem(studyCodeKey("x1"), JSON.stringify({ code: { code: "ERT-5723", at: "" } }));
    expect(readStudyCode(localStorage, "x1")).toBeNull();
    expect(researchContext("s", readStudyCode(localStorage, "x1"))).not.toHaveProperty("study_code");
  });
});
