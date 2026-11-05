#!/usr/bin/env python3
"""Study dataset builder (stage 0/1): learning_events export -> analysis tables.

Run:  python3 -I scripts/study-dataset.py --events events.csv --assignment assignment.csv \
          --allocation allocation.csv --study-id ertegi-stage0-2027 --out out/
Self-test (synthetic data, pipeline check only):  python3 -I scripts/study-dataset.py --selftest

Inputs (all CSV, UTF-8; docs/research-design/data-pipeline.md has the codebook):
  events      Supabase SQL editor export of public.learning_events
              (user_id, verb, object_type, object_id, story_id, level, result, context, occurred_at).
  assignment  code,story_id,condition[,position]   condition = F (folklore) or C (control) per student and tale.
              Comes from the randomisation plan (study-design.md, 3.1, 20 lists); not produced by the app.
  allocation  code,sequence (output of scripts/study-codes.mjs): the CONSORT denominator.
Outputs (--out):
  words.csv     one row per student x target word: known_pre/post/delayed, folk, position, form, pair, class, taps.
  students.csv  one row per student: completion flags, ITT / per-protocol, early exposure, versions seen.
  consort.csv   participant flow counts.
No data are invented here: the script only reshapes what the app logged. Sample (SAMPLE) items are dropped.
"""
import argparse, csv, json, os, sys, tempfile, random
from collections import defaultdict

TIMEPOINTS = ("pre", "post", "delayed")


def jload(s):
    if s is None or s == "":
        return {}
    if isinstance(s, dict):
        return s
    try:
        v = json.loads(s)
        return v if isinstance(v, dict) else {}
    except ValueError:
        return {}


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def load_events(rows, study_id):
    """Keep research-build events of this study; attach a participant code to every event of the user."""
    ev = []
    for r in rows:
        ctx = jload(r.get("context"))
        if ctx.get("research") not in (True, "true", "True") or ctx.get("study_id") != study_id:
            continue
        res = jload(r.get("result"))
        if res.get("sample") in (True, "true"):
            continue
        ev.append({**r, "ctx": ctx, "res": res})
    code_of = {}
    for e in ev:
        c = e["ctx"].get("study_code")
        if c:
            code_of.setdefault(e["user_id"], c)
    clash = defaultdict(set)
    for e in ev:
        c = e["ctx"].get("study_code")
        if c:
            clash[e["user_id"]].add(c)
    bad = {u for u, cs in clash.items() if len(cs) > 1}
    return ev, code_of, bad


