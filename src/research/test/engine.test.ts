import { describe, expect, it } from "vitest";
import { formFor, nextIndex, scoreAnswer, sessionItems, summarize, validateTestSet } from "./engine";
import { finishSession, loadSession, recordAnswer, startSession, testKey } from "./progress";
import { pickTestSet, TEST_SET } from "./testSet";
import sample from "../../data/researchTest.sample.json";
import type { Answer, TestItem, TestSet } from "./types";

const set = sample as TestSet;
const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};
const ans = (choice: string | null, correct: 0 | 1): Answer => ({ choice, correct, ms: 1000 });

describe("item set", () => {
  it("the sample is valid, marked as a sample, and is what the build uses", () => {
    expect(validateTestSet(set)).toEqual([]);
    expect(set.sample).toBe(true);
    expect(set.version).toMatch(/^SAMPLE/);
    expect(set.items.every((it) => it.id.startsWith("SAMPLE"))).toBe(true);
    expect(TEST_SET.set?.version).toBe(set.version);
  });
  it("an approved researchTest.json wins over the sample", () => {
    const real = { ...set, version: "v1", sample: false };
    const got = pickTestSet({ "../../data/researchTest.sample.json": { default: set }, "../../data/researchTest.json": { default: real } });
    expect(got.set?.version).toBe("v1");
  });
  it("finds the mistakes of a hand-edited set", () => {
    const bad = (patch: Partial<TestItem>) => validateTestSet({ ...set, items: [{ ...set.items[2], ...patch }] });
    expect(bad({ answer: "x" }).join()).toMatch(/answer/);
    expect(bad({ form: "C" as never }).join()).toMatch(/form/);
    expect(bad({ timepoints: ["later" as never] }).join()).toMatch(/timepoints/);
    expect(bad({ options: ["a", "a"] }).join()).toMatch(/options/);
    expect(validateTestSet({ ...set, items: [set.items[0], set.items[0]] }).join()).toMatch(/duplicate/);
    expect(validateTestSet({ ...set, items: [{ ...set.items[1], pseudo: false }] }).join()).toMatch(/recognition/);
    expect(validateTestSet({ ...set, sample: undefined }).join()).toMatch(/sample/);
    expect(pickTestSet({}).set).toBeNull();
  });
});

describe("sessions and scoring", () => {
  it("counterbalances forms A → B → A and B → A → B", () => {
    expect(["pre", "post", "delayed"].map((t) => formFor("AB", t as never))).toEqual(["A", "B", "A"]);
    expect(["pre", "post", "delayed"].map((t) => formFor("BA", t as never))).toEqual(["B", "A", "B"]);
  });
  it("selects items by form and moment, in file order", () => {
    expect(sessionItems(set, "A", "pre").map((i) => i.id)).toEqual(["SAMPLE-A-rec-01", "SAMPLE-A-rec-02", "SAMPLE-A-mean-01", "SAMPLE-A-use-01"]);
    expect(sessionItems(set, "B", "pre").map((i) => i.format)).toEqual(["recognition", "meaning"]);
    expect(sessionItems(set, "B", "post").map((i) => i.format)).toEqual(["recognition", "meaning", "comprehension"]);
  });
  it("scores 1 only for the right option; I don't know is 0", () => {
    const meaning = set.items[2];
    expect(scoreAnswer(meaning, "адал")).toBe(1);
    expect(scoreAnswer(meaning, "батыл")).toBe(0);
    expect(scoreAnswer(meaning, null)).toBe(0);
  });
  it("summarizes by format, with hits and false alarms on recognition", () => {
    const items = sessionItems(set, "A", "pre");
    const s = summarize(items, {
      "SAMPLE-A-rec-01": ans("yes", 1), "SAMPLE-A-rec-02": ans("yes", 0), "SAMPLE-A-mean-01": ans(null, 0),
    });
    expect(s).toMatchObject({ answered: 3, total: 4, rec_hits: 1, rec_real: 1, rec_false_alarms: 1, rec_pseudo: 1, rec_flag: true, meaning: 0, meaning_n: 1, use: 0, use_n: 1 });
    expect(summarize(items, { "SAMPLE-A-rec-02": ans("no", 1), "SAMPLE-A-use-01": ans("prison", 1) })).toMatchObject({ rec_flag: false, use: 1 });
  });
});

describe("progress on the device", () => {
  it("resumes at the first unanswered item after a reload, keeps the form, closes once", () => {
    const s = mem();
    const items = sessionItems(set, "A", "pre");
    const p = startSession(s, "u1", set.version, "pre", "A", new Date("2026-11-05T09:00:00Z"));
    expect(nextIndex(items, p.answers)).toBe(0);
    expect(recordAnswer(s, "u1", set.version, "pre", items[0].id, ans("yes", 1))).toBe(true);
    expect(recordAnswer(s, "u1", set.version, "pre", items[1].id, ans("no", 1))).toBe(true);
    // A second answer to the same item (another tab) is ignored.
    expect(recordAnswer(s, "u1", set.version, "pre", items[1].id, ans("yes", 0))).toBe(false);
    // "Reload": everything comes back from storage; the form asked for now does not replace the one started.
    const again = startSession(s, "u1", set.version, "pre", "B");
    expect(again.form).toBe("A");
    expect(again.answers[items[1].id].choice).toBe("no");
    expect(nextIndex(items, again.answers)).toBe(2);
    for (const it of items.slice(2)) recordAnswer(s, "u1", set.version, "pre", it.id, ans(it.answer, 1));
    expect(nextIndex(items, loadSession(s, "u1", set.version, "pre")!.answers)).toBe(-1);
    expect(finishSession(s, "u1", set.version, "pre")).toBe(true);
    expect(finishSession(s, "u1", set.version, "pre")).toBe(false);
    expect(recordAnswer(s, "u1", set.version, "pre", items[0].id, ans("no", 0))).toBe(false);
  });
  it("keeps learners, moments and set versions apart; survives broken storage", () => {
    const s = mem();
    startSession(s, "u1", set.version, "pre", "A");
    expect(loadSession(s, "u2", set.version, "pre")).toBeNull();
    expect(loadSession(s, "u1", set.version, "post")).toBeNull();
    expect(loadSession(s, "u1", "v1", "pre")).toBeNull();
    s.setItem(testKey("u3"), "{broken");
    expect(loadSession(s, "u3", set.version, "pre")).toBeNull();
    expect(startSession(null, "u4", set.version, "pre", "A").form).toBe("A");
  });
});
