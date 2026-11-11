---
id: perf-budgets-telemetry
title: "Performance budgets through telemetry"
summary: "The agent gets a performance budget, such as \"the service starts in under 800 ms\", queries the traces and optimizes the code until the service meets the budget."
sensor: computational
ilities: [performance]
places: [delivery/work, maintenance/work, maintenance/confirmation]
stages: [local]
speed: [minutes]
needs: [traces]
agent: [investigator]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

A performance requirement that exists only as text gives the agent no signal when the service breaks it. A budget
the agent can measure, such as a start time under 800 ms or no span on a critical path over 2 s, turns that
requirement into a check against the service's own traces. The traces show which span breaks the budget, not just
that the service is slow.

## How it works

The agent gets a performance budget, such as "the service starts in under 800 ms" or "no span on a critical path
takes longer than 2 s". It queries the traces and optimizes the code until the service meets the performance budget
(OpenAI's example).

## Set up

- A local telemetry stack: [structured-logs](../structured-logs/card.md),
  [metrics-promql](../metrics-promql/card.md), [traces-opentelemetry](../traces-opentelemetry/card.md).

## Notes

- The source does not say what the agent does if the agent cannot meet the performance budget. The source gives no
  limit on iterations or time, and no point where the agent stops and reports to a human.
- The source does not say how many runs must meet the performance budget before it counts as met, when timings
  change from run to run.

## Agent step

An investigator finds the span or the step that breaks the budget and returns that span or step as a Diagnosis. The
investigator never blocks; the budget does.
