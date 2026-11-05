import { beforeEach, describe, expect, it, vi } from "vitest";

const quota = { takeQuota: vi.fn(), refundQuota: vi.fn() };
vi.mock("./_usage.js", () => quota);
vi.mock("./_auth.js", () => ({ requireAuth: async () => ({ user: { id: "u1" }, admin: {} }) }));

const { default: handler, buildSystemPrompt } = await import("./shoqan.js");

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

describe("Shoqan's help ladder (I2)", () => {
  const sentPrompt = (fetchSpy) => JSON.parse(fetchSpy.mock.calls[0][1].body).systemInstruction.parts[0].text;

  it("keeps the fixed prompt with the ladder and the quiz rule when nothing is given", () => {
    const p = buildSystemPrompt();
    expect(p).toMatch(/HELP LADDER/);
    expect(p).toMatch(/quiz question they have not answered yet, do not give the answer/);
    expect(p).not.toMatch(/THIS REQUEST/);
  });

  it.each([
    [1, /help step 1 of 3.*Do not give, name or rule out any option/s],
    [2, /help step 2 of 3.*Do not say which option is right/s],
    [3, /help step 3 of 3.*explain with the right answer/s],
  ])("adds step %i to the prompt", (step, re) => {
    expect(buildSystemPrompt({ hintStep: step })).toMatch(re);
  });

  it("explains in Kazakh at A1-A2 and mostly in English at B2-C1", () => {
    expect(buildSystemPrompt({ level: "A2" })).toMatch(/level A2: explain in Kazakh/);
    expect(buildSystemPrompt({ level: "C1" })).toMatch(/level C1: explain mostly in English/);
  });

  it("sends the step and level to the model", async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Қара." }] } }] })));
    vi.stubGlobal("fetch", fetchSpy);
    const res = await call({ ...ask(), hint_step: 2, level: "B1" });
    expect(res.statusCode).toBe(200);
    expect(sentPrompt(fetchSpy)).toMatch(/help step 2 of 3/);
    expect(sentPrompt(fetchSpy)).toMatch(/level B1/);
  });

  it.each([
    ["step 0", { hint_step: 0 }],
    ["step above the ladder", { hint_step: 4 }],
    ["step as text", { hint_step: "2" }],
    ["unknown level", { level: "B3" }],
    ["level not text", { level: 2 }],
  ])("rejects a bad field (%s) without counting it", async (_, extra) => {
    const res = await call({ ...ask(), ...extra });
    expect(res.statusCode).toBe(400);
    expect(quota.takeQuota).not.toHaveBeenCalled();
  });
});
