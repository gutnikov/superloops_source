---
id: ci-clean-infra
title: "CI on clean infrastructure"
summary: "The agent pushes; autofixes apply themselves; the agent fixes the remaining failures locally."
sensor: computational
ilities: [deployability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [minutes]
needs: [ci]
agent: [investigator]
related: [pre-commit-pre-push, platform-matrix, isolated-environment]
links:
  - title: "Minions: Stripe's one-shot, end-to-end coding agents — Part 2"
    url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2"
    author: "Stripe"
    note: "lint locally first, autofixes in CI, at most two CI rounds before a person."
  - title: "gh run view"
    url: "https://cli.github.com/manual/gh_run_view"
    author: "GitHub"
  - title: "CI Replicate & Status (a skill)"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.gemini/skills/ci/SKILL.md#L24-L61"
    author: "gemini-cli (Google)"
    note: "poll every 15 seconds, stop at the first failure, run the suggested local command at once."
  - title: "ci.mjs: the failure report and the local command"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.gemini/skills/ci/scripts/ci.mjs#L238-L275"
    author: "gemini-cli (Google)"
---

## Why

Checks in the agent's workspace can pass because of something only that workspace has. CI runs on clean
infrastructure, so a green run there does not depend on the agent's machine. A CI round takes minutes, so cheap
checks run locally first and the number of rounds is limited.

## How it works

1. The agent runs the cheap checks locally ([pre-commit-pre-push](../pre-commit-pre-push/card.md)), pushes, and CI
   runs the checks on clean infrastructure.
2. Autofixes apply themselves: at Stripe, "After a minion pushes a change, we run CI and auto-apply any autofixes for
   failing tests."
3. For a job that still fails, an investigator reads the failed steps' log (`gh run view <run-id> --log-failed`) and
   returns a Diagnosis (see Agent step).
4. The agent reproduces the failure locally where it can, fixes it and pushes again, until CI passes or the agent
   reaches the limit on CI rounds.

## Set up

- **Clean runners.** Each job starts from a fresh runner or container image and installs from the lockfile. Key
  caches by the lockfile's hash, so a cache cannot carry state from another branch.
- **An autofix job** runs the formatters and the fixable lint rules and commits the result to the branch. The agent
  pulls before its next change.
- **Logs the agent can read.** `gh run view --log-failed` shows "the log for any failed steps in a run or specific
  job"; `--exit-status` makes the command "Exit with non-zero status if run failed".
- **A watcher that fails fast and names the local command.** Waiting for the whole run spends the minutes a round
  costs. gemini-cli's `ci` skill finds the branch's runs itself, polls every 15 seconds, and stops at the first poll
  that sees a failed job. It prints the failures grouped by test file, with stack traces and install noise dropped,
  at most 10 per file and 500 characters each, then the command that reruns exactly those files locally (`npm test
  -w <workspace> -- <files>`, or `npm run lint:all` for lint), and exits 1. The agent runs that command before it
  reads any code.
- **A limit on CI rounds: two, then a person.** Stripe loops on a lint step "locally before pushing an agent's
  branch", runs the full CI suite once, gives the agent "one more chance to fix the failing test locally", and "After
  the second push and CI run, we send the branch back to its human operator for manual scrutiny", because of
  "diminishing marginal returns if an LLM is running against indefinitely many rounds of a full CI loop".
- **`run`** judges the CI run of the branch's head commit and prints one line per job, `<job>: <status>`: `passed`,
  `failed` with the first error line as `file:line: message`, or `no run for <sha>` while CI has not run the head
  commit. It exits non-zero on anything but `passed`.
- **Cases** are recorded CI runs. Must fire: a run with one failed job; a run for an older commit than the head. Must
  pass: every job green at the head.
- **Wiring.** The CI jobs are required checks on the protected branch, so the agent cannot merge a red run. A
  PreToolUse hook denies the agent's writes to the workflow files, and a person reviews changes to them: removing a
  job is not a fix.

## Agent step

An investigator reads the failing job's log and returns a Diagnosis: the cause, the log lines that show it, the next
step. It keeps thousands of log lines out of the working agent's context. It never blocks; the CI job does.
