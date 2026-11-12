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
related: [release-confirmation, health-checks-smoke, slo-degradation, triage, backup-restore-rollback, patch-backport]
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
  - title: "opencode update server: channel rollouts"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/update/README.md#L28-L60"
    author: "opencode (anomalyco)"
    note: "eligibility by publication time and a hash of the channel and the IP; no metric."
  - title: "opencode update server: the fallback and the compatibility floor"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/update/src/index.ts#L196-L232"
    author: "opencode (anomalyco)"
  - title: "opencode update server: Activate on an earlier build"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/update/src/index.ts#L330-L353"
    author: "opencode (anomalyco)"
  - title: "gemini-cli Release: Promote: stable is the commit of the previous preview"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-promote.yml#L84-L131"
    author: "gemini-cli (Google)"
  - title: "gemini-cli Release: Promote: tests on every channel's commit"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-promote.yml#L159-L213"
    author: "gemini-cli (Google)"
  - title: "gemini-cli release confidence: the go/no-go checklist"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/docs/release-confidence.md#L141-L168"
    author: "gemini-cli (Google)"
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

Software that users install has no traffic to split. Its canary is a release channel, such as gemini-cli's `preview`
npm tag, out for a week before it becomes stable, or a staged rollout through the update server. In opencode's, each
channel has a rollout duration, a client's place in it is a SHA-256 of the channel and its IP, "Each IP keeps the
same rollout position across releases", and a client not yet eligible gets "the newest eligible artifact published
before it". The analysis is the same: the new version's error and crash rates, as its clients report them with
their version, against the previous version's.

## Set up

- **A rollout tool and a metrics provider**: Argo Rollouts or Flagger in the cluster, and the provider their analysis
  queries, such as Prometheus.
- **What counts as worse** is the project's decision, written in the analysis template: the canary's error rate and
  p95 latency, compared with the stable version's where the query can do so (the canary's error rate no more than
  0.5 points above the stable's), and with an absolute limit where it cannot. Each step runs for at least 3
  measurements: fewer judge noise.
- **For installed software, time is the soak, not the verdict.** A rollout step or a promotion goes ahead when the
  soak time has passed and the analysis passes; a failed analysis sends clients back to the previous build without
  a person. opencode's update server advances on time alone, and its rollback is a person pressing "Activate" on an
  earlier build; gemini-cli's go/no-go for stable is a checklist in a doc ("no spikes in errors" on a dashboard),
  and the verdict is written nowhere. Compute the verdict in the run and write it, with its measurements, into the
  release's record. Promote the exact commit that soaked: gemini-cli takes the commit of the previous preview tag as
  stable and runs its tests on every channel's commit before publishing. On a rollback, never send a client below
  the version it needs: opencode, "A rollout must not send an identified client back below its compatibility floor".
- **Flags.** A flag service with release flags for new behaviour and kill switches for features that can be turned off
  in an incident. Write in the runbook who turns each kill switch off and on which alert.
- **The agent gets the result.** The deploy pipeline saves the analysis run of a failed rollout (its measurements per
  metric) and the canary's version into the release's record, where the agent reads it.
- **`run`** judges a saved analysis run and prints one line per metric, `<metric>: <status>`, where the status is
  `passed`, `failed (<n> of <m> measurements, condition <condition>)` or `inconclusive`, and a last line
  `rollout: promoted` or `rollout: aborted`. For a channel, it also prints `commit: <sha>`, and fails when that is not
  the commit the channel soaked. It exits non-zero on anything but every metric `passed`.
- **Cases** are recorded analysis runs. Must fire: three measurements of the success rate under 0.95; an inconclusive
  run, which Argo Rollouts reaches when the failure limit is not violated and the success limit is not met; a
  promotion with the soak time passed and no analysis; a promotion of a commit newer than the one that soaked. Must
  pass: a successful run with every measurement within its condition.
- **Out of the agent's reach.** The rollout runs in the cluster, not in the agent's session. The agent's credentials
  do not let it promote a rollout or skip an analysis, and changes to the analysis templates go through review.
  Rolling back belongs to the rollout tool.

## Notes

- The canary tool judges the version; it does not check that the change happened or that its own signal appeared.
  [release-confirmation](../release-confirmation/card.md) adds those checks after the rollout.
