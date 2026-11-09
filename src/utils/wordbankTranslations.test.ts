import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORDBANK_TRANSLATION_FILES } from "../data/wordbank/config";
import type { WordbankEntry } from "../data/wordbank/types";
import { applyTranslations, isShown, pairKey, translationMap } from "./wordbankTranslations";
import { wordbankMeaning } from "../components/screens/wordbankMeaning";
import { parseCsv } from "../research/corpus";

/* Translations of the wordbank: agreed / ai-reviewed / human / needs-review
   (src/utils/wordbankTranslations.ts), what the screen shows for each, and
   that A1.json holds exactly what the files say. */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const entry = (word: string, pos = "noun"): WordbankEntry => ({ word, pos, level: "A1", source: "cefrj", example: null, kk: "", ru: "" });
const AGREED = "headword,pos,kk,ru\nhorse,noun,ат,лошадь\napple,noun,алма,яблоко\nm,be-verb,-мын,(я) есть\n";
const REVIEW = "headword,pos,kk_claude,kk_gemini,ru_claude,ru_gemini,причина,kk_final,ru_final,reviewer\n" +
  "watch,noun,қол сағат,сағат,наручные часы,часы,kk расходится,,,\n" +
  "aunt,noun,апа,тәте,тётя,тётя,?,тәте,тётя,teacher\n";
const ARBITRATION = "id,headword,pos,kk_choice,kk_final,ru_choice,ru_final,source_url\n" +
  "1,watch,noun,claude,қол сағат,claude,наручные часы,https://example.org/dict/watch\n" +
  "2,aunt,noun,gemini,тәте,gemini,тётя,https://example.org/dict/aunt\n" +
  "3,apple,noun,gemini,алма жемісі,gemini,яблоко,https://example.org/dict/apple\n";

describe("translation statuses", () => {
  it("agreed pairs get kk/ru and tr=agreed; review pairs stay empty as needs-review; a filled review is human", () => {
    const map = translationMap({ agreed: AGREED, review: REVIEW });
    expect(map.get(pairKey("horse", "noun"))).toEqual({ kk: "ат", ru: "лошадь", tr: "agreed" });
    expect(map.get(pairKey("watch", "noun"))).toEqual({ kk: "", ru: "", tr: "needs-review" });
    expect(map.get(pairKey("aunt", "noun"))).toEqual({ kk: "тәте", ru: "тётя", tr: "human" });
  });

  it("arbitration by a model with a source gives ai-reviewed; priority human > ai-reviewed > agreed", () => {
    const map = translationMap({ agreed: AGREED, review: REVIEW, arbitration: ARBITRATION });
    expect(map.get(pairKey("watch", "noun"))).toEqual({ kk: "қол сағат", ru: "наручные часы", tr: "ai-reviewed" });
    expect(map.get(pairKey("apple", "noun"))?.tr).toBe("ai-reviewed");
    expect(map.get(pairKey("aunt", "noun"))?.tr).toBe("human");
  });

  it("an arbitration row chosen by a human, or without a source, does not count: the pair stays needs-review", () => {
    const arb = "id,headword,pos,kk_choice,kk_final,ru_choice,ru_final,source_url\n" +
      "1,watch,noun,human,сағат,claude,часы,https://example.org/x\n2,watch,verb,claude,көру,claude,смотреть,\n";
    const review = REVIEW + "watch,verb,көру,қарау,смотреть,смотреть,kk расходится,,,\n";
    const map = translationMap({ review, arbitration: arb });
    expect(map.get(pairKey("watch", "noun"))?.tr).toBe("needs-review");
    expect(map.get(pairKey("watch", "verb"))?.tr).toBe("needs-review");
  });

  it("without the arbitration file the build simply skips it", () => {
    expect(translationMap({ agreed: AGREED, review: REVIEW })).toEqual(translationMap({ agreed: AGREED, review: REVIEW, arbitration: undefined }));
  });

  it("matches the headword without case or apostrophes (the sheets wrote \"a.m./a.m./am/am\" and \"m\")", () => {
    expect(pairKey("a.m./A.M./am/AM", "adverb")).toBe(pairKey("a.m./a.m./am/am", "adverb"));
    expect(pairKey("'m", "be-verb")).toBe(pairKey("m", "be-verb"));
    expect(pairKey("May", "noun")).not.toBe(pairKey("may", "modal auxiliary"));
  });

  it("applies to entries, and a translated pair with no entry is an error, not lost silently", () => {
    const map = translationMap({ agreed: AGREED, review: REVIEW });
    const out = applyTranslations([entry("horse"), entry("apple"), entry("'m", "be-verb"), entry("watch"), entry("aunt"), entry("cat")], map);
    expect(out.map((e) => e.tr)).toEqual(["agreed", "agreed", "agreed", "needs-review", "human", undefined]);
    expect(out[2].kk).toBe("-мын");
    expect(() => applyTranslations([entry("horse")], map)).toThrow(/no wordbank entry/);
  });

  it("a malformed file fails loudly", () => {
    expect(() => translationMap({ agreed: "word,kk\nhorse,ат\n" })).toThrow(/column headword missing/);
  });
});

