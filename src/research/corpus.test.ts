import { describe, expect, it } from "vitest";
import cefrj from "../../research/cefr/cefrj-vocabulary-profile-1.5.csv?raw";
import octanove from "../../research/cefr/octanove-vocabulary-profile-c1c2-1.0.csv?raw";
import profileJson from "../../docs/corpus-profile.json?raw";
import corpusDoc from "../../docs/corpus.md?raw";
import metaSourceFile from "../data/corpusMeta.ts?raw";
import { STORIES } from "../constants";
import { CONTENT_VERSION } from "../data/contentVersion";
import { CORPUS_META } from "../data/corpusMeta";
import { buildCorpus } from "./corpusBuild";
import {
  baseForm, buildLexicon, findNames, lookup, mattr, parseCsv, profileText, sentences, spliceMarkdown, tokens,
  LABELS, type Lexicon,
} from "./corpus";
import { lemmatize } from "./lemmatize";

const LEX = buildLexicon([cefrj, octanove]);
const built = buildCorpus([cefrj, octanove]);
const RUN = "Run `npm run corpus` and commit docs/corpus-profile.json, docs/corpus.md and src/data/corpusMeta.ts";

describe("corpus outputs are up to date", () => {
  it("docs/corpus-profile.json", () => expect(profileJson, RUN).toBe(built.json));
  it("the generated table in docs/corpus.md", () => expect(spliceMarkdown(corpusDoc, built.table), RUN).toBe(corpusDoc));
  it("src/data/corpusMeta.ts", () => expect(metaSourceFile, RUN).toBe(built.meta));
  it("the hand-written findings in docs/corpus.md quote the current numbers", () => {
    // "Что показал профиль" is prose, so check the figures it quotes.
    const findings = corpusDoc.slice(corpusDoc.indexOf("## Что показал профиль"), corpusDoc.indexOf("## Результаты"));
    const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")} %`;
    const at = (l: string) => built.report.summary.find((s) => s.label === l)!;
    expect(findings, RUN).toContain(pct(at("A1").coverageAtLabel));
    expect(findings, RUN).toContain(pct(at("A2").coverageAtLabel));
    expect(findings).toContain(`${at("A1").adequateAt} текст A1 из 7`);
    expect(findings).toContain(`${at("B1").adequateAt} из 7 достигают 95 % покрытия на B1`);
    expect(findings).toContain(`${at("B2").adequateBelow} из 7 текстов B2 и ${at("C1").adequateBelow} из 7 текстов C1`);
    expect(findings).toContain(`версия контента ${CONTENT_VERSION}`);
  });
  it("covers every tale at every level", () => {
    expect(built.report.texts).toHaveLength(STORIES.length * LABELS.length);
    for (const s of STORIES) for (const l of LABELS) expect(CORPUS_META[s.id]?.[l]?.words, `${s.id} ${l}`).toBeGreaterThan(0);
  });
});

describe("vocabulary lists", () => {
  it("parses quoted CSV fields", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n')).toEqual([["a", "b"], ["x, y", 'say "hi"']]);
  });
  it("reads both lists, A1 to C2", () => {
    expect(LEX.size).toBeGreaterThan(8000);
    expect(LEX.get("cat")?.level).toBe("A1");
    expect(LEX.get("timid")?.level).toBe("C1");
  });
  it("splits variant headwords and keeps the lowest level of a word", () => {
    const lex = buildLexicon(["headword,pos,CEFR\na.m./am,adverb,A1\nlight,noun,A1\nlight,adjective,A2\nice cream,noun,A1\n"]);
    expect(lex.get("am")?.level).toBe("A1");
    expect(lex.get("light")).toEqual({ level: "A1", content: true });
    expect(lex.has("ice cream")).toBe(false);
  });
  it("throws on a CSV without the needed columns", () => {
    expect(() => buildLexicon(["word,level\ncat,A1\n"])).toThrow();
  });
});

