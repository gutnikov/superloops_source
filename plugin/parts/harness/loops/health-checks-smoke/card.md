---
id: health-checks-smoke
title: "Health checks and smoke tests after deploy"
summary: "After a deploy, the agent polls `/health` and `/ready` and runs a smoke suite. On a red result, an investigator reads the startup logs and returns a Diagnosis."
sensor: computational
ilities: [reliability, deployability]
places: [delivery/release, remediation/release, maintenance/release]
stages: [preview, staging]
speed: [seconds]
needs: [logs]
agent: [investigator]
links: []
---

## Why

A change can pass every test and still not start after the deploy, because the tests did not run the service where
it is deployed. Polling `/health` and `/ready` and running a smoke suite right after the deploy show that while the
change is fresh. The startup logs show why the service did not start.

## How it works

1. The deploy finishes.
2. The agent polls `/health` and `/ready` and runs the smoke suite.
3. A red health check blocks.
4. If the result is red, an investigator reads the startup logs and returns a Diagnosis.

The source does not say how long the agent keeps polling before it treats the result as red. It also does not say what happens after the investigator returns the Diagnosis.

## Set up

To run this loop, the project needs:

- readiness checks that the source calls "meaningful" (it does not say what they must verify)
- a smoke suite that the agent can run after a deploy
- startup logs that the investigator can read

The source does not say what the smoke suite should cover.

## Notes

The research cites no source for this loop.

## Agent step

The investigator reads the startup logs only when the check is red, and returns a Diagnosis. The investigator never
blocks; the health check does.
