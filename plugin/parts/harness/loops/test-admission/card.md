---
id: test-admission
title: "A test must pay for its upkeep"
summary: "Before adding a test, the agent names the contract it protects, the regression that breaks it and why no existing test catches it, and shows it failing; a test without the three answers is not added."
sensor: computational
ilities: [testability, maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds, minutes]
needs: []
agent: [reviewer]
related: [mutation-testing, red-green-tdd, reproduction-gate, code-coverage, agent-code-review, check-incubation]
links:
  - title: "packages/app/AGENTS.md: Tests"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/AGENTS.md#L129-L139"
    author: "opencode (anomalyco)"
    note: "the three questions; one contract, one owner; no production seams; a test must be able to fail; mutate the owner once when a contract moves."
  - title: "packages/desktop/AGENTS.md: Tests"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/desktop/AGENTS.md#L3-L11"
    author: "opencode (anomalyco)"
    note: "tables across channels; no source-grep or tombstone tests."
  - title: "packages/app/e2e/AGENTS.md: Test Ownership"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/AGENTS.md#L18-L20"
    author: "opencode (anomalyco)"
    note: "one keeper suite per product area; a new regression is a new case in it, not a new spec file."
---

## Why

Every other loop that touches tests adds them: coverage, mutation testing, exploratory testing, a reproduction for
each bug. An agent writes tests for almost nothing, so a suite grows until it is slow, flaky and full of tests that
assert what the code returned, mock what they claim to check, or repeat one case per theme and viewport. Such a test
costs a run on every change and catches nothing. This loop is the counterweight: a test is admitted only when it
protects something no other test does, and only when it has been seen to fail.

## How it works

Before the agent adds a test, it answers three questions in one line each. opencode: "which observable contract does
it protect, which credible regression makes it fail, and why does no existing test already catch that regression.
If any answer is missing, do not add the test."

Then it applies the rules of ownership:

- **One contract, one owner.** The behaviour is tested once, at the strongest boundary that observes it. A new
  regression in an area with a keeper suite is a new case in that suite, or a row in an existing table, not a new
  file.
- **The test must be able to fail.** It does not assert values the code under test produced, mock the behaviour it
  asserts, or leave a promise unawaited. A regression test fails on the code before the fix. The agent breaks the
  contract once, by hand, and shows the test red.
- **No seams for tests.** No test-only exports, parameters such as `now` or `delay`, flags or `data-*` attributes in
  production code; the test drives the real entry point and controls time with the test runner's clock.
- **No tests of text.** No test greps source files, and no tombstone test asserts that a file or a feature is gone.
- **Moving coverage names its replacement.** When a test is deleted or moved, the agent names the test that still
  proves the contract, and breaks the contract once to show that test fail.

## Set up

- **The rules in AGENTS.md**, where the agent reads them before it writes a test, with the three questions first.
- **The answers in the pull request**, a `Tests` section with one entry per added or moved test: the contract, the
  regression, why it is new, and the output of the test failing on the broken code.
- **A tool that lists test-only exports**: an unused-export finder run with test files excluded (knip, ts-prune or
  the language's equivalent). An export only tests import is a seam.
- **`run`** reads the diff and the pull request's `Tests` section, and prints one line per problem:
  `<test>: missing <contract|regression|why-new|failing output>`, or `<file>:<line>: export <name> is used only by
  tests`. It exits non-zero on any line. The reviewer's findings are printed after it.
- **Cases.** Must fire: a new test with no entry in the `Tests` section; a function given a `now` parameter that only
  its test passes; a new spec file for a regression in an area whose keeper suite already exists (the reviewer).
  Must pass: a new row in an existing table, with its three answers and the red output on the broken code.
- **Wiring:** `run` in the pull request's CI job, and the rule in AGENTS.md. The reviewer runs with the other
  [agent-code-review](../agent-code-review/card.md) lenses.

## Notes

- [mutation-testing](../mutation-testing/card.md) asks whether the suite catches a change; this loop asks the same
  of each new test, by one mutation the agent makes by hand. Breaking the contract once costs a minute and shows
  more than a green run.
- A test admitted under this loop is still subject to [check-incubation](../check-incubation/card.md): admission
  says it is worth keeping, incubation that it is stable enough to block.

## Agent step

A reviewer gets the diff's added and moved tests with their answers, and the tests that already exist in the same
area. It returns Findings with these rules: `duplicate` (an existing test already catches the named regression, and
the finding names it), `cannot-fail` (the test asserts the code's own output or mocks what it asserts),
`wrong-owner` (a new file where a keeper suite or a table exists), `seam` (production code changed for the test).
It advises until it is `gate` ([agent-calibration](../agent-calibration/card.md)); its eval cases are tests a person
kept or removed in review.
