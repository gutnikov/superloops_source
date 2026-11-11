---
id: mutation-testing
title: "Mutation testing"
summary: "The agent sees surviving mutants — code changes the tests did not notice — and writes tests that catch them."
sensor: computational
ilities: [testability]
places: [delivery/work, remediation/work, maintenance/oracle]
stages: [local, ci]
speed: [minutes, hours]
needs: []
links:
  - title: "Mutation-Guided LLM-based Test Generation at Meta"
    url: "https://dl.acm.org/doi/10.1145/3696630.3728544"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
---

## Why

A suite can pass and run every line and still miss broken behaviour, because a test that runs code does not have to
check its result. Mutation testing changes the code on purpose; a change no test notices shows where the tests
are blind. When the agent wrote both the code and the tests, this checks the tests from outside.

## How it works

A mutation tool makes small changes to the code, called mutants, and runs the tests against each one. If the tests
still pass, the mutant survives. The agent gets the surviving mutants and writes tests that fail on them.

## Set up

Use a tool that can run incremental mutation on the diff: Stryker, PIT or mutmut. Run it in two places:

- locally, on the diff only
- in CI, on the full code

## Notes

- Meta applied its ACH system to 10,795 Kotlin classes on 7 platforms. ACH generated 9,095 mutants and
  571 privacy-hardening tests. At the Messenger and WhatsApp test-a-thons engineers accepted 73% of its tests
  (Foster et al., FSE '25).
- Mutation testing checks the agent's own tests from outside: whether a mutant survives depends on those tests.
  The research finds behaviour the worst covered of all qualities. It counts mutation testing among the independent
  behaviour checks that are especially valuable. The reason it gives: Böckeler writes that relying on tests the AI wrote itself is not yet
  enough.
