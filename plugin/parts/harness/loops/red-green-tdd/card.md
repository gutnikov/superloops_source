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
and refactors with the tests green. The [acceptance loop](../acceptance-loop/card.md) is the outer loop around this
one, from the requirements to the acceptance tests. For a bug, the same cycle starts from a test that reproduces it:
[bug-failing-test-fix](../bug-failing-test-fix/card.md).

## Set up

- **The rule in the prompt.** Add "use red/green TDD" to the agent's prompt or CLAUDE.md. Simon Willison says any
  good model understands this shorthand. Kent Beck states the rule as: "Always follow the TDD cycle: Red → Green →
  Refactor".
- **Red is kept.** The agent runs the new test before writing the code and keeps the failing output, the test's id
  and its failure message, in the task's evidence. A test that passes before the code tests nothing: the agent
  rewrites it until it fails for the reason the code is missing.
- **Tests stay honest.** The agent may delete a test, skip it, remove its assertions or fake the implementation (see
  Notes). A PreToolUse hook denies its writes to the acceptance tests and the spec, the oracle of the acceptance loop.
  A guard reviews every unit-test diff (Agent step). A test that has to change its expected value goes through a
  person.
- **`run`** is the unit tests of the changed area. It prints each failing test as `file:line: message` and exits
  non-zero on any failure. The guard's Verdict is printed with it, and blocks only once the guard is calibrated.
- **Cases.** Must fire: a copy whose change breaks a unit test; for the guard, test diffs that delete an assertion,
  skip a test or change an expected value. Must pass: a diff that adds a test which fails on the old code and passes
  on the new.
- **Wiring.** The agent runs the tests after each change. A Stop hook runs them at the end of the turn. The final
  checks are ones the agent cannot edit: the whole suite in CI, and [mutation testing](../mutation-testing/card.md)
  over the new tests.

## Notes

- Kent Beck names as a warning sign "any indication that the genie was cheating, for example by disabling or
  deleting tests". He has also seen "deleting assertions from tests, deleting whole tests" and "faking large swathes
  of implementation".

## Agent step

A guard: a reviewer whose only lens is the test diff. It returns a Verdict on whether the change weakened a test
(deleted, skipped, a loosened assertion, a changed expected value, the code under test mocked out). It gets the test
diff, never the agent's reasoning, and blocks only once calibrated on weakened and honest test diffs
([agent-calibration](../agent-calibration/card.md)).
