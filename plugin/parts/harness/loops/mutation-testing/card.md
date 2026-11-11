---
id: mutation-testing
title: "Mutation testing"
summary: "The agent sees surviving mutants — code changes the tests did not notice — and writes tests that catch them."
sensor: computational
ilities: [testability]
places: [delivery/work, remediation/work, maintenance/oracle]
stages: [local, ci, scheduled]
speed: [minutes, hours]
needs: []
related: [code-coverage, compliance-mutants, red-green-tdd, behaviour-invariance]
links:
  - title: "Mutation-Guided LLM-based Test Generation at Meta"
    url: "https://dl.acm.org/doi/10.1145/3696630.3728544"
    author: "Christopher Foster et al."
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Birgitta Böckeler"
  - title: "Incremental"
    url: "https://stryker-mutator.io/docs/stryker-js/incremental/"
    author: "Stryker Mutator"
---

## Why

A suite can pass and run every line and still miss broken behaviour, because a test that runs code does not have to
check its result. Mutation testing changes the code on purpose; a change no test notices shows where the tests
are blind. When the agent wrote both the code and the tests, this checks the tests from outside.

## How it works

A mutation tool makes small changes to the code, called mutants, and runs the tests against each one. If the tests
still pass, the mutant survives. The agent gets the surviving mutants and writes tests that fail on them.

In maintenance the agent runs it before the work: a mutant that survives in code about to be refactored marks
behaviour no test pins down, and it gets a test first ([behaviour-invariance](../behaviour-invariance/card.md)).

## Set up

- **Mutate only what changed, locally.** StrykerJS with `--incremental` re-tests only the mutants in changed code and
  tests, and keeps the previous result in `reports/stryker-incremental.json`. For other languages, run the project's
  mutation tool (PIT, mutmut) on the changed files. Run the whole code in CI, nightly once it takes longer than a PR
  can wait.
- **A threshold on the changed code.** Stryker's `thresholds.break`: below it, "Stryker will exit with exit code 1";
  its default is `null`, which never fails. The threshold is a reference a person approves (H5), written in the
  loop's `LOOP.md`.
- **Equivalent mutants are listed, not hidden.** A mutant that changes no behaviour cannot be killed. The agent adds
  it to the loop's list of accepted survivors with a one-line reason, and the list shows in the PR's diff.
- **`run`** prints one line per surviving mutant, `file:line: survived: <what the mutant changed>`, and exits non-zero
  when the mutation score of the changed code is below the threshold.
- **Cases.** Must fire: a function whose test calls it and asserts nothing, so every mutant survives. Must pass: the
  same function with assertions that kill its mutants.
- **Wiring.** The agent runs it locally before it reports done; a CI job runs it on the PR and enforces the threshold.
  A PreToolUse hook denies the agent's writes to the mutation configuration (the files to mutate, the thresholds), so
  it cannot make a survivor go away by not mutating the code.

## Notes

- Meta applied its ACH system to "10,795 Android Kotlin classes in 7 software platforms". ACH generated 9,095 mutants
  and 571 privacy-hardening tests. At the Messenger and WhatsApp test-a-thons engineers accepted 73% of its tests
  (Foster et al., FSE '25). The concern-driven version of this loop is
  [compliance-mutants](../compliance-mutants/card.md).
- Böckeler on tests the agent wrote: "This approach puts a lot of faith into the AI-generated tests, that's not good
  enough yet." She names mutation testing among the computational sensors "that have been underused in the past".
