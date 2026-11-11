---
id: remediation
title: "Remediation: from a problem to a fix confirmed in use"
entry: problem
phases: [entry, oracle, work, gate, release, confirmation]
exits: [confirmed, not-confirmed, inconclusive, mitigated]
---

# Remediation: from a problem to a fix confirmed in use

## Super-loop

A problem is seen: an error in production, an alert, a crash a fuzzer found, a report from a person. Before any fix,
a reproduction makes the problem fail on demand. The agent removes the cause until the reproduction passes and nothing
else has changed. The fix is released, and the problem counts as fixed only when the signal it was seen by is gone.

```
problem
  → oracle: a reproduction that fails, and the signal the problem was seen by
  → work: the fix
  → gate: the reproduction passes, it failed before the fix, the other tests are untouched
  → release
  → confirmation: the signal is gone, nothing else broke
      confirmed: done; the reproduction stays as a regression test
      not confirmed: back to the oracle, the reproduction missed the problem
```

## Oracle

The reproduction: a test, a script or a recorded scenario that fails the way the problem does. It has to fail before
the fix; one that passes before the fix reproduces nothing. The agent doing the fix may not weaken the other tests to
make the fix pass.

The signal the problem was seen by is part of the oracle too: the issue in the error tracker, the alert, the log
query. The confirmation watches it. When no test can reproduce the problem (it is flaky, depends on the environment,
or shows only in production), the signal is the whole oracle, and the confirmation carries all the weight.

## Phases

| Phase | What happens | Loop types |
|---|---|---|
| entry | A detector or a person brings the problem, and triage routes it here: the product does not do what it was specified to do, or what it did before | [triage](../loops/triage/card.md), [error-tracking](../loops/error-tracking/card.md), [slo-degradation](../loops/slo-degradation/card.md), [ai-judges-telemetry](../loops/ai-judges-telemetry/card.md), [fuzzing](../loops/fuzzing/card.md), [dast](../loops/dast/card.md), [security-review-agent](../loops/security-review-agent/card.md), [chaos-engineering](../loops/chaos-engineering/card.md), [backup-restore-rollback](../loops/backup-restore-rollback/card.md), [exploratory-testing](../loops/exploratory-testing/card.md), [sample-audit](../loops/sample-audit/card.md), [production-users](../loops/production-users/card.md), [docs-audit](../loops/docs-audit/card.md) |
| oracle | The problem is reproduced, and the reproduction fails | [reproduction-gate](../loops/reproduction-gate/card.md), [user-feedback](../loops/user-feedback/card.md), [fuzzing](../loops/fuzzing/card.md), [agentic-manual-testing](../loops/agentic-manual-testing/card.md), [browser-console-devtools](../loops/browser-console-devtools/card.md), [debugger-repl](../loops/debugger-repl/card.md), [structured-logs](../loops/structured-logs/card.md), [traces-opentelemetry](../loops/traces-opentelemetry/card.md), [scripted-model-tests](../loops/scripted-model-tests/card.md), [visual-stability-oracle](../loops/visual-stability-oracle/card.md); the `app-probing` part for a web app |
| work | The agent removes the cause | The inner loops: [bug-failing-test-fix](../loops/bug-failing-test-fix/card.md) for a bug; [profiling](../loops/profiling/card.md) for a slow path |
| gate | The reproduction passes, it failed before the fix, and the other tests were not changed | [reproduction-gate](../loops/reproduction-gate/card.md), [verification-subagent](../loops/verification-subagent/card.md), [agent-audit-trail](../loops/agent-audit-trail/card.md), [human-diff-review](../loops/human-diff-review/card.md) |
| release | The fix reaches production | [health-checks-smoke](../loops/health-checks-smoke/card.md), [risky-action-gates](../loops/risky-action-gates/card.md), [canary-feature-flags](../loops/canary-feature-flags/card.md), [changelog-audit](../loops/changelog-audit/card.md) |
| confirmation | The signal is gone for the window, and nothing else broke | [release-confirmation](../loops/release-confirmation/card.md), [canary-feature-flags](../loops/canary-feature-flags/card.md), [error-tracking](../loops/error-tracking/card.md), [slo-degradation](../loops/slo-degradation/card.md), [structured-logs](../loops/structured-logs/card.md), [metrics-promql](../loops/metrics-promql/card.md) |

## Gate

For every problem, the gate checks that it has a reproduction, that the reproduction failed before the fix and
passes after it, and that no other test changed. A reproduction that passed before the fix fails the gate: it does
not show that the problem was there. The final run is in CI. The loop is the
[reproduction gate](../loops/reproduction-gate/card.md).

## Confirmation

The same three checks as in [delivery](delivery.md#confirmation), with the second one turned around: the signal the
problem was seen by does not appear while the path it came from runs at least N times. A rare problem, seen once a
day, needs a window of days, or the result is `inconclusive`.

## Exits

| Exit | What it means | Where it goes |
|---|---|---|
| `confirmed` | The signal is gone for the window, and nothing else broke | Done; the reproduction stays as a regression test |
| `not-confirmed` | The signal is still there | Back to the oracle: the reproduction did not capture the problem |
| `inconclusive` | The path ran too few times in the window | A longer window, a synthetic run, or a person decides |
| `mitigated` | The service is restored without removing the cause: a rollback, a flag switched off, a restart | Stays open; the cause goes on from the oracle phase |

A mitigation and a fix are two exits for a reason: the first restores the service fast, the second removes the cause.
A postmortem goes to the harness level, not into this super-loop.

## Trace

For every problem: where it entered, its exit, and, when a recent change caused it, the super-loop and the phase that
let it through. A problem that a recent delivery introduced is a failure of that delivery too: its gate or its
confirmation missed it.

## When a project needs it

In every project that is in use. Without a detector at its entry, it starts only when a person notices; the first
detector is usually the error tracker, or a log query for errors by version.

## Sources

- Betsy Beyer et al., *Site Reliability Engineering* (O'Reilly, 2016), the chapter "Postmortem Culture: Learning from
  Failure".
- ITIL: incident management restores the service, problem management removes the cause.
- [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
  (OpenAI): a failing test that reproduces the bug, before the fix.
