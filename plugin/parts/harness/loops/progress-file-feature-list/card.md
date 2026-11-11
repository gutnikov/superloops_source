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
related: [acceptance-loop, e2e-browser, isolated-environment, stop-hook]
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
- **Only `passes` changes.** A PreToolUse hook on writes to `feature_list.json` denies any change other than
  `passes`. Better still, a script sets `passes` from the e2e suite's report, where tests are tagged with the feature's
  id, and the agent never writes it.
- **A failed check or an unfinished session** leaves the feature at `false`. The progress entry says where the work
  stopped, and the session commits on its branch or reverts with git, so the next one starts from a working state.
- **`run`** compares `feature_list.json` with the main branch and the latest e2e report. It prints one line per
  changed feature, `<id>: <status>`, where the status is `passing`, `passing without evidence`, `steps changed` or
  `removed`. It exits non-zero on anything but `passing`.
- **Cases.** Must fire: a feature set to `true` with no green e2e run for it; a feature whose steps were edited; a
  removed feature. Must pass: one feature set to `true` after its e2e test passed, the rest untouched.
- **Wiring**: a [Stop hook](../stop-hook/card.md) runs `run` at the end of each session, and CI runs it on the
  branch.

## Notes

- At Anthropic, the list for a claude.ai clone had over 200 features. Agents were told to change only the `passes`
  field: "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."
  The list is JSON because "the model is less likely to inappropriately change or overwrite JSON files compared to
  Markdown files."
- Without an explicit instruction to test as a user would, Claude marked features complete after unit tests or
  `curl` while the feature did not work end to end (Anthropic).
- Deferred work needs the same file. Pi builds one package in vertical slices: anything a slice leaves for later goes
  into the "Carry-over" section under the slice that will do it, in the same change, and that slice's spec and build
  must include every entry filed under it. Work put off in one session is then where the next session reads it.
- A progress entry is a summary, and a summary loses details. Before the session commits, it re-reads its entry
  against what it did: a file path, a command's result or a constraint the person gave that is missing from the
  entry is one the next session will not have. gemini-cli gives every summary of its history this second pass: "Did you omit
  any specific technical details, file paths, tool results, or user constraints mentioned in the history? If
  anything is missing or could be more precise, generate a FINAL, improved <state_snapshot>."
