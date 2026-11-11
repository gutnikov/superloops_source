---
id: stall-detector
title: "Stall detector"
summary: "A hook hashes every tool call; the same call or cycle of calls five times in a row tells the agent to step back, and a second stall in the same task stops it for a person."
sensor: computational
ilities: [alignment]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, task]
speed: [sub-second]
needs: []
agent: [judge]
related: [stop-hook, escalation-on-uncertainty, observe-and-interrupt, tool-use-telemetry, agent-calibration, approval-reviewer-agent]
links:
  - title: "loopDetectionService.ts: thresholds and the judge's prompt"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/services/loopDetectionService.ts#L29-L118"
    author: "gemini-cli (Google)"
    note: "5 repeats, 50-character text chunks seen 10 times, a judge from turn 30, a confidence of 0.9."
  - title: "loopDetectionService.ts: the tool-call check"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/services/loopDetectionService.ts#L313-L349"
    author: "gemini-cli (Google)"
    note: "a cycle of 1 to 5 calls, each call a sha256 of its name and arguments."
  - title: "loopDetectionService.ts: when the judge runs"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/services/loopDetectionService.ts#L260-L311"
    author: "gemini-cli (Google)"
  - title: "client.ts: the message after the first stall"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/core/client.ts#L1360-L1388"
    author: "gemini-cli (Google)"
  - title: "useGeminiStream.ts: the second stall halts the request"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/cli/src/ui/hooks/useGeminiStream.ts#L1958-L1990"
    author: "gemini-cli (Google)"
  - title: "snippets.ts: Strategic Re-evaluation"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/prompts/snippets.ts#L371-L374"
    author: "gemini-cli (Google)"
    note: "after more than 3 failed fixes: restate the task, list the assumptions, propose another approach."
  - title: "Hooks reference: PostToolUse and UserPromptSubmit"
    url: "https://code.claude.com/docs/en/hooks"
    note: "exit code 2 sends stderr to the agent; \"continue\": false stops it with a stopReason."
  - title: "Codex /goal: empty turns and broken executions counted"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/ext/goal/src/accounting.rs#L120-L174"
    author: "Codex (OpenAI)"
    note: "3 automatic turns with no activity, or 3 turns where exec broke and no tool succeeded, block the goal."
  - title: "Codex /goal: a turn error blocks the goal"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/ext/goal/src/extension.rs#L423-L445"
    author: "Codex (OpenAI)"
  - title: "Codex /goal: the no-progress check in the continuation prompt"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/ext/goal/templates/goals/continuation.md#L18-L21"
    author: "Codex (OpenAI)"
  - title: "opencode /goal: a stall is the reviewer's same reason, or a round with no tool call"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/test/plugin/goal.test.ts#L103-L135"
    author: "opencode (anomalyco)"
  - title: "opencode max-steps.ts: the last step at the step cap"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/session/runner/max-steps.ts#L1-L16"
    author: "opencode (anomalyco)"
    note: "tools off; the model states the limit, what is done, what remains and what to do next."
  - title: "opencode llm.ts: two continuations after a truncated response"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/session/runner/llm.ts#L346-L376"
    author: "opencode (anomalyco)"
---

## Why

An agent can repeat itself while every single call succeeds: it reads the same file again, applies the same edit
and gets the same error, restates the same plan. No test fails and no check fires, so the loop runs until the
session's turn or token budget ends, and the person finds out at the end. The [stop hook](../stop-hook/card.md)
catches an agent that stops too early; this loop catches one that does not stop and makes no progress.

## How it works

After every tool call, a hook turns the call into a key: a hash of the tool's name and its arguments. It keeps the
last 25 keys of the current task. The hook fires when the last 5 keys are the same, or when the last 5×k keys are
one cycle of k calls (k from 2 to 5) repeated 5 times.

- **The first stall** sends the agent a message, and the agent goes on. gemini-cli's text: "Please take a step back
  and confirm you're making forward progress. If not, take a step back, analyze your previous actions and rethink
  how you're approaching the problem. Avoid repeating the same tool calls or responses without new results."
- **A second stall in the same task** stops the agent. The person who gave the task sees the repeated calls and
  decides: change the task, give a hint, or let it go on.
- **A new prompt from the person** starts a new task: the keys and the count are cleared.

Hashing the arguments is what keeps batch work out: the same edit tool over 20 different files gives 20 different
keys. An edit followed by the build is a cycle only when the edit is the same each time; an agent that changes
different code between builds is debugging, and the keys differ.

A hook sees only tool calls. An agent that restates the same plan in text without calling tools needs the judge
(Agent step).

## Set up

- **One script, two hooks.** In `.claude/settings.json`, a `PostToolUse` hook with matcher `*` runs the script on
  each call; a `UserPromptSubmit` hook runs it with `--reset`. The script keeps its keys in a temporary file named by
  the hook input's `session_id`, and hashes `tool_name` with `tool_input` serialized with sorted keys, so the same
  arguments in another order give the same key.
