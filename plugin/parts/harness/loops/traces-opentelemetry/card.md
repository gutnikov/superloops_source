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
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

When a request is slow or fails, logs and metrics show that something is wrong but not where. A trace shows each step
of the request as a span, with its time and its status, so a query points to the step that is slow or failed.

## How it works

The agent queries the traces with TraceQL. Each request appears there as spans, one per step, each with its
time and status. The query returns the span that is slow or failed.

The source does not say what starts the query, what the agent does with the span, or how it checks that its fix worked.

## Set up

- The OTel SDK.
- A local collector.

Example: in the cited post, OpenAI uses Vector → VictoriaTraces. Vector passes traces on to VictoriaTraces. The source gives this as OpenAI's own setup, not as a requirement.

## Agent step

An investigator runs the trace queries and returns the slow or failed span, why it is slow or failed, and the next
step, as a Diagnosis. It never blocks.
