---
id: llm-evals
title: "Eval suites for LLM features"
summary: "The agent changes a prompt and runs the evals; a drop in the metric counts as a failure."
sensor: computational
ilities: [correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local]
speed: [minutes]
needs: []
agent: [judge]
links: []
---

## Why

The output of an LLM feature differs from run to run, so one good example says little about a prompt change. Evals
run the feature on a suite of cases against thresholds, and a drop in the metric fails the change. Without them, a
prompt that got worse on cases nobody looked at goes out unnoticed.

## How it works

1. The agent changes a prompt.
2. The agent runs the evals in the repository. They run the LLM feature on each case in the suite and compute the
   metric.
3. The evals compare the metric with its threshold. A drop in the metric fails the change.

A script computes some metrics. Others need judgement, and a judge grades them (see Agent step).

## Set up

- Add the evals to the repository, with thresholds.

## Notes

The research cites no source for this loop.

## Agent step

When a metric needs judgement (a summary is faithful, a reply is helpful), the grader is a judge calibrated on a
person's grades ([agent-calibration](../agent-calibration/card.md)). A metric a script computes needs no agent.