- **First stall:** exit 2, with the message on stderr and the repeated calls named: the tool and a short form of
  the arguments, such as `Edit src/billing.ts` or `Bash npm test`. Claude Code shows the agent stderr of a
  `PostToolUse` hook that exits 2.
- **Second stall:** print `{"continue": false, "stopReason": "stall: <the cycle>, twice in this task"}` and exit 0.
  The agent stops, and the person sees the reason.
- **A guide for the agent, before the hook fires.** A line in CLAUDE.md, after gemini-cli's: after more than 3 failed
  attempts to fix the same failure, restate the task, list the assumptions and which might be wrong, and propose a
  different approach instead of patching the current one. The hook is the check; the line makes it fire less often.
- **Out of the agent's reach.** A `PreToolUse` hook denies the agent's writes to the script and to
  `.claude/settings.json`, as for the [stop hook](../stop-hook/card.md).
- **`run`** reads a case's hook inputs, one JSON object per line, in order, and prints one line per stall,
  `stall <n>: cycle of <k>: <calls>`. It exits non-zero at the first stall.
- **Cases.** Must fire: the same `Read` five times; an `Edit` with the same arguments and `Bash npm test`, alternating
  five times each. Must pass: one `Edit` on each of 20 files; an `Edit` with different arguments each time,
  alternating with the same test command; four identical calls, a `--reset`, then four more.
- **Wiring:** the two hooks in `.claude/settings.json`. Trigger it once for real: ask the agent in a scratch worktree
  to fix a test that cannot pass, and keep the transcript with the message and the stop. The stops stay in the session
  transcripts, where [tool-use-telemetry](../tool-use-telemetry/card.md) counts them per tool and model.

## Notes

- gemini-cli runs this check inside the agent, on by default, with the same thresholds: 5 repeats, cycles of up to 5
  calls, the last 25 calls kept. It also checks the streamed text, which a hook cannot see: a chunk of 50 characters
  that appears 10 times, close together, is a stall; code blocks, tables and lists do not count.
- The cap on turns or tokens is the last resort. This loop ends a stalled task earlier, with the repeated calls in
  front of the person. Make the cap end in a handoff, not in silence: at opencode's step cap the last step runs with
  tools off and a prompt that requires a "Statement that maximum steps for this agent have been reached", what was
  done, the tasks left and what to do next. The tool definitions stay in that request "to preserve the provider's
  cached prefix".
- A response cut off at the output limit is a stall of its own. opencode answers it with "Do not apologize, recap,
  or repeat yourself. Break the remaining work into smaller pieces.", and fails the step after two such
  continuations in a row.
- Whether the agent made progress between two identical runs of the build is a judgement the hash cannot make. Leave
  the threshold at 5: lower, and an agent waiting on a slow command trips it.
- **An agent that restarts itself stalls in other ways.** Where a runtime starts the next turn on its own, as
  Codex's `/goal` does, count turns as well as calls. Codex blocks the goal after 3 automatic turns in a row with no
  tool call and a blank answer, after 3 turns in a row in which its `exec` tool itself broke and no tool succeeded (a
  script that runs and exits non-zero does not count: that is a result the agent can act on), and after any turn
  that ends in an error, "to prevent automatic continuation from looping and consuming tokens". Any activity resets
  the empty-turn count. Its prompt adds the rules the hashes cannot apply: "status restatements and unexecuted plans
  are no progress"; a wait counts only while it polls a handle "confirmed live now"; and "Treat equivalent blockers
  as the same condition across turns even when their wording or stated next step changes."
- **A judge that repeats itself.** Where a reviewer decides whether to continue, its reason is a signal too.
  opencode's `/goal` counts a round as stalled when the reviewer gives the same reason as last time, compared with
  case and spaces ignored, or when the agent called no tool since the last continuation; 3 stalled rounds in a row
  pause the goal with "Not making progress". Its test shows why the reason counts even when tools ran: "The flaky
  test still fails." given four times in a row pauses the goal, though the agent called tools in every round.
- Repeated denials are a stall too: an agent that tries variants of a refused action gives different hashes each
  time. [approval-reviewer-agent](../approval-reviewer-agent/card.md) counts denials per turn and interrupts it.

## Agent step

A judge looks for stalls the hashes miss, such as the same plan restated, or the same fix in slightly different
words. It runs from the 30th tool call of a task, every 10 calls. It gets the last 20 turns and the person's request,
and returns a Verdict: `fail` when the agent repeated one pattern for at least 5 actions with no net change, with a
`score` from 0 to 1 as its confidence. gemini-cli's prompt lists what is not a stall: the same tool on different
files, edits to different parts of one file, a build run again after a change, and a retry with different arguments.
After a confident verdict, the next check comes sooner: gemini-cli waits `round(5 + 10 × (1 − score))` turns.

A `fail` counts as a stall only with a score of 0.9 or more, confirmed by a second, stronger model that also scores
0.9 or more. A wrong stall interrupts good work, so the judge advises until it is `gate`
([agent-calibration](../agent-calibration/card.md)); its eval cases are transcripts a person labelled stalled or
working.
