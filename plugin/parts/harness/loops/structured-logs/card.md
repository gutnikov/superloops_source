---
id: structured-logs
title: "Structured logs and log queries"
summary: "The agent starts the application, queries the logs, finds the error and fixes it (at OpenAI: LogQL against an ephemeral VictoriaLogs per worktree)."
sensor: computational
ilities: [observability]
places: [delivery/work, delivery/confirmation, remediation/oracle, remediation/confirmation, maintenance/confirmation]
stages: [local]
speed: [seconds]
needs: [logs]
agent: [investigator]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
---

## Why

When the running application fails, the cause is in its logs, not in the test output. Unstructured logs have to be
read line by line; structured ones can be queried, so the agent goes straight to the error and the events around it. A
log stack per worktree means the agent reads only its own task's logs.

## How it works

The agent starts the application and queries the logs from its own worktree's log stack. The query results show the error, and the agent fixes it.

At OpenAI, the agent writes these queries in LogQL and runs them against an ephemeral VictoriaLogs for each worktree.

## Set up

- Structured logging, enforced by a lint ([taste-invariants](../taste-invariants/card.md)).
- A log stack per worktree, deleted after the task.
- A skill with the logging standards (Böckeler).

## Agent step

An investigator runs the log queries and returns a Diagnosis instead of raw lines. It never blocks.
