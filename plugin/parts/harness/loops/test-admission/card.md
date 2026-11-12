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
related: [mutation-testing, red-green-tdd, reproduction-gate, code-coverage, agent-code-review, check-incubation, llm-evals]
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
  - title: "coverage-gate.ts: the deletion gate"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/scripts/coverage-gate.ts#L1-L32"
    author: "sandcastle (Matt Pocock)"
    note: "A, the file alone; B, every other legacy test; C, the e2e suite; it exits 1 when C misses a line in A and not in B."
  - title: "coverage-gate-core.ts: the verdict line"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/scripts/coverage-gate-core.ts#L145-L146"
    author: "sandcastle (Matt Pocock)"
  - title: "CODING_STANDARDS.md: Where tests live"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/CODING_STANDARDS.md#L127-L141"
    author: "sandcastle (Matt Pocock)"
    note: "a legacy test is deleted only when the gate passes; never delete a test to satisfy the test ratchet."
  - title: "Lift drill into evals: the deletion gate per assertion"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md#L78-L80"
    author: "superpowers (obra)"
  - title: "Lift drill into evals: the subagent's per-assertion table"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md#L102-L115"
    author: "superpowers (obra)"
  - title: "tdd SKILL.md: tautological tests"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/tdd/SKILL.md#L31"
    author: "skills (Matt Pocock)"
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
  asserts, or leave a promise unawaited. Expected values come from "an independent source of truth: a known-good
  literal, a worked example, the spec" (Pocock's `tdd`), not recomputed the way the code computes them. A regression
  test fails on the code before the fix. The agent breaks the contract once, by hand, and shows the test red.
- **No seams for tests.** No test-only exports, parameters such as `now` or `delay`, flags or `data-*` attributes in
  production code; the test drives the real entry point and controls time with the test runner's clock.
- **No tests of text.** No test greps source files, and no tombstone test asserts that a file or a feature is gone.
- **A deleted test needs a proof that its coverage moved.** When a test is deleted or moved, a script measures the
  lines only that test covers (its coverage minus the rest of the suite's) and fails when the replacing tests miss
  any of them. sandcastle's rule: "A migration PR may delete a legacy test only when `npm run coverage:gate -- <file>`
  passes"; the gate prints "**Gate: fail.** <n> of the <m> lines that only `<file>` covers have no e2e coverage
  yet." and exits 1. Where lines cannot show it, as when an LLM eval replaces a scripted test, a reviewer maps every
  assertion of the old test to a check of the new one; superpowers: "A bash test is deleted *only if* a drill
  scenario verifiably covers every assertion it makes", and "Default keeps it".

## Set up

- **The rules in AGENTS.md**, where the agent reads them before it writes a test, with the three questions first.
- **The answers in the pull request**, a `Tests` section with one entry per added or moved test: the contract, the
  regression, why it is new, and the output of the test failing on the broken code. A deleted test gets the coverage
  gate's report, or the per-assertion table, there or in the commit message.
- **A tool that lists test-only exports**: an unused-export finder run with test files excluded (knip, ts-prune or
  the language's equivalent). An export only tests import is a seam.
- **`run`** reads the diff and the pull request's `Tests` section, and prints one line per problem:
  `<test>: missing <contract|regression|why-new|failing output>`, `<file>:<line>: export <name> is used only by
  tests`, or `<test>: deleted, <n> lines only it covered are not covered`. It exits non-zero on any line. The
  reviewer's findings are printed after it.
- **Cases.** Must fire: a new test with no entry in the `Tests` section; a function given a `now` parameter that only
  its test passes; a deleted test whose lines no remaining test covers; a new spec file for a regression in an area
  whose keeper suite already exists (the reviewer). Must pass: a new row in an existing table, with its three answers
  and the red output on the broken code; a deleted test whose lines a test in the keeper suite covers.
- **Wiring:** `run` in the pull request's CI job, and the rule in AGENTS.md. The reviewer runs with the other
  [agent-code-review](../agent-code-review/card.md) lenses.

## Notes

- [mutation-testing](../mutation-testing/card.md) asks whether the suite catches a change; this loop asks the same
  of each new test, by one mutation the agent makes by hand. Breaking the contract once costs a minute and shows
  more than a green run.
- A test admitted under this loop is still subject to [check-incubation](../check-incubation/card.md): admission
  says it is worth keeping, incubation that it is stable enough to block.
- A ratchet that counts test files rewards deleting tests. sandcastle's counts legacy test files and only lets the
  count fall, and its standards warn: "The ratchet counts files, not cases: deleting a test lowers the count while
  the behaviour it guarded silently loses coverage, and CI can't tell." The deletion gate is what CI can tell with.

## Agent step

A reviewer gets the diff's added and moved tests with their answers, and the tests that already exist in the same
area. It returns Findings with these rules: `duplicate` (an existing test already catches the named regression, and
the finding names it), `cannot-fail` (the test asserts the code's own output or mocks what it asserts),
`wrong-owner` (a new file where a keeper suite or a table exists), `seam` (production code changed for the test).
For a deletion that line coverage cannot prove, it gets the old test and its replacement and returns one row per
old assertion with the check that matches it, or `unmatched`; one `unmatched` keeps the test.
It advises until it is `gate` ([agent-calibration](../agent-calibration/card.md)); its eval cases are tests a person
kept or removed in review.
