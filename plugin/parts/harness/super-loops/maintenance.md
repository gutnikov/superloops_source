---
id: maintenance
title: "Maintenance: from a trigger to an improvement users do not notice"
entry: trigger
phases: [entry, oracle, work, gate, release, confirmation]
exits: [confirmed, not-confirmed, inconclusive, behaviour-changed]
---

# Maintenance: from a trigger to an improvement users do not notice

## Super-loop

Something other than the product's behaviour asks for a change: a new version of a dependency, a runtime at its end
of life, a vulnerability, a measure over its budget, a schedule for clean-up. The agent changes the code so that users
notice nothing and a measure gets better. The change is released, and it counts as done when production behaves as
before and the measure has improved.

```
trigger
  → oracle: the behaviour as it is, and the measure's current value
  → work
  → gate: the tests pass with their expected values unchanged, and the measure improved
  → release
  → confirmation: production behaves as before, and the measure improved
      confirmed: done
      not confirmed: roll back → remediation
  an expected value had to change → back to triage: this is delivery or remediation
```

## Oracle

The behaviour as it is: the existing tests with their expected values, and the current value of the measure the
change should improve (the age of a dependency, the number of known vulnerabilities, coupling, the bundle size,
latency). The agent may change how a test reaches the code, such as a mock or a setup, but not what the test expects.

Where the tests do not cover the code the change touches, the oracle is weak. Characterization tests come first then:
they record what the code does now ([approved-fixtures](../loops/approved-fixtures/card.md)).

## Phases

| Phase | What happens | Loop types |
|---|---|---|
| entry | A trigger arrives: a schedule, a release of a dependency, an end of life, a vulnerability, a measure over its budget | [triage](../loops/triage/card.md), [dependency-updates](../loops/dependency-updates/card.md), [dependency-scanning-sbom](../loops/dependency-scanning-sbom/card.md), [coupling-analysis](../loops/coupling-analysis/card.md), [garbage-collection](../loops/garbage-collection/card.md), [knowledge-base-doc-lint](../loops/knowledge-base-doc-lint/card.md), [compliance-mutants](../loops/compliance-mutants/card.md) |
| oracle | The baseline is recorded: the tests that must stay as they are, and the measure's current value | [behaviour-invariance](../loops/behaviour-invariance/card.md), [run-tests-first](../loops/run-tests-first/card.md), [approved-fixtures](../loops/approved-fixtures/card.md), [code-coverage](../loops/code-coverage/card.md), [mutation-testing](../loops/mutation-testing/card.md), [benchmarks-vs-baseline](../loops/benchmarks-vs-baseline/card.md), [coupling-analysis](../loops/coupling-analysis/card.md) |
| work | The agent changes the code | The inner loops |
| gate | The tests pass with their expected values unchanged, and the measure improved | [behaviour-invariance](../loops/behaviour-invariance/card.md), [verification-subagent](../loops/verification-subagent/card.md), [api-breaking-changes](../loops/api-breaking-changes/card.md), [contract-tests](../loops/contract-tests/card.md), [db-migration-lint](../loops/db-migration-lint/card.md), [agent-audit-trail](../loops/agent-audit-trail/card.md), [human-diff-review](../loops/human-diff-review/card.md) |
| release | The change reaches production | [health-checks-smoke](../loops/health-checks-smoke/card.md), [load-testing](../loops/load-testing/card.md), [risky-action-gates](../loops/risky-action-gates/card.md), [canary-feature-flags](../loops/canary-feature-flags/card.md), [changelog-audit](../loops/changelog-audit/card.md) |
| confirmation | Production behaves as the previous version did, and the measure improved where it is measured | [release-confirmation](../loops/release-confirmation/card.md), [canary-feature-flags](../loops/canary-feature-flags/card.md), [error-tracking](../loops/error-tracking/card.md), [slo-degradation](../loops/slo-degradation/card.md), [structured-logs](../loops/structured-logs/card.md), [metrics-promql](../loops/metrics-promql/card.md), [perf-budgets-telemetry](../loops/perf-budgets-telemetry/card.md) |

## Gate

For every change, the gate checks whether any test's expected value changed, whether the tests pass, and whether the
measure improved against its baseline. A changed expected value fails the gate whatever the reason, and the work goes
back to triage. The final run is in CI. The loop is
[behaviour-invariance](../loops/behaviour-invariance/card.md).

## Confirmation

The three checks of [delivery](delivery.md#confirmation), with the second one replaced: no new event should appear;
instead, the product's own events and errors stay at the previous version's level over the same window. Where the
measure shows in production, such as latency or memory, it is compared with the previous version too.

## Exits

| Exit | What it means | Where it goes |
|---|---|---|
| `confirmed` | Production behaves as before, and the measure improved | Done |
| `not-confirmed` | Production behaves differently | Roll back, then remediation |
| `inconclusive` | Too few events in the window | A synthetic run, or a person decides |
| `behaviour-changed` | The gate found a changed expected value | Back to triage: delivery if the new behaviour is wanted, remediation if the old one was wrong |

## Trace

For every change: the trigger, the exit, and whether the gate caught a change of behaviour. Repeated
`behaviour-changed` exits from one source, such as a dependency bot, say that triage routes too much here.

## When a project needs it

In every project with dependencies, a runtime or a codebase that ages. Its entry is usually a bot, such as Renovate
or Dependabot, or a schedule.

## Notes

- This is the super-loop most likely to run without a person: at OpenAI, the pull requests of
  [garbage collection](../loops/garbage-collection/card.md) were merged automatically. That is why its gate checks
  the behaviour itself and does not rely on a review: a change of behaviour routed here would reach users with nobody
  approving it.
- ISO/IEC 14764 calls this adaptive, perfective and preventive maintenance; corrective maintenance is
  [remediation](remediation.md).

## Sources

- Martin Fowler, *Refactoring* (2nd edition, Addison-Wesley, 2018): changing the structure without changing the
  behaviour, with the tests as the check.
- Michael Feathers, *Working Effectively with Legacy Code* (Prentice Hall, 2004): characterization tests that record
  what the code does before it is changed.
- ISO/IEC 14764, *Software Engineering — Software Life Cycle Processes — Maintenance*.
