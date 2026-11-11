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
related: [release-confirmation, health-checks-smoke, slo-degradation, triage]
links:
  - title: "Analysis & Progressive Delivery"
    url: "https://argo-rollouts.readthedocs.io/en/stable/features/analysis/"
    author: "Argo Rollouts"
  - title: "Deployment Strategies"
    url: "https://docs.flagger.app/usage/deployment-strategies"
    author: "Flagger"
  - title: "Feature flags"
    url: "https://docs.getunleash.io/reference/feature-toggles"
    author: "Unleash"
    note: "flag types, among them the release flag and the kill switch."
---

## Why

Some faults show only in production, after every earlier check has passed. This loop catches a release that performs
worse there and undoes it without waiting for a person. A feature flag does the same for one feature inside a release
that is otherwise fine.

## How it works

1. The new version gets a small share of the traffic, and the share grows step by step. In Flagger, `stepWeight` is
   the "canary increment step", `maxWeight` the "max traffic percentage routed to canary", and the analysis runs every
   `interval` (60 s by default).
2. At each step an analysis queries the canary's metrics. In Argo Rollouts, an AnalysisTemplate with
   `successCondition: result[0] >= 0.95` and `failureLimit: 3` means: "If the metric is measured to be less than 95%,
   and there are three such measurements, the analysis is considered Failed." Flagger checks the request success rate
   and latency, and counts failed checks up to `threshold`, the "max number of failed metric checks before rollback".
3. A failed analysis rolls the release back. In Argo Rollouts, "The failed analysis causes the Rollout to abort,
   setting the canary weight back to zero"; Flagger will "route all traffic to primary" and "scale to zero the canary
   deployment and mark it as failed".
4. The agent gets the failed analysis: the canary's version, the metric that failed and its measurements. It opens a
   remediation item through [triage](../triage/card.md), with the failed analysis as its signal.

New behaviour also ships behind a release flag, which Unleash describes as one to "Manage the release of new or
incomplete features", turned on for a growing share of users. A kill switch, a flag to "Gracefully degrade system
functionality", turns a feature off without a deploy. The canary rolls back a version; a flag turns off a feature.

## Set up

- **A rollout tool and a metrics provider**: Argo Rollouts or Flagger in the cluster, and the provider their analysis
  queries, such as Prometheus.
- **What counts as worse** is the project's decision, written in the analysis template: the canary's error rate and
  p95 latency, compared with the stable version's where the query can do so (the canary's error rate no more than
  0.5 points above the stable's), and with an absolute limit where it cannot. Each step runs for at least 3
  measurements: fewer judge noise.
- **Flags.** A flag service with release flags for new behaviour and kill switches for features that can be turned off
  in an incident. Write in the runbook who turns each kill switch off and on which alert.
- **The agent gets the result.** The deploy pipeline saves the analysis run of a failed rollout (its measurements per
  metric) and the canary's version into the release's record, where the agent reads it.
- **`run`** judges a saved analysis run and prints one line per metric, `<metric>: <status>`, where the status is
  `passed`, `failed (<n> of <m> measurements, condition <condition>)` or `inconclusive`, and a last line
  `rollout: promoted` or `rollout: aborted`. It exits non-zero on anything but every metric `passed`.
- **Cases** are recorded analysis runs. Must fire: three measurements of the success rate under 0.95; an inconclusive
  run, which Argo Rollouts reaches when the failure limit is not violated and the success limit is not met. Must pass: a
  successful run with every measurement within its condition.
- **Out of the agent's reach.** The rollout runs in the cluster, not in the agent's session. The agent's credentials
  do not let it promote a rollout or skip an analysis, and changes to the analysis templates go through review.
  Rolling back belongs to the rollout tool.

## Notes

- The canary tool judges the version; it does not check that the change happened or that its own signal appeared.
  [release-confirmation](../release-confirmation/card.md) adds those checks after the rollout.
