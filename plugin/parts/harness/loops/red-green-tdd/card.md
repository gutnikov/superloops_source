---
id: red-green-tdd
title: "Unit tests, red/green TDD"
summary: "The agent writes a test and sees it fail, then writes the code until the test passes, then refactors."
sensor: computational
ilities: [testability, correctness]
places: [delivery/work, remediation/work]
stages: [local]
speed: [seconds]
needs: []
agent: [reviewer]
related: [acceptance-loop, mutation-testing]
links:
  - title: "Red/green TDD — Agentic Engineering Patterns"
    url: https://andrewmurphy.io/stdlib/b139fcdd-2733-435b-a97f-6d7e47836719
    author: Simon Willison
  - title: "agentic-engineering-patterns: Red/green TDD"
    url: https://github.com/lucas-flatwhite/agentic-engineering-patterns-simon-willison/blob/main/docs/en/03-testing-and-qa/01-red-green-tdd.md
  - title: "Augmented Coding: Beyond the Vibes"
    url: https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes
    author: Kent Beck
  - title: "Genie Wants to Leap"
    url: https://newsletter.kentbeck.com/p/genie-wants-to-leap
    author: Kent Beck
  - title: "Spec + TDD: The Combination That Actually Produces Shippable AI Code"
    url: https://www.augmentcode.com/guides/spec-tdd-shippable-ai-generated-code
---

## Why

If the agent writes a test after the code, it can fit the test to the code. That test checks what the code does, not
what it should do, so it passes. A test that failed before the change and passes after it shows that the change is
what made the difference. It runs in seconds, so the agent can run it after every change.

## How it works

The agent writes a test and makes sure it fails (red). Then it writes the implementation until the run is green,
and refactors. The [acceptance loop](../acceptance-loop/card.md) is the outer loop around this one, from the
requirements to the acceptance tests.

## Set up

- Add "use red/green TDD" to the agent's prompt. Simon Willison says any good model understands this shorthand.
  Kent Beck states the rule as: "Always follow the TDD cycle: Red → Green → Refactor".
- Stop the agent from deleting or weakening tests. The agent may, for example, disable a test or remove its
  assertions (see Notes). The source names two guards: a hook, and a review of the test diff. It does not say what
  the hook checks or who reviews the diff.
- Use checks the agent cannot edit as the final ones: CI, mutation testing, production.

## Notes

- Kent Beck names as a warning sign "any indication that the genie was cheating, for example by disabling or
  deleting tests". He also describes the agent deleting assertions and faking the implementation.

## Agent step

A guard: a reviewer whose only lens is the test diff. It returns a Verdict on whether the change weakened a test
(deleted, skipped, a loosened assertion, a changed expected value, the code under test mocked out). That answers who
reviews the test diff. It blocks only once calibrated on weakened and honest test diffs
([agent-calibration](../agent-calibration/card.md)).
