---
id: pre-commit-pre-push
title: "Pre-commit / pre-push"
summary: "Fast checks, such as linting, run when the agent commits or pushes; a failing check blocks the commit or the push before the change reaches CI."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [commit]
speed: [sub-second]
needs: []
related: [ci-clean-infra, autoformat-hook, secret-scanning, stop-hook, isolated-environment, agent-branch-integration, risky-action-gates]
links:
  - title: "Minions: Stripe's one-shot, end-to-end coding agents — Part 2"
    url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2"
  - title: "githooks"
    url: "https://git-scm.com/docs/githooks"
    author: "Git"
  - title: "git-push"
    url: "https://git-scm.com/docs/git-push"
    author: "Git"
  - title: "pre-commit"
    url: "https://pre-commit.com/"
  - title: "pi's pre-commit hook"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.husky/pre-commit"
    author: "pi (earendil-works)"
  - title: "check-lockfile-commit.mjs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/check-lockfile-commit.mjs"
    author: "pi (earendil-works)"
  - title: "opencode .husky/pre-push: the toolchain version first"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.husky/pre-push#L1-L20"
    author: "opencode (anomalyco)"
  - title: "sandcastle .husky/pre-commit: lint-staged without its stash"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.husky/pre-commit#L1-L4"
    author: "sandcastle (Matt Pocock)"
  - title: "check-no-partially-staged.mjs"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/scripts/check-no-partially-staged.mjs#L1-L45"
    author: "sandcastle (Matt Pocock)"
    note: "refs/stash is shared by every worktree; a partly staged file is refused."
  - title: "implement docs: a stash vanishing across parallel sessions"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement.md#L55-L57"
    author: "skills (Matt Pocock)"
  - title: "gemini-cli .husky/pre-commit: a failure message that names --no-verify"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.husky/pre-commit#L1-L9"
    author: "gemini-cli (Google)"
---

## Why

A problem that CI finds costs the agent a push and a wait for the result. A fast check at commit or push finds
the same problem before the change leaves the agent's workspace, and the fix is cheaper the earlier it comes.

## How it works

Fast checks run when the agent commits or pushes. A check that fails exits non-zero, git aborts the commit or the
push, and the check's output (`file:line: message`) comes back to the agent in the output of `git commit` or
`git push`. A hook that fixes files itself, such as a formatter, also stops the commit; the agent stages the fixed
files and commits again.

## Set up

- **Only what takes about a second** on the changed files. At pre-commit: the formatter's check and
  [secret scanning](../secret-scanning/card.md) of the staged files. At pre-push: the linter with its autofixes on
  the files the push changes, as at Stripe. The type check and the tests run at the end of a turn or in CI. A slow
  hook invites skipping it.
- **A slower check only when the staged paths need it.** Pi's pre-commit runs its browser smoke check only when
  `packages/ai/`, `packages/web-ui/` or the package files are staged, and a separate app's check only when its files
  or the shared packages are. With the pre-commit framework, a hook's `files` pattern does the same.
- **A lockfile change is a decision.** Pi's pre-commit blocks a staged `package-lock.json` unless the change only
  updates workspace metadata or `PI_ALLOW_LOCKFILE_CHANGE=1` is set, and its AGENTS.md tells the agent not to set it
  unless the user wants the lockfile committed.
- **The toolchain version before the checks.** A hook run by another version of the runtime or package manager can
  pass where CI fails, or fail where CI passes. opencode's pre-push hook first fails when Bun is outside the range of
  the `packageManager` field in `package.json`, and warns on any other version than the exact one, before it runs
  `bun run check`.
- **Safe for parallel worktrees.** Agents in several worktrees of one repository share `refs/stash`. lint-staged
  keeps a backup stash there, which in sandcastle's words "every worktree of the repo shares: parallel commits from
  different worktrees race on it, drop each other's entries". Run it with `--no-stash`. Without the stash a formatter
  would re-stage the unstaged hunks too, so the hook first refuses a file with both staged and unstaged changes:
  "Stage each file in full (git add <file>). Don't set the rest aside with `git stash`: the stash is shared by every
  worktree of this repo." Pocock's docs report stashes vanishing between parallel sessions for the same reason.
- **The hooks**, with the pre-commit framework: `.pre-commit-config.yaml` lists them, each with its `stages`, and
  `default_install_hook_types: [pre-commit, pre-push]`, so that `pre-commit install` installs both. A hook fails when
  it exits non-zero or modifies files ("Files were modified by this hook").
- **The `run`** is `pre-commit run --all-files` over the directory: it prints each hook as passed or failed with the
  tool's own `file:line: message` lines, and exits non-zero when any hook fails.
- **Cases.** Must fire: a staged file with a lint error; a staged file that is not formatted; a file staged in part.
  For the guard below, a recorded PreToolUse input with `git commit --no-verify`. Must pass: a clean staged change.
- **Out of the agent's reach.** `git commit --no-verify` skips the pre-commit hook, and `git push --no-verify` skips
  the pre-push hook completely. A PreToolUse hook on `Bash` in `.claude/settings.json` denies both (exit 2, with the
  reason on stderr, which Claude sees). A hook's failure message names the fix, never the bypass: gemini-cli's ends
  "in case of emergency, run: git commit --no-verify", which an agent reads as its next step. The agent can also
  edit `.pre-commit-config.yaml`, so CI runs `pre-commit run --all-files` on every PR
  ([ci-clean-infra](../ci-clean-infra/card.md)): a skipped or weakened hook still fails there.
- **Wiring:** `.pre-commit-config.yaml` and `pre-commit install` in the agent's workspace, the PreToolUse guard, and
  the CI job.

## Notes

- Stripe works by the principle of "shifting feedback left": its pre-push hooks fix the most common lint issues, and
  a background daemon precomputes which lint rules apply to a change and caches the results, so "developers can
  usually get lint fixes in well under a second on a push." Its agents loop on lint locally before pushing.
- A check of a few seconds, such as the type check, runs at the end of every turn in a
  [Stop hook](../stop-hook/card.md); one that takes minutes runs in CI.
