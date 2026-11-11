---
id: metrics-promql
title: "Metrics (PromQL)"
summary: "The agent runs a scenario and compares error counters, latency and resource use with what it expects."
sensor: computational
ilities: [observability, performance, reliability]
places: [delivery/work, delivery/confirmation, remediation/confirmation, maintenance/confirmation]
stages: [local, production]
speed: [seconds]
needs: [metrics]
agent: [investigator]
related: [slo-degradation, perf-budgets-telemetry, load-testing, release-confirmation]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "HTTP API"
    url: "https://prometheus.io/docs/prometheus/latest/querying/api/"
    author: "Prometheus"
    note: "/api/v1/query, /api/v1/query_range, the JSON envelope and its error codes."
  - title: "Query functions"
    url: "https://prometheus.io/docs/prometheus/latest/querying/functions/"
    author: "Prometheus"
    note: "rate() and histogram_quantile()."
  - title: "MetricsQL"
    url: "https://docs.victoriametrics.com/victoriametrics/metricsql/"
    author: "VictoriaMetrics"
---

## Why

A change can pass every test and still raise the error rate, slow responses down or use more resources. Tests check
results, not counters. Running a scenario and reading the metrics shows those effects as numbers the agent can compare
with what it expected.

## How it works

1. The agent runs a scenario against its own instance of the app: a test, a script or a short load.
2. It queries the metrics with PromQL through the HTTP API: `/api/v1/query` for one instant, `/api/v1/query_range`
   for a window. With the metric names of the project's instrumentation, the rate of requests per second over five
   minutes is `rate(http_requests_total[5m])`, and the 90th percentile of latency over ten minutes is
   `histogram_quantile(0.9, rate(http_request_duration_seconds_bucket[10m]))`.
3. It compares each value with what it expected. A difference sends it to the cause: a trace
   ([traces-opentelemetry](../traces-opentelemetry/card.md)), a profile, a log.

## Set up

- **A Prometheus-compatible store per worktree**: Prometheus, or VictoriaMetrics, whose MetricsQL "is
  backwards-compatible with PromQL". The agent reaches it through the HTTP API with `curl`, or through an MCP server.
- **The expectations are a file** in the loop's folder: per query, a name, the PromQL and a limit. Give errors an
  absolute limit (no 5xx in the scenario), and latency and resources a limit relative to the same scenario on the
  base branch, such as no more than 20% worse: a local stand is too noisy for fixed numbers. The limits are
  references a person approves (H5).
- **The `run`** runs the scenario, then each query, and prints one line per query, `<name>: <value> (limit
  <limit>)`, ending in `over` for a value over its limit. A query that returns no series prints `no data`; a query
  the API rejects (`"status": "error"`, HTTP 400 or 422) prints `query error`. It exits non-zero on any of the three.
- **Cases.** Must fire: a copy of a handler that fails one request in ten; a copy with a sleep in the hot path; a
  query for a metric that no longer exists. Must pass: the current code.
- **Wiring and reach.** The agent runs it in its worktree after a change to a path the scenario covers. As a gate,
  CI runs the same `run` in the e2e job with its own store, and the file of expectations changes only through review.
  In production, the same queries compare the new version with the previous one in
  [release-confirmation](../release-confirmation/card.md).

## Notes

- At OpenAI, metrics come from "a local observability stack that’s ephemeral for any given worktree", and with it
  prompts like "ensure service startup completes in under 800ms" become tractable
  ([perf-budgets-telemetry](../perf-budgets-telemetry/card.md)).

## Agent step

An investigator runs the queries and returns which counter or latency differs from what was expected, and why, as a
Diagnosis. It never blocks; the `run` does.
