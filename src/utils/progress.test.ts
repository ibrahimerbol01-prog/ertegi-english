import { beforeEach, describe, expect, it, vi } from "vitest";

const rows: { story_id: string; step: string }[] = [];
let failRead = false;
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: async () => (failRead ? { data: null, error: { message: "offline" } } : { data: rows, error: null }),
      }),
      upsert: () => ({ then: () => {} }),
      update: () => ({ eq: () => ({ eq: () => ({ then: () => {} }) }) }),
    }),
  },
}));

const { nextReview, lapse, localDay, daysBetween, isDue, loadProgress, loadLocalReviews, REVIEW_INTERVAL_DAYS, MAX_MASTERY } =
  await import("./progress");

const DAY = 86400000;
const from = new Date("2026-11-03T10:00:00Z");

describe("review schedule (Leitner boxes)", () => {
  it("waits the box's interval", () => {
    REVIEW_INTERVAL_DAYS.forEach((days, box) => {
      expect(new Date(nextReview(box, from)).getTime() - from.getTime()).toBe(days * DAY);
    });
  });
  it("clamps boxes outside 0..MAX", () => {
    expect(nextReview(-3, from)).toBe(nextReview(0, from));
    expect(nextReview(MAX_MASTERY + 5, from)).toBe(nextReview(MAX_MASTERY, from));
  });
  it("does not throw on NaN or fractions from old data", () => {
    expect(() => nextReview(Number.NaN, from)).not.toThrow();
    expect(nextReview(Number.NaN, from)).toBe(nextReview(0, from));
    expect(nextReview(2.4, from)).toBe(nextReview(2, from));
  });
  it("a forgotten word drops one box and comes back tomorrow", () => {
    expect(lapse(3, from)).toEqual({ mastery: 2, nextReviewAt: new Date(from.getTime() + DAY).toISOString() });
    expect(lapse(0, from).mastery).toBe(0);
  });
  it("isDue: no date or a past date is due", () => {
    expect(isDue(null)).toBe(true);
    expect(isDue(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(isDue(new Date(Date.now() + DAY).toISOString())).toBe(false);
  });
});

describe("calendar days in Kazakhstan", () => {
  it("the day turns at local midnight, not at 05:00 UTC", () => {
    expect(localDay(new Date("2026-11-03T18:59:00Z"))).toBe("2026-11-03");
    expect(localDay(new Date("2026-11-03T19:01:00Z"))).toBe("2026-11-04");
  });
  it("counts days across months and years", () => {
    expect(daysBetween("2026-10-31", "2026-11-01")).toBe(1);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30);
    expect(daysBetween("2026-11-03", "2026-11-03")).toBe(0);
  });
});

describe("progress stored on the device", () => {
  beforeEach(() => {
    localStorage.clear();
    rows.length = 0;
    failRead = false;
  });

  it("merges the device copy with the server", async () => {
    localStorage.setItem("ertegi_progress_u1", JSON.stringify(["aldar_kose:A1"]));
    rows.push({ story_id: "aldar_kose", step: "A2" });
    const done = await loadProgress("u1");
    expect([...done].sort()).toEqual(["aldar_kose:A1", "aldar_kose:A2"]);
  });

  it.each(["{}", "5", "null", '"text"', "{not json", '[1, 2]'])("a damaged value (%s) counts as empty", async (raw) => {
    localStorage.setItem("ertegi_progress_u1", raw);
    failRead = true;
    await expect(loadProgress("u1")).resolves.toEqual(new Set());
  });

  it("damaged review dates count as empty", () => {
    for (const raw of ["null", "[]", '{"cat": 5}', "{oops"]) {
      localStorage.setItem("ertegi_reviews_u1", raw);
      expect(loadLocalReviews("u1")).toEqual({});
    }
    localStorage.setItem("ertegi_reviews_u1", JSON.stringify({ cat: "2026-11-04T00:00:00.000Z" }));
    expect(loadLocalReviews("u1")).toEqual({ cat: "2026-11-04T00:00:00.000Z" });
  });
});
