---
id: canary-feature-flags
title: "Canaries and feature flags"
summary: "When a canary release performs worse than the baseline, the release rolls back automatically and the agent gets the metrics of that release."
sensor: computational
ilities: [deployability, reliability]
places: [delivery/release, delivery/confirmation, remediation/release, remediation/confirmation, maintenance/release, maintenance/confirmation]
stages: [production]
speed: [minutes, hours]
needs: [metrics, deploy]
links: []
---

## Why

Some faults show only in production, after every earlier check has passed. This loop catches a release that performs worse there and undoes it without waiting for a person.

## How it works

1. An analysis compares the canary release with the baseline.
2. If the canary performs worse, the release rolls back automatically.
3. The agent gets the metrics of the release that failed.

## Set up

- Use Argo Rollouts or Flagger.
- Add a kill switch.

## Notes

The source entry does not say:

- what the project needs before it can use Argo Rollouts or Flagger
- which metrics the analysis compares, or what counts as worse
- how the agent gets the metrics, or what it should do with them
- what the kill switch turns off, who uses it, and whether you need it as well as the canary tool or instead of it
- how feature flags fit into the loop

The research cites no source for this loop.