def build(events_rows, assignment_rows, allocation_rows, study_id, allowed_versions=None):
    ev, code_of, bad = load_events(events_rows, study_id)
    cond = {(a["code"], a["story_id"]): a["condition"].strip().upper() for a in assignment_rows}
    pos_given = {(a["code"], a["story_id"]): a.get("position") for a in assignment_rows}
    issued = {a["code"] for a in allocation_rows}
    by_code = defaultdict(list)
    for e in ev:
        c = code_of.get(e["user_id"])
        if c and e["user_id"] not in bad:
            by_code[c].append(e)
    for evs in by_code.values():
        evs.sort(key=lambda e: e["occurred_at"])

    words, students = [], []
    for code, evs in sorted(by_code.items()):
        # First answer per item and timepoint wins (an item is answered once; a repeat would be a client replay).
        ans = {}
        done = {}
        for e in evs:
            r = e["res"]
            if e["verb"] == "test_answer" and r.get("timepoint") in TIMEPOINTS:
                ans.setdefault((r["timepoint"], e["object_id"]), e)
            elif e["verb"] == "test_complete" and r.get("timepoint") in TIMEPOINTS:
                done.setdefault(r["timepoint"], e)
        stories = sorted({e["story_id"] for e in evs if e["verb"] in ("story_open", "level_complete") and e["story_id"]})
        first_open = {}
        for e in evs:
            if e["verb"] == "story_open" and e["story_id"]:
                first_open.setdefault(e["story_id"], e["occurred_at"])
        order = {s: i + 1 for i, s in enumerate(sorted(first_open, key=first_open.get))}
        pre_done_at = done["pre"]["occurred_at"] if "pre" in done else None
        # Early exposure: a study tale opened before the pretest ended (design 3.1: such students go to the sensitivity analysis).
        early = bool(pre_done_at) and any(t < pre_done_at for t in first_open.values()) or (not pre_done_at and bool(first_open))
        taps = defaultdict(int)
        for e in evs:
            if e["verb"] == "word_tap" and e["object_id"]:
                taps[(e["story_id"], e["object_id"].lower())] += 1
        completed = {e["story_id"] for e in evs if e["verb"] == "level_complete" and e["story_id"]}
        conds_done = {cond.get((code, s)) for s in completed} - {None}
        versions = sorted({e["ctx"].get("content_version") for e in evs if e["ctx"].get("content_version")})
        integrity = allowed_versions is None or set(versions) <= set(allowed_versions)
        has = {t: t in done for t in TIMEPOINTS}
        itt = has["pre"] and has["delayed"]
        pp = itt and len(completed) >= 4 and {"F", "C"} <= conds_done
        students.append({
            "code": code, "class_id": next((e["ctx"].get("class_id") for e in evs if e["ctx"].get("class_id")), ""),
            "pre": int(has["pre"]), "post": int(has["post"]), "delayed": int(has["delayed"]),
            "tales_completed": len(completed), "conditions_completed": "".join(sorted(conds_done)),
            "itt": int(itt), "per_protocol": int(pp), "early_exposure": int(early),
            "content_versions": "|".join(versions), "version_ok": int(integrity),
            "form_pre": (done.get("pre") or {}).get("res", {}).get("form", ""),
        })
        # Word rows from the 'meaning' items (primary measure); other formats go to the sensitivity sum below.
        items = {}
        for (tp, iid), e in ans.items():
            r = e["res"]
            if r.get("pseudo"):
                continue
            items.setdefault(iid, {"story_id": e["story_id"], "word": (r.get("word") or "").lower(), "format": r.get("format")})
            items[iid][tp] = r.get("correct")
            items[iid]["form_" + tp] = r.get("form")
        # A word is one row: pool its meaning items across forms (A/B items of the same word share the word).
        agg = {}
        for iid, it in items.items():
            if it["format"] != "meaning" or not it["word"]:
                continue
            a = agg.setdefault((it["story_id"], it["word"]), {})
            for tp in TIMEPOINTS:
                if tp in it:
                    a[tp] = it[tp]
                    a["form_" + tp] = it.get("form_" + tp, "")
        for (s, w), a in sorted(agg.items()):
            c = cond.get((code, s))
            words.append({
                "code": code, "story_id": s, "word": w, "folk": "" if c is None else int(c == "F"),
                "known_pre": a.get("pre", ""), "known_post": a.get("post", ""), "known_delayed": a.get("delayed", ""),
                "form_pre": a.get("form_pre", ""), "form_delayed": a.get("form_delayed", ""),
                "position": pos_given.get((code, s)) or order.get(s, ""), "taps": taps.get((s, w), 0),
                "class_id": students[-1]["class_id"], "itt": students[-1]["itt"], "per_protocol": students[-1]["per_protocol"],
                "early_exposure": students[-1]["early_exposure"], "version_ok": students[-1]["version_ok"],
            })

    st = students
    consort = [
        ("codes_issued", len(issued)),
        ("codes_with_any_event", len(by_code)),
        ("codes_not_in_allocation", len(set(by_code) - issued)),
        ("users_with_conflicting_codes_excluded", len(bad)),
        ("pretest_complete", sum(s["pre"] for s in st)),
        ("posttest_complete", sum(s["post"] for s in st)),
        ("delayed_complete", sum(s["delayed"] for s in st)),
        ("itt", sum(s["itt"] for s in st)),
        ("per_protocol", sum(s["per_protocol"] for s in st)),
        ("early_exposure", sum(s["early_exposure"] for s in st)),
        ("version_mismatch", sum(1 - s["version_ok"] for s in st)),
        ("students_without_assignment", sum(1 for w in {x["code"] for x in words if x["folk"] == ""})),
    ]
    return words, students, consort


