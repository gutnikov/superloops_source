---
id: delivery
title: "Delivery: from an idea to a change confirmed in use"
entry: idea
phases: [entry, oracle, work, gate, release, confirmation]
exits: [confirmed, not-confirmed, inconclusive, dropped]
---

# Delivery: from an idea to a change confirmed in use

## Super-loop

An idea or a requirement becomes an approved spec and acceptance tests that fail. The agent works until they pass.
The change is released, and it counts as delivered only when the place where it is used shows that it happened and
broke nothing.

```
idea
  → oracle: the spec approved, acceptance tests red
  → work
  → gate: every requirement's tests green
  → release: deployed, the flag switched on
  → confirmation: the change is there, it happened, nothing broke
      confirmed: done
      not confirmed: roll back or switch the flag off → remediation
```

## Oracle

The approved spec and the acceptance tests derived from it ([acceptance-loop](../loops/acceptance-loop/card.md)).
A person approves the spec. The tests fail before the work, or they test nothing. The agent doing the work cannot
change either of them: a change to an example goes through the spec and a new approval.

For each requirement, the spec also says how the change shows where it is used: the event, metric or log line it
produces, and the window to watch it for. With the `spec` part, that is the requirement's `prod`, and
`specs.py signals` hands the signals of a release to its confirmation.

## Phases

| Phase | What happens | Loop types |
|---|---|---|
| entry | An idea, a ticket or a requirement arrives, and triage routes it here: the behaviour is to change | [triage](../loops/triage/card.md), [production-users](../loops/production-users/card.md) |
| oracle | The spec with examples is approved, and acceptance tests derived from it fail | [acceptance-loop](../loops/acceptance-loop/card.md), [interview](../loops/interview/card.md), [task-restatement](../loops/task-restatement/card.md), [plan-approval](../loops/plan-approval/card.md), [human-acceptance-criteria](../loops/human-acceptance-criteria/card.md), [spec-check](../loops/spec-check/card.md), [choose-from-options](../loops/choose-from-options/card.md), [user-feedback](../loops/user-feedback/card.md) |
| work | The agent changes the product | The inner loops: [build](../loops/build/card.md), [type-check](../loops/type-check/card.md), [lint-with-fix-instructions](../loops/lint-with-fix-instructions/card.md), [red-green-tdd](../loops/red-green-tdd/card.md), [e2e-browser](../loops/e2e-browser/card.md), [agent-code-review](../loops/agent-code-review/card.md), [stop-hook](../loops/stop-hook/card.md), [progress-file-feature-list](../loops/progress-file-feature-list/card.md), [stall-detector](../loops/stall-detector/card.md), [approval-reviewer-agent](../loops/approval-reviewer-agent/card.md), [test-admission](../loops/test-admission/card.md) and the others |
| gate | Every approved requirement's tests pass, and the spec and the tests are the approved ones | [acceptance-loop](../loops/acceptance-loop/card.md), [verification-subagent](../loops/verification-subagent/card.md), [contract-tests](../loops/contract-tests/card.md), [ux-evaluator](../loops/ux-evaluator/card.md), [agent-audit-trail](../loops/agent-audit-trail/card.md), [result-demo](../loops/result-demo/card.md), [human-diff-review](../loops/human-diff-review/card.md) |
| release | The change reaches production through the stands on the way: deployed, a flag switched on, rolled out step by step | [preview-environments](../loops/preview-environments/card.md), [health-checks-smoke](../loops/health-checks-smoke/card.md), [dast](../loops/dast/card.md), [lighthouse-ci](../loops/lighthouse-ci/card.md), [load-testing](../loops/load-testing/card.md), [exploratory-testing](../loops/exploratory-testing/card.md), [risky-action-gates](../loops/risky-action-gates/card.md), [canary-feature-flags](../loops/canary-feature-flags/card.md), [terminal-ui-tmux](../loops/terminal-ui-tmux/card.md), [changelog-audit](../loops/changelog-audit/card.md), [translation-sync](../loops/translation-sync/card.md), [shipped-artifact-check](../loops/shipped-artifact-check/card.md), [release-trust-boundary](../loops/release-trust-boundary/card.md) |
| confirmation | Production shows that the change happened and broke nothing | [release-confirmation](../loops/release-confirmation/card.md), [canary-feature-flags](../loops/canary-feature-flags/card.md), [error-tracking](../loops/error-tracking/card.md), [structured-logs](../loops/structured-logs/card.md), [metrics-promql](../loops/metrics-promql/card.md), [slo-degradation](../loops/slo-degradation/card.md), [production-users](../loops/production-users/card.md) |

