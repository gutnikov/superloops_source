---
id: compliance-mutants
title: "Compliance hardening with mutants"
summary: "An LLM takes one concern, such as data leaks, and writes mutants for it and tests that catch them; a mutation run shows the tests fail on the mutants and pass on the real code."
sensor: computational
ilities: [security, testability]
places: [maintenance/entry, maintenance/work]
stages: [ci, scheduled]
speed: [minutes, hours]
needs: []
agent: [worker]
related: [mutation-testing, security-review-agent, garbage-collection]
links:
  - title: "LLMs Are the Key to Mutation Testing and Better Compliance"
    url: "https://engineering.fb.com/2025/09/30/security/llms-are-the-key-to-mutation-testing-and-better-compliance/"
    author: "Mark Harman, Meta"
  - title: "Mutation-Guided LLM-based Test Generation at Meta"
    url: "https://arxiv.org/abs/2501.12862"
    author: "Christopher Foster et al."
  - title: "Meta: LLM-Powered Mutation Testing for Automated Test Generation"
    url: "https://www.zenml.io/llmops-database/llm-powered-mutation-testing-for-automated-test-generation"
    author: "ZenML LLMOps Database"
---

## Why

Ordinary tests are written for behaviour, so a change that leaks data can pass them all. Mutants for one concern,
such as data leaks, show where the tests would miss that kind of change, and the generated tests close the gap.

## How it works

A worker takes one concern, written in plain text, such as "a message is shown to an audience it was not meant for",
and the code it applies to. Then:

1. it writes mutants of that code that would introduce the fault the concern describes;
2. it drops the mutants that change nothing and the ones the existing tests already catch;
3. it writes tests that catch the rest.

A mutation run then checks each new test: it must pass on the real code and fail on its mutant. The tests that pass
this check go to engineers as a pull request; the mutants are not committed.

## Set up

- **Concerns are written down**, one file per concern in the loop's folder, by the engineer who owns the concern
  (privacy, security, a regulation). The file names the concern, the code it covers, and what a leak or a breach
  would look like in that code.
- **The worker is not the coding agent.** It runs on a schedule, weekly per concern by default, over the code that
  changed since its last run, and over all the covered code on its first run. It opens one small PR per concern and
  never merges it.
- **The mutation run is the check, not the worker.** For each generated test, `run` applies its mutant, runs the
  test, reverts the mutant and runs the test again. It prints one line per test, `<test>: <status>`:
  `kills its mutant`, `passes on the mutant`, `fails on the real code`. The exit is non-zero on anything but
  `kills its mutant`, and only tests that kill their mutant go into the PR.
- **Survivors are reported, not dropped.** A mutant the worker could not write a killing test for in two attempts
  goes into the PR's description as a gap for the concern's owner. A mutant the worker judges equivalent is listed
  with its reason.
- **Cases.** Must fire: a generated test that passes on its mutant (a mutant that logs a user's email address); a
  generated test that fails on the unchanged code. Must pass: a test that fails on that mutant and passes on the real
  code.
- **Wiring.** A scheduled CI job runs the worker and then `run`. The PR's own loops decide on merging: CI, and a
  person's review of the tests. The worker's PR adds tests only: the job fails when its change touches product code,
  and the mutants are applied in a scratch copy.

## Notes

- Meta's ACH takes "simple, plain-text prompts where engineers describe the mutant to test", and an "LLM-based
  Equivalence Detector agent" filters out mutants no test could kill. It aims at "currently undetected faults that
  are specific to an issue of concern" (Foster et al.).
- In Meta's privacy test-a-thons engineers accepted 73% of ACH's tests and judged 36% privacy relevant.
- The general version of this loop, with the tool's own mutants instead of a concern's:
  [mutation-testing](../mutation-testing/card.md).

## Agent step

A worker generates the concern's mutants and the tests that catch them, and opens the PR. A mutation run, not the
worker, shows that the tests fail on the mutants and pass on the real code: the worker does not grade its own tests.
It does not block; the loops on its PR decide.
