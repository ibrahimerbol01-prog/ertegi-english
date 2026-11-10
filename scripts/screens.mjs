// Screenshots of every learner tab at 360, 390 and 1440 px with a demo session (Q5).
// No working database: the sign-in is a saved session in localStorage and every Supabase
// request is answered here, the way the e2e tests fake it (src/e2e/flow.dom.test.tsx).
//
// Usage:  npm run build && npx vite preview --port 4173   (in another terminal), then
//         node scripts/screens.mjs [base-url=http://localhost:4173] [out-dir=screens]
// Env:    CHROME_PATH   a Chrome/Chromium binary, if Playwright has no browser of its own
//         SB_AUTH_KEY   localStorage key of the Supabase session (default: the project's)
// Playwright is not a project dependency: like scripts/perf-measure.cjs, it is taken from a
// local or global install (npm i -g playwright && npx playwright install chromium).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch {
  try { ({ chromium } = require(join(execSync("npm root -g").toString().trim(), "playwright"))); } catch {
    console.error("Playwright not found. Install it: npm i -g playwright && npx playwright install chromium");
    process.exit(1);
  }
}

const BASE = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const OUT = process.argv[3] || "screens";
const AUTH_KEY = process.env.SB_AUTH_KEY || "sb-tsialjlxlhwemrkyyvjv-auth-token";
const WIDTHS = [[360, 740], [390, 844], [1440, 900]];

// --- the demo learner and the data the fake database answers with ---
const USER = "00000000-0000-0000-0000-00000000de30";
const session = () => {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "demo-jwt", refresh_token: "demo", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
    user: { id: USER, aud: "authenticated", email: "demo@example.test", app_metadata: {}, user_metadata: { role: "student", display_name: "Айгерім" }, created_at: "2026-09-01" },
  };
};
const day = (d) => new Date(Date.now() + d * 86400000).toISOString();
const DATA = {
  profiles: { id: USER, display_name: "Айгерім", xp: 140, quizzes_completed: 3, perfect_quizzes: 1, streak_days: 4, last_active_date: new Date().toISOString().slice(0, 10) },
  saved_words: [
    ["coat", "шапан", 1, day(-1)], ["horse", "ат", 6, day(60)], ["clever", "айлакер", 2, day(-1)],
    ["merchant", "саудагер", 0, day(-1)], ["trick", "айла", 6, day(40)], ["rich", "бай", 3, day(5)],
  ].map(([word, translation, mastery, next_review_at]) => ({ word, translation, mastery, next_review_at, review_count: mastery })),
  quiz_results: [{ story_id: "aldar_kose", level: "A1", score: 4, total: 4, created_at: day(-2) }],
};
const answer = (route) => {
  const req = route.request();
  const path = req.url().replace(/^https?:\/\/[^/]+/, "");
  const table = (path.match(/^\/rest\/v1\/([a-z_]+)/) || [])[1];
  let body = "[]";
  if (req.method() === "GET" && table && DATA[table]) {
    const one = (req.headers()["accept"] || "").includes("vnd.pgrst.object");
    const rows = Array.isArray(DATA[table]) ? DATA[table] : [DATA[table]];
    body = JSON.stringify(one ? rows[0] : rows);
  } else if (/^\/rest\/v1\/rpc\//.test(path)) body = "null";
  return route.fulfill({ status: 200, contentType: "application/json", body });
};

// --- steps ---
const signIn = async (pg) => {
  await pg.evaluate(([k, v]) => localStorage.setItem(k, v), [AUTH_KEY, JSON.stringify(session())]);
  await pg.reload();
  await pg.getByRole("button", { name: "Кіру" }).first().click();
  await pg.getByText(/Сәлем/).first().waitFor({ timeout: 20000 });
  await calm(pg);
};
// Close a sheet that opens on its own (the week's words) so it doesn't cover the screen.
const calm = async (pg) => {
  await pg.waitForTimeout(600);
  if (await pg.getByRole("dialog").count()) { await pg.keyboard.press("Escape"); await pg.waitForTimeout(300); }
};
const tab = (name) => async (pg) => {
  await pg.getByRole("button", { name: new RegExp(`${name}$`) }).first().click();
  await calm(pg);
};
const practice = (sub) => async (pg) => {
  await tab("Жаттығу")(pg);
  await pg.getByRole("tablist").getByRole("tab", { name: sub }).click();
  await calm(pg);
};
const reader = async (pg) => {
  await tab("Ертегілер")(pg);
  // Same targets as the e2e flow test: the first tale's card, then its A1 level.
  await pg.getByRole("button", { name: /Aldar Köse & the Rich/ }).first().click();
  await pg.getByRole("button", { name: /^A1/ }).first().click();
  await pg.locator("article, [lang=en]").first().waitFor({ timeout: 15000 });
};
const quizQuestion = async (pg) => {
  await reader(pg);
  await pg.getByRole("button", { name: /^Сынақтан өту/ }).first().click();
  await pg.getByRole("button", { name: "Бастау" }).first().click();
  await pg.getByRole("radio").first().waitFor({ timeout: 15000 });
};

const SHOTS = [
  ["00-landing", null],
  ["01-home", async () => {}],
  ["02-tales", tab("Ертегілер")],
  ["03-reader-a1", reader],
  ["04-practice-words", practice("Сөздер")],
  ["05-practice-speak", practice("Айтылым")],
  ["06-practice-test", practice("Тест")],
  ["07-quiz-question", quizQuestion],
  ["08-wordbank", tab("Сөздік")],
  ["09-me", tab("Мен")],
];

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let ok = 0;
const failed = [];
for (const [w, h] of WIDTHS) {
  const dir = join(OUT, String(w));
  mkdirSync(dir, { recursive: true });
  for (const [name, step] of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const pg = await ctx.newPage();
    await pg.route("**/*.supabase.co/**", answer);
    try {
      await pg.goto(`${BASE}/`);
      await pg.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 20000 });
      if (step) { await signIn(pg); await step(pg); }
      await pg.waitForTimeout(400);
      await pg.screenshot({ path: join(dir, `${name}.png`), fullPage: true });
      ok++;
    } catch (e) {
      failed.push(`${w}/${name}: ${String(e.message || e).split("\n")[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`${ok} screenshots in ${OUT}/ (${WIDTHS.map(([w]) => w).join(", ")} px)`);
if (failed.length) { console.error(`Failed:\n  ${failed.join("\n  ")}`); process.exit(1); }
