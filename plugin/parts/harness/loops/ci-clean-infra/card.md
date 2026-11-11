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
  - title: "blocking-ci.yml: the required fan-in job"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/blocking-ci.yml#L46-L73"
    author: "Codex (OpenAI)"
    note: "if: always(), so a failed dependency cannot leave the required check looking green."
  - title: "check_ci_results.py"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/check_ci_results.py#L3-L28"
    author: "Codex (OpenAI)"
    note: "skipped and cancelled count as failures; one script for the PR gate and the post-merge gate."
  - title: "verify_bazel_clippy_lints.py: the local lint and the CI lint agree"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/verify_bazel_clippy_lints.py#L55-L78"
    author: "Codex (OpenAI)"
  - title: "check-clean-worktree (a composite action)"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/actions/check-clean-worktree/action.yml#L1-L19"
    author: "Codex (OpenAI)"
  - title: "repo-checks.yml: step names that carry the fix, and the clean-worktree step"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/repo-checks.yml#L70-L78"
    author: "Codex (OpenAI)"
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
- **A required job that only an explicit success passes.** A required check that depends on other jobs is skipped
  when one of them fails, and a skipped required check can look green. Codex's merge gate is one `required` job with
  `if: always()` over every check; its script prints `<job>: <result>` and fails on anything but `success`: "for a
  required fan-in job, only an explicit success is safe to accept". Its `needs:` list is "the version-controlled list
  that the main-branch ruleset should require", so dropping a check from the gate is a diff a person reviews.
- **The local lint and the CI lint read the same rules.** When the agent lints with one tool and CI with another, a
  rule present in only one costs a CI round. A check that diffs the two configurations and prints the line to add
  keeps them equal; Codex's compares Cargo's clippy levels with Bazel's flags, since "Bazel clippy does not ingest
  Cargo lint levels automatically".
- **A clean worktree after every job.** A last step, run even after a failure, fails the job when anything is modified
  or untracked (`git status --porcelain`): a generator, a lockfile resolution or a test that writes into the tree.
  Each check that can fail this way names its fix, in the step's name and in its message: Codex's "Check formatting
  (run `just fmt` to fix)", and "Run `just write-config-schema` to overwrite with your changes".
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
