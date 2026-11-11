---
id: correction-becomes-rule
title: "Steering: a repeated correction becomes a rule"
summary: "When the person has corrected the agent twice for the same thing, the correction becomes an automated sensor (a lint, a test, a fitness function) or a line in CLAUDE.md."
sensor: human
ilities: [alignment]
places: [harness:remediation/entry, harness:remediation/oracle]
stages: [continuous]
speed: [minutes]
needs: []
initiator: human
related: [steering-loop]
links:
  - title: "Designing Human-in-the-Loop for Agentic Workflows"
    author: "AlignX"
---

## Why

Without this loop the person makes the same correction from task to task, because nothing remembers it. A
correction that comes back is a sign of a missing constraint, tool or context. Turned into a lint or a
test, it is checked on every run, and the person does not have to make it again.

## How it works

The loop starts on the second correction for the same thing, not the first. The correction then goes to one of two places:

- an automated sensor: a lint, a test or a fitness function
- a line in CLAUDE.md

The [steering loop](../steering-loop/card.md) is the same loop for the agent's own repeated mistakes.

## Set up

- Keep a log of escalations and corrections by type: recurring types show where the agent lacks constraints,
  tools or context (AlignX).
- Code (a lint, a test) is more reliable than text: CLAUDE.md is advice, not a guarantee.
