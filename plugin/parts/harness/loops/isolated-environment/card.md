---
id: isolated-environment
title: "Isolated reproducible environment"
summary: "At the start of every task, the agent gets a clean environment: a devbox, a devcontainer, or a worktree with its own instance of the app, so the sensors give the same result for the same code."
sensor: computational
ilities: [deployability, security]
places: [delivery/work, remediation/work, maintenance/work, discovery/work]
stages: [task]
speed: [seconds, minutes]
needs: []
related: [run-tests-first, ci-clean-infra, structured-logs, preview-environments]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
    note: "the app bootable per git worktree, with an ephemeral observability stack."
  - title: "Minions: Stripe's one-shot, end-to-end coding agents — Part 2"
    url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2"
    author: "Stripe"
    note: "a warmed devbox per task, with no production data and no confirmation prompts."
  - title: "Effective harnesses for long-running agents"
    url: "https://anthropic.com/engineering/effective-harnesses-for-long-running-agents"
    author: "Anthropic"
    note: "init.sh and a basic test at the start of every session."
  - title: "Configure the sandboxed Bash tool"
    url: "https://code.claude.com/docs/en/sandboxing"
    author: "Anthropic"
  - title: "Development containers"
    url: "https://code.claude.com/docs/en/devcontainer"
    author: "Anthropic"
  - title: "git-worktree"
    url: "https://git-scm.com/docs/git-worktree"
---

## Why

In a shared or reused environment, a test can fail because of something an earlier task left behind, and the agent
chases a fault that is not in its code. A clean environment for each task removes that cause: a red result no longer
comes from what an earlier task left behind. An environment that holds no production data also limits what a mistake
can damage.

## How it works

At the start of every task, the agent gets a new environment of its own, and at the end the environment is thrown
away. It takes one of three forms:

- **A devbox**, a machine per task. At Stripe, devboxes are "cattle, not pets", run in the QA environment, so the
  agents "don't have access to real user data, Stripe's production services, or arbitrary network egress", and a
  warmed pool lets Stripe "aim for it to be ready within 10 seconds".
- **A devcontainer.** With Claude Code installed in the container, "commands Claude runs execute inside it rather than
  on the host machine".
- **A git worktree with its own instance of the app.** OpenAI "made the app bootable per git worktree, so Codex could
  launch and drive one instance per change", with an observability stack "that's ephemeral for any given worktree". A
  worktree alone isolates only the files: it is "linked to the current repository, sharing everything except
  per-worktree files such as HEAD, index, etc.", and it shares the machine's database, ports and caches. The instance
  started for it brings its own.

## Set up

- **Pick the form**, and write the choice in CLAUDE.md: a worktree with its own instance when the app starts locally
  in seconds; a devcontainer when the toolchain must be the same on every machine; a devbox when the task needs
  services a laptop cannot run.
- **One command builds it**: a script such as `init.sh` that creates the environment, starts the app on free ports
  with its own database, and prints the address. Anthropic's long-running harness has an initializer agent write "an
  init.sh script that can run the development server"; each session starts by reading it, and runs "a basic test on
  the development server to catch any undocumented bugs".
- **Nothing shared**: its own database or schema, ports, caches, temporary directory and telemetry; no production data
  and no production credentials.
- **Teardown at the end of the task**: stop the app and its containers, drop its database, and
  `git worktree remove <path>` (only a clean worktree; `--force` for one with changes).
- **No confirmations only inside a boundary.** Stripe skips them because "the quarantined devbox environment means
  that the agent doesn't need confirmation prompts". Claude Code's `/sandbox` is such a boundary for shell commands
  only: "Claude's file tools, MCP servers, and hooks run outside it". It limits writes to the working directory and a
  per-user temp directory and sends network traffic through a proxy with an allowlist, and in auto-allow mode a
  sandboxed command runs with no prompt. In a devcontainer, `--dangerously-skip-permissions` is for unattended work,
  but "dev containers do not prevent a malicious project from exfiltrating anything accessible inside the container,
  including the Claude Code credentials"; restrict its network egress as well. A worktree is no boundary: it is a
  directory on the same machine.
- **`run`** builds two environments from the same commit, runs the project's quick suite in each, tears both down, and
  prints one line per check, `<check>: <status>`: `build: ok`, `same results: ok` or the tests whose results differ,
  `no collision: ok` (ports and database names differ), `teardown: ok` or what was left behind. It exits non-zero on
  any failed check.
- **Cases.** Must fire: a setup script with a fixed port, so the second environment cannot start; a setup that shares
  one database name, so the two runs see each other's data; a test that passes only when a file from an earlier run is
  in the temporary directory. Must pass: the clean setup.
- **Wiring.** The harness that starts the agent builds the environment before the session, and a SessionStart hook
  adds its address to the agent's context. CI runs `run` on every change to the setup files (`init.sh`,
  `.devcontainer/`), and a PreToolUse hook denies the agent's writes to them during a task.
