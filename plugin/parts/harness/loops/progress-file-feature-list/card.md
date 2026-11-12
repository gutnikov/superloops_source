---
id: progress-file-feature-list
title: "Progress file and feature list"
summary: "Long work over many sessions: a JSON feature list and a progress file carry the state; each session takes one failing feature and marks it passing only after an e2e check."
sensor: computational
ilities: [correctness]
places: [delivery/work]
stages: [task]
speed: [minutes, hours]
needs: []
related: [acceptance-loop, e2e-browser, isolated-environment, stop-hook, plan-approval, agent-branch-integration, afk-run-handoff]
links:
  - title: "Effective harnesses for long-running agents"
    url: "https://anthropic.com/engineering/effective-harnesses-for-long-running-agents"
    author: "Anthropic"
    note: "the initializer, feature_list.json, claude-progress.txt, init.sh, one feature per session"
  - title: "Effective harnesses for long-running agents"
    url: "https://businessdatasolutions.github.io/ai-wiki/sources/2025-11-26-anthropic-effective-harnesses-long-running-agents"
    note: "AI wiki summary"
  - title: "Effective harnesses for long-running agents"
    url: "https://daily.dev/posts/effective-harnesses-for-long-running-agents-7clzunmmu"
    note: "daily.dev"
  - title: "AGENTS.md: Chord v2 Code Style, Slices and Deferred work"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/AGENTS.md#chord-v2-code-style"
    author: "pi (earendil-works)"
    note: "the carry-over ledger of deferred work."
  - title: "chatCompressionService.ts: the summary's second pass"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/context/chatCompressionService.ts#L770-L800"
    author: "gemini-cli (Google)"
  - title: "opencode compaction.ts: the summary template, a nudge, then a failure"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/session/compaction.ts#L173-L204"
    author: "opencode (anomalyco)"
    note: "Objective, Requirements, Decisions, Work State (Completed, Active, Blocked), Next Move, Relevant Files, Important Context."
  - title: "opencode compaction.ts: the nudge"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/session/compaction.ts#L247-L248"
    author: "opencode (anomalyco)"
  - title: "opencode compaction.ts: the check that the template was filled"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/session/compaction.ts#L486-L521"
    author: "opencode (anomalyco)"
  - title: "math-proof worker: write as you go, and the end line last"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/agents/math-proof-worker.md#L9-L15"
    author: "Anthropic"
  - title: "math-proof ledger.py: a script classifies each answer by its last line"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/scripts/ledger.py#L416-L430"
    author: "Anthropic"
  - title: "math-proof siege: resume from state.md, never redo a step whose outputs exist"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/SKILL.md#L87-L101"
    author: "Anthropic"
  - title: "math-proof siege: state.md rewritten after every step"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/SKILL.md#L304-L308"
    author: "Anthropic"
  - title: "subagent-driven-development: a ledger per plan, named on its first line"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/subagent-driven-development/SKILL.md#L108-L128"
    author: "superpowers (obra)"
  - title: "resuming.md: another plan's ledger is left in place"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/subagent-driven-development/references/resuming.md#L6-L12"
    author: "superpowers (obra)"
  - title: "task-done: the completion line written only when the tests pass"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/executing-plans/scripts/task-done#L1-L55"
    author: "superpowers (obra)"
  - title: "SDD design: 269 dispatches for about 22 tasks"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-06-09-sdd-task-scoped-review-dispatch-design.md#L91-L94"
    author: "superpowers (obra)"
  - title: "Plan-scoped workspace eval: 6 to 13 tool calls per resume"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md#L36-L64"
    author: "superpowers (obra)"
  - title: "implement-spec SKILL.md: tickets as a task graph, one worktree each"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement-spec/SKILL.md#L13-L42"
    author: "skills (Matt Pocock)"
  - title: "implement-spec.md: blocked tickets that never start"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement-spec.md#L58-L60"
    author: "skills (Matt Pocock)"
  - title: "to-tickets.md: one shared tickets file, written by parallel agents"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/to-tickets.md#L70-L71"
    author: "skills (Matt Pocock)"
---

## Why

Work that spans many sessions loses its state between them: a new session redoes work, or sees that much is built
and declares the job done. An agent's word that a feature is done is not evidence either. With this loop the state
lives in files the next session reads, and a feature counts as passing only after an e2e check. One feature per
session keeps each claim small enough to check.

## How it works

1. **The first session is an initializer.** It turns the request into a JSON list of end-to-end features, each
   with its steps and `"passes": false`. It also writes `init.sh`, which starts the app, a progress file and a first
   commit.
2. **Every later session first gets its bearings.** It reads the progress file and `git log`, runs `init.sh` and a
   basic e2e check, and fixes what is broken before anything new.
3. **It takes one feature**: the highest-priority one that does not pass. It implements the feature and checks it
   end to end as a user would; for a web app, that means [in a browser](../e2e-browser/card.md).
4. **Only then it marks the feature.** It sets `passes` to `true`, commits with a descriptive message, and adds what
   it did to the progress file.

