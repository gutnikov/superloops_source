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
links:
  - title: "Augmented Coding: Beyond the Vibes"
    url: "https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes"
    author: "Kent Beck"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
---

## Why

Tests show that the code does the right thing, not how fast it does it. Without a baseline, slow code passes every
check. A benchmark against a baseline, such as an existing library, gives the agent a number to beat, and a
regression threshold turns a worse number into a failure.

## How it works

The agent benchmarks its code and compares the benchmark result with a baseline. If the result is worse than the
baseline, the agent optimizes the code.

In Beck's example, the baseline was existing libraries. He asked the agent to compare its B+ tree implementation with
`BTreeMap` in Rust and with `SortedDict` in Python. The source does not say what the comparison showed or what the
agent changed.

## Set up

- Stable benchmarks with a regression threshold.
- A skill with the performance requirements.
