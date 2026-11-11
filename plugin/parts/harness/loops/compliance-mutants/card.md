---
id: compliance-mutants
title: "Compliance hardening with mutants"
summary: "An LLM takes one concern, such as data leaks, and writes mutants for it and tests that catch them; a mutation run shows the tests fail on the mutants and pass on the real code."
sensor: computational
ilities: [security, testability]
places: [maintenance/entry, maintenance/work]
stages: [ci, scheduled]
speed: [minutes, hours]
needs: []
agent: [worker]
links:
  - title: "Meta: LLM-Powered Mutation Testing for Automated Test Generation"
    url: "https://www.zenml.io/llmops-database/llm-powered-mutation-testing-for-automated-test-generation"
    author: "ZenML LLMOps Database"
---

## Why

Ordinary tests are written for behaviour, so a change that leaks data can pass them all. Mutants for one concern,
such as data leaks, show where the tests would miss that kind of change, and the generated tests close the gap.

## How it works

The loop follows the three steps of the approach Meta calls ACH, as the linked source describes them:

1. a description of one concern, such as data leaks
2. mutants specific to that concern, which an LLM generates
3. tests that catch those mutants, which the LLM also generates

A mutation run then checks the tests. They must fail on the mutants and pass on the real code.

## Set up

- Follow the approach Meta calls ACH, which the linked source describes. How it works lists its three steps.
- Run the loop in CI or as a scheduled batch job.

The source does not say:

- whether the LLM is the coding agent or a separate generator
- who writes the description of the concern, or in what form
- which tool or model runs the steps
- where the generated tests go, or what signal reaches the coding agent
- what to do with mutants that no test catches, or with tests that fail on the unchanged code
- what starts a CI run, or how often batches run and what goes into each one

## Agent step

A worker generates the concern's mutants and the tests that catch them. A mutation run, not the worker, shows that
the tests fail on the mutants and pass on the real code: the worker does not grade its own tests.
