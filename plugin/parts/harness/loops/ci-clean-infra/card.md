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
related: [pre-commit-pre-push, platform-matrix, isolated-environment, dependency-updates]
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
  - title: "opencode-watches.ts: CI wakes the session, with caps"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/provider/opencode-watches.ts#L30-L32"
    author: "opencode (anomalyco)"
    note: "5 wakes in 10 minutes and 20 since the person's last prompt, \"so agents can't loop\"."
  - title: "opencode-watches.ts: the watch tool's description"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/provider/opencode-watches.ts#L611-L616"
    author: "opencode (anomalyco)"
  - title: "opencode-watches.ts: what a pushed branch or an opened PR starts watching"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/provider/opencode-watches.ts#L685-L690"
    author: "opencode (anomalyco)"
  - title: "opencode-watches.ts: comments from others are information"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/provider/opencode-watches.ts#L711-L712"
    author: "opencode (anomalyco)"
  - title: "ci.yml: the merge-queue skipper, and a job that runs only when it says not to skip"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/ci.yml#L34-L54"
    author: "gemini-cli (Google)"
  - title: "ci.yml: the CI job accepts skipped"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/ci.yml#L486-L519"
    author: "gemini-cli (Google)"
    note: "its needs omit the skipper, so a failed skipper skips every check and CI passes."
  - title: "validate-plugins.yml: six path carve-outs for a required check"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/validate-plugins.yml#L3-L70"
    author: "Anthropic"
    note: "its comments disagree on whether a dispatched run satisfies the required check (L25-L41 against L63-L70)."
  - title: "scan-plugins.yml: no path filter, the skip inside the job"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L3-L9"
    author: "Anthropic"
  - title: "bump-plugin-shas.yml: required checks dispatched on bot PRs"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/bump-plugin-shas.yml#L9-L17"
    author: "Anthropic"
  - title: "ci.yml: a test matrix built from packages/*/"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/ci.yml#L64-L118"
    author: "pi (earendil-works)"
  - title: "release.yml: the stable release runs the suite before any publish"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/release.yml#L82-L96"
    author: "opencode (anomalyco)"
  - title: "check-test.yml: the Windows browser legs off the release gate"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/check-test.yml#L224-L233"
    author: "opencode (anomalyco)"
  - title: "setup-bun: pull requests never save the cache"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/actions/setup-bun/action.yml#L54-L78"
    author: "opencode (anomalyco)"
  - title: "turbo.json: the CI configuration in the task-cache key"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/turbo.json#L3-L19"
    author: "opencode (anomalyco)"
  - title: "check-process-daemon.yml: no cache on failure, serial reruns of a failed suite"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/check-process-daemon.yml#L148-L195"
    author: "opencode (anomalyco)"
  - title: "find-polluter.sh"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/systematic-debugging/find-polluter.sh#L37-L72"
    author: "superpowers (obra)"
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
  caches by the lockfile's hash and the CI configuration, so a cache cannot carry state from another branch or an
  older CI. A pull request's run restores caches and never saves them, so its code cannot plant packages a release
  build restores; a failed or timed-out run saves none: at opencode, a "timed-out run once saved a partial cache that
  broke re-runs".
- **An autofix job** runs the formatters and the fixable lint rules and commits the result to the branch. The agent
  pulls before its next change.
- **Logs the agent can read.** `gh run view --log-failed` shows "the log for any failed steps in a run or specific
  job"; `--exit-status` makes the command "Exit with non-zero status if run failed". When a suite fails, opencode
  reruns it serially with its output (`--test-threads=1 --nocapture`), so the failing test and its output sit
  together while green runs stay fast.
- **A watcher that fails fast and names the local command.** gemini-cli's `ci` skill finds the branch's runs, polls
  every 15 seconds and stops at the first failed job. It prints the failures by test file, without stack traces or
  install noise, at most 10 per file and 500 characters each, then the command that reruns exactly those files
  (`npm test -w <workspace> -- <files>`, or `npm run lint:all`), and exits 1. The agent runs that command before it
  reads any code.
- **Wake on the result instead of waiting for it.** Where the runtime can resume a session on an event, the agent
  ends its turn after a `git push` or `gh pr create` and wakes as each check finishes: opencode tells it "don't wait
  on CI with `gh pr checks --watch`, `gh run watch` or `sleep`". Cap the wakes, "so agents can't loop": 5 in 10
  minutes and 20 since the person's last prompt. Only the person's comments steer; others' are "information for the
  task".
