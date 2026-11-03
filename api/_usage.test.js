import { describe, expect, it, vi } from "vitest";
import { takeQuota, refundQuota } from "./_usage.js";

// A stand-in for the Supabase admin client: rpc() answers as given, and the
// old table path reads `row` and records writes.
function admin({ rpc, row = null, readError = null, writeError = null }) {
  const writes = [];
  return {
    writes,
    rpc: vi.fn(async () => rpc),
    from: () => ({
      select() { return this; },
      eq() { return this; },
      maybeSingle: async () => ({ data: row, error: readError }),
      upsert: async (v) => { writes.push(v); return { error: writeError }; },
    }),
  };
}

describe("daily limits", () => {
  it("lets a request through while under the limit", async () => {
    const a = admin({ rpc: { data: 3, error: null } });
    await expect(takeQuota(a, "u", "chat", 10)).resolves.toEqual({ ok: true });
    expect(a.rpc).toHaveBeenCalledWith("bump_api_usage", { p_user: "u", p_kind: "chat", p_limit: 10 });
  });
  it("refuses with 429 at the limit", async () => {
    await expect(takeQuota(admin({ rpc: { data: -1, error: null } }), "u", "chat", 10)).resolves.toEqual({ ok: false, status: 429 });
  });
  it("refuses with 503 when the counter can't be read (fails closed)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(takeQuota(admin({ rpc: { data: null, error: { code: "08006", message: "down" } } }), "u", "chat", 10))
      .resolves.toEqual({ ok: false, status: 503 });
  });

  describe("before the migration (function missing)", () => {
    const missing = { data: null, error: { code: "PGRST202" } };
    it("counts with the old two-step path", async () => {
      const a = admin({ rpc: missing, row: { shoqan_count: 2 } });
      await expect(takeQuota(a, "u", "chat", 10)).resolves.toEqual({ ok: true });
      expect(a.writes[0]).toMatchObject({ user_id: "u", shoqan_count: 3 });
    });
    it("lesson feedback shares the chat counter, as before", async () => {
      await expect(takeQuota(admin({ rpc: missing, row: { shoqan_count: 10 } }), "u", "tool", 10)).resolves.toEqual({ ok: false, status: 429 });
    });
    it("still fails closed on a read error", async () => {
      await expect(takeQuota(admin({ rpc: missing, readError: { message: "x" } }), "u", "chat", 10)).resolves.toEqual({ ok: false, status: 503 });
    });
  });

  it("a refund never throws", async () => {
    const a = { rpc: vi.fn(async () => { throw new Error("network"); }) };
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(refundQuota(a, "u", "chat")).resolves.toBeUndefined();
  });
});
