---
id: stop-hook
title: "Stop hook / `/goal`"
summary: "When the agent tries to end its turn, a hook runs the check and sends the agent back to work while it fails; `/goal` does the same with a model that judges the transcript."
sensor: computational
ilities: [correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local]
speed: [seconds, minutes]
needs: []
agent: [judge]
related: [acceptance-loop, verification-subagent, pre-commit-pre-push, autoformat-hook]
links:
  - title: "Hooks reference: Stop"
    url: "https://code.claude.com/docs/en/hooks"
    note: "Stop input, stop_hook_active, the 8-consecutive-continuation cap, prompt and agent hooks"
  - title: "Keep Claude working toward a goal"
    url: "https://code.claude.com/docs/en/goal"
    note: "the evaluator judges the conversation; it runs no commands and reads no files"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "a Stop hook among the checks of done"
  - title: "claude-code-best-practice"
    url: "https://github.com/shanraisshan/claude-code-best-practice"
---

## Why

An agent can end its turn and call the work done while the check still fails. A line in CLAUDE.md is only
advice; a hook makes the check a condition of ending the turn. That lets an autonomous run finish without a
person, and stops it from finishing on a red check.

## How it works

When the agent tries to end its turn, Claude Code runs the Stop hook. The hook runs the loop's check. If the check
fails, the hook blocks the end of the turn: it exits with code 2 and its stderr reaches the agent as the reason, or
it prints `{"decision": "block", "reason": "…"}`. The agent keeps working with the failures in front of it. When
the check passes, the turn ends.

Three kinds of hook can stand at Stop. They differ in what decides:

| Hook | What decides | Use it for |
|---|---|---|
| Command hook | The check's exit code and output | Anything a script can check: build, types, lint, tests, the acceptance gate |
| `/goal`, or a prompt hook | A small fast model that reads the condition and the conversation; it "doesn't run commands or read files independently" | A condition no script can check, written so that the agent's own output shows it |
| Agent hook (`type: "agent"`, experimental) | A subagent that reads files and test output with Read, Grep and Glob, and runs nothing | A condition that needs the files, not only the conversation |

`/goal` is a session-scoped prompt hook: after each turn the evaluator returns met, not yet met or impossible.

**The cap.** Stop hooks can continue a turn 8 times in a row; at the next block Claude Code ends the turn anyway,
with a warning, and the session goes on. The count resets each time the agent calls a tool, so an agent that keeps
working never reaches the cap: only blocks with no work between them count. `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`
changes the cap, and 0 removes it. The cap stops an agent that answers the hook without acting; it is not a limit
on attempts, so set your own (Set up).

In the [acceptance loop](../acceptance-loop/card.md), a Stop hook keeps the agent working until the loop's gate
passes.

## Set up

- **A command hook that runs `run`.** In `.claude/settings.json`, under `hooks.Stop`, a command hook runs the
  check loop's `run` on the repository and, when it fails, exits 2 with the `file:line: message` lines on stderr.
  It runs at every attempt to stop, so keep it to the checks that take seconds; a check that takes minutes runs at
  [pre-push or in CI](../pre-commit-pre-push/card.md).
- **Give up when the agent does not converge.** Keep the previous round's output in a temporary file named by the
  hook input's `session_id`. After 3 rounds with the same failures, let the turn end and print that the agent is
  stuck: a person should see the failure, not a fourth identical attempt. `stop_hook_active` in the input is `true`
  while the turn already continues because of a Stop hook.
- **Write a `/goal` condition as evidence.** The evaluator sees only the conversation, so name what the agent must
  run and show: "`./verify` ran in this session and printed `OK`", not "the feature works". Where the check can be
  scripted, use a command hook instead: the agent's summary of a run can mislead a model, an exit code cannot.
- **Out of the agent's reach.** The agent can edit `.claude/settings.json` and the check's script. A PreToolUse
  hook denies its writes to both, and CI runs the same check: a turn that ended green counts only when CI agrees.
- **Cases.** The check the hook runs has its own cases. Give the hook script three more, each a workspace with a
  recorded Stop input on stdin. Must fire: the check fails, so the hook exits 2 and its stderr names the failures.
  Must pass: a clean workspace, exit 0. Must pass: the same failures for the fourth round, exit 0 with the "stuck"
  line.
- **Wiring:** `.claude/settings.json` `hooks.Stop`. Trigger it once for real: break a test in a scratch worktree, ask
  the agent to finish, and keep the transcript that shows the block.

## Notes

- A passing check shows only what the script tests: a hook over the unit tests lets the agent stop on a feature no
  test covers. The acceptance gate is the stronger check to put here.

## Agent step

With `/goal` or a prompt hook, the agent step is a judge over the transcript: a model reads the condition and the
conversation and returns met, not yet met or impossible. It runs no tests and opens no app, so it can check only
what the agent printed; it is not a refuter. An agent hook reads files and test output as well, but still runs
nothing. A "not yet met" costs a turn; a wrong "met" ends the turn on unfinished work. So a turn may end on a
judge's "met" only where no script can check the condition, and after the judge's prompt is calibrated on
conversations known to be done and not done ([agent-calibration](../agent-calibration/card.md)). The `/goal`
evaluator is built in: its condition is the only part you write and calibrate. A verdict that runs the tests and
opens the app belongs to a [verification subagent](../verification-subagent/card.md).

A command hook needs no agent.