def write_csv(path, rows, fields=None):
    if not rows:
        open(path, "w").close()
        return
    fields = fields or list(rows[0].keys())
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def selftest():
    """SYNTHETIC data, made up here only to check that the pipeline runs. Never analyse or report these numbers."""
    rnd = random.Random(1)
    sid = "selftest"
    tales = ["t1", "t2"]
    ev, assign, alloc = [], [], []
    def add(u, code, verb, t, story=None, oid=None, res=None, cls="c1"):
        ev.append({"user_id": u, "verb": verb, "object_type": "", "object_id": oid or "", "story_id": story or "", "level": "",
                   "result": json.dumps(res or {}), "occurred_at": t,
                   "context": json.dumps({"research": True, "study_id": sid, "study_code": code, "content_version": "v1", "class_id": cls})})
    for n in range(4):
        u, code = f"u{n}", f"ERT-{1000 + n}"
        alloc.append({"code": code, "sequence": "AB"})
        for i, s in enumerate(tales):
            assign.append({"code": code, "story_id": s, "condition": "F" if (n + i) % 2 == 0 else "C"})
        for tp, base in (("pre", "2026-12-01T09:"), ("post", "2026-12-10T09:"), ("delayed", "2027-01-05T09:")):
            if n == 3 and tp == "delayed":
                continue  # dropout
            for s in tales:
                add(u, code, "test_answer", base + "0" + str(tales.index(s)), s, f"{s}-w", {"timepoint": tp, "format": "meaning", "form": "A", "word": f"{s}word", "correct": rnd.randint(0, 1)})
            add(u, code, "test_answer", base + "05", tales[0], "pseudo1", {"timepoint": tp, "format": "recognition", "pseudo": True, "correct": 1})
            add(u, code, "test_complete", base + "09", None, None, {"timepoint": tp, "form": "A"})
            if tp == "pre":
                for s in tales:
                    add(u, code, "story_open", "2026-12-02T10:0" + str(tales.index(s)), s)
                    add(u, code, "word_tap", "2026-12-02T10:1" + str(tales.index(s)), s, f"{s}word")
                    add(u, code, "level_complete", "2026-12-03T10:00", s, f"{s}:b1")
    # sample item and foreign study must be dropped
    add("u0", "ERT-1000", "test_answer", "2026-12-01T09:20", "t1", "x", {"timepoint": "pre", "sample": True, "format": "meaning", "word": "zzz", "correct": 1})
    ev.append({**ev[0], "context": json.dumps({"research": True, "study_id": "other", "study_code": "ERT-9999"})})
    words, students, consort = build(ev, assign, alloc, sid, allowed_versions=["v1"])
    c = dict(consort)
    assert c["codes_issued"] == 4 and c["itt"] == 3, c
    assert c["delayed_complete"] == 3 and c["codes_not_in_allocation"] == 0, c
    assert all(w["word"] != "zzz" for w in words), "sample item leaked"
    assert len(words) == 4 * 2, len(words)
    assert {w["folk"] for w in words} <= {0, 1}
    assert all(s["early_exposure"] == 0 for s in students), "story_open came after pretest"
    assert next(w for w in words if w["code"] == "ERT-1000" and w["story_id"] == "t1")["taps"] == 1
    d = tempfile.mkdtemp()
    write_csv(os.path.join(d, "words.csv"), words)
    print("selftest ok:", c)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--events"); p.add_argument("--assignment"); p.add_argument("--allocation")
    p.add_argument("--study-id"); p.add_argument("--out", default="out")
    p.add_argument("--content-versions", help="comma-separated allowed content_version values")
    p.add_argument("--selftest", action="store_true")
    a = p.parse_args()
    if a.selftest:
        return selftest()
    for k in ("events", "assignment", "allocation", "study_id"):
        if not getattr(a, k):
            p.error(f"--{k.replace('_', '-')} is required")
    words, students, consort = build(read_csv(a.events), read_csv(a.assignment), read_csv(a.allocation), a.study_id,
                                     a.content_versions.split(",") if a.content_versions else None)
    os.makedirs(a.out, exist_ok=True)
    write_csv(os.path.join(a.out, "words.csv"), words)
    write_csv(os.path.join(a.out, "students.csv"), students)
    write_csv(os.path.join(a.out, "consort.csv"), [{"item": k, "n": v} for k, v in consort])
    for k, v in consort:
        print(f"{k:42s}{v}")


if __name__ == "__main__":
    sys.exit(main())
