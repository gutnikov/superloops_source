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
related: [release-confirmation, metrics-promql, traces-opentelemetry, triage]
links:
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "Alerting on SLOs"
    url: "https://sre.google/workbook/alerting-on-slos/"
    author: "Google, The Site Reliability Workbook"
    note: "burn rate; multiwindow, multi-burn-rate alerts and their parameters for a 99.9% SLO."
  - title: "Sloth"
    url: "https://sloth.dev/introduction/"
    note: "Prometheus recording rules and burn-rate alerts generated from an SLO spec."
  - title: "Alertmanager configuration"
    url: "https://prometheus.io/docs/alerting/latest/configuration/"
    author: "Prometheus"
    note: "webhook_config and the JSON it posts."
---

## Why

Latency, error rates and availability can get worse with no single failure to report, and checks before the release
never see production traffic. An SLO turns that drift into a line that is either crossed or not. A crossed SLO is
a signal to start remediation, and the SLO is a measure to confirm a release.

## How it works

Each SLO is the share of good events among all events over a window, with an objective such as 99.9% over 30 days.
The SLO degrades when the service spends its error budget too fast; in the SRE workbook's words, "Burn rate is how
fast, relative to the SLO, the service consumes the error budget." A burn-rate alert starts an investigator. It
follows the SLO to its cause through logs, traces and recent deploys, and returns a Diagnosis with a proposed fix.
The fix goes through [triage](../triage/card.md) into remediation like any other problem, and counts once the burn
rate under the new version is back below 1 ([release-confirmation](../release-confirmation/card.md)).

## Set up

- **SLOs as code.** One spec per service: the SLI as a query of bad and of total events, the objective, the window.
  Sloth generates the Prometheus recording rules and the multiwindow, multi-burn-rate alerts from such a spec
  (`sloth generate -i <spec>.yml`).
- **Degradation is a burn-rate alert.** Start from the workbook's parameters for a 99.9% SLO, where an alert fires
  only when both windows are over the burn rate:

  | Severity | Long window | Short window | Burn rate | Budget spent |
  |---|---|---|---|---|
  | Page | 1 hour | 5 minutes | 14.4 | 2% |
  | Page | 6 hours | 30 minutes | 6 | 5% |
  | Ticket | 3 days | 6 hours | 1 | 10% |

  A page starts the investigator at once; a ticket goes to triage.
- **How the agent hears of it.** An Alertmanager `webhook_config` receiver posts each alert group as JSON (`status`,
  `firing` or `resolved`, and the alerts with their labels and annotations) to the endpoint that starts the
  investigator's session.
- **Read-only access** to the metrics, the logs, the traces and the deploy history. The agent proposes; it does not
  roll back or change production (H2).
- **The `run`** judges a snapshot of the burn rates that a job saves from Prometheus: one line per SLO, `<slo>:
  <status>`: `ok (burn 0.4 over 1h)`, `fast burn (16.2 over 1h, 15.0 over 5m)`, `slow burn (1.3 over 3d, 1.1 over
  6h)`, `no data`. It exits non-zero for anything but `ok`. `no data` counts: an SLI that stops reporting hides the
  next degradation.
- **The cases are recorded snapshots.** Must fire: a fast burn; a slow burn; an SLI with no data. Must pass: burn
  rates under 1 in every window; a five-minute spike that the long window does not confirm.
- **Out of the agent's reach.** The SLO specs and the alert rules change only through review, and an objective is a
  reference a person approves (H5). The agent cannot silence an alert or lower an objective to end a degradation.

## Notes

- Böckeler lists this among the runtime feedback agents could monitor: "having them look for degrading SLOs to make
  suggestions how to improve them".

## Agent step

An investigator gets the alert (the SLO, its burn rates, when the burn started), the deploys in that window, and
read access to the logs and traces. It follows the SLO to its cause and returns a Diagnosis: the cause, the evidence
(the deploy, the query, the trace), and the proposed fix as `next`. It never blocks.
