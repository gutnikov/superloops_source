---
id: metrics-promql
title: "Metrics (PromQL)"
summary: "The agent runs a scenario and compares error counters, latency and resource use with what it expects."
sensor: computational
ilities: [observability, performance, reliability]
places: [delivery/work, delivery/confirmation, remediation/confirmation, maintenance/confirmation]
stages: [local]
speed: [seconds]
needs: [metrics]
agent: [investigator]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

A change can pass every test and still raise the error rate, slow responses down or use more resources. Tests check
results, not counters. Running a scenario and reading the metrics shows those effects as numbers the agent can compare
with what it expected.

## How it works

1. The agent runs a scenario.
2. The agent queries the metrics with PromQL.
3. The agent compares the error counters, latency and resource use that the queries return with what it expected.

## Set up

- A local Prometheus or VictoriaMetrics that the agent reaches through an API or MCP.

## Agent step

An investigator runs the queries and returns which counter or latency differs from what was expected, and why, as a
Diagnosis. It never blocks.
