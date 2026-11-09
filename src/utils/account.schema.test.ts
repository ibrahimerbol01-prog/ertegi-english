import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* Guards for R1: a new table with a user column, or a new outside service,
   must not slip past account deletion and the privacy policy. */
const root = join(__dirname, "..", "..");
const migDir = join(root, "supabase", "migrations");
const migrations = readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort();
// The live delete_my_account() is the one in the last migration that (re)defines it.
const deleteFile = migrations.filter((f) => readFileSync(join(migDir, f), "utf8").includes("create or replace function public.delete_my_account()")).pop()!;
const deleteSql = readFileSync(join(migDir, deleteFile), "utf8");

// Tables the code reads and writes, including the hand-made ones.
const codeTables = ["profiles", "saved_words", "user_achievements"];

describe("delete_my_account covers every user table", () => {
  const userTables = new Set<string>();
  for (const f of migrations) {
    const sql = readFileSync(join(migDir, f), "utf8");
    for (const m of sql.matchAll(/create table if not exists public\.(\w+)\s*\(([\s\S]*?)\n\);/g)) {
      if (/\b(user_id|teacher_id|student_id)\b/.test(m[2])) userTables.add(m[1]);
    }
  }

  it("finds the migrated user tables", () => {
    expect([...userTables].sort()).toEqual(expect.arrayContaining(["api_usage_daily", "class_members", "classes", "council_votes", "debate_entries", "learning_events", "quiz_results", "story_progress", "trail_entries"]));
  });

  it.each([...userTables, ...codeTables].map((t) => [t]))("%s is deleted", (t) => {
    expect(deleteSql).toMatch(new RegExp(`'${t}'|public\\.${t}\\b`));
  });

  it("is security definer with a fixed search_path, and only for signed-in users", () => {
    expect(deleteSql).toMatch(/security definer/);
    expect(deleteSql).toMatch(/set search_path = public/);
    expect(deleteSql).toMatch(/revoke all on function public\.delete_my_account\(\) from public;/);
    expect(deleteSql).toMatch(/revoke all on function public\.delete_my_account\(\) from anon;/);
    expect(deleteSql).toMatch(/grant execute on function public\.delete_my_account\(\) to authenticated;/);
    expect(deleteSql).toMatch(/delete from auth\.users where id = uid/);
  });

  it("deletes auth.users last", () => {
    expect(deleteSql.lastIndexOf("delete from")).toBe(deleteSql.indexOf("delete from auth.users"));
  });
});

describe("privacy policy names every outside service", () => {
  const policy = readFileSync(join(root, "src", "components", "PrivacyPolicy.tsx"), "utf8");
  const bodies = ["KK", "RU", "EN"].map((name) => {
    const m = policy.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`\\.trim\\(\\);`));
    return [name, m?.[1] ?? ""] as const;
  });
  it.each(bodies)("%s text", (_name, body) => {
    expect(body.length).toBeGreaterThan(1000);
    for (const s of ["Supabase", "Vercel", "Google Gemini", "Anthropic Claude", "Microsoft Azure Speech", "POLICY_UPDATED"]) {
      expect(body, s).toContain(s);
    }
    // Fonts are self-hosted (src/fonts.css): Google Fonts is no longer an outside service.
    expect(body).not.toContain("Google Fonts");
  });
  it("the update date is 06.11.2026", () => expect(policy).toContain('POLICY_UPDATED = "06.11.2026"'));
});
