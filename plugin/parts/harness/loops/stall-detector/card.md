---
id: stall-detector
title: "Stall detector"
summary: "A hook hashes every tool call: the same call or cycle five times in a row tells the agent to step back, a second stall stops it for a person, and a leaf subagent's spawn is denied."
sensor: computational
ilities: [alignment]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, task]
speed: [sub-second]
needs: []
agent: [judge]
related: [stop-hook, escalation-on-uncertainty, observe-and-interrupt, tool-use-telemetry, agent-calibration, approval-reviewer-agent, agent-code-review, afk-run-handoff]
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
  - title: "code-review: sub-agents that invoke /code-review again"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/code-review.md#L59-L61"
    author: "skills (Matt Pocock)"
  - title: "research: a background agent that spawns another"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/research.md#L27-L37"
    author: "skills (Matt Pocock)"
  - title: "Out of scope: guards against sub-agents recursing into skills"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/.out-of-scope/subagent-recursion.md#L1-L14"
    author: "skills (Matt Pocock)"
  - title: "Claude Code changelog: agent_id and agent_type in hook events (2.1.69)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L8200"
    author: "Anthropic"
  - title: "Orchestrator.ts: the idle timeout, and the completion timeout after the signal"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/src/Orchestrator.ts#L120-L142"
    author: "sandcastle (Matt Pocock)"
    note: "600 s and 60 s by default (L293-L295)."
  - title: "ADR 0019: completion timeout for a hanging process"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/docs/adr/0019-completion-timeout-for-hanging-process.md#L3-L12"
    author: "sandcastle (Matt Pocock)"
  - title: "CODING_STANDARDS.md: output reaches the timer as it arrives"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/CODING_STANDARDS.md#L49"
    author: "sandcastle (Matt Pocock)"
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

### Agents that spawn agents

A subagent that finds the skill it was dispatched by can call it again and spawn more agents, each a new session
with new arguments, so no key repeats. With Matt Pocock's code-review skill, "One report reached more than 50
agents"; one research task cost "roughly 450k tokens across three overlapping runs". The hook counts spawns too: a
spawn from a subagent whose type is not an orchestrator, or the 11th in one task, is denied with "You are a leaf
agent: do this work yourself and start no agents."; a second denial stops the agent for the person, with the tree of
spawns. It is a hook, not a line in a prompt. Pocock: "A guard written into one skill's prose covers only that skill,
costs tokens on every run, and still depends on the model choosing to obey it." A blanket rule fails the other way:
when global instructions forbid re-delegating, the background agent "declines the task, and the skill does nothing
without telling you". The hook denies only the spawn, and the leaf does the work itself.

## Set up

- **One script, three hooks.** In `.claude/settings.json`, a `PostToolUse` hook with matcher `*` runs the script on
  each call; a `UserPromptSubmit` hook runs it with `--reset`; a `PreToolUse` hook with matcher `Agent|Task` runs it
  with `--spawn`. The script keeps its keys in a temporary file named by the hook input's `session_id`, and by its
  `agent_id` inside a subagent, so parallel subagents do not mix their calls. It hashes `tool_name` with
  `tool_input` serialized with sorted keys, so the same arguments in another order give the same key.
- **First stall:** exit 2, with the message on stderr and the repeated calls named: the tool and a short form of
  the arguments, such as `Edit src/billing.ts` or `Bash npm test`. Claude Code shows the agent stderr of a
  `PostToolUse` hook that exits 2.
- **Second stall:** print `{"continue": false, "stopReason": "stall: <the cycle>, twice in this task"}` and exit 0.
  The agent stops, and the person sees the reason.
- **The spawn cap.** Claude Code puts `agent_id` and `agent_type` in a hook's input when a subagent makes the call
  (2.1.69): a spawn with an `agent_id` passes only for the types the script's config lists as orchestrators. The
  count is per task, cleared by `--reset`, 10 by default; raise it in the config, a reviewed line, for an
  orchestrator with one implementer per ticket. A denial exits 2 with the message on stderr, which blocks the call;
  the second prints `{"continue": false, "stopReason": "spawn cap: <tree>"}`. A `tools` list without the spawning
  tool does the same only for agents in `.claude/agents/`, not for the general-purpose agent a skill dispatches.
- **A guide for the agent, before the hook fires.** A line in CLAUDE.md, after gemini-cli's: after more than 3 failed
  attempts to fix the same failure, restate the task, list the assumptions and which might be wrong, and propose a
  different approach instead of patching the current one. The hook is the check; the line makes it fire less often.
- **Out of the agent's reach.** A `PreToolUse` hook denies the agent's writes to the script and to
  `.claude/settings.json`, as for the [stop hook](../stop-hook/card.md).
- **`run`** reads a case's hook inputs, one JSON object per line, in order, and prints one line per stall,
  `stall <n>: cycle of <k>: <calls>`, and per denied spawn, `spawn denied: <agent_type>: <n> in this task`. It exits
  non-zero at the first stall or denied spawn.
- **Cases.** Must fire: the same `Read` five times; an `Edit` with the same arguments and `Bash npm test`, alternating
  five times each; a reviewer subagent that calls the review skill, which spawns an agent; an 11th spawn in one task.
  Must pass: one `Edit` on each of 20 files; an `Edit` with different arguments each time, alternating with the same
  test command; four identical calls, a `--reset`, then four more; the main session spawning 5 reviewers; an
  orchestrator type from the config spawning a worker.
- **Wiring:** the three hooks in `.claude/settings.json`. Trigger it once for real: ask the agent in a scratch worktree
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
- **Silence is a stall no hook sees.** A wrapper that runs the agent unattended resets a timer on every line of
  output: sandcastle fails the run after 10 minutes ("Agent idle for N seconds — no output received", with N at 600). After the
  agent's completion signal the timer drops to 60 seconds and its end is a success with a warning, since a child
  such as `gh` or an MCP server can hold the output open, and failing there discarded "the already-committed work".
  Switch on the signal, not on a final event: sandcastle synthesizes a `result` event for every Codex and OpenCode
  message. Stream the output to the timer as it arrives, or "the timeout will fire prematurely or hangs won't be
  detected". The run then ends blocked with its reason ([afk-run-handoff](../afk-run-handoff/card.md)).
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
