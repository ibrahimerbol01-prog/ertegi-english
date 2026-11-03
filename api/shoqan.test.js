import { beforeEach, describe, expect, it, vi } from "vitest";

const quota = { takeQuota: vi.fn(), refundQuota: vi.fn() };
vi.mock("./_usage.js", () => quota);
vi.mock("./_auth.js", () => ({ requireAuth: async () => ({ user: { id: "u1" }, admin: {} }) }));

const { default: handler } = await import("./shoqan.js");

function call(body) {
  const res = { statusCode: 0, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return handler({ method: "POST", headers: { authorization: "Bearer t" }, body }, res).then(() => res);
}
const ask = (text = "What does 'clever' mean?") => ({ messages: [{ role: "user", content: text }] });

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
  quota.takeQuota.mockReset().mockResolvedValue({ ok: true });
  quota.refundQuota.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/shoqan", () => {
  it.each([
    ["no body", undefined],
    ["empty list", { messages: [] }],
    ["not a list", { messages: "hi" }],
    ["last message is not the learner's", { messages: [{ role: "user", content: "hi" }, { role: "assistant", content: "x" }] }],
    ["content is not text", { messages: [{ role: "user", content: { a: 1 } }] }],
  ])("rejects a broken request (%s) without counting it", async (_, body) => {
    const res = await call(body);
    expect(res.statusCode).toBe(400);
    expect(quota.takeQuota).not.toHaveBeenCalled();
  });

  it("uses the chat limit of 10, or the lesson limit for kind=tool", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Ақылды." }] } }] }))));
    await call(ask());
    expect(quota.takeQuota).toHaveBeenLastCalledWith({}, "u1", "chat", 10);
    await call({ ...ask(), kind: "tool" });
    expect(quota.takeQuota).toHaveBeenLastCalledWith({}, "u1", "tool", 10);
  });

  it("answers 429 over the limit and does not call the model", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    quota.takeQuota.mockResolvedValue({ ok: false, status: 429 });
    const res = await call(ask());
    expect(res.statusCode).toBe(429);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the model's reply", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Ақылды деген сөз." }] } }] }))));
    const res = await call(ask());
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "Ақылды деген сөз." });
  });

  it("when every model fails: refunds the request and hides the upstream error", async () => {
    const secret = '{"error":{"message":"API key AIza-SECRET is invalid","status":"PERMISSION_DENIED"}}';
    vi.stubGlobal("fetch", vi.fn(async () => new Response(secret, { status: 503 })));
    const res = await call(ask());
    expect(res.statusCode).toBeGreaterThanOrEqual(500);
    expect(JSON.stringify(res.body)).not.toContain("SECRET");
    expect(quota.refundQuota).toHaveBeenCalledWith({}, "u1", "chat");
  });

  it("sends only the last 16 messages, each cut to 4000 characters", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }] } }] })));
    vi.stubGlobal("fetch", fetchSpy);
    const messages = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(5000) }));
    messages.push({ role: "user", content: "last" });
    await call({ messages });
    const sent = JSON.parse(fetchSpy.mock.calls[0][1].body).contents;
    expect(sent.length).toBeLessThanOrEqual(16);
    expect(Math.max(...sent.map((m) => m.parts[0].text.length))).toBeLessThanOrEqual(4000);
  });
});
