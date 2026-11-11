---
id: stop-hook
title: "Stop hook / `/goal`"
summary: "A hook runs a check and does not let the agent end its turn until the check passes."
sensor: computational
ilities: [correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local]
speed: [seconds, minutes]
needs: []
agent: [refuter]
related: [acceptance-loop]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
  - title: "claude-code-best-practice"
    url: "https://github.com/shanraisshan/claude-code-best-practice"
---

## Why

An agent can end its turn and call the work done while the check still fails. A line in CLAUDE.md is only
advice; a hook makes the check a condition of ending the turn. That lets an autonomous run finish without a
person.

## How it works

When the agent tries to end its turn, the hook runs the check. If the check fails, the hook blocks the end of the turn and the agent keeps working.

In the [acceptance loop](../acceptance-loop/card.md), a Stop hook keeps the agent working until the loop's gate passes.

**Limit:** in Claude Code, a Stop hook blocks the end of a turn no more than 8 times in a row. After the 8th block, the turn ends even if the check still fails, and the run ends with it.

## Set up

Use one of these:

- A Stop hook in Claude Code.
- `/goal` with a separate evaluator.

## Notes

- A passing check shows only what the script tests.

## Agent step

With `/goal`, the separate evaluator is a refuter: an agent that gets the goal and the state of the work and returns a Verdict.

A hook may block the end of a turn on the evaluator's Verdict only once the evaluator is calibrated
([agent-calibration](../agent-calibration/card.md)).

A script check needs no agent.
