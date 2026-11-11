---
id: release-confirmation
title: "Release confirmation"
summary: "After a deploy, a job judges a snapshot of a window: the change is confirmed only if production runs it, its signal appeared often enough, and nothing is worse than under the previous version."
sensor: computational
ilities: [correctness, reliability, observability]
places: [delivery/confirmation, remediation/confirmation, maintenance/confirmation]
stages: [production]
speed: [minutes, days]
needs: [logs, deploy]
agent: [investigator]
related: [canary-feature-flags, health-checks-smoke, reproduction-gate, error-tracking]
links:
  - title: "Kayenta"
    author: "Netflix and Google"
    note: "2018: canary analysis that judges a release against the previous version running beside it."
  - title: "Towards Progressive Delivery"
    author: "James Governor"
    note: "RedMonk, 2018: releasing step by step, with a check at every step."
  - title: "DORA"
    url: "https://dora.dev"
    note: "the change failure rate."
---

## Why

Passing the gate means a change is ready to release, not that it works where it is used. Quiet logs after a deploy
prove little: a feature behind a flag that is off, or a path nobody takes, leaves them quiet too. So a super-loop does
not end at the deploy. It ends only when all three checks below pass.

## How it works

A job after the deploy waits for a window and judges a snapshot of it. A change counts as confirmed only when
production runs it, its own signal appeared often enough, and nothing is worse than under the previous version. This
is the confirmation phase of delivery, remediation and maintenance; the three differ in the second check.

| Super-loop | 1. The change is there | 2. Its signal | 3. Nothing broke |
|---|---|---|---|
| delivery | The version runs; behind a flag, the flag is on for the audience | The event the spec names appears at least N times | No new errors; the error rate and latency are no worse than the previous version's |
| remediation | The same | The signal that showed the problem stays absent while the path where the problem showed runs at least N times | The same |
| maintenance | The same | The product's own events stay at the previous version's level, and the measure improved | The same |

## Set up

- **Every log line and every error carries the version.** Without it, nothing can be attributed to the release.
- **Each change names its signal before the work**: in the spec for delivery, as the reproduction's signal for
  remediation, as the measure for maintenance. With the `spec` part, every functional requirement has its `prod`
  signal, and `specs.py signals --base <ref>` writes those of a release in the format this loop reads.
- **The window is counted in events**: at least T minutes and at least N events on the changed path, up to a cap. At
  the cap with too few events, the result is `inconclusive`. A nightly job's window is its next run. A mobile
  release's window is the sessions on the new version over days.
- **Compare with the previous version, not with zero.** Production always has background errors.
- **A weak baseline is said out loud.** Right after a rollback, the previous version may have served only a few
  requests. With fewer than half of the window's events to compare with, the check falls back to an absolute limit
  on the error rate (1%, say), skips the latency, and prints that the baseline is weak.
- **Wait in the wiring, judge in `run`.** A job runs after the deploy: in the pipeline, or on a schedule where deploys
  are manual. The job:
  1. waits for the window;
  2. saves a snapshot into a directory.

  The snapshot holds which version ran and, for the new version and for the previous one over comparable windows, the
  errors, the event counts and the metrics. `run` judges the snapshot, so it is fast and deterministic, and it fits
  the contract of any loop.
- **The output** is one line per item, `<item>: <status>`: `confirmed`, `not the running version`,
  `signal missing (3 of 50)`, `new error <fingerprint> (12)`, `error rate 2.1% vs 0.4%`, `inconclusive (too few
  events)`. The exit is non-zero for anything but `confirmed`.
- **The cases are recorded windows.** Must fire: a new error; the signal missing; the old version still running; too
  few events. Must pass: enough events, no new errors, the rates at the previous version's level.
- **Out of the agent's reach.** The job runs in the deploy pipeline or on a schedule, not in the agent's session; the
  agent reads its verdict. Rolling back belongs to the pipeline or to the canary tool.

## Notes

- A canary tool compares with the previous version by itself
  ([canary-feature-flags](../canary-feature-flags/card.md)); this loop adds the check that the change happened.
- Beside [canary-feature-flags](../canary-feature-flags/card.md) and
  [health-checks-smoke](../health-checks-smoke/card.md), this loop decides what counts as worse (the previous
  version's level) and how long to wait before a result counts as red (a window counted in events).
- For a fixed error from the tracker, the signal is its Sentry issue
  ([error-tracking](../error-tracking/card.md)).

## Agent step

An investigator gets the snapshot of a window that did not confirm and returns a Diagnosis: which check failed, the
errors or the missing events that show it, and the likely cause. It never blocks; the verdict on the snapshot does.
