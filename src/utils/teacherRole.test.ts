import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* Teacher access (20261108000000_teacher_role): the status from the server,
   "missing" before the migration, and a readable not_approved. */
const rpc = vi.fn();
vi.mock("../lib/supabase", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

const { createClass, errorText, requestTeacherRole } = await import("./classes");

describe("teacher access", () => {
  beforeEach(() => {
    rpc.mockReset();
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each(["pending", "approved", "revoked"])("passes the %s status through", async (s) => {
    rpc.mockResolvedValue({ data: s, error: null });
    expect(await requestTeacherRole()).toEqual({ ok: true, data: s });
    expect(rpc).toHaveBeenCalledWith("request_teacher_role");
  });

  it("an odd answer is not taken for a status", async () => {
    rpc.mockResolvedValue({ data: "admin", error: null });
    expect(await requestTeacherRole()).toEqual({ ok: false, error: "unknown" });
  });

  it.each(["PGRST202", "42883", "42P01"])("no migration (%s) is 'missing', so the cabinet works as before", async (code) => {
    rpc.mockResolvedValue({ data: null, error: { code, message: "Could not find the function" } });
    expect(await requestTeacherRole()).toEqual({ ok: false, error: "missing" });
  });

  it("create_class refused as not_approved gets its own text", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "not_approved" } });
    const res = await createClass("7A");
    expect(res).toEqual({ ok: false, error: "not_approved" });
    expect(errorText("not_approved", true)).toMatch(/расталмаған/);
    expect(errorText("not_approved", false)).toMatch(/isn't confirmed/);
  });
});
