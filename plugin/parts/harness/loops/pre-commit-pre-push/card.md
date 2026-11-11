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
related: [ci-clean-infra, autoformat-hook, secret-scanning, stop-hook]
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
- **The hooks**, with the pre-commit framework: `.pre-commit-config.yaml` lists them, each with its `stages`, and
  `default_install_hook_types: [pre-commit, pre-push]`, so that `pre-commit install` installs both. A hook fails when
  it exits non-zero or modifies files ("Files were modified by this hook").
- **The `run`** is `pre-commit run --all-files` over the directory: it prints each hook as passed or failed with the
  tool's own `file:line: message` lines, and exits non-zero when any hook fails.
- **Cases.** Must fire: a staged file with a lint error; a staged file that is not formatted. For the guard below, a
  recorded PreToolUse input with `git commit --no-verify`. Must pass: a clean staged change.
- **Out of the agent's reach.** `git commit --no-verify` skips the pre-commit hook, and `git push --no-verify` skips
  the pre-push hook completely. A PreToolUse hook on `Bash` in `.claude/settings.json` denies both (exit 2, with the
  reason on stderr, which Claude sees). The agent can also edit `.pre-commit-config.yaml`, so CI runs
  `pre-commit run --all-files` on every PR ([ci-clean-infra](../ci-clean-infra/card.md)): a skipped or weakened hook
  still fails there.
- **Wiring:** `.pre-commit-config.yaml` and `pre-commit install` in the agent's workspace, the PreToolUse guard, and
  the CI job.

## Notes

- Stripe works by the principle of "shifting feedback left": its pre-push hooks fix the most common lint issues, and
  a background daemon precomputes which lint rules apply to a change and caches the results, so "developers can
  usually get lint fixes in well under a second on a push." Its agents loop on lint locally before pushing.
- A check of a few seconds, such as the type check, runs at the end of every turn in a
  [Stop hook](../stop-hook/card.md); one that takes minutes runs in CI.
