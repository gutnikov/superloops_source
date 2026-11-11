#!/usr/bin/env python3
"""The superloops wizard: its questions, and the plan of loops a set of answers brings in.

    python3 wizard.py check                      wizard.json is whole: every step has its prompt, every option a
                                                 unique id, every loop id is in the catalog, every plan loop has a
                                                 place in `order`, every rule names real steps and options
    python3 wizard.py questions [ANSWERS]        the steps still to answer, as JSON: id, question, multi, options
    python3 wizard.py resolve ANSWERS [--json]   the profile and the plan of loops for a set of answers

ANSWERS is a JSON file, or `-` for stdin: {"phase": "existing", "kind": ["web"], ...}, or the same object under an
"answers" key, as the site writes it. A single-choice step takes a string, a multi-choice step a list.

The plan: the core loops, the loops each answer adds, and the loops of the rules whose conditions the answers meet.
The loops a bundle covers become that one bundle loop. Loops added by the answers to `pains` come first after the
bundle, then the rest in the order of `order`; the first `first_wave` of them are wave 1, the others wave 2.
`suggest` lists loop types to build later, when a failure shows the project needs them.

Only the Python 3 standard library.
"""
import argparse
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent.parent
WIZARD = HERE / "wizard.json"
CATALOG = HERE.parent / "harness" / "loops"
OBSERVABILITY = ("errors", "logs", "metrics", "traces")


def load_wizard():
    return json.loads(WIZARD.read_text(encoding="utf-8"))


def catalog_ids():
    return {p.parent.name for p in CATALOG.glob("*/card.md") if p.parent.name != "_template"}


def steps_by_id(w):
    return {s["id"]: s for s in w["steps"]}


def covered(w):
    """{loop type: bundle id} for every loop type a bundle covers."""
    return {t: b["id"] for b in w.get("bundles", []) for t in b["covers"]}


def check(w):
    errors = []
    known = catalog_ids()
    bundles = {b["id"]: b for b in w.get("bundles", [])}
    steps = steps_by_id(w)
    if len(steps) != len(w["steps"]):
        errors.append("two steps share an id")

    def loop_ids(where, ids, allow_bundles=False):
        for i in ids:
            if i in known or (allow_bundles and i in bundles):
                continue
            errors.append("%s: %r is not a loop type in the catalog" % (where, i))

    loop_ids("core.loops", w["core"]["loops"])
    if not (HERE / w["core"]["prompt"]).exists():
        errors.append("core.prompt: %s does not exist" % w["core"]["prompt"])
    for b in bundles.values():
        loop_ids("bundle %s" % b["id"], [b["type"]] + b["covers"])
    loop_ids("order", w["order"], allow_bundles=True)
    if len(set(w["order"])) != len(w["order"]):
        errors.append("order: a loop is listed twice")

    plan_loops = set(w["core"]["loops"])
    for s in w["steps"]:
        where = "step %s" % s["id"]
        if not re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", s["id"]):
            errors.append("%s: the id must be kebab-case" % where)
        if not (HERE / s["prompt"]).exists():
            errors.append("%s: prompt %s does not exist" % (where, s["prompt"]))
        if s["prompt"] != "steps/wizard-%s.md" % s["id"]:
            errors.append("%s: prompt must be steps/wizard-%s.md" % (where, s["id"]))
        ids = [o["id"] for o in s["options"]]
        if len(set(ids)) != len(ids):
            errors.append("%s: two options share an id" % where)
        if not 2 <= len(ids):
            errors.append("%s: fewer than 2 options" % where)
        for o in s["options"]:
            ow = "%s option %s" % (where, o["id"])
            loop_ids(ow + " loops", o.get("loops", []))
            loop_ids(ow + " suggest", o.get("suggest", []))
            plan_loops.update(o.get("loops", []))
            if o.get("exclusive") and not s["multi"]:
                errors.append("%s: exclusive only makes sense in a multi-choice step" % ow)
    for n, r in enumerate(w.get("rules", [])):
        where = "rule %d" % (n + 1)
        for step_id, options in r["if"].items():
            if step_id not in steps:
                errors.append("%s: no step %r" % (where, step_id))
                continue
            for o in options:
                if o not in {x["id"] for x in steps[step_id]["options"]}:
                    errors.append("%s: step %s has no option %r" % (where, step_id, o))
        loop_ids(where + " loops", r.get("loops", []))
        loop_ids(where + " suggest", r.get("suggest", []))
        plan_loops.update(r.get("loops", []))
        if not r.get("why"):
            errors.append("%s: no why" % where)
    cov = covered(w)
    for i in sorted(plan_loops):
        if cov.get(i, i) not in w["order"]:
            errors.append("order: %r can be in a plan but has no place in order" % cov.get(i, i))
    for s in w["steps"]:
        text = (HERE / s["prompt"]).read_text(encoding="utf-8") if (HERE / s["prompt"]).exists() else ""
        for o in s["options"]:
            if "`%s`" % o["id"] not in text:
                errors.append("%s: the prompt never names option `%s`" % (s["prompt"], o["id"]))
        for i in sorted({x for o in s["options"] for x in o.get("loops", []) + o.get("suggest", [])}):
            if i not in text:
                errors.append("%s: the prompt never names loop %s" % (s["prompt"], i))
    core_text = (HERE / w["core"]["prompt"]).read_text(encoding="utf-8") if (HERE / w["core"]["prompt"]).exists() else ""
    for i in w["core"]["loops"]:
        if i not in core_text:
            errors.append("%s: the prompt never names loop %s" % (w["core"]["prompt"], i))
    return errors


