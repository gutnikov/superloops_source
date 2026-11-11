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
related: [acceptance-loop, verification-subagent, pre-commit-pre-push, autoformat-hook, stall-detector, security-review-agent]
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
  - title: "nextSpeakerChecker.ts"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/utils/nextSpeakerChecker.ts#L14-L18"
    author: "gemini-cli (Google)"
    note: "who speaks next after a turn with no tool call; on 'model' the client sends 'Please continue.'"
  - title: "Hooks reference: AfterAgent"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/docs/hooks/reference.md#L163-L181"
    author: "gemini-cli (Google)"
    note: "the reason as a new prompt; clearContext clears the conversation before the retry."
  - title: "Codex /goal: the continuation prompt and its completion audit"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/ext/goal/templates/goals/continuation.md#L26-L52"
    author: "Codex (OpenAI)"
    note: "the same model audits its own completion; fidelity, completion audit, blocked audit."
  - title: "Codex /goal: update_goal checks only the status value"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/ext/goal/src/tool.rs#L265-L292"
    author: "Codex (OpenAI)"
  - title: "Codex /goal: the budget-limit message"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/ext/goal/templates/goals/budget_limit.md#L1-L16"
    author: "Codex (OpenAI)"
    note: "injected once into the running turn when the goal's token budget runs out."
  - title: "opencode /goal: the reviewer's prompt"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/goal/judge.txt#L1-L20"
    author: "opencode (anomalyco)"
    note: "a separate turn with no tools; done, continue, blocked, paused or wait; \"When in doubt, answer 'continue'\"."
  - title: "opencode /goal: the limits"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/goal.ts#L15-L19"
    author: "opencode (anomalyco)"
    note: "50 rounds, 3 stalls, 30 minutes of waiting on background work."
  - title: "opencode /goal: the idle hook and the stall rule"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/goal.ts#L138-L203"
    author: "opencode (anomalyco)"
  - title: "opencode /goal: the objective added back after compaction"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/goal.ts#L218-L231"
    author: "opencode (anomalyco)"
  - title: "Ralph loop (a plugin): the stop hook"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/ralph-loop/hooks/stop-hook.sh#L128-L188"
    author: "Anthropic"
    note: "the same prompt fed back at every Stop; a completion promise matched as a literal string; an iteration cap."
  - title: "Ralph loop: escape hatches"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/ralph-loop/README.md#L119-L134"
    author: "Anthropic"
    note: "\"Always rely on `--max-iterations` as your primary safety mechanism\"."
  - title: "Claude Code changelog: prompt-based stop hooks (2.0.30)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L9384"
    author: "Anthropic"
  - title: "Claude Code changelog: the /goal command (2.1.139)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L6603"
    author: "Anthropic"
  - title: "Claude Code changelog: the cap of 8 consecutive blocks (2.1.143)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L6467-L6469"
    author: "Anthropic"
    note: "added for stop hooks that block repeatedly \"looping forever\"; /goal no longer fires while background work runs."
  - title: "Claude Code changelog: background_tasks and session_crons in the Stop input (2.1.145)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L6389"
    author: "Anthropic"
  - title: "Claude Code changelog: /goal check-ins on background work (2.1.234, 2.1.239, 2.1.246)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L4710"
    author: "Anthropic"
    note: "after 30 minutes of waiting, then backing off to 1 h and 2 h; at most three per goal until the next message (#L4548, #L4419)."
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
- **Tell waiting from not done.** Since Claude Code 2.1.145 the Stop input carries `background_tasks` and
  `session_crons`. A command hook that sees a background build or a scheduled check still running lets the turn end
  as waiting, and does not count the round toward "stuck"; the `/goal` evaluator likewise does not fire while
  background shells or subagents run (2.1.143). On a long wait, `/goal` checks in after 30 minutes, backs off to an
  hour and then every two, and starts at most three check-ins per goal until the person writes again.
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
- Prompt-based Stop hooks arrived in Claude Code 2.0.30, `/goal` in 2.1.139, and the cap of 8 consecutive blocks in
  2.1.143, as a fix for stop hooks that block repeatedly "looping forever".
- **The same prompt, again and again.** Anthropic's Ralph loop plugin blocks every Stop and feeds the agent the same
  prompt from a state file; the work carries over only in the files and git. It ends when the agent writes
  `<promise>…</promise>` with text that matches the configured promise exactly, after whitespace is normalised, or at
  `--max-iterations`. Each round reminds the agent: "ONLY when statement is TRUE - do not lie to exit!". The promise
  is the agent's own claim, so the plugin's README says "Always rely on `--max-iterations` as your primary safety
  mechanism", and suggests the prompt name what to do when stuck: after 15 iterations, document what blocks
  progress. Use it for open-ended work, with a command hook beside it for what a script can check.
- A review of each turn's diff can stand at Stop as well, as a security reviewer that wakes the agent with its
  findings: [security-review-agent](../security-review-agent/card.md).
- **A narrower question than "done?".** An agent can stop right after announcing its next step. gemini-cli's
  next-speaker check asks a small model only who speaks next, by rules in order: the model continues when its last
  response "explicitly states an immediate next action *you* intend to take (e.g., "Next, I will...")" or was cut
  off; the person speaks next after a question to them or a finished thought. On "model" the client sends "Please
  continue." In Claude Code this is a prompt hook at Stop with that one condition; it is a judge, calibrated like
  any other, and it never says the task is done.
- **A retry in a fresh context.** When the transcript itself keeps the agent on a wrong track, the alternative to
  another round is to start again with only the failures. gemini-cli's AfterAgent hook, its Stop hook, sends the
  block reason "to the agent as a new prompt" and can clear the conversation first (`clearContext`); each retry
  takes one turn of the session's budget of 100.
- **The agent as its own judge.** Codex's `/goal` restarts the turn whenever the thread goes idle with the goal
  active, and the same model decides when it is done, by a completion audit in its prompt: "treat completion as
  unproven"; tests and green checks count "only after confirming they cover the relevant requirement"; "The audit
  must prove completion, not merely fail to find obvious remaining work." A fidelity rule forbids "a narrower,
  safer, smaller, merely compatible, or easier-to-test solution because it is more likely to pass current tests".
  Put that audit in the agent's instructions, but do not let it end the loop alone: `update_goal` checks only that
  the status is allowed, so nothing verifies a "complete". Keep a command hook at Stop for what a script can check.
- **A token budget as a stop.** A goal with a budget ends when the budget runs out: Codex injects one message into
  the running turn, "do not start new substantive work… Wrap up this turn soon", and starts no further turns. Set a
  budget on every unattended goal; the Stop hook's cap counts only blocks, not the tokens spent between them.
- **A reviewer turn between the two.** opencode's `/goal` judges in a separate turn of the same session, with the
  whole transcript and no tools: "The assistant claiming the goal is met is not evidence", and "When in doubt,
  answer 'continue'". On `continue` the agent gets the reason and a next step. `wait` is allowed only while one of
  the session's own background commands runs, never for a dev server, and 30 minutes with nothing running pause the
  goal. The goal also pauses after 50 rounds, and after 3 stalled rounds in a row: the reviewer's reason is the same
  as last time, or the agent called no tool. The objective reaches the reviewer as `<untrusted_objective>`, and
  after a compaction it is added back to the history. Whichever judge you use, count its repeated reasons: a judge
  that says the same thing three times is watching a [stall](../stall-detector/card.md).

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
