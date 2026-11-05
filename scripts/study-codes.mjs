#!/usr/bin/env node
/* Participant codes for the research build (docs/research-build.md).
   node scripts/study-codes.mjs 40 > codes.csv
   prints code,sequence for N learners: unique random codes ERT-NNNC (Damm
   check digit, same as src/research/studyCode.ts), half with an even NNN
   (forms A → B → A) and half odd (B → A → B), in random order. The file is
   the allocation list: it stays with the responsible researcher, never in
   the repository or with the teacher. */
import { randomInt } from "node:crypto";
import { pathToFileURL } from "node:url";

const DAMM = "0317598642709215486342068713591750983426612304597836742095815869720134894536201794386172052581436790";
export const damm = (digits) => [...digits].reduce((i, ch) => Number(DAMM[i * 10 + Number(ch)]), 0);
export const codeOf = (n) => { const b = String(n).padStart(3, "0"); return `ERT-${b}${damm(b)}`; };

export function makeCodes(count, rand = randomInt) {
  if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error("count: 1..500");
  const pick = (even) => { for (;;) { const n = rand(0, 500) * 2 + (even ? 0 : 1); if (!used.has(n)) { used.add(n); return n; } } };
  const used = new Set();
  const rows = [];
  for (let i = 0; i < count; i++) rows.push(pick(i % 2 === 0));
  for (let i = rows.length - 1; i > 0; i--) { const j = rand(0, i + 1); [rows[i], rows[j]] = [rows[j], rows[i]]; }
  return rows.map((n) => ({ code: codeOf(n), sequence: n % 2 === 0 ? "AB" : "BA" }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = makeCodes(Number(process.argv[2] || 20));
  process.stdout.write("code,sequence\n" + rows.map((r) => `${r.code},${r.sequence}`).join("\n") + "\n");
}
