---
id: stall-detector
title: "Stall detector"
type: stall-detector
status: validated
trigger: [edit, task]
places: [delivery/work, remediation/work, maintenance/work]
run: ./run
budget_seconds: 5
validation: cases
agents: []
parts: []
hitl: []
wiring: [".claude/settings.json hooks.PostToolUse matcher * runs stall.py on every tool call", ".claude/settings.json hooks.PreToolUse matcher Agent|Task runs stall.py --spawn on every spawn", ".claude/settings.json hooks.UserPromptSubmit runs stall.py --reset on every prompt"]
---

# Stall detector

## Requirement

The agent repeats the same call, or the same short cycle of calls, without getting anywhere, and spends the task on
it; or a subagent starts agents that start agents. Its place is the work phase of delivery, remediation and
maintenance: the session itself, before anything reaches a gate.

## Loop

1. After every tool call, `stall.py` turns the call into a key, a hash of the tool's name and its arguments with the
   keys sorted, and keeps the last 25 keys of each agent in the task.
2. When the last 5 keys are one call, or one cycle of 2 to 5 calls, repeated 5 times, it is a stall. The first one
   sends the agent a message on stderr with exit 2, and the agent goes on; the second in the same task stops the
   agent with the repeated calls as the reason.
3. Before every spawn, `stall.py --spawn` denies one from a subagent whose type is not an orchestrator, and the
   11th in one task.
4. A new prompt from the person clears the keys and the counts.

## Tools

- Python 3.8 or later, standard library only. Validated with Python 3.12.
- Claude Code with `agent_id` and `agent_type` in hook input (2.1.69 or later) for the spawn rules.

## Signal

`run` prints one line and exits 1 at the first stall or denied spawn:

```
stall 1: cycle of 2: Edit src/billing.ts → Bash npm test
spawn denied: reviewer: 1 in this task: leaf agent
```

In a session, the first stall reaches the agent as gemini-cli's message after the repeated calls; the second stops
the agent with `{"continue": false, "stopReason": "stall: <calls>, twice in this task"}`.

## Validation

Each case is a `hooks.jsonl` of hook inputs, replayed in order through the same functions the hooks call.

| Case | Stands for |
|---|---|
| must-fire/same-read-five-times | one call repeated |
| must-fire/same-edit-and-test-cycle | a cycle of two: the same edit, then the tests |
| must-fire/same-arguments-in-another-order | the same call with its arguments reordered is one key |
| must-fire/reviewer-subagent-spawns-agent | a leaf subagent starting an agent |
| must-fire/eleventh-spawn-in-a-task | the spawn cap |
| must-pass/edit-on-twenty-files | batch work: the same tool on different files |
| must-pass/different-edits-same-test | debugging: a different edit before each test run |
| must-pass/four-calls-reset-four-calls | a new prompt starts a new task |
| must-pass/parallel-subagents-same-call | two subagents' calls are counted apart |
| must-pass/main-session-spawns-five-reviewers | spawns from the main session under the cap |
| must-pass/orchestrator-spawns-a-worker | a type the config lists as an orchestrator may spawn |

Wiring: copy `stall.py` to `superloops/loops/stall-detector/` and merge `settings.json` into `.claude/settings.json`.
Trigger it once for real: ask the agent, in a scratch worktree, to fix a test that cannot pass, and keep the
transcript with the message and the stop.
