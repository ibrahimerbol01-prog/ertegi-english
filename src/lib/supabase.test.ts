import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { makeSupabase } from "./supabase";

const URL_ = "https://abcdefgh.supabase.co";
const KEY = "sb_publishable_test";
type Call = { url: string; headers: Headers };

function client(storage: Map<string, string> = new Map()) {
  const calls: Call[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), headers: new Headers(init?.headers) });
    return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
  };
  return { sb: makeSupabase(URL_, KEY, {
    fetch: fetchImpl,
    storage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => void storage.set(k, v), removeItem: (k) => void storage.delete(k) },
  }), calls };
}

describe("thin Supabase client", () => {
  it("signed out: rpc and tables go to /rest/v1 with the API key as the bearer", async () => {
    const { sb, calls } = client();
    await sb.rpc("council_stats", { q: "x" });
    await sb.from("profiles").select("id");
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual(["/rest/v1/rpc/council_stats", "/rest/v1/profiles"]);
    for (const c of calls) {
      expect(c.headers.get("apikey")).toBe(KEY);
      expect(c.headers.get("Authorization")).toBe(`Bearer ${KEY}`);
    }
  });

  it("signed in: reads the session saved by createClient() (same storage key) and sends the user's token", async () => {
    const session = {
      access_token: "user-jwt", refresh_token: "r", token_type: "bearer",
      expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: "u1", aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01" },
    };
    const { sb, calls } = client(new Map([["sb-abcdefgh-auth-token", JSON.stringify(session)]]));
    await sb.from("profiles").select("id");
    const rest = calls.find((c) => c.url.includes("/rest/v1/"))!;
    expect(rest.headers.get("Authorization")).toBe("Bearer user-jwt");
    expect(rest.headers.get("apikey")).toBe(KEY);
  });
});

describe("research build keeps the full client", () => {
  it("vite.config.ts aliases lib/supabase to lib/research/supabase in research mode only", () => {
    const cfg = readFileSync("vite.config.ts", "utf8");
    const research = cfg.slice(cfg.indexOf("alias: research"), cfg.indexOf(" : ["));
    expect(research).toContain("replacement: '$1/lib/research/supabase'");
    expect(readFileSync("src/lib/research/supabase.ts", "utf8")).toMatch(/createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\)/);
  });
});
