---
id: agent-calibration
title: "Calibration of a loop's agent"
summary: "A loop's agent runs at least three times on eval cases with known answers; it may block only once its agreement reaches a threshold a person approved, and every miss becomes a new case."
sensor: computational
ilities: [correctness, alignment]
places: [harness:delivery/gate, harness:delivery/confirmation, harness:remediation/oracle, harness:maintenance/gate]
stages: [local, scheduled]
speed: [minutes]
needs: []
related: [llm-judge-calibration, sample-audit, steering-loop, llm-evals, docs-audit]
links:
  - title: "Using LLM-as-a-Judge For Evaluation: A Complete Guide"
    url: "https://hamel.dev/blog/posts/llm-judge/"
    author: "Hamel Husain"
    note: "grading against one principal expert with pass or fail and a critique; true-positive and true-negative rates"
  - title: "Creating a LLM-as-a-Judge that drives business results"
    url: "https://simonwillison.net/2024/Oct/30/llm-as-a-judge/"
    author: "Simon Willison"
    note: "revising the judge's prompt until it agrees with the expert"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "a fresh reviewer that never saw the conversation"
  - title: "Audit documentation against implementation (an eval suite)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/evals/evals/documentation-audit.eval.ts"
    author: "pi (earendil-works)"
    note: "an eval that checks the agent's reads as well as its verdict."
  - title: "Caretaker triage eval: golden specs from human pull requests"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/tools/caretaker-agent/evals/triage/helpers/generate_golden_spec.md#L18-L30"
    author: "gemini-cli (Google)"
    note: "the Fairness Pruning Pass: files the human PR changed beyond the reported symptom are pruned."
  - title: "Caretaker triage eval: a worktree at the issue's version"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/tools/caretaker-agent/evals/triage/runner.py#L45-L58"
    author: "gemini-cli (Google)"
  - title: "Caretaker triage eval: the summary"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/tools/caretaker-agent/evals/triage/helpers/summary.py#L249-L315"
    author: "gemini-cli (Google)"
    note: "autoclose_recall_rate and valid_kept_open_rate."
---

## Why

An agent's verdict differs from run to run, and how often it is right is unknown until it is scored against known
answers. A verdict that blocks without that score is a guess presented as a check, and the working agent learns to
satisfy the reviewer, not to meet the requirement. Scoring the agent before it may block, and again whenever its
prompt or model changes, is what turns its verdict into a check.

## How it works

An agent that is a step of a loop, such as a reviewer, a refuter or a judge, is run at least three times on eval
cases with known answers, and its agreement with those answers is scored. The agent may block anything only after
its agreement reaches a threshold a person approved; until then, and whenever its agreement falls below that
threshold, the agent only advises. Its verdicts in real use are logged with their outcome, and every false positive
or miss becomes a new eval case.

```
created (draft)
  │
  ▼
eval cases with known answers ──► ≥3 runs ──► eval-score
  ▲                                               │
  │                                               ▼
  └── revise the prompt ◄──no── agreement ≥ approved threshold?
      (or keep it advisory)                       │yes
                                                  ▼
                                 gate: its verdict can fail the loop
                                                  │
                                                  ▼
in use: each verdict's outcome is logged (confirmed, false positive, missed, overridden)
   a false positive or a miss ─────────► a new eval case ──► evals again
   the prompt or the model changes ────► evals again (the check refuses a gate that was not re-scored)
   on a schedule ──────────────────────► a person grades a random sample of its verdicts
```

## Set up

- **A registry.** `superloops/agents.yaml` lists each agent with its kind, definition, model, status (`draft`,
  `evaluated`, `advisory`, `gate`, `retired`), threshold and last evaluation; `loops.py agent-new` adds one.
- **Eval cases** in `superloops/agents/<id>/evals/`, each with the agent's input and `expected.json`, in the formats of
  the harness's `agent-formats.md`. For a reviewer, a guard or a refuter: broken copies that must fire and clean
  ones that must pass, usually made from the loop's own must-fire and must-pass cases. For a judge: results a
  person graded pass or fail, with a reason, under H5.
- **Cases from history**, where a person already gave the answer. gemini-cli's triage eval builds each case from a
  closed issue and the pull request a person merged for it; the expected files drop those the pull request changed
  beyond the reported symptom, and the agent runs in a git worktree at the issue's version, on the code the reporter
  had.
- **The harm scored apart from the accuracy.** An agent that acts, such as one that closes items, is scored on the
  wrong actions as well: gemini-cli's `valid_kept_open_rate` is the share of real issues its triage keeps open. Such
  an agent acts on its own only at 100% on that measure, since a real bug closed costs more than spam left open.
- **Runs and scoring.** Each run of the whole set is one `results/<run>.jsonl`; at least three runs, because the
  output differs from run to run. `loops.py eval-score <id> --record` scores agreement per case and overall, lists
  flaky cases, refuses runs older than the definition, and writes the registry and `report.md`.
- **The threshold** is a reference a person approves (H5), recorded in `threshold_source`. Without one the agent
  stays `evaluated` or `advisory`.
- **The rule that makes it safe**: only a `gate` agent blocks. `loops.py check` refuses:
  - an agent that blocks without being `gate`;
  - a `gate` agent below its threshold;
  - a `gate` agent without three runs;
  - a `gate` agent not re-scored after its definition or model changed;
  - a judge that is `gate` without `human_grades: true`;
  - a `validated` or `active` loop whose agent is still `draft`.
- **Outcomes** of real verdicts: `loops.py outcome <id> --loop <loop> --outcome confirmed|false-positive|missed|overridden`.
  `loops.py stats` shows them since the last evaluation and asks for new eval cases after two false positives or
  misses.

## Notes

- A judge's eval cases come from [llm-judge-calibration](../llm-judge-calibration/card.md): one expert's pass or
  fail grades, each with a critique. This loop scores the judge against them three times, against a threshold a
  person approved, and keeps a judge that never reaches it `advisory` or retires it.
  [llm-evals](../llm-evals/card.md) covers prompts of product features; this is the same loop for the agents of the
  harness itself.
- Reviewers, guards, refuters and investigators can be calibrated without a person: their cases have answers a
  script can check. A judge of taste or quality cannot: only a person knows the right grade, so a person grades
  its cases once, and a [sample audit](../sample-audit/card.md) checks it again later.
- A repeated false positive is the agent's version of a repeated mistake: [steering-loop](../steering-loop/card.md) turns
  it into an eval case, not into a line in the prompt alone.
- Without this calibration loop, an agent's verdict is a guess presented as a check: the working agent learns to
  satisfy the reviewer, not to meet the requirement.
- An eval case can check the agent's process as well as its verdict. Pi's documentation audit counts a run only if
  the agent read the page and at least one file of the implementation, and called its submit tool exactly once
  ([docs-audit](../docs-audit/card.md)); a right verdict without that evidence is not agreement. The verdict comes
  through a tool with a schema that ends the run, so no prose has to be parsed.
