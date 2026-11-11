---
id: benchmarks-vs-baseline
title: "Benchmarks against a baseline"
summary: "The agent benchmarks its code against a baseline, such as existing libraries, and optimizes the code when its benchmark result is worse."
sensor: computational
ilities: [performance]
places: [delivery/work, maintenance/oracle, discovery/work]
stages: [local]
speed: [minutes]
needs: []
related: [profiling, behaviour-invariance, perf-budgets-telemetry]
links:
  - title: "Augmented Coding: Beyond the Vibes"
    url: "https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes"
    author: "Kent Beck"
    note: "benchmarks of a B+ tree against Rust's BTreeMap and Python's SortedDict."
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Birgitta Böckeler"
    note: "performance requirements fed forward as skills, performance tests fed back."
  - title: "pytest-benchmark: Usage"
    url: "https://pytest-benchmark.readthedocs.io/en/latest/usage.html"
---

## Why

Tests show that the code does the right thing, not how fast it does it. Without a baseline, slow code passes every
check. A benchmark against a baseline, such as an existing library, gives the agent a number to beat, and a
regression threshold turns a worse number into a failure.

## How it works

The agent runs the benchmarks and compares each result with the baseline: another implementation of the same thing,
or the code's own previous version. Where the result is worse than the threshold allows, the agent finds where the
time goes ([profiling](../profiling/card.md)), optimizes, and runs the benchmarks again.

Beck had the agent "write performance benchmarks to compare my Rust BPlusTreeMap to the Rust's BTreeMap and my
Python BPlusTreeMap to Python's Sorted Dict". The result: "In both cases my code is a bit slower at some operations
but faster at range scanning". One total would have hidden both halves, so compare per operation.

## Set up

- **One benchmark per operation the requirement names** (insert, lookup, range scan), running the code and the
  baseline on the same inputs in the same run. Numbers recorded on another machine measure the machine.
- **The requirement is written down**, per operation, in a skill or the loop's `LOOP.md`: "lookup no more than 10%
  slower than `BTreeMap`; range scan faster". Böckeler names this pair: "Skills that feed forward our performance
  requirements, and performance tests that feed back to the agent".
- **A threshold above the noise.** Fix the input size and the random seed, warm up, and compare medians of several
  runs. Run the unchanged code 5 times and set the threshold above the spread you see: a threshold inside the noise
  fires on noise.
- **Against the previous version**, a tool can keep the runs. pytest-benchmark saves a run with `--benchmark-save` or
  `--benchmark-autosave`, compares with the latest saved run with `--benchmark-compare`, and with
  `--benchmark-compare-fail=mean:5%` it will "Fail test if performance regresses according to given EXPR".
- **`run`** prints one line per operation, `<benchmark>: <result> vs <baseline> (<ratio>): <status>`, where the
  status is `ok` or `slower than allowed`, and exits non-zero when any operation is slower than its threshold allows.
- **Cases.** Must fire: a copy with a deliberate slowdown on one operation (a linear scan in lookup). Must pass: the
  clean copy, run twice, to show that the noise does not fire.
- **Wiring.** The agent runs `run` locally after a change to the code the requirement covers. Run benchmarks on one
  machine, not on shared CI runners whose speed varies from job to job. A PreToolUse hook denies the agent's writes to
  the thresholds and to the saved baseline runs: moving the bar is a person's decision.
