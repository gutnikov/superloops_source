---
id: correction-becomes-rule
title: "Steering: a repeated correction becomes a rule"
summary: "Every correction a person makes is logged at the phase that should have caught it; the second of a kind is an escape, and it becomes a lint, a test or a line in CLAUDE.md."
sensor: human
ilities: [alignment]
places: [harness:remediation/entry]
stages: [continuous]
speed: [minutes]
needs: []
initiator: human
related: [steering-loop, human-diff-review, taste-invariants, sample-audit]
links:
  - title: "Designing Human-in-the-Loop for Agentic Workflows"
    author: "AlignX"
    note: "logging escalations and corrections by type"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
---

## Why

Without this loop the person makes the same correction from task to task, because nothing remembers it. A
correction that comes back is a sign of a missing constraint, tool or context. Turned into a lint or a
test, it is checked on every run, and the person does not have to make it again.

## How it works

1. A person corrects the agent: in the session, in a review comment, or by reverting a change.
2. The correction is logged at the phase that should have caught it, its kind first in `--note`:
   `loops.py trace correction <super-loop>/<phase> --item <id> --note "<kind>: <what was corrected>"`.
3. The first correction of a kind is only logged. The second of the same kind is an escape, and the
   [steering loop](../steering-loop/card.md) takes it: it records the corrected example as a must-fire case at that
   phase and fixes or adds the loop there.
4. The rule ends in one of two places: an automated sensor (a lint, a test, a fitness function), or a line in
   CLAUDE.md where no check can express it.

`loops.py stats` lists the places where corrections pile up; a place with two or more needs a loop or a stronger
one. The measure is that each kind of correction stops coming back.

## Set up

- **The agent logs a correction the moment a person makes it**: CLAUDE.md tells it to. The harness engineer logs
  the corrections made outside the session: review comments, reverts.
- **Short, stable kinds**, such as `unstructured log line` or `test edited instead of code`, so that two corrections
  of one kind are seen as one kind. Reuse a kind already in `superloops/trace.jsonl` before writing a new one.
- **Code before text.** CLAUDE.md is advice, not a guarantee. Prefer a [custom lint](../taste-invariants/card.md) or
  a test whose message says how to fix the violation; write a line in CLAUDE.md only for what no check can see.
- **Logging calls no one.** A person is asked only when two rules would both fix the correction and differ in a
  trade-off only they can weigh (H4), logged with `loops.py hitl H4 …`.
- **Validation** is `manual`: the person's correction is the signal. What a script checks: the loop the steering
  loop builds from it has the corrected example among its must-fire cases and the corrected version among its
  must-pass cases.

## Notes

- Keep a log of escalations and corrections by type: recurring types show where the agent lacks constraints, tools
  or context (AlignX).
- With sensors only, the agent repeats the same mistakes; with guides only, it never learns whether the rules worked
  (Böckeler).
