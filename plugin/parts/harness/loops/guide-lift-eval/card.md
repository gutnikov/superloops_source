---
id: guide-lift-eval
title: "Guide lift eval"
summary: "The agent does the same tasks with and without a guide, each run in a fresh isolated environment; the guide stays only if the paired pass rates show that it helps."
sensor: computational
ilities: [correctness, usability]
places: [harness:delivery/gate, harness:maintenance/gate]
stages: [local, scheduled]
speed: [minutes, hours]
needs: []
related: [llm-evals, correction-becomes-rule, docs-audit, agent-calibration]
links:
  - title: "Pi evals: documentation-lift evals"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/evals/README.md"
    author: "pi (earendil-works)"
    note: "paired without_docs and with_docs arms in fresh containers, deterministic grading, blocked pairs withhold the headline."
  - title: "Add custom streaming provider (an eval case)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/evals/evals/custom-provider.docs.eval.ts"
    author: "pi (earendil-works)"
    note: "a task graded by probing the configured runtime against a fake server."
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
    note: "with guides only, the agent never learns whether the rules worked."
---

## Why

A guide, such as a section of AGENTS.md, a skill or a docs page the agent reads, is written in the hope that it
helps, and nothing checks that hope. A guide that does not help still costs context on every run, and one that
misleads costs more. Sensors check the code; this loop checks the guide. The same tasks run with and without it,
and only the difference in the results shows whether the guide earns its place.

## How it works

1. A set of tasks the guide should help with, each with a deterministic grade: the result is run or probed, not
   read by a model.
2. Every task runs in two arms, `without` the guide and `with` it. Everything else is the same: the model, the
   tools, the installed build.
3. Each arm runs in a fresh environment: a new container, home directory, workspace and session. Repetitions
   alternate the order of the arms.
4. The report pairs the two arms of each task and computes the lift: the pass rate with the guide minus the pass
   rate without it.
5. A guide whose lift is zero or negative is rewritten or removed. A task that passes without the guide (a
   saturated control) cannot show lift, and is replaced.

In pi, `without_docs` removes the coding agent's README, CHANGELOG, `docs/` and `examples/`, and the docs-routing
section of the system prompt; `with_docs` keeps them. One task is to configure a custom provider from an API
description. Its grade is a strict structured comparison of what the configured runtime returns when it is probed
against a fake server.

## Set up

- **The oracle out of the agent's reach.** The agent under test cannot read the eval definitions, graders or
  fixtures. Pi's harness makes them root-owned and drops to an unprivileged user before the agent starts.
- **The guide is the only difference.** Both arms install the same build. Copies of the guide elsewhere, such as the
  docs and sources of dependency packages, are removed from both arms, so they cannot act as a second guide.
- **The cohort is planned first.** Every `(task, arm, model, run)` is listed before anything runs. A missing,
  errored, skipped or unscored arm blocks its pair. If any pair is blocked, the headline pass rates are withheld and
  the run exits non-zero. Missing telemetry stays missing; it is never counted as zero.
- **Repetitions for stability.** One run per arm cannot show stability. The report flags flakiness, no lift and
  negative deltas; pi repeats with `--runs-per-variant 5`.
- **A low score is data, not a failure.** The suite fails only when an invariant of the harness breaks. A task the
  agent fails is a result.
- **`run`** runs the cohort for one guide and prints one line per task, `<task>: without <p>% with <q>% lift <d>`,
  with `saturated`, `flaky` or `blocked` where they apply, then the guide's paired lift. It exits non-zero when a pair
  is blocked, and when the lift is zero or below: a guide that does not help still costs context on every run. The
  run takes hours, so `budget_seconds` in its `LOOP.md` is set to match.
- **Cases** run on recorded observations, not on a model, so validation costs no tokens. Must fire: a cohort where
  both arms pass at the same rate; a cohort with one arm missing from the observations. Must pass: a recorded cohort
  where the arm with the guide passes more tasks and every pair is complete.
- **Wiring:** a CI job on a pull request that changes a guide (AGENTS.md, CLAUDE.md, `.claude/skills/`, `docs/`),
  which takes the eval definitions from the base branch; and a run after a change of the model, logged with
  `loops.py trace` when the lift falls.

## Notes

- This is the sensor that guides lack: with guides only, the agent never learns whether the rules worked
  (Böckeler). When a [repeated correction becomes a rule](../correction-becomes-rule/card.md) in CLAUDE.md, this loop
  checks that the rule changes the agent's results.
- Pi's documentation evals give the agent only `read`, `write`, `edit`, `grep`, `find` and `ls`. The container still
  needs the network to reach the model's provider, so it cannot prove that code the agent wrote stayed offline.
- Every arm costs a real model's tokens. Run the loop when a guide changes and when the model changes, not on every
  edit.
