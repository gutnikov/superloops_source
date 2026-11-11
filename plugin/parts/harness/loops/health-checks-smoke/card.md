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
related: [release-confirmation, preview-environments, config-validation, canary-feature-flags]
links:
  - title: "Liveness, Readiness, and Startup Probes"
    url: "https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/"
    author: "Kubernetes"
  - title: "Deployments"
    url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"
    author: "Kubernetes"
    note: "the exit code of kubectl rollout status, the progress deadline, kubectl rollout undo."
  - title: "opencode schedule.ts: a condition polled with no model call"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/schema/src/schedule.ts#L214-L234"
    author: "opencode (anomalyco)"
    note: "`until` polls every 30 seconds by default, wakes once when it passes, and gives up after 24 hours."
  - title: "opencode shell.ts: a background command resumes the agent"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/tool/plugin/shell.ts#L30-L31"
    author: "opencode (anomalyco)"
---

## Why

A change can pass every test and still not start after the deploy, because the tests did not run the service where
it is deployed. Polling `/health` and `/ready` and running a smoke suite right after the deploy show that while the
change is fresh. The startup logs show why the service did not start.

## How it works

1. The deploy finishes. On Kubernetes, `kubectl rollout status` exits 0 once the rollout completes, and non-zero
   once the Deployment passes its progress deadline (600 seconds by default).
2. A job polls `/health` and `/ready` on the new version, then runs the smoke suite against its address.
3. A red result stops the release there: the change does not go on to the next stage.
4. An investigator reads the startup logs of the new version and returns a Diagnosis. The agent fixes the cause and
   deploys again, and the job runs again.

## Set up

- **A readiness check that means something.** Kubernetes: "Readiness probes determine when a container is ready to
  accept traffic." Make `/ready` check each back end the service cannot work without, such as its database and its
  queue, and keep `/health` to the process itself. Kubernetes warns that "Incorrect implementation of liveness
  probes can lead to cascading failures": a `/health` that fails while the database is down gets every pod
  restarted, which does not bring the database back.
- **Poll for a limited time.** Poll every 5 s for up to 2 minutes; a timeout is red: a slower start is a problem of
  its own.
- **A smoke suite of a few checks**: 3 to 10 requests or browser steps over what every release must do (the main
  page loads, a user logs in, the main read and the main write), tagged `@smoke`, on a test account, under a minute,
  against any environment by its base URL. It is not the e2e suite: it answers only whether this deploy works at all.
- **Startup logs kept.** The job saves the new version's logs from its start to the verdict, so the investigator
  reads exactly those.
- **The `run`** prints one line per check, `<check>: <status>`: `rollout: ok`, `/ready: ok after 35s`, `/ready:
  timeout after 120s (last 503)`, `smoke login: fail (500 on POST /session)`. It exits non-zero when any check is not
  `ok`.
- **Cases**, each a copy of the service that the case starts locally. Must fire: a copy with a required environment
  variable missing, which exits at start; a copy whose database is unreachable, so `/ready` stays 503; a copy where
  one smoke step answers 500. Must pass: the current version.
- **Wiring and reach.** A step of the deploy pipeline after every deploy to a preview or to staging, before
  promotion. The agent reads the result; it does not run the step. The smoke suite and the polling limits are in the
  protected suite, so the agent cannot turn a red deploy green by trimming them.

## Notes

- Green here means the version starts and answers, not that the change works for users. That is
  [release-confirmation](../release-confirmation/card.md), which waits for real traffic.
- **When the agent itself waits for a deploy, it should not spend turns polling.** A model that sleeps and re-reads
  `/ready` pays a turn per poll and drifts. Poll outside the model: opencode's `schedule_create` with `until`
  runs a shell check "with no model call", every 30 seconds by default, wakes the session once when the command
  exits 0 and its output matches, and gives up after 24 hours. A background command does the same for a single
  long step: the agent ends its turn and is "resumed automatically when the command finishes", with the output and
  the exit code. Keep this card's limits in the check itself: every 5 s for up to 2 minutes, then red.

## Agent step

The investigator gets the startup logs only when the check is red, and returns a Diagnosis: the cause, the log lines
that show it, and the next step. It never blocks; the health check does.
