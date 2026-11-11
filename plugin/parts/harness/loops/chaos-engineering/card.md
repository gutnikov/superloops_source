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
related: [fault-injection, slo-degradation, backup-restore-rollback]
links:
  - title: "Principles of Chaos Engineering"
    url: "https://principlesofchaos.org/"
    note: "steady state, a hypothesis, real-world events, a small blast radius."
  - title: "Simulate Pod Faults"
    url: "https://chaos-mesh.org/docs/simulate-pod-chaos-on-kubernetes/"
    author: "Chaos Mesh"
    note: "PodChaos: pod-kill, pod-failure, container-kill; mode, selector, duration."
  - title: "Define Scheduling Rules"
    url: "https://chaos-mesh.org/docs/define-scheduling-rules/"
    author: "Chaos Mesh"
  - title: "Resilience Probes"
    url: "https://docs.litmuschaos.io/docs/concepts/probes"
    author: "LitmusChaos"
---

## Why

A recovery mechanism that has never been tested is an assumption: a second replica, a retry, a failover. Tests in CI
do not kill pods or zones, so a missing mechanism stays hidden until a real outage. Killing them on purpose in
staging, and reading the alerts and SLOs, shows which mechanism is missing before users depend on it.

## How it works

Each experiment is a hypothesis about the steady state, a measurable output of the system, under one fault: "the
share of failed checkout requests stays under 1% while one `checkout` pod is killed". A job injects the fault in
staging under load and saves a snapshot: the steady-state measure before, during and after the fault, and the alerts
that fired. `run` judges the snapshot. A broken steady state means a recovery mechanism is missing: an investigator
reads the snapshot with the alerts and SLOs and names it. The finding enters remediation through
[triage](../triage/card.md), and the experiment is its reproduction: the fix counts once the experiment holds its
steady state ([reproduction-gate](../reproduction-gate/card.md)).

## Set up

- **Experiments as code**, next to the deploy manifests: a Chaos Mesh `PodChaos` with `action: pod-kill` (it "kills
  a specified Pod"), `pod-failure` (the Pod is unavailable for a while) or `container-kill`, or a LitmusChaos
  experiment. Each names its target by `selector` and `mode` (`one` picks one random eligible Pod) and sets a
  `duration`: without one, Chaos Mesh keeps the fault on until the experiment is paused or deleted.
- **The steady state is a query**: the SLI of the service's SLO ([slo-degradation](../slo-degradation/card.md)),
  with the limit written in the experiment. LitmusChaos runs such a check as a `promProbe`, which runs a Prometheus
  query and matches the result against a condition; a fault passes only when every probe passes.
- **Traffic during the fault.** A steady state with no traffic shows nothing. The job runs a load generator or
  replays traffic ([load-testing](../load-testing/card.md)); with fewer requests than the experiment names, the
  result is `inconclusive`.
- **Staging, one fault at a time.** The Principles of Chaos prefer production ("Chaos strongly prefers to experiment
  directly on production traffic."); this loop starts in staging, with one pod or one zone per experiment. Moving an
  experiment to production is a person's decision under H2, recorded in the loop's `LOOP.md`.
- **On a schedule.** A Chaos Mesh `Schedule` creates the experiment from a cron expression, and by default
  (`concurrencyPolicy: Forbid`) never runs two at once. Run each experiment weekly and after every change to the
  service's deploy manifests: that is where a replica count or a probe goes missing.
- **The `run`** prints one line per experiment, `<experiment>: <status>`: `steady`, `steady state broken (5xx 7.2% >
  1% at +1m40s)`, `not recovered 5m after the fault`, `inconclusive (40 requests of 1000)`. It exits non-zero for
  anything but `steady`.
- **The cases are recorded snapshots.** Must fire: the 5xx share over the limit during the fault; the service still
  degraded five minutes after the fault ends; too little traffic. Must pass: a pod killed, the share under the limit
  throughout, recovery within the window.
- **Out of the agent's reach.** The job runs in the staging pipeline, not in the agent's session. Experiments and
  their limits change only through review: the agent fixing the service cannot loosen the hypothesis that caught it,
  and a new limit is a threshold a person approves (H5).

## Notes

- Principles of Chaos: "Start by defining ‘steady state’ as some measurable output of a system that indicates normal
  behavior." On the blast radius: "Experimenting in production has the potential to cause unnecessary customer
  pain."
- [fault-injection](../fault-injection/card.md) is the same idea for one dependency in a test, locally and in CI;
  this loop covers what only the platform has: replicas, probes, failover.

## Agent step

An investigator gets the snapshot of an experiment that did not hold, with the alerts that fired and the SLO over the
window, and returns a Diagnosis: the recovery mechanism that is missing (a single replica, a client with no retry, a
readiness probe that never fails), the evidence, and the next step. It never blocks; the `run` does.
