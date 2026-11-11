---
id: property-based-tests
title: "Property-based tests"
summary: "The agent states invariants and writes property tests for them. The framework finds a minimal counterexample, and the agent fixes the code."
sensor: computational
ilities: [correctness, reliability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci, scheduled]
speed: [seconds]
needs: []
related: [fuzzing, red-green-tdd, bug-failing-test-fix]
links:
  - title: "Agentic Property-Based Testing: Finding Bugs Across the Python Ecosystem"
    url: "https://arxiv.org/abs/2510.09907"
    author: "Muhammad Maaz, Liam DeVoe, Zac Hatfield-Dodds, Nicholas Carlini"
    note: "NeurIPS 2025, Deep Learning for Code workshop."
  - title: "Hypothesis API Reference"
    url: "https://hypothesis.readthedocs.io/en/latest/reference/api.html"
    author: "Hypothesis"
  - title: "fast-check: Introduction"
    url: "https://fast-check.dev/docs/introduction/"
    author: "fast-check"
  - title: "patchmark: differential fuzzing against commonmark.js and micromark"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/patchmark/test/fuzz-differential.test.ts#L5-L32"
    author: "opencode (anomalyco)"
    note: "5,000 seeded core cases and 2,000 GFM cases, half generated, half mutated from spec examples; zero diffs."
  - title: "fuzz-known.ts: the known divergences, as a function"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/patchmark/test/fuzz-known.ts#L8-L31"
    author: "opencode (anomalyco)"
  - title: "commonmark-spec.test.ts: streaming invariance"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/patchmark/test/commonmark-spec.test.ts#L128-L161"
    author: "opencode (anomalyco)"
---

## Why

Example tests check only the inputs their author picked. A property says what must hold for every input, and the
framework searches for an input that breaks it. That finds the edge cases nobody thought to write down.

## How it works

1. The agent states an invariant: a property that must hold for every input, such as "decoding an encoded value gives
   the value back" or "the output is sorted and has the same elements".
2. The agent writes a property test for that invariant.
3. The framework searches for an input that breaks the property. When it finds one, it shrinks that input to a
   minimal counterexample.
4. The agent decides which side is wrong. It reads the counterexample against the spec or the docs of the code:
   - **the code**: the counterexample becomes a fixed example of the test, and the agent fixes the code red/green;
   - **the property**: the agent narrows it, by constraining the inputs or restating the invariant, and writes the
     reason in the test.

A property that finds no counterexample within the run's number of examples passes; the loop ends there.

## Set up

- **A framework**: Hypothesis for Python, fast-check for JavaScript and TypeScript, jqwik for the JVM. fast-check runs
  the assertion "over hundreds of cases and shrinks failures down to the smallest inputs that still reproduces them".
- **Counterexamples are kept in the test.** Hypothesis saves failing examples under `.hypothesis/examples` and replays
  them on the next run. Keep that folder out of the repository as a local cache; each counterexample the agent fixed
  goes into the test as an `@example`, an input "Hypothesis will always try before generating random inputs", so it
  runs in CI too.
- **The same result on every run in CI.** Hypothesis's `derandomize=True` seeds the search from a hash of the test
  function. Use it in the PR job, so a run gives the same result each time; a nightly job runs with random seeds and
  more examples than the default of 100.
- **A narrowed property is reviewed.** A changed `assume`, a tighter input strategy or a deleted property shows in
  the test diff and goes through the review of test changes ([red-green-tdd](../red-green-tdd/card.md)).
- **Another implementation as the oracle.** Where a reference implementation exists, the property is "same output
  as the reference" on generated and mutated inputs. opencode's Markdown parser is compared with commonmark.js on
  5,000 seeded cases and with micromark on 2,000 GFM cases, half generated and half mutated from the spec's examples,
  and must produce zero diffs; a failing case shows `{case, md, got}` against the reference's output. A disagreement
  the project accepts is written as a function that decides it, not a list of inputs: when the code agrees with
  commonmark.js and only micromark differs, the bug is micromark's. A function stays correct as the generator finds
  new inputs; a list does not.
- **The same answer however the input arrives.** For a streaming parser, feed every input whole, one character at a
  time, in random chunks and in token-sized chunks, and require the same output: opencode runs every CommonMark and
  GFM spec example this way, chunks of 1 to 19 characters from a seeded generator.
- **`run`** is the property tests. It prints each falsified property as `file:line: <property> falsified by <minimal
  input>` and exits non-zero on any.
- **Cases.** Must fire: an encoder whose round trip loses a non-ASCII character; a sort that drops duplicates. Must
  pass: the fixed copies.
- **Wiring.** The agent runs the property tests locally; the PR's CI job runs them derandomized, and the nightly job
  searches wider and opens a problem for any new counterexample.

## Notes

- Maaz, DeVoe, Hatfield-Dodds and Carlini ran an agent that writes property tests over "100 Python packages covering
  933 modules". It produced 984 bug reports; on manual review, "56% were valid bugs and 32% were valid bugs that we
  would report to maintainers". Nearly half of the reports were not valid bugs, which is why step 4 checks the
  property as well as the code.
- On a false alarm the authors' agent goes back and refines its test strategy, constraining the inputs, before it
  reports anything.