The list is the agent's plan and memory, not the oracle. Where the requirements come from a person, the
[acceptance loop](../acceptance-loop/card.md) is the oracle: the feature list is then its list of requirements, and a
feature passes when its acceptance tests are green.

## Set up

- **Three files.**
  - `feature_list.json`: per feature an id, a description, the steps and `passes`.
  - The progress file (`claude-progress.txt` at Anthropic): one entry per session with the feature, what was done,
    what is left and how it was checked.
  - `init.sh`: starts the app and runs the basic e2e check.
- **Two prompts.**
  - The initializer's: build the list from the spec with every feature failing, write `init.sh`, commit.
  - Each session's: the steps above, one feature only, and never edit a feature's description or steps.
- **Only `passes` changes, and only a passing run sets it.** A PreToolUse hook on writes to `feature_list.json`
  denies any change other than `passes`. Better still, a script runs the feature's e2e tests, tagged with its id, and
  sets `passes` only when they exit 0, adding a line to the progress file with the commit range and the command's
  last line; the agent never writes it. superpowers' `task-done` appends `Task <N>: complete (commits
  <base7>..<head7>, tests: <command> → <last line>)`, and "A failing command records nothing".
- **The progress file names its plan.** Its first line names the feature list it tracks, as superpowers' ledger
  does with `# SDD ledger — plan: <plan file path>`. A progress file that names another list "is another plan's
  progress: leave it in place and start your own, fresh". Without that line, each resume in a repository with an old
  ledger spent 6 to 13 tool calls proving it was not its own (superpowers' eval). With no ledger at all, sessions
  "re-dispatched entire completed task sequences after compaction — 269 dispatches for ~22 tasks".
- **A failed check or an unfinished session** leaves the feature at `false`. The progress entry says where the work
  stopped, and the session commits on its branch or reverts with git, so the next one starts from a working state.
- **Write as you go, and mark the end.** A worker that may be cut off writes its plan and the step it is attempting
  "early in EVERY message", appends each result as soon as it has it, and writes an agreed end line last, only when
  it is finished. Anthropic's math-proof plugin ends each answer file with `=== END OF ANSWER <id> ===`, and a script,
  not the orchestrator, reads the last line and sorts the file as answered, partial or missing. A partial file is
  handed to one rerun, whose worker is told to "treat none of it as established". The orchestrator rewrites its own
  state file after every step, "your only memory if this conversation is ever compacted", and the same command
  resumes from the recorded phase, "never redoing a step whose output files exist".
- **`run`** compares `feature_list.json` with the main branch, the latest e2e report and the progress file's
  completion lines. It prints one line per changed feature, `<id>: <status>`, where the status is `passing`,
  `passing without evidence` (no green run, or a commit range `git log` does not have), `steps changed` or `removed`.
  It exits non-zero on anything but `passing`.
- **Cases.** Must fire: a feature set to `true` with no green e2e run for it; a pass whose commit range `git log`
  does not have; a feature whose steps were edited; a removed feature. Must pass: one feature set to `true` after its
  e2e test passed, the rest untouched.
- **Wiring**: a [Stop hook](../stop-hook/card.md) runs `run` at the end of each session, and CI runs it on the
  branch.

## Notes

- At Anthropic, the list for a claude.ai clone had over 200 features. Agents were told to change only the `passes`
  field: "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."
  The list is JSON because "the model is less likely to inappropriately change or overwrite JSON files compared to
  Markdown files."
- Without an explicit instruction to test as a user would, Claude marked features complete after unit tests or
  `curl` while the feature did not work end to end (Anthropic).
- **Parallel sessions.** When several agents take features at once, each in its own worktree, the list is a graph:
  a feature is ready when every feature it depends on has merged. Compute that from what merged into the integration
  branch, not from the tracker. Pocock's implement-spec: "The tracker's blocked-by count only drops when a blocker
  *closes*", at the end of the run, so blocked tickets never started. One shared tickets file "caused race conditions
  when parallel agents wrote to it": give each feature its own progress file, or let only the orchestrator write.
- Deferred work needs the same file. Pi builds one package in vertical slices: anything a slice leaves for later goes
  into the "Carry-over" section under the slice that will do it, in the same change, and that slice's spec and build
  must include every entry filed under it. Work put off in one session is then where the next session reads it.
- A progress entry is a summary, and a summary loses details. Before the session commits, it re-reads its entry
  against what it did: a file path, a command's result or a constraint the person gave that is missing from the
  entry is one the next session will not have. gemini-cli gives every summary of its history this second pass: "Did you omit
  any specific technical details, file paths, tool results, or user constraints mentioned in the history? If
  anything is missing or could be more precise, generate a FINAL, improved <state_snapshot>."
- A progress entry has a shape a script can check. opencode's compaction summary must use a fixed template:
  Objective, Requirements, Decisions, Work State with Completed, Active and Blocked, Next Move, Relevant Files (at
  most 15) and Important Context. A reply with none of the template's headings gets one nudge, "Return the summary as
  text using the exact section headings from the template", and then fails as "Compaction summary did not match the
  required template". Give the progress file the same headings, and let the commit hook reject an entry without them.
