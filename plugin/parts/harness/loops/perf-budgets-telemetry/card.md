---
id: perf-budgets-telemetry
title: "Performance budgets through telemetry"
summary: "The agent gets a performance budget, such as \"service startup completes in under 800ms\", queries the service's own traces and metrics, and optimizes the code until the service meets it."
sensor: computational
ilities: [performance]
places: [delivery/work, maintenance/work, maintenance/confirmation]
stages: [local]
speed: [minutes]
needs: [traces]
agent: [investigator]
related: [traces-opentelemetry, metrics-promql, benchmarks-vs-baseline, release-confirmation]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
    note: "budgets given to the agent as prompts, checked against a per-worktree observability stack."
  - title: "Construct a TraceQL query"
    url: "https://grafana.com/docs/tempo/latest/traceql/construct-traceql-queries/"
    author: "Grafana Tempo"
  - title: "gemini-cli memory tests"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/memory-tests/memory-usage.test.ts#L149-L159"
    author: "gemini-cli (Google)"
    note: "the heap against the committed baseline, and back to within 20% of the first snapshot."
  - title: "test-rig.ts: memory read from the CLI's own OTel metric"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/test-utils/src/test-rig.ts#L1572-L1600"
    author: "gemini-cli (Google)"
  - title: "memory-test-harness.ts: the leak check and the return to baseline"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/test-utils/src/memory-test-harness.ts#L259-L313"
    author: "gemini-cli (Google)"
---

## Why

A performance requirement that exists only as text gives the agent no signal when the service breaks it. A budget
the agent can measure, such as a start time under 800 ms or no span on a critical path over 2 s, turns that
requirement into a check against the service's own traces. The traces show which span breaks the budget, not just
that the service is slow.

## How it works

The agent gets a budget. At OpenAI the prompts were "ensure service startup completes in under 800ms" and "no span in
these four critical user journeys exceeds two seconds", and they became tractable because "Logs, metrics, and traces
are exposed to Codex via a local observability stack that's ephemeral for any given worktree." The agent starts the
service in its own environment, drives the journeys, measures each budget with a query, and optimizes the code until
every budget holds.

## Set up

- **A local telemetry stack per worktree**: [structured-logs](../structured-logs/card.md),
  [metrics-promql](../metrics-promql/card.md), [traces-opentelemetry](../traces-opentelemetry/card.md), in an
  [isolated environment](../isolated-environment/card.md) so that no other run's spans mix in.
- **Budgets as queries.** Each budget is a name, a query and a limit, in the loop's `LOOP.md` or a budgets file.
  Startup is a span or a metric. "No span exceeds 2 s" is a TraceQL query such as `{ span:duration > 2s }`, narrowed
  to the journey's spans, that must return nothing.
- **Many runs.** Timings vary from run to run. Start the service 5 times and judge the median start time: one slow
  start is noise, a median over the budget is not. A "no span exceeds" budget is judged on every span: one span over
  the limit is red.
- **Memory is a budget too, read from the same telemetry.** gemini-cli's memory tests read heap, RSS and external
  memory from the CLI's own OTel metric `gemini_cli.memory.usage`, so a test measures what production reports. A
  scenario fails when its final heap is more than 10% over the committed baseline, and a multi-turn scenario also fails
  when its final heap is more than 20% above its first snapshot: what a finished turn should have released was kept.
  Growth of more than 1 MB in each of the last two phases is printed as a leak warning.
- **A limit on attempts.** After 5 rounds of optimizing in which the measure did not improve, the agent stops and
  reports to a person, with the investigator's Diagnosis and the measurements: the budget may be wrong (H5), or the
  design may need to change.
- **`run`** prints one line per budget, `<budget>: <measured> (limit <limit>): <status>`, where the status is `ok`,
  `over`, or `no data` when the query found no spans of the journey: a journey that did not run is not a pass. It
  exits non-zero on `over` or `no data`.
- **Cases** are recorded telemetry snapshots that `run` judges. Must fire: a median start of 1.2 s; one span of 2.4 s
  in a journey; no spans of the journey at all. Must pass: a snapshot within every budget.
- **Wiring.** The agent runs `run` locally while it works and keeps the final measurements as evidence. A PreToolUse
  hook denies its writes to the budgets. For the `maintenance/confirmation` place, the same queries run against
  production telemetry after the release, outside the agent's session
  ([release-confirmation](../release-confirmation/card.md)).

## Agent step

An investigator gets the budget, its query and the slowest traces, finds the span or the step that breaks the budget,
and returns it as a Diagnosis. The investigator never blocks; the budget does.
