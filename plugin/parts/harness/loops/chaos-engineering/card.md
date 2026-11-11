---
id: chaos-engineering
title: "Chaos engineering"
summary: "Experiments kill pods or zones in staging. From the alerts and SLOs, the agent finds the recovery mechanism that is missing."
sensor: computational
ilities: [reliability]
places: [remediation/entry]
stages: [staging]
speed: [minutes]
needs: [metrics, deploy]
agent: [investigator]
links: []
---

## Why

A recovery mechanism that has never been tested is an assumption. Tests in CI do not kill pods or zones, so a
missing mechanism stays hidden until a real outage. Killing them on purpose in staging, and reading the alerts and
SLOs, shows which mechanism is missing.

## How it works

Experiments written as code kill pods or zones in staging. The agent reads the alerts and SLOs from each experiment
and names the recovery mechanism that is missing.

## Set up

To set up the loop:

- write the experiments as code
- run the experiments only in an isolated environment

## Notes

The research cites no source for this loop.

## Agent step

From the experiment's alerts and SLOs, an investigator returns which recovery mechanism was missing, as a Diagnosis.
The investigator never blocks.
