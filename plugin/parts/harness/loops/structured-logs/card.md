---
id: structured-logs
title: "Structured logs and log queries"
summary: "The agent starts the application, queries the logs, finds the error and fixes it (at OpenAI: LogQL against an ephemeral VictoriaLogs per worktree)."
sensor: computational
ilities: [observability]
places: [delivery/work, delivery/confirmation, remediation/oracle, remediation/confirmation, maintenance/confirmation]
stages: [local, production]
speed: [seconds]
needs: [logs]
agent: [investigator]
related: [taste-invariants, isolated-environment, traces-opentelemetry, browser-console-devtools]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "LogQL"
    url: "https://grafana.com/docs/loki/latest/query/"
    author: "Grafana Loki"
  - title: "Querying VictoriaLogs"
    url: "https://docs.victoriametrics.com/victorialogs/querying/"
    author: "VictoriaMetrics"
    note: "the /select/logsql/query endpoint; its language is LogsQL."
---

## Why

When the running application fails, the cause is in its logs, not in the test output. Unstructured logs have to be
read line by line; structured ones can be queried, so the agent goes straight to the error and the events around it. A
log stack per worktree means the agent reads only its own task's logs.

## How it works

The agent starts the application in its worktree, runs the scenario and queries the logs of that run: first the
error-level events, then the events around one of them, by its request or trace id. The result shows the error with
its fields (the message, the caller, the ids). The agent fixes the cause and runs the scenario again until the query
comes back empty. When the logs did not hold enough to find the cause, the fix adds the missing field to the log call.

At OpenAI, logs come from "a local observability stack that’s ephemeral for any given worktree", and "Agents can
query logs with LogQL".

## Set up

- **Structured logging.** Every line is one JSON object with at least the level, the message, the caller and the
  request or trace id. A lint enforces it ([taste-invariants](../taste-invariants/card.md)), and a skill with the
  logging standards tells the agent how to write a log call (Böckeler).
- **A log store per worktree**, started with the app and deleted after the task
  ([isolated-environment](../isolated-environment/card.md)), so the agent reads only its own run. Write the queries
  in the store's own language. Loki's is LogQL. VictoriaLogs' is LogsQL, a different language, queried at
  `/select/logsql/query`: `curl http://localhost:9428/select/logsql/query -d 'query=_time:5m error'` returns the
  matching entries as JSON lines.
- **The `run`** runs the scenario and queries the error-level events since it started. It prints one line per
  distinct error, `<caller>: <message> (<count>)`, where the caller is the event's `file:line`, and exits non-zero
  when any error is not on the allow-list in the loop's `LOOP.md`.
- **Cases.** Must fire: a copy of a handler that logs an error on the scenario's path; a copy whose background job
  fails, which the scenario's own assertions do not see. Must pass: the current code, with no error-level events.
- **Wiring and reach.** The agent runs it in its worktree. As a gate, CI runs the same `run` after the e2e job against
  its own store; the allow-list changes only through review.

## Notes

- Böckeler also suggests "debugging instructions that ask the agent to reflect on the quality of the logs it had
  available": the field the agent missed goes into the logging skill.
- OpenAI's diagram shows an app sending logs, metrics and traces to Vector, which fans them out to Victoria Logs,
  Metrics and Traces, "each queried via LogQL, PromQL, or TraceQL APIs". VictoriaLogs' own documentation names its
  language LogsQL and has a guide to converting Loki queries: check which language the store takes before writing
  queries.

## Agent step

An investigator runs the log queries and returns a Diagnosis instead of raw lines. It never blocks.
