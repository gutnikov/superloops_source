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
related: [run-tests-first, ci-clean-infra, structured-logs, preview-environments, agent-branch-integration, afk-run-handoff, agent-ci-hardening]
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
  - title: "Claude Code devcontainer: init-firewall.sh verifies itself"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.devcontainer/init-firewall.sh#L106-L136"
    author: "Anthropic"
    note: "default drop, REJECT \"for immediate feedback\"; example.com must fail and api.github.com must answer, or exit 1."
  - title: "Claude Code: HIPAA settings example, Check a computer"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/examples/settings/README-hipaa.md#L116-L127"
    author: "Anthropic"
    note: "after you deploy, and again after every edit."
  - title: "Claude Code changelog: sandbox.failIfUnavailable (2.1.83)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L7737"
    author: "Anthropic"
  - title: "verify SKILL.md: a world per run, the canary, the ledger and remote sandboxes"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.agents/skills/verify/SKILL.md#L10-L102"
    author: "sandcastle (Matt Pocock)"
  - title: "verify features/agents.md: declare exactly the agent's key"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.agents/skills/verify/features/agents.md#L20-L25"
    author: "sandcastle (Matt Pocock)"
  - title: "verify features/sandboxes.md: the live escape prompts"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.agents/skills/verify/features/sandboxes.md#L26-L33"
    author: "sandcastle (Matt Pocock)"
  - title: "envLeaks.ts: the canary, or an undeclared host secret by name or by value"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/verify/envLeaks.ts#L20-L55"
    author: "sandcastle (Matt Pocock)"
  - title: "protectGitMounts.ts: config, hooks and info read-only"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/src/protectGitMounts.ts#L1-L11"
    author: "sandcastle (Matt Pocock)"
  - title: "agent-update-branch.yml: one concurrency group per PR, and the push lease"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/agent-update-branch.yml#L26-L105"
    author: "sandcastle (Matt Pocock)"
  - title: "ADR 0003: a reused worktree only fast-forwards"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/docs/adr/0003-reuse-worktree-by-default.md#L11-L35"
    author: "sandcastle (Matt Pocock)"
  - title: "implement-spec: a key test skipped inside a worktree reported green"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement-spec.md#L66-L68"
    author: "skills (Matt Pocock)"
  - title: "implement: refs/stash is shared across worktrees"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement.md#L55-L57"
    author: "skills (Matt Pocock)"
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
  worktree alone isolates only the tracked files: it is "linked to the current repository, sharing everything except
  per-worktree files such as HEAD, index, etc.", so it shares the machine's database, ports, caches and `refs/stash`,
  and it lacks what git ignores: "Tests that read gitignored fixtures, local databases, or credentials can silently
  skip there" (Matt Pocock). The instance brings its own database, ports and caches; a check that needs untracked
  files runs where they are.

## Set up

- **Pick the form**, and write the choice in CLAUDE.md: a worktree with its own instance when the app starts locally
  in seconds; a devcontainer when the toolchain must be the same on every machine; a devbox when the task needs
  services a laptop cannot run.
- **One command builds it**: a script such as `init.sh` that creates the environment, starts the app on free ports
  with its own database, and prints the address. Anthropic's long-running harness has an initializer agent write "an
  init.sh script that can run the development server"; each session starts by reading it, and runs "a basic test on
  the development server to catch any undocumented bugs".
- **Nothing shared**: its own database or schema, ports, caches, HOME, temporary directory and telemetry; no
  production data and no production credentials.
- **One writer per branch.** Every workflow that changes a PR joins one concurrency group for that PR, with
  `cancel-in-progress: false`, so runs queue instead of racing. Every push carries
  `--force-with-lease=refs/heads/<branch>:<sha the run started from>`, so a push after someone else's fails
  ([afk-run-handoff](../afk-run-handoff/card.md)). A reused worktree is refreshed only by fast-forward, when clean
  and strictly behind; sandcastle: a `git reset --hard` "would silently destroy" the agent's unpushed commits. A
  second run handed a worktree in use is a must-fire case of
  [agent-branch-integration](../agent-branch-integration/card.md).
