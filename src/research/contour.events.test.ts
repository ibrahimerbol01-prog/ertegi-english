import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeStudyCode, writeStudyCode } from "./studyCode";
import { writeAssent } from "./assent";
import assentFile from "../data/studyAssent.json";

/* Research contour, stage 0: the real event log of the app (src/utils/events.ts)
   as the research build runs it. The build flag and the study id are mocked
   (the tests themselves run as the ordinary build, vitest.config.ts), and
   Supabase is a fake that records what would reach learning_events. */

const sent = vi.hoisted(() => [] as { table: string; rows: Record<string, unknown>[] }[]);
vi.mock("./mode", () => ({ RESEARCH_MODE: true, STUDY_ID: "ertegi-stage0-test" }));
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      upsert: async (rows: Record<string, unknown>[]) => { sent.push({ table, rows }); return { error: null }; },
    }),
  },
}));

const { track, setEventsUser, flushEvents, queueKey } = await import("../utils/events");
const { RESEARCH_MODE, STUDY_ID } = await import("./mode");

const CODE_B = makeStudyCode(17);
const ASSENT_VERSION = (assentFile as { version: string }).version;
const queue = (uid: string) => JSON.parse(localStorage.getItem(queueKey(uid)) || "[]") as { verb: string; context: Record<string, unknown> }[];
const sentRows = () => sent.filter((s) => s.table === "learning_events").flatMap((s) => s.rows);

/** A learner who typed the code and said yes to the current assent text (what StudyGate stores). */
function enrolled(uid: string, code = "ERT-5724") {
  writeStudyCode(localStorage, uid, code, "2026-11-05T09:00:00.000Z");
  writeAssent(localStorage, uid, { version: ASSENT_VERSION, answer: "yes", at: "2026-11-05T09:01:00.000Z", sample: true });
}

beforeEach(() => {
  setEventsUser(null);
  localStorage.clear();
  sent.length = 0;
});

describe("research contour: no events without assent (item 1)", () => {
  it("the mock really is the research build", () => {
    expect(RESEARCH_MODE).toBe(true);
    expect(STUDY_ID).toBe("ertegi-stage0-test");
  });

  it("before the learner is switched on (code and assent not done yet) nothing is queued or sent", async () => {
    track("story_open", { story_id: "er_tostik" });
    track("test_answer", { object_type: "test_item", object_id: "A1", result: { correct: 1 } });
    await flushEvents();
    expect(localStorage.length).toBe(0);
    expect(sent).toEqual([]);
  });

  it("after the gate closes again (a no, sign-out) new events are dropped, not queued", async () => {
    enrolled("u-close");
    setEventsUser("u-close");
    expect(queue("u-close").map((r) => r.verb)).toEqual(["session_start"]);
    await flushEvents();
    const before = sentRows().length;

    setEventsUser(null);
    track("story_open", { story_id: "er_tostik" });
    track("quiz_answer", { result: { correct: true } });
    await flushEvents();
    expect(queue("u-close")).toEqual([]);
    expect(sentRows().length).toBe(before);
  });

  it("a learner who said no has no queue of their own, even if another learner on the device is logged", async () => {
    enrolled("u-yes");
    writeStudyCode(localStorage, "u-no", CODE_B);
    writeAssent(localStorage, "u-no", { version: ASSENT_VERSION, answer: "no", at: "2026-11-05T09:02:00.000Z", sample: true });
    setEventsUser("u-yes");
    track("word_tap", { object_id: "wolf" });
    await flushEvents();
    expect(localStorage.getItem(queueKey("u-no"))).toBeNull();
    expect(sentRows().every((r) => r.user_id === "u-yes")).toBe(true);
  });
});

describe("research contour: every event is marked (item 2)", () => {
  it("each queued and each sent row carries research=true, the study id, the participant code and the assent version", async () => {
    enrolled("u-mark", "ERT-5724");
    setEventsUser("u-mark");
    track("story_open", { story_id: "er_tostik", level: "A1" });
    track("word_tap", { object_type: "word", object_id: "steppe" });
    track("quiz_answer", { result: { correct: true, attempt: 1 } });
    track("test_answer", { object_type: "test_item", object_id: "A-r1", result: { correct: 0, form: "A" } });
    track("test_complete", { object_type: "test", object_id: "v1|pre", result: { score: 3 } });

    const queued = queue("u-mark");
    expect(queued.map((r) => r.verb)).toEqual(["session_start", "story_open", "word_tap", "quiz_answer", "test_answer", "test_complete"]);
    await flushEvents();
    const rows = sentRows();
    expect(rows.length).toBe(queued.length);
    for (const r of [...queued, ...rows] as { context: Record<string, unknown> }[]) {
      expect(r.context).toMatchObject({
        research: true,
        study_id: "ertegi-stage0-test",
        study_code: "ERT-5724",
        assent_version: ASSENT_VERSION,
      });
    }
    expect(rows.every((r) => r.user_id === "u-mark")).toBe(true);
    // Sent rows leave the device queue.
    expect(queue("u-mark")).toEqual([]);
  });

  it("the participant code in the context is the learner's own, not the previous learner's on a shared device", async () => {
    enrolled("u-a", "ERT-5724");
    enrolled("u-b", CODE_B);
    setEventsUser("u-a");
    track("story_open", { story_id: "er_tostik" });
    setEventsUser("u-b");
    track("story_open", { story_id: "alpamys" });
    const codes = (uid: string) => [...new Set(queue(uid).map((r) => r.context.study_code))];
    expect(codes("u-a")).toEqual(["ERT-5724"]);
    expect(codes("u-b")).toEqual([CODE_B]);
    await flushEvents();
    expect(sentRows().every((r) => r.user_id === "u-b" && (r.context as Record<string, unknown>).study_code === CODE_B)).toBe(true);
  });
});