- **A limit on CI rounds: two, then a person.** Stripe lints "locally before pushing an agent's branch", runs CI
  once, gives the agent "one more chance to fix the failing test locally", and after the second run sends the branch
  "back to its human operator", because of "diminishing marginal returns" from more rounds.
- **A required check always reports.** A required workflow with a `paths:` filter does not run on a PR that touches
  none of its paths, and the PR waits on "Expected — Waiting for status to be reported" for good. Anthropic's
  validate workflow has grown six path carve-outs, one per kind of PR that would wait there; its scan workflow has no
  filter and "skips the heavy scan setup at the step level". Do the second. A dispatched run is no stand-in:
  Anthropic's bump job relies on one for bot PRs, while its validate workflow records that one on a PR's head "can't
  satisfy the gate". Where a bot's PRs start no `pull_request` run, dispatch the checks, then read `gh pr checks <pr>
  --required` and fail when one is missing on the head commit ([dependency-updates](../dependency-updates/card.md)).
- **A required job that only an explicit success passes.** A required check that depends on other jobs is skipped
  when one of them fails, and a skipped required check can look green. Codex's merge gate is one `required` job with
  `if: always()` over every check; its script prints `<job>: <result>` and fails on anything but `success`: "for a
  required fan-in job, only an explicit success is safe to accept". Its `needs:` list is "the version-controlled list
  that the main-branch ruleset should require", so dropping a check from the gate is a diff a person reviews. A skip
  counts only when the job that decided it succeeded: gemini-cli's `CI` job accepts `skipped`, and its lint, tests
  and CodeQL run only when a merge-queue skipper outputs `skip == 'false'`, so when the skipper fails they are skipped
  and `CI` prints "All CI jobs passed!". Put the skip decision in the gate's `needs`, and require its `success`.
- **The matrix cannot forget a package.** pi builds one test job's `--workspace` list from `packages/*/`, minus the
  two suites with jobs of their own, "so new packages are tested without editing this workflow". Its `--if-present`
  still lets a package with no test script pass untested.
- **A release does not race its commit's CI.** opencode's stable release runs the full suite as a job that every
  publish job needs, since otherwise "a stable release would publish whatever that run later says". The Windows
  browser legs, which flake, are off that gate by name, with the reason, and run on pushes and nightly.
- **The local lint and the CI lint read the same rules.** When the agent lints with one tool and CI with another, a
  rule present in only one costs a CI round. A check that diffs the two configurations and prints the line to add
  keeps them equal; Codex's compares Cargo's clippy levels with Bazel's flags, since "Bazel clippy does not ingest
  Cargo lint levels automatically".
- **A clean worktree after every job.** A last step, run even after a failure, fails the job when anything is modified
  or untracked (`git status --porcelain`): a generator, a lockfile resolution or a test that writes into the tree.
  Each check that can fail this way names its fix, in the step's name and in its message: Codex's "Check formatting
  (run `just fmt` to fix)". To find the test that wrote, superpowers' `find-polluter.sh <path> <pattern>` runs each
  test file alone and stops at the first after which the path exists.
- **`run`** judges the CI run of the branch's head commit and prints one line per job, `<job>: <status>`: `passed`,
  `failed` with the first error line as `file:line: message`, `missing` for a required check with no run, or `no run
  for <sha>` while CI has not run the head commit. It exits non-zero on anything but `passed`.
- **Cases** are recorded CI runs. Must fire: a run with one failed job; a run for an older commit than the head; a
  PR touching only a path a required workflow filters out; a gate job that passed while the skip decision failed and
  every job was skipped; a package no job tests. Must pass: every job green at the head; a docs-only PR whose jobs
  skipped on a skip decision that succeeded.
- **Wiring.** The CI jobs are required checks on the protected branch, so the agent cannot merge a red run. A
  PreToolUse hook denies the agent's writes to the workflow files, and a person reviews changes to them: removing a
  job is not a fix.

## Agent step

An investigator reads the failing job's log and returns a Diagnosis: the cause, the log lines that show it, the next
step. It keeps thousands of log lines out of the working agent's context. It never blocks; the CI job does.
