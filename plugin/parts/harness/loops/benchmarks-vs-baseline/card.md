---
id: benchmarks-vs-baseline
title: "Benchmarks against a baseline"
summary: "The agent benchmarks its code against a baseline, such as existing libraries, and optimizes the code when its benchmark result is worse."
sensor: computational
ilities: [performance]
places: [delivery/work, maintenance/oracle, discovery/work]
stages: [local, ci]
speed: [minutes]
needs: []
related: [profiling, behaviour-invariance, perf-budgets-telemetry, scripted-model-tests]
links:
  - title: "Augmented Coding: Beyond the Vibes"
    url: "https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes"
    author: "Kent Beck"
    note: "benchmarks of a B+ tree against Rust's BTreeMap and Python's SortedDict."
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Birgitta Böckeler"
    note: "performance requirements fed forward as skills, performance tests fed back."
  - title: "opencode app benchmarks (strobe)"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/perf/README.md#L3-L33"
    author: "opencode (anomalyco)"
    note: "two builds in interleaved pairs of fresh launches; one primary metric per case with an interval; counts that must stay exact."
  - title: "strobe: run, A/A, the results block in a pull request"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/perf/README.md#L49-L88"
    author: "opencode (anomalyco)"
  - title: "strobe: why it changed, leaks, bisect"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/perf/README.md#L104-L139"
    author: "opencode (anomalyco)"
  - title: "strobe: writing a case"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/perf/README.md#L165-L166"
    author: "opencode (anomalyco)"
    note: "\"Do not throttle the CPU or the network: make the workload bigger instead.\""
  - title: "opencode app AGENTS.md: benchmark before changing session or timeline code"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/AGENTS.md#L3-L4"
    author: "opencode (anomalyco)"
  - title: "pytest-benchmark: Usage"
    url: "https://pytest-benchmark.readthedocs.io/en/latest/usage.html"
  - title: "gemini-cli performance tests"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/perf-tests/README.md#L45-L74"
    author: "gemini-cli (Google)"
    note: "warmup, samples, the IQR filter, the median; baselines.json and how it is recalibrated."
  - title: "perf-test-harness.ts: the comparison and its failure message"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/test-utils/src/perf-test-harness.ts#L214-L322"
    author: "gemini-cli (Google)"
  - title: "Codex justfile: bench-smoke and bench-e2e-smoke"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/justfile#L104-L119"
    author: "Codex (OpenAI)"
  - title: "rust-ci.yml: the benchmark smoke test on pull requests"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/rust-ci.yml#L78-L79"
    author: "Codex (OpenAI)"
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
  fires on noise. Drop outliers before the median: gemini-cli's harness runs 1 warmup and 5 samples in CI (3
  locally), discards samples outside Q1 − 1.5×IQR and Q3 + 1.5×IQR, and fails a median more than 15% above the
  baseline, printing the measured value, the baseline, the delta and how many samples survived the filter.
- **A program that calls a model is measured on replayed replies**, so neither the model's latency nor its output
  is in the number: each of gemini-cli's scenarios replays a recorded `perf.<scenario>.responses` file
  ([scripted-model-tests](../scripted-model-tests/card.md)).
- **The baseline is a committed file.** gemini-cli keeps `baselines.json` next to the tests;
  `UPDATE_PERF_BASELINES=true` rewrites it after an intended change, and the new numbers reach main only as a commit
  a person reviews. A scenario with no baseline prints `no baseline` and does not pass.
- **Against the previous version**, a tool can keep the runs. pytest-benchmark saves a run with `--benchmark-save` or
  `--benchmark-autosave`, compares with the latest saved run with `--benchmark-compare`, and with
  `--benchmark-compare-fail=mean:5%` it will "Fail test if performance regresses according to given EXPR".
- **Against the base branch, built side by side.** Where the code has no fixed baseline number, build the base ref
  next to the change and run the two in alternating pairs of fresh launches (A B, B A, …), so drift on the machine
  hits both sides. opencode's rule: "Before changing session or timeline code, benchmark it against `origin/dev`
  with strobe". Each case decides one primary metric with an interval. Some cases also count what must not happen
  and compare the count exactly: 0 transcript requests on a warm tab switch, 0 layout shifts.
- **A check of the method first.** Run the same build on both sides: opencode, "The same build on both sides must
  come out 'same'". Refuse a setup that cannot give a fair number, such as a hidden window, a software GPU, a
  throttled CPU or a busy machine, and a run that landed on the wrong page; do not throttle to make a difference
  visible, "make the workload bigger instead".
- **A moved verdict brings its explanation.** When a result moves, profile one launch per side and read what moved
  ([profiling](../profiling/card.md)); to find the commit that moved it, bisect along the first-parent line. The
  results go into the pull request as a generated block that the tool refuses to update once someone edits it.
- **`run`** prints one line per operation, `<benchmark>: <result> vs <baseline> (<ratio>): <status>`, where the
  status is `ok` or `slower than allowed`, and exits non-zero when any operation is slower than its threshold allows.
- **Cases.** Must fire: a copy with a deliberate slowdown on one operation (a linear scan in lookup); for the smoke
  run, a benchmark that panics on start. Must pass: the clean copy, run twice, to show that the noise does not fire.
- **Wiring.** The agent runs `run` locally after a change to the code the requirement covers. Run benchmarks on one
  machine, not on shared CI runners whose speed varies from job to job. CI runs each benchmark once, without
  measuring, so one that no longer builds or starts fails the PR that broke it: Codex's `just bench-smoke` ("Run
  benchmark targets once to ensure they start successfully") runs `cargo bench … -- --test` in its PR CI, and its
  end-to-end smoke builds without the optimizer, "Avoid optimizer cost because smoke runs only check that benchmarks
  work". A PreToolUse hook denies the agent's writes to the thresholds and to the saved baseline runs: moving the bar
  is a person's decision.
