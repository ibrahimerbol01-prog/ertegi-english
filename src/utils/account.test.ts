import { beforeEach, describe, expect, it, vi } from "vitest";
import { appStorageKeys, classifyDeleteError, clearAppStorage, deleteAccount, isConfirmWord } from "./account";

const U = "11111111-2222-3333-4444-555555555555";

function seed() {
  localStorage.clear();
  const keys = [
    "ertegi_lang",
    `ertegi_progress_${U}`, `ertegi_role_${U}`, `ertegi_is_teacher_${U}`, `ertegi_quiz_outbox_${U}`,
    `ertegi_my_classes_${U}`, `ertegi_trail_${U}`, `ertegi_trail_draft_${U}_aldar_kose_A1`,
    `ertegi_cards_${U}`, `ertegi_debate_${U}_2026-11-02`, `ertegi_daily_words_${U}`,
    `ertegi_council_${U}`, `ertegi_maqals_${U}`, `ertegi_known_${U}`,
    "ertegi_pending_class", "ertegi_role_pending", "ertegi_privacy_consent_pending",
    "shoqan_bubble_pos", "sb-tsialjlxlhwemrkyyvjv-auth-token", "sb-tsialjlxlhwemrkyyvjv-auth-token-code-verifier",
    // Guest data: on a shared school computer it is another child's, must stay.
    "ertegi_cards_guest", "ertegi_trail_draft_guest_aldar_kose_A1", "ertegi_debate_guest_2026-11-02",
    // Not ours: must stay.
    "other_site_key", "workbox-precache", "sb-something-else",
  ];
  for (const k of keys) localStorage.setItem(k, "1");
}

describe("clearing the device after deletion", () => {
  beforeEach(seed);

  it("removes every app key, keeps the language, guest data and other sites' keys", () => {
    const n = clearAppStorage();
    expect(n).toBe(19);
    const left = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).sort();
    expect(left).toEqual([
      "ertegi_cards_guest", "ertegi_debate_guest_2026-11-02", "ertegi_lang", "ertegi_trail_draft_guest_aldar_kose_A1",
      "other_site_key", "sb-something-else", "workbox-precache",
    ]);
  });

  it("lists keys without removing them", () => {
    expect(appStorageKeys(localStorage)).toContain(`ertegi_progress_${U}`);
    expect(localStorage.getItem(`ertegi_progress_${U}`)).toBe("1");
  });

  it("does not throw when storage is blocked", () => {
    const blocked = { get length(): number { throw new Error("SecurityError"); }, key: () => null, removeItem: () => {} };
    expect(clearAppStorage(blocked)).toBe(0);
    expect(clearAppStorage(null)).toBe(0);
  });
});

describe("what the learner is told when deletion fails", () => {
  it.each([
    [{ code: "PGRST202", message: "Could not find the function public.delete_my_account without parameters in the schema cache", status: 404 }, "unavailable"],
    [{ status: 404 }, "unavailable"],
    [{ code: "42883", message: "function public.delete_my_account() does not exist" }, "unavailable"],
    [{ code: "42501", message: "permission denied for table users" }, "unavailable"],
    [{ code: "PGRST301", message: "JWT expired", status: 401 }, "session"],
    [{ code: "P0001", message: "not_signed_in", status: 400 }, "session"],
    [{ code: "", message: "TypeError: Failed to fetch", status: 0 }, "offline"],
    [{ message: "Load failed" }, "offline"],
    [{ code: "XX000", message: "internal", status: 500 }, "failed"],
    [null, "failed"],
  ] as const)("%o → %s", (err, want) => expect(classifyDeleteError(err)).toBe(want));

  it("offline wins over any error text", () => {
    expect(classifyDeleteError({ code: "PGRST202" }, false)).toBe("offline");
  });
});

describe("deleteAccount", () => {
  beforeEach(seed);

  it("on success clears the device and signs out locally", async () => {
    const signOut = vi.fn(async () => ({}));
    const res = await deleteAccount({ rpc: async () => ({ error: null, status: 204 }), signOut, online: () => true });
    expect(res).toEqual({ ok: true, removedKeys: 19 });
    expect(signOut).toHaveBeenCalledOnce();
    expect(localStorage.getItem(`ertegi_progress_${U}`)).toBeNull();
    expect(localStorage.getItem("ertegi_lang")).toBe("1");
  });

  it("tells the app before signing out, after the device is cleared", async () => {
    const order: string[] = [];
    await deleteAccount({
      rpc: async () => ({ error: null }),
      signOut: async () => { order.push("signOut"); },
      onDeleted: () => order.push(localStorage.getItem(`ertegi_progress_${U}`) === null ? "onDeleted(cleared)" : "onDeleted(not cleared)"),
      online: () => true,
    });
    expect(order).toEqual(["onDeleted(cleared)", "signOut"]);
  });

  it("does not tell the app when the server refused", async () => {
    const onDeleted = vi.fn();
    await deleteAccount({ rpc: async () => ({ error: { code: "XX000" } }), signOut: async () => ({}), onDeleted, online: () => true });
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("a failing signOut after success still counts as deleted", async () => {
    const res = await deleteAccount({ rpc: async () => ({ error: null }), signOut: async () => { throw new Error("403"); }, online: () => true });
    expect(res.ok).toBe(true);
  });

  it("offline: no request, nothing removed", async () => {
    const rpc = vi.fn(async () => ({ error: null }));
    const signOut = vi.fn(async () => ({}));
    const res = await deleteAccount({ rpc, signOut, online: () => false });
    expect(res).toEqual({ ok: false, reason: "offline" });
    expect(rpc).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(26);
  });

  it("fetch throwing counts as offline and keeps local data", async () => {
    const res = await deleteAccount({ rpc: async () => { throw new TypeError("Failed to fetch"); }, signOut: async () => ({}), online: () => true });
    expect(res).toEqual({ ok: false, reason: "offline" });
    expect(localStorage.length).toBe(26);
  });

  it("migration not applied: unavailable, keeps local data and session", async () => {
    const signOut = vi.fn(async () => ({}));
    const res = await deleteAccount({
      rpc: async () => ({ error: { code: "PGRST202", message: "Could not find the function" }, status: 404 }),
      signOut,
      online: () => true,
    });
    expect(res).toEqual({ ok: false, reason: "unavailable" });
    expect(signOut).not.toHaveBeenCalled();
    expect(localStorage.getItem(`ertegi_progress_${U}`)).toBe("1");
  });

  it("takes the HTTP status from the response when the error has none", async () => {
    const res = await deleteAccount({ rpc: async () => ({ error: { message: "x" }, status: 404 }), signOut: async () => ({}), online: () => true });
    expect(res).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("confirmation word", () => {
  it.each(["ӨШІРУ", "өшіру", "  Өшіру ", "ОШИРУ", "оширу", "ОШІРУ", "DELETE", "delete", "УДАЛИТЬ"])("accepts %s", (w) => expect(isConfirmWord(w)).toBe(true));
  it.each(["", "ӨШІР", "DELET", "yes", "ӨШІРУ!"])("rejects %s", (w) => expect(isConfirmWord(w)).toBe(false));
});