describe("what the screen shows", () => {
  it("agreed and ai-reviewed: the meaning, marked as machine translation; human: unmarked; needs-review: nothing, no card", () => {
    expect(wordbankMeaning({ ...entry("horse"), kk: "ат", ru: "лошадь", tr: "agreed" })).toEqual({ kk: "ат", ru: "лошадь", auto: true, reviewing: false });
    expect(wordbankMeaning({ ...entry("watch"), kk: "қол сағат", ru: "часы", tr: "ai-reviewed" }).auto).toBe(true);
    expect(wordbankMeaning({ ...entry("aunt"), kk: "тәте", ru: "тётя", tr: "human" })).toEqual({ kk: "тәте", ru: "тётя", auto: false, reviewing: false });
    expect(wordbankMeaning({ ...entry("watch"), tr: "needs-review" })).toEqual({ kk: "", ru: "", auto: false, reviewing: true });
    for (const tr of ["agreed", "ai-reviewed", "human"] as const) expect(isShown(tr)).toBe(true);
    expect(isShown("needs-review")).toBe(false);
  });

  it("the card gets the Kazakh meaning, and a needs-review word has no active add button", () => {
    const src = read("src/components/screens/WordbankScreen.tsx");
    expect(src).toContain("const translation = m.kk;");
    expect(src).toContain("disabled={isSaved || !translation}");
    expect(src).toContain("onClick={() => onAdd(word, translation)}");
    expect(src).toContain("{m.reviewing && <p className=\"text-sm text-ink-3\">{t.wbTrReview}</p>}");
    expect(src).toContain("{m.auto && ");
  });
});

describe("A1.json holds what the translation files say", () => {
  const files = WORDBANK_TRANSLATION_FILES.A1!;
  const a1 = JSON.parse(read("src/data/wordbank/A1.json")) as WordbankEntry[];
  const rows = (p: string) => { const [h, ...r] = parseCsv(read(p)); return r.map((x) => Object.fromEntries(h.map((c, i) => [c.trim(), (x[i] ?? "").trim()]))); };

  it("every A1 word has a status; agreed and review together cover all of A1", () => {
    expect(a1.every((e) => e.tr)).toBe(true);
    expect(rows(files.agreed).length + rows(files.review).length).toBe(a1.length);
  });

  it("the counts match the files (agreed, needs-review, human, ai-reviewed)", () => {
    const count = (tr: string) => a1.filter((e) => e.tr === tr).length;
    const human = rows(files.review).filter((r) => r.kk_final && r.ru_final).length;
    const arb = !!files.arbitration && existsSync(join(root, files.arbitration));
    expect(count("human")).toBe(human);
    if (!arb) {
      expect(count("ai-reviewed")).toBe(0);
      expect(count("agreed")).toBe(rows(files.agreed).length);
      expect(count("needs-review")).toBe(rows(files.review).length - human);
    }
    expect(count("agreed") + count("ai-reviewed") + count("human") + count("needs-review")).toBe(a1.length);
  });

  it("the review sheet has the columns for the person: kk_final, ru_final, reviewer", () => {
    const [h] = parseCsv(read(files.review));
    expect(h.slice(-3)).toEqual(["kk_final", "ru_final", "reviewer"]);
  });
});

describe("A2.json holds the agreed translations and the decided arbitration pairs", () => {
  const files = WORDBANK_TRANSLATION_FILES.A2!;
  const a2 = JSON.parse(read("src/data/wordbank/A2.json")) as WordbankEntry[];
  const [h, ...body] = parseCsv(read(files.agreed));
  const agreed = new Map(body.map((x) => { const r = Object.fromEntries(h.map((c, i) => [c.trim(), (x[i] ?? "").trim()])); return [pairKey(r.headword, r.pos), r]; }));

  it("the dispatcher's decision: agreed + arbitration, no review sheet for A2 yet", () => {
    expect(existsSync(join(root, files.arbitration!))).toBe(true);
    expect(existsSync(join(root, files.review))).toBe(false);
    expect(a2.every((e) => !e.tr || e.tr === "agreed" || e.tr === "ai-reviewed")).toBe(true);
  });

  it("ai-reviewed = arbitration rows where both kk and ru are decided, with those values", () => {
    const [ah, ...ab] = parseCsv(read(files.arbitration!));
    const arb = ab.map((x) => Object.fromEntries(ah.map((c, i) => [c.trim(), (x[i] ?? "").trim()]))).filter((r) => r.kk_final && r.ru_final);
    const ai = a2.filter((e) => e.tr === "ai-reviewed");
    expect(ai.length).toBe(arb.length);
    const byKey = new Map(arb.map((r) => [pairKey(r.headword, r.pos), r]));
    for (const e of ai) expect([e.kk, e.ru], e.word).toEqual([byKey.get(pairKey(e.word, e.pos))!.kk_final, byKey.get(pairKey(e.word, e.pos))!.ru_final]);
  });

  it("every agreed row lands on its A2 word with the same kk and ru", () => {
    expect(agreed.size).toBe(body.length);
    const hit = a2.filter((e) => e.tr === "agreed");
    expect(hit.length).toBe(agreed.size);
    for (const e of hit) {
      const r = agreed.get(pairKey(e.word, e.pos));
      expect(r, e.word).toBeDefined();
      expect([e.kk, e.ru]).toEqual([r!.kk, r!.ru]);
    }
  });

  it("the other A2 words stay without a translation, so the screen offers no card for them", () => {
    const rest = a2.filter((e) => !e.tr);
    expect(rest.length).toBe(a2.length - agreed.size - a2.filter((e) => e.tr === "ai-reviewed").length);
    expect(rest.every((e) => e.kk === "" && e.ru === "")).toBe(true);
  });
});