- **Teardown at the end of the task**: stop the app and its containers, drop its database, and
  `git worktree remove <path>` (only a clean worktree; `--force` for one with changes). Then a ledger lists what is
  left: git refs pushed, temporary branches or a merge in progress; worktrees; containers, images and sandbox
  processes; files under the run's HOME and temporary directory; env names seen in the sandbox. sandcastle: "Every
  `LEAK` line fails the verdict". A remote sandbox outlives teardown: it is gone when the provider lists none of the
  run's, and one that cannot be tied to the run is reported, not deleted.
- **No confirmations only inside a boundary.** Stripe skips them because "the quarantined devbox environment means
  that the agent doesn't need confirmation prompts". Claude Code's `/sandbox` is such a boundary for shell commands
  only: "Claude's file tools, MCP servers, and hooks run outside it". It limits writes to the working directory and a
  per-user temp directory and sends network traffic through a proxy with an allowlist, and in auto-allow mode a
  sandboxed command runs with no prompt. In a devcontainer, `--dangerously-skip-permissions` is for unattended work,
  but "dev containers do not prevent a malicious project from exfiltrating anything accessible inside the container,
  including the Claude Code credentials"; restrict its network egress as well. A worktree is no boundary: it is a
  directory on the same machine.
- **The boundary tests itself.** A limit on egress that was never tried is a claim. Anthropic's devcontainer firewall
  ends its setup with two probes: `https://example.com` must not answer, and `api.github.com` must, or the script
  prints "ERROR: Firewall verification failed" and exits 1. The blocked traffic is rejected, not dropped, "for
  immediate feedback". Anthropic's HIPAA settings example runs the same pair after deploying, "and again after every
  edit": a `curl` to an arbitrary host fails, one to the Git host answers. Set `sandbox.failIfUnavailable` (Claude
  Code 2.1.83) so a sandbox that cannot start ends the session instead of running it unsandboxed.
- **Probe from inside, too.** Set a canary variable, declared nowhere, where the sandbox starts; while the agent runs,
  read the env of every sandbox process, and fail on the canary or on a host secret the sandbox was not given, by name
  or by value. Declare only the agent's own key: an extra one "hides a leak rather than revealing one" (sandcastle).
  Then a real agent on its cheapest model gets one escape per prompt (read a planted fake `~/.ssh/id_ed25519` or a
  sibling directory; write `../outside.txt`, `.git/hooks/pre-commit`, `.git/config` or `~/.claude/settings.json`;
  `kill` a host process; run `env`), and the check reads the host, "Never the model's wording". A sandbox that
  commits needs `.git` writable; mount its `config`, `hooks` and `info` read-only: they decide what host git runs.
- **`run`** builds two environments from the same commit, runs the project's quick suite in each, tears both down, and
  prints one line per check, `<check>: <status>`: `build: ok`, `same results: ok` or the tests whose results differ
  between the two or from the main checkout, skips counted; `no collision: ok` (ports and database names differ),
  `egress: ok` (the blocked probe failed and the allowed one answered), `env: ok` or the leaked names,
  `escapes: ok` or the escape that worked, `ledger: clean` or its `LEAK` lines. It exits non-zero on any failed check.
- **Cases.** Must fire: a setup script with a fixed port, so the second environment cannot start; a setup that shares
  one database name, so the two runs see each other's data; a test that passes only when a file from an earlier run is
  in the temporary directory; a firewall rule that lets an arbitrary host through; a sandbox that inherits the host's
  env, canary included; a declared key the agent does not use; `.git/hooks` mounted writable; a test that reads a
  gitignored fixture and skips in the worktree; a container left after teardown. Must pass: the clean setup.
- **Wiring.** The harness that starts the agent builds the environment before the session, and a SessionStart hook
  adds its address to the agent's context. CI runs `run` on every change to the setup files (`init.sh`,
  `.devcontainer/`), and a PreToolUse hook denies the agent's writes to them during a task.
