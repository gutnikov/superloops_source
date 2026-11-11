---
id: run-tests-first
title: "Run the tests first"
summary: "Before changing anything the agent runs the whole suite. It learns the state of the project and which tests already fail, so later it does not mistake them for its own regressions."
sensor: computational
ilities: [testability]
places: [delivery/work, remediation/work, maintenance/oracle]
stages: [task, local]
speed: [minutes]
needs: []
related: [isolated-environment, behaviour-invariance, ci-clean-infra]
links:
  - title: "First run the tests — Agentic Engineering Patterns"
    url: "https://simonwillison.net/guides/agentic-engineering-patterns/first-run-the-tests/"
    author: "Simon Willison"
  - title: "Simon Willison's playbook for working with coding agents"
    url: "https://ai.sulat.com/simon-willisons-playbook-for-working-with-coding-agents-d56ccd3f959f"
  - title: "Retries"
    url: "https://playwright.dev/docs/test-retries"
    author: "Playwright"
  - title: "Managing pytest's output"
    url: "https://docs.pytest.org/en/stable/how-to/output.html"
    author: "pytest"
---

## Why

An agent that has not run the suite before it changes anything cannot tell the failures it caused from the ones
that were already there. It then spends time on tests it did not break, or takes a real regression for an old
failure. One run before it changes anything gives it the baseline to compare with.

## How it works

Before it changes anything, the agent runs the whole suite and keeps the per-test result as the baseline. After its
change it runs the suite again and compares test by test:

- a test that passed and now fails is its regression, and it fixes it;
- a test that failed in the baseline and still fails is not its doing: it names it in its report and leaves it,
  unless the task is to fix it;
- a known flaky test that fails is retried, and counts as a failure only if it fails every retry.

In maintenance the baseline is the oracle, the behaviour as it is: the change must leave every result as it was
([behaviour-invariance](../behaviour-invariance/card.md)).

## Set up

- **One command runs the suite and writes a per-test report**, such as JUnit XML (`pytest --junit-xml=path`). The
  command is in CLAUDE.md or AGENTS.md; Simon Willison's prompt "First run the tests" "forces it to figure out how to
  run the tests" when it is not.
- **A green main branch.** When the baseline on a clean checkout of main has failures, the agent reports them before
  it starts. They go to [triage](../triage/card.md) as a problem of their own, not into the agent's task.
- **A list of known flaky tests** in the repository, at a path the loop's `LOOP.md` names, with retries for them only.
  Playwright counts a test that "failed on the first run, but passed when retried" as `flaky`; a test flaky in two
  runs goes on the list. The agent cannot add to the list: a PreToolUse hook denies its writes to it, and a person
  reviews additions.
- **A suite too slow to run whole** before every task: the agent runs the tests of the area it will change as its
  local baseline, and the comparison in CI uses main's last full run for the rest.
- **`run`** compares two reports and prints one line per test whose status differs or still fails,
  `<test id>: <status>`: `new failure`, `failing in the baseline`, `flaky: passed on retry`, `fixed`. The exit is
  non-zero on any `new failure`.
- **Cases.** Must fire: a pair of reports where a test that passed now fails. Must pass: a pair where only a test that
  failed in the baseline still fails; a pair where a listed flaky test failed once and passed on retry.
- **Wiring.** The task's first step runs the baseline: a line in CLAUDE.md, or a SessionStart hook when the suite takes
  seconds. A Stop hook runs the comparison at the end of the turn. The CI job compares with the run on the base
  commit, which the agent cannot change, so it cannot hide a regression in its own baseline.
