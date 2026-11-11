---
id: reproduction-gate
title: "Reproduction gate"
summary: "A fix counts only against a reproduction that failed first. The agent fixes until it passes; the gate reports whether it was red before and green after, and whether any other test changed."
sensor: computational
ilities: [correctness, testability]
places: [remediation/oracle, remediation/gate]
stages: [local, ci]
speed: [minutes]
needs: []
agent: [reviewer]
related: [bug-failing-test-fix, acceptance-loop, release-confirmation, exploratory-testing, scripted-model-tests]
links:
  - title: "Regression tests named by issue"
    url: "https://github.com/earendil-works/pi/tree/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/coding-agent/test/suite/regressions"
    author: "pi (earendil-works)"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
    note: "a failing test that reproduces the bug, before the fix."
  - title: "Genie Wants to Leap"
    url: "https://newsletter.kentbeck.com/p/genie-wants-to-leap"
    author: "Kent Beck"
    note: "agents that disable or delete tests."
---

## Why

A fix with no failing reproduction shows only that the tests pass, and they may have passed before it too. A
reproduction that failed first shows that the fix is what changed the result. Keeping the other tests out of the
agent's reach stops it from making the problem go away by changing a test instead of the code.

## How it works

A problem gets a reproduction before any fix: a test, a script or a recorded scenario that fails the way the problem
does. The agent fixes the code until the reproduction passes. The gate reports, for each problem, whether its
reproduction exists, failed before the fix and passes after it, and whether any other test changed on the way. The
loop is a composite loop: its parts are the project's reproduction and test loops, and its own check is the gate over
them.

## Set up

- **Problems have ids**, from the error tracker or the issue tracker, and each reproduction is tagged with its
  problem's id. The id can be the file name: pi names its regression tests `<issue>-<what>.test.ts`, 93 of them in
  one folder, so `run` finds a problem's reproduction without a separate index.
- **Red first.** The reproduction's run from before the fix is kept: a CI job on the commit that adds the
  reproduction, or a run in the task's evidence. The gate compares this run with the run after the fix.
- **A protected suite.** The agent fixing the problem cannot change the other tests: a PreToolUse hook denies its
  writes to them, and the final run of the gate happens in CI. A test that has to change goes through a person.
- **The gate is the `run`.** One line per problem, `<problem id>: <status>`: `no reproduction`,
  `green before the fix`, `red`, `green`, `other tests changed`. The exit is non-zero while any problem is not
  `green`.
- **When no test can reproduce the problem** (it is flaky, depends on the environment, or shows only in production),
  the gate records `no reproduction: confirmation only`, and the problem's confirmation carries all the weight
  ([release-confirmation](../release-confirmation/card.md)).
- **Cases.** Must fire: a fix without a reproduction; a reproduction that passed before the fix; a weakened test
  elsewhere. Must pass: a reproduction red before the fix and green after it, with the other tests untouched.

## Notes

- Its part at the work phase is [bug-failing-test-fix](../bug-failing-test-fix/card.md), the agent's red/green
  for a bug. This gate checks the record that loop leaves: red before the fix, green after it, no other test
  weakened, and a bug no test can catch handed to the confirmation.
- It is to remediation what the [acceptance loop](../acceptance-loop/card.md) is to delivery.
- When the problem is in code around a model, the reproduction runs against a scripted model, so it fails the same
  way every time ([scripted-model-tests](../scripted-model-tests/card.md)).

## Agent step

A guard, a reviewer whose lens is the tests, returns a Verdict on whether the agent weakened any test other than the
reproduction: an assertion removed or loosened, a test skipped, an expected value changed. It gets the diff of the
tests, never the agent's reasoning, and it blocks only once calibrated ([agent-calibration](../agent-calibration/card.md)).
