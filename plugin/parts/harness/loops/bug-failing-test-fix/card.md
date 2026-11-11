---
id: bug-failing-test-fix
title: "Bug → failing test → fix"
summary: "Red/green for a bug: the agent starts from a test that reproduces the bug and fails, changes the code until it passes, and runs the whole suite."
sensor: computational
ilities: [correctness, testability]
places: [remediation/work]
stages: [local]
speed: [seconds, minutes]
needs: []
agent: [explorer]
related: [reproduction-gate, red-green-tdd, exploratory-testing, agentic-manual-testing]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "write a failing test that reproduces it, then fix it"
---

## Why

A fix with no test that reproduced the bug is a guess: nothing shows that the bug was there or that the change removed
it. A test that fails before the fix and passes after it shows both. It stays in the suite, so the same bug cannot
come back unnoticed.

## How it works

1. The agent starts from a test that reproduces the bug and fails for the bug's reason: the reproduction from the
   [reproduction gate](../reproduction-gate/card.md) when the project has one, or a test it writes now. A test that
   passes before the fix does not reproduce the bug, and the agent rewrites it before touching the code.
2. It changes the code, not the test, until the test passes.
3. It runs the whole suite: a fix that turns the new test green and another test red is not done.
4. The test stays in the suite as a regression test.

This loop is to remediation what [red/green TDD](../red-green-tdd/card.md) is to delivery: the agent's own inner
loop. The reproduction gate is the check over it, in CI, out of the agent's reach.

## Set up

- **The instruction**, in CLAUDE.md or the template of a remediation task: "write a failing test that reproduces it,
  then fix it" (Claude Code best practices), then run the whole suite before saying done.
- **For a bug in a web app's UI**, the [`app-probing`](../../../app-probing/README.md) part first reproduces the bug
  in the running app, on the state a fixture creates and through Page Objects. The agent then writes the failing test
  on the same fixture and Page Objects.
- **When no automated test can catch the bug** (it is flaky, depends on the environment, or shows only in
  production), the agent says so in the task, reproduces it with a script or a recorded probe, and leaves the
  proof to the [release confirmation](../release-confirmation/card.md).
- **The other tests are not the agent's to change.** A PreToolUse hook denies its writes to existing test files
  during a remediation task; only the new reproduction is its own. The reproduction gate's guard checks the test diff
  in CI.
- **`run`** is the project's test command over the whole suite. It prints each failing test as `file:line: message`
  and exits non-zero while any test fails.
- **Cases.** Must fire: a copy of the code with the bug and its reproduction test; the fix in place with another test
  broken. Must pass: the same copy with the fix and every test green.
- **Wiring**: the agent runs `run` in its session, and a [Stop hook](../stop-hook/card.md) keeps the turn going
  while it is red.

## Notes

- At OpenAI the agent also records a video before and after the fix. For a UI bug, such a recording is evidence a
  reviewer can check without rerunning the scenario ([agent-audit-trail](../agent-audit-trail/card.md)).

## Agent step

An explorer reproduces the bug in the running app before the agent writes the test. It returns the steps the test
will follow and what it saw, as Findings. It does not block.