def read_answers(path):
    raw = sys.stdin.read() if path == "-" else pathlib.Path(path).read_text(encoding="utf-8")
    data = json.loads(raw) if raw.strip() else {}
    return data.get("answers", data)


def validate_answers(w, answers):
    errors = []
    steps = steps_by_id(w)
    for key, value in answers.items():
        if key not in steps:
            errors.append("answers: no step %r" % key)
            continue
        s = steps[key]
        values = value if isinstance(value, list) else [value]
        if not s["multi"] and isinstance(value, list):
            if len(value) != 1:
                errors.append("%s: a single-choice step takes one answer" % key)
        options = {o["id"]: o for o in s["options"]}
        for v in values:
            if v not in options:
                errors.append("%s: no option %r (one of %s)" % (key, v, ", ".join(options)))
        if len(values) > 1 and any(options.get(v, {}).get("exclusive") for v in values):
            errors.append("%s: %s cannot be combined with other answers" %
                          (key, ", ".join(v for v in values if options.get(v, {}).get("exclusive"))))
    return errors


def missing_steps(w, answers):
    return [s for s in w["steps"] if s["id"] not in answers]


def chosen(answers, step_id):
    v = answers.get(step_id, [])
    return v if isinstance(v, list) else [v]


def resolve(w, answers):
    cov = covered(w)
    bundles = {b["id"]: b for b in w.get("bundles", [])}
    plan = {}       # loop id -> {"from": [...], "why": [...]}
    suggest = {}    # loop type -> [sources]
    profile = {"kind": [], "stages": [], "tools": {}, "pains": [], "autonomy": None}

    def add(loop_type, source, why=None):
        loop = cov.get(loop_type, loop_type)
        entry = plan.setdefault(loop, {"from": [], "why": [], "covers": []})
        if source not in entry["from"]:
            entry["from"].append(source)
        if why and why not in entry["why"]:
            entry["why"].append(why)
        if loop in bundles and loop_type not in entry["covers"]:
            entry["covers"].append(loop_type)

    for t in w["core"]["loops"]:
        add(t, "core")
    for s in w["steps"]:
        for v in chosen(answers, s["id"]):
            o = next(x for x in s["options"] if x["id"] == v)
            for t in o.get("loops", []):
                add(t, "%s:%s" % (s["id"], v), o["label"])
            for t in o.get("suggest", []):
                suggest.setdefault(t, []).append("%s:%s" % (s["id"], v))
            p = o.get("profile", {})
            for key in ("kind", "stages", "pains"):
                for x in p.get(key, []):
                    if x not in profile[key]:
                        profile[key].append(x)
            profile["tools"].update(p.get("tools", {}))
            if p.get("autonomy"):
                profile["autonomy"] = p["autonomy"]
    for n, r in enumerate(w.get("rules", [])):
        if all(set(chosen(answers, k)) & set(v) for k, v in r["if"].items()):
            for t in r.get("loops", []):
                add(t, "rule:%d" % (n + 1), r["why"])
            for t in r.get("suggest", []):
                suggest.setdefault(t, []).append("rule:%d" % (n + 1))

    if "production" in profile["stages"] and any(k in profile["tools"] for k in OBSERVABILITY):
        profile["done_at"] = "production"
    elif "staging" in profile["stages"]:
        profile["done_at"] = "staging"
    elif "ci" in profile["stages"]:
        profile["done_at"] = "ci"
    else:
        profile["done_at"] = "local"

    def rank(loop):
        first = 0 if loop in bundles else (1 if any(f.startswith("pains:") for f in plan[loop]["from"]) else 2)
        return (first, w["order"].index(loop) if loop in w["order"] else len(w["order"]))

    ordered = sorted(plan, key=rank)
    loops = []
    for n, loop in enumerate(ordered):
        e = plan[loop]
        item = {"id": loop, "type": bundles[loop]["type"] if loop in bundles else loop,
                "wave": 1 if n < w.get("first_wave", 5) else 2, "from": e["from"], "why": e["why"]}
        if loop in bundles:
            item["covers"] = [t for t in bundles[loop]["covers"] if t in e["covers"]]
            item["title"] = bundles[loop]["title"]
            item["why"] = [bundles[loop]["why"]] + e["why"]
        loops.append(item)
    planned_types = {t for l in loops for t in l.get("covers", [l["type"]])} | set(plan)
    suggestions = [{"id": t, "from": src} for t, src in suggest.items() if t not in planned_types]
    prompts = [w["core"]["prompt"]] + [s["prompt"] for s in w["steps"] if s["id"] in answers]
    return {"answers": answers, "profile": profile, "loops": loops, "suggest": suggestions,
            "prompts": prompts, "missing": [s["id"] for s in missing_steps(w, answers)]}


