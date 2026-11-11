---
id: load-testing
title: "Load testing"
summary: "The agent runs k6, Gatling or Locust against a preview, sees p95 degrade and looks for the bottleneck in the traces."
sensor: computational
ilities: [performance]
places: [delivery/release, maintenance/release]
stages: [staging]
speed: [minutes]
needs: [traces]
agent: [investigator]
links: []
---

## Why

A change that is fast for one user can slow down under many, and functional tests never put that load on it. This loop catches a p95 that degrades under load, and the traces show the agent where the bottleneck is.

## How it works

1. The agent runs a scenario from the repository against a preview, using k6, Gatling or Locust.
2. If p95 degrades, the run's thresholds end the run with a non-zero exit code.
3. The agent looks for the bottleneck in the traces from the preview.

## Set up

The loop needs:

- A preview deployment for the agent to run the load against. If your project has no preview, the agent has nothing to test, and you need to add one first.
- Traces from that preview. If your project collects no traces, the agent can see p95 degrade but cannot look for the bottleneck, and you need to add tracing first.
- Scenarios in the repository.
- Thresholds that end the run with a non-zero exit code.

## Notes

The research cites no source for this loop. It lists k6 among tools that reflect common practice and that the research itself did not verify. It does not say which claims about k6 went unchecked. Gatling and Locust are not on that list.

## Agent step

An investigator reads the load run's report and the traces and returns the bottleneck as a Diagnosis. It never
blocks; the run's thresholds do.