describe("words", () => {
  it("splits sentences after closing quotes", () => {
    expect(sentences('He shouts, "Look!" The man runs. Is it true?')).toEqual(['He shouts, "Look!', "The man runs.", "Is it true?"]);
  });
  it("counts contractions as one word and folds accents", () => {
    expect(tokens("Aldar Köse didn't run.").map((t) => t.lower)).toEqual(["aldar", "kose", "didn't", "run"]);
    expect(baseForm("didn't")).toBe("did");
    expect(baseForm("can't")).toBe("can");
    expect(baseForm("man's")).toBe("man");
  });
  it("a word opening a quotation starts a sentence", () => {
    const t = tokens('He said, "Thank you."');
    expect(t.find((x) => x.lower === "thank")?.sentenceStart).toBe(true);
  });
  it("finds names: capitalised inside a sentence, never lowercase", () => {
    const names = findNames(["Then Aldar runs. Aldar is clever.", "According to legend, he is clever. Look at the horse. I look."]);
    expect([...names]).toEqual(["aldar"]);
  });
  it("finds the dictionary form and the lowest level among readings", () => {
    expect(lookup("ran", LEX, lemmatize)).toMatchObject({ lemma: "run", entry: { level: "A1" } });
    expect(lookup("saw", LEX, lemmatize).entry?.level).toBe("A1");
    expect(lookup("wolves", LEX, lemmatize).lemma).toBe("wolf");
    expect(lookup("others", LEX, lemmatize).lemma).toBe("other");
    expect(lookup("steppe", LEX, lemmatize).entry).toBeUndefined();
    // wink alone gives hat, hop, rid, star; the e-rule in lemmatize.ts fixes them.
    expect(lookup("hated", LEX, lemmatize).lemma).toBe("hate");
    expect(lookup("hoped", LEX, lemmatize).lemma).toBe("hope");
    expect(lookup("riding", LEX, lemmatize)).toMatchObject({ lemma: "ride", entry: { level: "A1" } });
    expect(lookup("stared", LEX, lemmatize).lemma).toBe("stare");
    expect(lookup("hopped", LEX, lemmatize).lemma).toBe("hop");
    expect(lookup("visited", LEX, lemmatize).lemma).toBe("visit");
    expect(lookup("hissing", LEX, lemmatize).lemma).not.toBe("his");
    expect(lookup("cannot", LEX, lemmatize).lemma).toBe("can");
  });
  it("MATTR: plain TTR for short texts, moving average for long ones", () => {
    expect(mattr(["a", "b", "a"], 50)).toBeCloseTo(2 / 3);
    expect(mattr(["a", "b", "a", "b"], 2)).toBe(1);
    expect(mattr(["a", "a", "a", "b"], 2)).toBeCloseTo((1 / 2 + 1 / 2 + 1) / 3);
    expect(mattr([])).toBe(0);
  });
});

describe("one text", () => {
  const lex: Lexicon = buildLexicon(["headword,pos,CEFR\nthe,determiner,A1\ncat,noun,A1\nsit,verb,A1\nmat,noun,A2\nkhan,noun,C2\n"]);
  const ctx = { lex, lemmatize, names: new Set(["aldar"]), glossary: { the: "", cat: "мысық", sat: "отырды", aldar: "Алдар" } };
  const p = profileText("t", "A1", "Aldar sat. The cat sat on the mat. The cat sat.", null, ctx);

  it("counts words, sentences and names", () => {
    expect(p.words).toBe(11);
    expect(p.sentences).toBe(3);
    expect(p.maxSentence).toBe(6);
    expect(p.nameTokens).toBe(1);
  });
  it("coverage is cumulative and leaves names out", () => {
    // 10 words without the name: the×3, cat×2, sit×3 (A1), mat (A2), on (off the list)
    expect(p.coverage.A1).toBe(0.8);
    expect(p.coverage.A2).toBe(0.9);
    expect(p.coverage.C2).toBe(0.9);
    expect(p.estimatedAdequate).toBe("above C2");
    expect(p.estimatedAdequateOffListKnown).toBe("A2");
    expect(p.offList).toEqual([{ lemma: "on", count: 1 }]);
    expect(p.aboveLabel).toEqual([{ lemma: "mat", count: 1, level: "A2" }]);
  });
  it("translation coverage follows the reader's lookup", () => {
    // "the" has an empty translation and "on", "mat" none: 6 of 11 words.
    expect(p.glossCoverage).toBe(0.545);
    expect(p.glossMissing).toEqual(["mat", "on", "the"]);
  });
  it("translation coverage counts a hyphenated word as one tap, as the reader does", () => {
    const q = profileText("t", "A1", "The cat sat on a worn-out mat.", null, ctx);
    expect(q.words).toBe(8);
    expect(q.glossCoverage).toBe(0.286); // cat, sat of 7 taps
    expect(q.glossMissing).toContain("worn-out");
  });
  it("draft targets: content words at the level, repeated enough", () => {
    expect(p.targetCandidates.map((c) => c.lemma)).toEqual(["sit"]);
    expect(p.newLemmas).toBeNull();
  });
  it("new lemmas are counted against the lower levels of the same tale", () => {
    const q = profileText("t", "A2", "The cat sat on a big mat.", new Set(["the", "cat", "sit", "on"]), ctx);
    expect(q.newLemmas).toBe(3);
  });
});
