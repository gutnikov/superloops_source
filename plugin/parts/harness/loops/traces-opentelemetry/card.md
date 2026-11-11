---
id: traces-opentelemetry
title: "Traces (OpenTelemetry)"
summary: "The agent queries traces (TraceQL) and finds a slow or failed span."
sensor: computational
ilities: [observability, performance]
places: [delivery/work, remediation/oracle]
stages: [local]
speed: [seconds]
needs: [traces]
agent: [investigator]
related: [perf-budgets-telemetry, load-testing, structured-logs, metrics-promql]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Traces"
    url: "https://opentelemetry.io/docs/concepts/signals/traces/"
    author: "OpenTelemetry"
    note: "spans, their status and attributes."
  - title: "Collector"
    url: "https://opentelemetry.io/docs/collector/"
    author: "OpenTelemetry"
  - title: "Construct a TraceQL query"
    url: "https://grafana.com/docs/tempo/latest/traceql/construct-traceql-queries/"
    author: "Grafana Tempo"
  - title: "Tempo HTTP API"
    url: "https://grafana.com/docs/tempo/latest/api_docs/"
    author: "Grafana Tempo"
    note: "GET /api/search with a TraceQL query."
  - title: "VictoriaTraces"
    url: "https://docs.victoriametrics.com/victoriatraces/"
    author: "VictoriaMetrics"
  - title: "turn_phase_trace.rs: a test that asserts the app's own spans"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/suite/turn_phase_trace.rs#L85-L115"
    author: "Codex (OpenAI)"
    note: "an in-memory exporter behind the production export filter, one subprocess per case."
  - title: "turn_phase_trace.rs: span order and the time breakdown"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/suite/turn_phase_trace.rs#L293-L299"
    author: "Codex (OpenAI)"
  - title: "turn_critical_path.rs"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/analytics/src/turn_critical_path.rs#L1-L48"
    author: "Codex (OpenAI)"
    note: "\"Missing capture never becomes a zero-duration measurement.\""
---

## Why

When a request is slow or fails, logs and metrics show that something is wrong but not where. A trace shows each step
of the request as a span, with its time and its status, so a query points to the step that is slow or failed.

## How it works

After a scenario, the agent queries the traces of its own run with TraceQL: `{ status = error }` for the failed
spans, `{ span:duration > 2s }` for the slow ones, narrowed to one service with
`resource.service.name = "checkout"`. A span is one unit of work with its duration and its status, and the status
`Error` means the operation it tracks failed. The query returns the span, and its trace shows the calls around it.
The agent fixes the cause and runs the scenario again; the fix holds once the same query returns nothing.

## Set up

- **The OpenTelemetry SDK** in each service, with the service's name set, and the span's status set to `Error` where
  an operation fails.
- **A collector and a trace store per worktree.** The Collector receives, processes and exports telemetry;
  OpenTelemetry recommends one alongside the service, and sending straight to a backend is enough to start. For
  TraceQL the store is Tempo, queried at `GET /api/search`:
  `curl -G -s http://localhost:3200/api/search --data-urlencode 'q={ status=error }'`.
- **Span budgets are a file** in the loop's folder: per user journey, the longest a span may take. OpenAI's example:
  "no span in these four critical user journeys exceeds two seconds". The budgets are references a person approves
  (H5).
- **Tests for the instrumentation itself.** A span that is never emitted, or ends in the wrong order, makes every
  later query wrong without failing anything. Test it like code: install an in-memory exporter behind the same
  export filter production uses, run a scenario, and assert on the finished spans, their order and their parents.
  Codex polls for each expected span for up to 10 seconds, asserts that sampling ends before a tool call is accepted,
  and checks the turn's time breakdown (inference, tools, review, waiting on the user, unknown): a direct tool call
  must show time in `tools` and none in `unknown`. Run each case in its own process when the tracing setup is
  global, as Codex does.
- **A measure that was not captured is missing, not zero.** Codex: "Missing capture never becomes a zero-duration
  measurement." A zero would pass every budget; `run` prints `missing` for it and fails.
- **The `run`** runs the scenario, queries the failed spans and the spans over budget, and prints one line per span,
  `<service> <span>: <status>`: `error (<status message>) trace <id>` or `slow 2.4s > 2s trace <id>`. It exits
  non-zero when it prints any line, and when the scenario left no traces at all: the instrumentation is broken.
- **Cases.** Must fire: a copy of a handler that fails on the scenario's path; a copy with a sleep over the budget; a
  copy with the instrumentation removed. Must pass: the current code.
- **Wiring and reach.** The agent runs it in its worktree. As a gate, CI runs the same `run` with its own collector
  and store; the budgets change only through review.

## Notes

- At OpenAI, an app sends logs, metrics and traces to Vector, which fans them out to Victoria Logs, Metrics and
  Traces, "each queried via LogQL, PromQL, or TraceQL APIs" (the diagram "Giving Codex a full observability stack in
  local dev"). VictoriaTraces' own documentation describes ingestion over OTLP and querying through the Jaeger query
  API.
- [perf-budgets-telemetry](../perf-budgets-telemetry/card.md) uses the same traces for a budget on one measure, such
  as the start-up time.

## Agent step

An investigator runs the trace queries and returns the slow or failed span, why it is slow or failed, and the next
step, as a Diagnosis. It never blocks.
