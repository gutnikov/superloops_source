---
id: property-based-tests
title: "Property-based tests"
summary: "The agent states invariants and writes property tests for them. The framework finds a minimal counterexample, and the agent fixes the code."
sensor: computational
ilities: [correctness, reliability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
links:
  - title: "Agentic Property-Based Testing"
    url: "https://arxiv.org/abs/2510.09907"
    author: "Maaz, DeVoe, Hatfield-Dodds, Carlini"
    note: "NeurIPS 2025, arXiv 2510.09907. The research's entry for this loop names this paper, but the research's source list does not include it."
---

## Why

Example tests check only the inputs their author picked. A property says what must hold for every input, and the
framework searches for an input that breaks it. That finds the edge cases nobody thought to write down.

## How it works

1. The agent states an invariant: a property that must hold for every input.
2. The agent writes a property test for that invariant.
3. The framework searches for an input that breaks the property. When it finds one, it reduces that input to a minimal counterexample.
4. The agent fixes the code.

A failing property does not always mean a bug in the code. The invariant itself may be wrong. In the paper under Notes, the authors judged 56% of the agent's 984 bug reports to be valid bugs.

The source covers only the case where the code is wrong. It does not say what the agent should do when the invariant itself is wrong, or when to stop the loop if the framework finds no counterexample.

## Set up

- Use one of these frameworks: Hypothesis, fast-check or jqwik. The source names no other tools.
- Run the tests locally and in CI.

The source gives no setup steps.

## Notes

- One paper tried this loop at scale: Maaz, DeVoe, Hatfield-Dodds, Carlini, "Agentic Property-Based Testing" (NeurIPS 2025).
- The authors' agent ran property tests over 100 Python packages (933 modules) and produced 984 bug reports.
- The authors judged the reports this way: "56% were valid bugs and 32% were valid bugs that we would report to maintainers".
