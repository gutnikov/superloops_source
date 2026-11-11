---
id: slo-degradation
title: "SLO degradation"
summary: "The agent watches the SLOs for latency, errors and availability. When an SLO degrades, the agent looks for the cause in logs, traces and recent deploys and proposes a fix."
sensor: computational
ilities: [reliability]
places: [delivery/confirmation, remediation/entry, remediation/confirmation, maintenance/confirmation]
stages: [production]
speed: [minutes, hours]
needs: [metrics]
agent: [investigator]
links:
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
---

## Why

Latency, error rates and availability can get worse with no single failure to report, and checks before the release
never see production traffic. An SLO turns that drift into a line that is either crossed or not. A crossed SLO is
a signal to start remediation, and the SLO is a measure to confirm a release.

## How it works

The agent watches the SLOs for latency, errors and availability and proposes fixes (Böckeler's example).

In this catalog, an investigator does the work when an SLO degrades:

1. It follows the SLO to its cause through logs, traces and recent deploys.
2. It returns a Diagnosis with a proposed fix.

## Set up

- Agent access to monitoring.

## Notes

The source gives only two things: the agent watches the SLOs and proposes fixes, and the agent needs access to
monitoring. The source does not say:

- what counts as degradation
- what form a proposed fix takes
- how the agent learns of a degradation
- what level of monitoring access the agent needs
- who approves a fix, or how the loop checks that the SLO recovered

## Agent step

An investigator follows a degrading SLO to its cause through logs, traces and recent deploys, and returns a
Diagnosis with a proposed fix. It never blocks.
