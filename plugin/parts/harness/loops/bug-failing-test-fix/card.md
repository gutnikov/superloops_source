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
related: [reproduction-gate, red-green-tdd, debugger-repl, exploratory-testing, agentic-manual-testing, coupling-analysis]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "write a failing test that reproduces it, then fix it"
  - title: "diagnosing-bugs: a regression test only at a correct seam"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/SKILL.md#L114-L138"
    author: "skills (Matt Pocock)"
    note: "no correct seam is the finding; re-run the un-minimised scenario; the hypothesis in the commit message."
  - title: "systematic-debugging: root cause before any fix"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/systematic-debugging/SKILL.md#L14-L20"
    author: "superpowers (obra)"
---

## Why

A fix with no test that reproduced the bug is a guess: nothing shows that the bug was there or that the change removed
it. A test that fails before the fix and passes after it shows both. It stays in the suite, so the same bug cannot
come back unnoticed.

## How it works

1. The agent starts from the reproduction: red on the reported symptom and shrunk until every part of it is needed
   ([reproduction gate](../reproduction-gate/card.md)). Its cause is found before any fix (superpowers: "NO FIXES
   WITHOUT ROOT CAUSE INVESTIGATION FIRST"), with [debugger-repl](../debugger-repl/card.md) where values decide it.
2. It picks the seam: one where the test exercises the bug as it happens at the call site. Pocock: "If the only
   available seam is too shallow (single-caller test when the bug needs multiple callers ...), a regression test
   there gives false confidence." With no such seam the agent writes no test there and records `no correct seam:
   <why>` in the task: the design keeps the bug from being locked down, and that is a finding for
   [coupling-analysis](../coupling-analysis/card.md), not a reason to test somewhere shallower.
3. It turns the shrunk reproduction into a test at that seam and sees it fail for the bug's reason. A test that
   passes before the fix does not reproduce the bug, and the agent rewrites it before touching the code.
4. It changes the code, not the test, until the test passes.
5. It re-runs the original, unshrunk reproduction: a cut can remove a second cause, and then the small test passes
   while the reported bug remains.
6. It runs the whole suite: a fix that turns the new test green and another test red is not done.
7. The test stays in the suite as a regression test, and the commit message names the cause that turned out right,
   so the next person debugging this code starts from it.

This loop is to remediation what [red/green TDD](../red-green-tdd/card.md) is to delivery: the agent's own inner
loop. The reproduction gate is the check over it, in CI, out of the agent's reach.

## Set up

- **The instruction**, in CLAUDE.md or the template of a remediation task: "write a failing test that reproduces it,
  then fix it" (Claude Code best practices), at a seam that exercises the real bug, then re-run the original
  reproduction and the whole suite before saying done.
- **For a bug in a web app's UI**, the [`app-probing`](../../../app-probing/README.md) part first reproduces the bug
  in the running app, on the state a fixture creates and through Page Objects. The agent then writes the failing test
  on the same fixture and Page Objects.
- **When no automated test can catch the bug** (it is flaky, depends on the environment, or shows only in
  production), the agent says so in the task, reproduces it with a script or a recorded probe, and leaves the
  proof to the [release confirmation](../release-confirmation/card.md). This differs from `no correct seam`: there
  a test could catch the bug, and the code's shape is what stops it.
- **The other tests are not the agent's to change.** A PreToolUse hook denies its writes to existing test files
  during a remediation task; only the new reproduction is its own. The reproduction gate's guard checks the test diff
  in CI.
- **`run`** is the project's test command over the whole suite, then the original reproduction's command. It prints
  each failing test as `file:line: message` and exits non-zero while any test or the reproduction fails.
- **Cases.** Must fire: a copy of the code with the bug and its reproduction test; the fix in place with another test
  broken; a fix that turns the shrunk test green while the original reproduction still fails. Must pass: the same
  copy with the fix and every test green.
- **Wiring**: the agent runs `run` in its session, and a [Stop hook](../stop-hook/card.md) keeps the turn going
  while it is red.

## Notes

- At OpenAI the agent also records a video before and after the fix. For a UI bug, such a recording is evidence a
  reviewer can check without rerunning the scenario ([agent-audit-trail](../agent-audit-trail/card.md)).

## Agent step

An explorer reproduces the bug in the running app before the agent writes the test. It returns the steps the test
will follow and what it saw, as Findings. It does not block.