def print_plan(r):
    p = r["profile"]
    print("profile: kind %s · stages %s · done_at %s · autonomy %s" %
          (", ".join(p["kind"]) or "?", ", ".join(p["stages"]) or "none", p["done_at"], p["autonomy"] or "?"))
    if p["tools"]:
        print("tools: %s" % ", ".join("%s (%s)" % (k, v) for k, v in p["tools"].items()))
    if p["pains"]:
        print("pains: %s" % "; ".join(p["pains"]))
    for wave in (1, 2):
        print("\nwave %d:" % wave)
        for l in r["loops"]:
            if l["wave"] == wave:
                extra = " = %s" % " + ".join(l["covers"]) if l.get("covers") else ""
                print("  %-30s %s%s" % (l["id"], ", ".join(l["from"]), extra))
    if r["suggest"]:
        print("\nlater, when a failure shows the need: %s" % ", ".join(s["id"] for s in r["suggest"]))
    if r["missing"]:
        print("\nnot answered: %s" % ", ".join(r["missing"]))


def main():
    ap = argparse.ArgumentParser(description=(__doc__ or "").split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check")
    q = sub.add_parser("questions")
    q.add_argument("answers", nargs="?")
    r = sub.add_parser("resolve")
    r.add_argument("answers")
    r.add_argument("--json", action="store_true")
    a = ap.parse_args()
    w = load_wizard()
    if a.cmd == "check":
        errors = check(w)
        for e in errors:
            print(e)
        if errors:
            sys.exit(1)
        print("OK: %d steps, %d options, %d rules" %
              (len(w["steps"]), sum(len(s["options"]) for s in w["steps"]), len(w.get("rules", []))))
        return
    answers = read_answers(a.answers) if getattr(a, "answers", None) else {}
    errors = validate_answers(w, answers)
    if errors:
        for e in errors:
            print(e, file=sys.stderr)
        sys.exit(2)
    if a.cmd == "questions":
        print(json.dumps([{"id": s["id"], "title": s["title"], "question": s["question"], "multi": s["multi"],
                           "required": s["required"], "prompt": s["prompt"],
                           "options": [{"id": o["id"], "label": o["label"], "description": o.get("description", "")}
                                       for o in s["options"]]} for s in missing_steps(w, answers)],
                         indent=2, ensure_ascii=False))
        return
    result = resolve(w, answers)
    if a.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print_plan(result)


if __name__ == "__main__":
    main()