## Gate

The gate checks what only the whole can show, before the release. Every approved requirement is traced to at least
one acceptance test. Each of those tests failed before the work and passes after it. The spec and the tests are the
ones a person approved. The final run is in CI, where the agent cannot write. This is the gate of the acceptance
loop; passing it means the change is ready to release, not that it works.

## Confirmation

Clean logs do not confirm a change: a feature behind a flag that is off, or a path nobody takes, leaves the logs
clean too. The confirmation is three checks over a window:

1. **The change is there.** Production runs the version with the change. Behind a flag, the flag is on for the
   audience the change is for. In a staged rollout (1% → 10% → 100%), every step has its own window.
2. **The change happened.** The event, metric or log line that the spec names for the requirement appears at least
   N times.
3. **Nothing broke.** There are no new errors with this version, and the error rate and latency are no worse than
   the previous version's. The comparison is with the previous version, not with zero: production always has
   background errors. For this, every log line and every error carries the version.

The window is counted in events, not in minutes: at least T minutes and at least N events on the changed path, up to
a cap. Twenty minutes in which the new path ran three times prove nothing. At the cap with too few events, the result
is `inconclusive`, and then a synthetic run of the scenario in production or a person decides. A nightly job's window
is its next run; a mobile release's window is the sessions on the new version over several days.

The loop that does all this is [release-confirmation](../loops/release-confirmation/card.md). It runs
where the agent doing the work cannot reach: in the deploy pipeline, or in a job after it. The job waits for the
window to end, saves a snapshot of it into a directory (the errors, logs and metrics of the old and
the new version), and the confirmation judges the snapshot. That keeps it a loop like any other: recorded windows are
its must-fire and must-pass cases. Rolling back is the job of the pipeline or of the canary tool: in the default
policy, anything that touches production goes through a person (H2).

## Exits

| Exit | What it means | Where it goes |
|---|---|---|
| `confirmed` | All three checks pass for every requirement | Done |
| `not-confirmed` | The old version still runs, the change did not happen, or something broke | Roll back or switch the flag off, then remediation, with the snapshot as evidence |
| `inconclusive` | The window reached its cap with too few events | A synthetic run in production, or a person decides |
| `dropped` | The spec was not approved, or the idea was withdrawn | Discovery, or closed |

## Trace

For every requirement: its exit, the phase where a failure was caught, and the evidence. A requirement whose gate
passed and whose confirmation did not says that a phase before the gate lacks a check; the
[harness level](harness-level.md) finds which.

## When a project needs it

In every project that changes what its product does. It ends at the last stage the project has and the agent can
read: production with its logs for a service, a published version for a library, a store release with its crash
reports for a mobile app. Where the agent cannot read that stage, a person confirms.

## Sources

- Steve Freeman, Nat Pryce, *Growing Object-Oriented Software, Guided by Tests* (Addison-Wesley, 2009): an outer
  acceptance test that fails first, around the inner loop of unit tests.
- James Governor, *Towards Progressive Delivery* (RedMonk, 2018): releasing step by step, with a check at every step.
- Netflix and Google, Kayenta (2018): automated canary analysis that judges a release against the previous version
  running beside it, not against fixed thresholds.
