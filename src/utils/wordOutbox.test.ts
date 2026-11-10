// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

/* The word outbox against a fake saved_words table. */
type Row = { user_id: string; word: string; translation: string };
let table: Row[] = [];
let mode: "ok" | "offline" | "refuse-bad" | "server" = "ok";
let calls = 0;

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => ({
      upsert: (rows: Row[]) => ({
        select: async () => {
          calls++;
          if (mode === "offline") throw new TypeError("Failed to fetch");
          if (mode === "server") return { data: null, error: { code: "PGRST000", message: "down" } };
          if (mode === "refuse-bad" && rows.some((r) => r.word === "bad")) return { data: null, error: { code: "23514", message: "check" } };
          const added = rows.filter((r) => !table.some((t) => t.word === r.word));
          table.push(...added);
          return { data: added.map((r) => ({ word: r.word })), error: null };
        },
      }),
    }),
  },
}));

const U = "u1";
beforeEach(() => { table = []; mode = "ok"; calls = 0; localStorage.clear(); vi.resetModules(); });
const load = () => import("./wordOutbox");

describe("word outbox", () => {
  it("keeps a word saved offline across a reload and sends it when the network is back", async () => {
    let m = await load();
    mode = "offline";
    m.queueWord(U, { word: "coat", translation: "шапан" });
    expect((await m.flushWords(U)).left).toBe(1);
    expect(table).toEqual([]);

    vi.resetModules(); m = await load(); // a reload: memory gone, the device keeps the queue
    expect(m.pendingWords(U)).toEqual([{ word: "coat", translation: "шапан" }]);
    mode = "ok";
    expect(await m.flushWords(U)).toEqual({ added: ["coat"], refused: [], left: 0 });
    expect(table.map((r) => r.word)).toEqual(["coat"]);
    expect(m.pendingWords(U)).toEqual([]);
  });

  it("a word already on the server is not counted as added", async () => {
    const m = await load();
    table.push({ user_id: U, word: "horse", translation: "ат" });
    m.queueWord(U, { word: "horse", translation: "ат" });
    expect(await m.flushWords(U)).toEqual({ added: [], refused: [], left: 0 });
  });

  it("a server error keeps the queue; a refused word is dropped without holding back the rest", async () => {
    const m = await load();
    mode = "server";
    m.queueWord(U, { word: "bad", translation: "x" });
    m.queueWord(U, { word: "good", translation: "y" });
    expect((await m.flushWords(U)).left).toBe(2);
    mode = "refuse-bad";
    expect(await m.flushWords(U)).toEqual({ added: ["good"], refused: ["bad"], left: 0 });
  });

  it("queues a word once, and per learner", async () => {
    const m = await load();
    m.queueWord(U, { word: "coat", translation: "a" });
    m.queueWord(U, { word: "coat", translation: "a" });
    m.queueWord("u2", { word: "coat", translation: "a" });
    expect(m.pendingWords(U)).toHaveLength(1);
    expect(m.pendingWords("u2")).toHaveLength(1);
  });
});
