---
id: llm-judge-calibration
title: "Calibrating an LLM judge on an expert (critique shadowing)"
summary: "An expert grades a sample of results. An LLM judge's prompt is revised until the judge grades that sample the same way as the expert. This is prompt revision, not model training."
sensor: human
ilities: [alignment]
places: [harness:delivery/oracle, harness:delivery/gate]
stages: [scheduled]
speed: [seconds, hours]
needs: []
sync: async
assesses: [result]
related: [llm-evals, ai-judges-telemetry]
links:
  - title: "Using LLM-as-a-Judge For Evaluation"
    author: "Hamel Husain"
  - title: "A retelling of critique shadowing"
    author: "Simon Willison"
    note: "a retelling of Hamel Husain's method"
---

## Why

An expert cannot grade every result. An LLM judge can grade them all, but its grades mean little until they are checked against the expert's. Calibration does that check. It takes hours of the expert's time, once. After that, the judge takes seconds per grade. The source gives no time for revising the prompt.

Hamel Husain notes that building a judge is a handy way to make people look closely at their data.

## How it works

The expert's grades on the sample are the signal. Each revision of the judge's prompt is checked against them. This is prompt revision, not model training. When the judge's grades agree with the expert's, the judge grades the whole stream instead of the expert.

A calibrated judge is used in [eval suites for LLM features](../llm-evals/card.md) and
[AI judges on telemetry](../ai-judges-telemetry/card.md).

## Set up

To set up the loop with Hamel Husain's method:

1. Choose one principal expert, so that the grades are consistent.
2. The expert grades a sample of results. For each result, the expert answers yes or no to whether the AI achieved the desired outcome, and writes a critique with reasons, instead of scoring on a 1–5 scale.
3. Revise the judge's prompt, round after round, until its grades agree with the expert's (Simon Willison).

The source does not say who revises the prompt: the expert, an engineer or an agent.

## Notes

- The source does not say:
  - how the expert's critiques are used in the judge's prompt
  - how closely the judge's grades must match the expert's, or on how many results, before calibration is finished
  - what to do if the judge never matches the expert
  - whether the expert has to check the judge again later
