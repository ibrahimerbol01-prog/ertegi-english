---
name: "ertegi-story-method"
description: "Ertegi English method: write, adapt, level (A1–C1), check or extend Kazakh folk tales for the app, with quiz, flashcard, speaking and video-scene tasks."
---

# Ertegi story method

Use whenever the user wants to write, adapt, level, check or extend a story for the Ertegi English app (Kazakh folk tales taught to Kazakh children learning English), create A1-C1 versions of a tale, design quiz/flashcard/speaking tasks for a story, generate video-scene prompts, or asks about the Ertegi learning method. Trigger on "new story", "Er Töstik", "Asan Qaighy", "tale for level A2", "same plot for B1", "story for the app", "методика", "история на разных уровнях", even if the skill is not named.

Turns a real Kazakh folk tale into a set of English texts (A1, A2, B1, B2, C1) plus learning tasks and video scenes, following one fixed method. The methodology, level spec, file format, an example and the checker script are all included below (sections A–E).

## Workflow

1. **Source the tale.** Confirm the tale and its variant with the user. Never invent folk content: if unsure about a detail (names, ritual, moral), say so and ask. Mark sensitive cultural details for the user to verify.
2. **Write the beat spine** (7 beats, same for every level):
   1 Home/normal world, 2 Goal, 3 Obstacle, 4 Choice moment (child picks, tied to `choicePrompt`), 5 Action, 6 Outcome, 7 Moral (one sentence in the tale's own spirit).
   Every level keeps all 7 beats and the same plot. Only language, detail and inner thoughts change.
3. **Pick target words per level** (see section B). Targets are concrete, picturable, reusable. Each target appears at least 3 times in the text, spread across beats, once in the choice moment. Higher levels reuse lower-level targets plus new ones.
4. **Write each level** under its limits. Short, active, concrete sentences at A1-A2. Cause words (because, so, but) from A2. Dialogue from A2. Every level must be a real story with a goal and an obstacle, not a word list.
5. **Run the checker** for every level. First write the script from section E to `check_story.py` in the working directory (once per session), then: `python3 check_story.py story_A1.md --translations translations.json`. Fix every FAIL, reread every WARN.
6. **Add tasks** per story: 5 quiz questions (retrieval, no timer at A1-A2; mix recall of facts, word meaning, and one "why" inference), 1 choice prompt, 4-6 flashcard words with Kazakh translation, 1 speaking sentence per level for pronunciation scoring.
7. **Add video scenes**: 4-6 shots of 5-8 seconds, one per key beat, each with a prompt (setting, character, action, mood), no text in frame, no real brand/character likeness. Remind the user to check the generator's commercial licence.
8. **Hand over** with a short list of what the user must verify: cultural accuracy, Kazakh translations, level fit with a teacher.

## Rules that must hold

- Output English text only inside story files; translations to Kazakh go in the glossary.
- Honest labelling: methodology claims are either `evidence` (supported by research) or `hypothesis` (our design choice, to be tested in the pilot). Do not present hypotheses as proven.
- Do not simplify the culture away: keep names, values (hospitality, wisdom, bravery) and setting at every level.
- Never add violence beyond what the tale needs; keep it suitable for ages 8-14.
- Every word in the text should be translatable by the app: check against `WORD_TRANSLATIONS` (the checker reports missing words).

## Session loop used by the app (for task design)

Prime (video + 3-4 glossed words) → read along with audio → retrieval quiz → spaced flashcards (same day, +1, +3, +7 days) → speak one sentence → next level, same plot.

---

## A. Methodology: reasoning and evidence

Evidence comes from many universities and journals, not only Ivy League. Each rule is tagged EVIDENCE (supported by research, with typical effect sizes varying by study) or HYPOTHESIS (our design, to test in the pilot).

1. Retrieval practice: quiz after reading beats rereading (testing effect; Roediger & Karpicke, Washington Univ. and Purdue). EVIDENCE. -> quiz right after each story, no timer at A1-A2 to avoid anxiety (HYPOTHESIS).
2. Spacing: reviewing words across days beats massing (Cepeda et al.; L2 vocabulary studies). EVIDENCE. -> flashcards at same day, +1, +3, +7.
3. Interleaving and desirable difficulties (Bjork lab, UCLA): moderate difficulty improves retention. EVIDENCE. -> re-read same plot one level up.
4. Repetition for incidental vocabulary: a word needs roughly 10 meaningful encounters; a single exposure teaches about 13-17% of target words (Webb, Waring and others). EVIDENCE. -> targets repeat >= 3 times per text and reappear across levels and tasks.
5. Lexical coverage: comprehension generally needs high known-word coverage, commonly cited 95-98%; a 2025 study did not find significant differences between 90, 95, 98%. MIXED. -> we aim ~95% but treat as soft.
6. Reading while listening improves vocabulary and fluency for L2 (Webb & Chang and others). EVIDENCE. -> audio + highlight.
7. Multimedia learning (Mayer): words + relevant pictures, no decorative extras, signal key words, segment content. EVIDENCE. -> short videos, no on-screen text clutter, 3-4 glossed words only.
8. Dual coding (Paivio): concrete picturable words are easier. EVIDENCE. -> pick picturable targets.
9. Story structure: goal, obstacle, causal links improve comprehension and recall. EVIDENCE (reading research). -> 7-beat spine.
10. Generation and choice: making a decision about the story increases engagement and encoding. PARTLY EVIDENCE, our application HYPOTHESIS. -> choice moment.
11. Cultural relevance and identity support motivation in L2 learning. EVIDENCE (general), effect size in our app HYPOTHESIS. -> real Kazakh tales, translations in Kazakh.

Known limits: most studies use adults or university students; effects for 8-14 year olds and for Kazakh L1 learners are not directly tested. The pilot (pre/post vocabulary test) is how we check. Before citing any of these works in a scientific text, open and read the original.

## B. Level spec (limits used by check_story.py)

| Level | Words | Avg sentence | Max sentence | Targets | Tense / grammar |
|---|---|---|---|---|---|
| A1 | 80-120 | <= 7 | 10 | 3-4 | present simple, there is/are, can, basic adjectives, no subordinate clauses |
| A2 | 150-220 | <= 10 | 14 | 5-6 | past simple, and/but/because/so, simple dialogue |
| B1 | 250-350 | <= 14 | 20 | 6-8 | past continuous, comparatives, time clauses, reported speech (simple) |
| B2 | 400-550 | <= 18 | 26 | 8-10 | perfect tenses, conditionals, passive, inner thoughts |
| C1 | 600-800 | <= 22 | 32 | 10-12 | nuance, idiom, varied rhetoric, implied morals |

Rules:
- Each target word appears >= 3 times (A1-A2) or >= 2 times (B1+) in the level text.
- Non-target vocabulary should be known at the level or glossed. Aim for ~95% known-word coverage; this is a design target, not a proven threshold (a 2025 study found no significant comprehension difference between 90, 95 and 98%).
- The numbers are our working limits, derived from CEFR descriptors and common graded-reader practice. A teacher must validate them in the pilot.

## C. Story file format (input for check_story.py)

```
TITLE: Er Tostik and the Snake
LEVEL: A1
TARGETS: cave, bird, brave, help
---
[1] Text of beat 1.
[2] Text of beat 2.
...
[7] Moral.
```

- Header lines before `---`, body after.
- Start each beat with `[n]`. All 7 beats must be present.
- Plain English prose, one paragraph per beat.
- Glossary goes in a separate `glossary.json`: {"cave": "үңгір", ...}.

## D. Example (passes the checker: A1, 114 words, avg 5.4, max 10)

```
TITLE: Er Tostik and the Big Bird
LEVEL: A1
TARGETS: tree, bird, brave, help
---
[1] Er Tostik is a young man. He is strong and brave. His wife is Kenzhekey.
[2] A bad old woman sends him under the ground. It is dark there. He wants to go home.
[3] He sees a big tree. A big bird has a nest in the tree. A monster comes to the baby birds. They cry, "Help!"
[4] Er Tostik is afraid. Does he run away, or does he help the birds?
[5] Er Tostik is brave. He takes his sword. He fights the monster under the tree.
[6] The monster is dead. The baby birds are safe. The mother bird comes back. She says, "Thank you!"
[7] The bird takes him home. A brave heart finds help.
```

## E. check_story.py (write this to a file, then run it)

```python
#!/usr/bin/env python3
"""Check an Ertegi story file against level limits.
Usage: check_story.py story.md [--translations translations.json]
Exit code 1 if any FAIL.
"""
import argparse, json, re, sys

SPEC = {
    "A1": dict(words=(80, 120), avg=7, mx=10, targets=(3, 4), minrep=3),
    "A2": dict(words=(150, 220), avg=10, mx=14, targets=(5, 6), minrep=3),
    "B1": dict(words=(250, 350), avg=14, mx=20, targets=(6, 8), minrep=2),
    "B2": dict(words=(400, 550), avg=18, mx=26, targets=(8, 10), minrep=2),
    "C1": dict(words=(600, 800), avg=22, mx=32, targets=(10, 12), minrep=2),
}

def words_of(t):
    return re.findall(r"[A-Za-z]+(?:'[a-z]+)?", t.lower())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--translations")
    a = ap.parse_args()
    raw = open(a.file, encoding="utf-8").read()
    if "---" not in raw:
        print("FAIL no --- separator"); return 1
    head, body = raw.split("---", 1)
    meta = {}
    for line in head.splitlines():
        if ":" in line:
            k, v = line.split(":", 1); meta[k.strip().upper()] = v.strip()
    lvl = meta.get("LEVEL", "")
    if lvl not in SPEC:
        print("FAIL unknown LEVEL", lvl); return 1
    s = SPEC[lvl]
    targets = [t.strip().lower() for t in meta.get("TARGETS", "").split(",") if t.strip()]
    fails, warns = [], []

    beats = re.findall(r"^\[(\d)\]", body, flags=re.M)
    if sorted(beats) != [str(i) for i in range(1, 8)]:
        fails.append(f"beats found {beats}, need 1-7")

    text = re.sub(r"^\[\d\]\s*", "", body, flags=re.M)
    ws = words_of(text)
    n = len(ws)
    if not s["words"][0] <= n <= s["words"][1]:
        fails.append(f"word count {n} outside {s['words']}")

    sents = [x for x in re.split(r'(?<=[.!?])["”]?\s+', text.strip()) if words_of(x)]
    lens = [len(words_of(x)) for x in sents]
    avg = sum(lens) / len(lens) if lens else 0
    if avg > s["avg"]:
        fails.append(f"avg sentence {avg:.1f} > {s['avg']}")
    for x, l in zip(sents, lens):
        if l > s["mx"]:
            fails.append(f"sentence {l} words > {s['mx']}: {x[:60]}...")

    if not s["targets"][0] <= len(targets) <= s["targets"][1]:
        fails.append(f"{len(targets)} targets, need {s['targets']}")
    for t in targets:
        c = ws.count(t)
        if c < s["minrep"]:
            fails.append(f"target '{t}' appears {c}x, need >= {s['minrep']}")

    if a.translations:
        tr = {k.lower() for k in json.load(open(a.translations, encoding="utf-8"))}
        missing = sorted({w for w in ws if w not in tr})
        if missing:
            warns.append(f"{len(missing)} words without translation: {', '.join(missing)}")

    print(f"{lvl}: {n} words, {len(sents)} sentences, avg {avg:.1f}, max {max(lens) if lens else 0}")
    for w in warns: print("WARN", w)
    for f in fails: print("FAIL", f)
    if not fails: print("OK")
    return 1 if fails else 0

sys.exit(main())
```