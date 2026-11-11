---
id: ux-evaluator
title: "UX evaluator with thresholds"
summary: "A separate agent walks the app with Playwright MCP like a user, grades depth, functionality, design and code, and once calibrated fails a sprint below any threshold; the generator gets a breakdown."
sensor: inferential
ilities: [usability, correctness]
places: [delivery/gate]
stages: [sprint]
speed: [minutes]
needs: [browser]
agent: [explorer, judge]
links:
  - title: "Harness design for long-running apps"
    url: "https://anthropic.com/engineering/harness-design-long-running-apps"
    author: "Anthropic"
---

## Why

Without this loop, a sprint can pass while the running app falls short for the person who uses it. The evaluator
catches shortfalls in depth, functionality, design and code, and tells the generator what failed, not just a bare
verdict.

## How it works

A separate evaluator walks through the app with Playwright MCP the way a user would, and grades it on four criteria:
depth, functionality, design and code. The evaluator is two agents: an explorer that walks the app, and a judge that
grades the walk (see Agent step).

If any criterion is below its threshold, the sprint fails. The generator, the agent whose work is graded, then gets a
detailed breakdown ("FAIL — `PUT /frames/reorder` route defined after `/{frame_id}`…"). This holds only once the judge
is calibrated (see Set up).

## Set up

- Before the sprint starts, set up a "sprint contract".
- Before the judge can fail sprints, calibrate it: have a person grade a sample of walks, and check that the judge's
  grades agree with the person's. Until they agree, treat the judge's grades as advice.

## Notes

- Use the UX evaluator only where the model alone cannot do the job reliably.
- Anthropic warns: "out of the box, Claude is a poor QA agent".
- Anthropic reports one solo run at 20 minutes and $9, and one full-harness run at 6 hours and $200. The source does not say what the full harness adds besides the evaluator, so the difference is not the cost of this loop alone.

## Agent step

Two agents: an explorer walks the app the way a user would and records what it saw; a judge grades the walk on the
rubric (depth, functionality, design, code). The judge fails a sprint only after a person has graded a sample of walks
and the judge's grades agree with the person's ([agent-calibration](../agent-calibration/card.md)). Until then, the
judge's grades are advice.
