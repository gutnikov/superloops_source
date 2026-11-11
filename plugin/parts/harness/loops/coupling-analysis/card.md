---
id: coupling-analysis
title: "Coupling analysis"
summary: "The agent calls a CLI that reports fan-in, fan-out and dependency cycles. It then refactors the hot spots using the numbers from that tool, not its own judgement of the code."
sensor: computational
ilities: [maintainability]
places: [maintenance/entry, maintenance/oracle]
stages: [scheduled]
speed: [minutes]
needs: []
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
---

## Why

Coupling grows one dependency at a time, and no single change looks wrong. Asked to judge modularity from the
code alone, a model gives weak answers. Fan-in, fan-out and cycles from a tool give the agent numbers to work
from and point it at the hot spots.

## How it works

The agent works from the tool's numbers, not from its own judgement of the code:

1. It runs the CLI.
2. It finds the hot spots in the numbers, using the thresholds you pick in Set up.
3. It refactors those modules.

The source does not say when the refactoring is done.

## Set up

- Pick a CLI for your stack that reports fan-in, fan-out and dependency cycles, and let the agent call it.
- Pick the thresholds and the output format. The source names no tool, thresholds or output format, so it does not
  say which values make a module a hot spot.

## Notes

- In Böckeler's experience a report built on a deterministic tool's output deserves more trust; she called the
  model's own conclusions about modularity "lackluster".
