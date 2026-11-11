---
id: load-testing
title: "Load testing"
summary: "The agent runs k6, Gatling or Locust against a preview, sees p95 degrade and looks for the bottleneck in the traces."
sensor: computational
ilities: [performance]
places: [delivery/release, maintenance/release]
stages: [preview, staging]
speed: [minutes]
needs: [traces]
agent: [investigator]
related: [preview-environments, traces-opentelemetry, profiling, perf-budgets-telemetry]
links:
  - title: "Thresholds"
    url: "https://grafana.com/docs/k6/latest/using-k6/thresholds/"
    author: "Grafana k6"
  - title: "Gatling assertions scripting reference"
    url: "https://docs.gatling.io/concepts/assertions/"
    author: "Gatling"
  - title: "Locust: Running without the web UI"
    url: "https://docs.locust.io/en/stable/running-without-web-ui.html"
---

## Why

A change that is fast for one user can slow down under many, and functional tests never put that load on it. This
loop catches a p95 that degrades under load, and the traces show the agent where the bottleneck is.

## How it works

1. The agent runs a scenario from the repository with k6, Gatling or Locust against an environment that runs its
   change: the PR's preview or staging.
2. The tool's thresholds decide the result. When a k6 threshold fails, "k6 would exit with a non-zero exit code". In
   Gatling, "If at least one assertion fails, the simulation fails." Locust gives "an exit code of 1 if there were any
   failed samples", and a `quitting` listener can set `environment.process_exit_code` from the fail ratio or
   `get_response_time_percentile(0.95)`.
3. On a failure, an investigator reads the run's report and the traces of the slowest requests and returns the
   bottleneck (see Agent step).
4. The agent fixes the code and runs the same scenario again.

## Set up

- **An environment that runs the change alone**: the PR's [preview](../preview-environments/card.md), or staging with
  nothing else deployed during the run. Never production. Either size it like production, or set the thresholds for
  the size it has.
- **Scenarios in the repository**, each with its load: users, ramp-up and duration. Ramp up to the expected peak and
  hold it for at least 5 minutes: a shorter run hides exhausted pools and slow leaks.
- **Thresholds in the scenario.** In k6, `http_req_duration: ['p(95)<200']` and `http_req_failed: ['rate<0.01']`; in
  Gatling, `global().responseTime().percentile(95).lt(1000)` and `forAll().failedRequests().percent().lte(5.0)`; in
  Locust, the `quitting` listener. The numbers are the project's decision: from the SLO, or, without one, main's p95 on
  the same scenario plus 10%. A person approves a change to them (H5).
- **Traces from the environment** ([traces-opentelemetry](../traces-opentelemetry/card.md)). Without them the run
  shows that p95 degraded but not where, and the agent profiles the service instead
  ([profiling](../profiling/card.md)).
- **`run`** runs the scenario and prints one line per threshold, `<metric>: <value> (threshold <expression>):
  <status>`, where the status is `ok` or `failed`. It exits non-zero when the tool does.
- **Cases** run a 10-second scenario against a local stub server. Must fire: the stub with a 300 ms delay on one
  endpoint (p95 over the threshold); the stub returning 500 on 5% of requests (the error rate over the threshold).
  Must pass: the stub without delay or errors.
- **Wiring.** A CI job runs the scenarios after the preview deploy, or a scheduled job runs them against staging; the
  agent may also run them against its own preview while it works. The CI run is the one that counts, and a PreToolUse
  hook denies the agent's writes to the thresholds.

## Agent step

An investigator gets the run's report and the traces of the slowest requests in the run's window, and returns a
Diagnosis: the span that takes the time, the trace ids that show it, and the likely cause (a missing index, a lock, an
exhausted pool). It never blocks; the run's thresholds do.
