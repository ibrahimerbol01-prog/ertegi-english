import { describe, expect, it } from "vitest";
import { cors } from "./_cors.js";

function run(method, origin) {
  const headers = {};
  const res = { code: 0, ended: false, setHeader: (k, v) => { headers[k] = v; }, status(c) { res.code = c; return res; }, end() { res.ended = true; } };
  const done = cors({ method, headers: origin ? { origin } : {} }, res, "POST");
  return { done, headers, res };
}

describe("CORS for the mobile app", () => {
  it.each(["capacitor://localhost", "https://localhost", "http://localhost"])("allows the app origin %s", (origin) => {
    const { done, headers } = run("POST", origin);
    expect(done).toBe(false);
    expect(headers["Access-Control-Allow-Origin"]).toBe(origin);
  });
  it("answers the preflight with 204", () => {
    const { done, res, headers } = run("OPTIONS", "capacitor://localhost");
    expect(done).toBe(true);
    expect(res.code).toBe(204);
    expect(headers["Access-Control-Allow-Headers"]).toContain("Authorization");
  });
  it("gives other sites no access", () => {
    const { headers } = run("POST", "https://evil.example");
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
  it("same-origin requests need nothing", () => {
    const { done, headers } = run("POST", undefined);
    expect(done).toBe(false);
    expect(Object.keys(headers)).toHaveLength(0);
  });
});
