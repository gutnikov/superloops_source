---
id: agent-ci-hardening
title: "Agents in CI run with their guards on"
summary: "A CI check finds every workflow job that runs an agent and fails when one lacks its guards: egress firewall, reviewed permissions, tool list and turn cap, no write token near untrusted text."
sensor: computational
ilities: [security]
places: [harness:delivery/gate, harness:maintenance/gate]
stages: [ci]
speed: [seconds]
needs: [ci]
related: [risky-action-gates, approval-reviewer-agent, isolated-environment, garbage-collection, repo-health-agent, triage, release-trust-boundary, third-party-extension-scan]
links:
  - title: "CLAUDE.md: Security hardening for GitHub Actions"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CLAUDE.md#L5-L40"
    author: "Anthropic"
    note: "the firewall runner, the allow list in enforce mode, --permission-mode auto on a model that supports it; \"Do not skip or weaken the check.\""
  - title: "workflow-hardening.yml"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/workflows/workflow-hardening.yml#L1-L12"
    author: "Anthropic"
  - title: "check_workflow_hardening.py: the model floor and the exemption tables"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/scripts/check_workflow_hardening.py#L20-L31"
    author: "Anthropic"
  - title: "check_workflow_hardening.py: how a job is found to call Claude"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/scripts/check_workflow_hardening.py#L14-L106"
    author: "Anthropic"
    note: "the two Claude actions, a local action with claude_args, or the marker anthropic_federation_rule_id."
  - title: "check_workflow_hardening.py: the permission-mode check"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/scripts/check_workflow_hardening.py#L109-L209"
    author: "Anthropic"
    note: "# lines ignored; an exempt job must set no mode; a settings path outside the repository fails."
  - title: "check_workflow_hardening.py: defaultMode anywhere in the job"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/scripts/check_workflow_hardening.py#L255-L265"
    author: "Anthropic"
    note: "catches a settings file that an earlier step of the job writes."
  - title: "check_workflow_hardening.py: the allow-list check"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/scripts/check_workflow_hardening.py#L277-L309"
    author: "Anthropic"
  - title: "check_workflow_hardening.py: the result when no job is found"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/scripts/check_workflow_hardening.py#L320-L335"
    author: "Anthropic"
  - title: "egress-firewall.yaml"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/egress-firewall.yaml#L1-L5"
    author: "Anthropic"
  - title: "non-write-users-check.yml"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/workflows/non-write-users-check.yml#L2-L44"
    author: "Anthropic"
    note: "a one-time warning on a pull request that lets users without write access trigger an agent."
  - title: "claude-plugins-official scan-plugins.yml: sign-in and redaction"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L199-L255"
    author: "Anthropic"
    note: "Claude through a third-party action with anthropic-federation-rule-id; key-shaped strings redacted before cache, artifact or comment."
  - title: "claude-plugins-official scan-plugins.yml: model text neutralized"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L314-L338"
    author: "Anthropic"
  - title: "gemini-cli: scheduled issue triage, the agent step"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/gemini-scheduled-issue-triage.yml#L175-L204"
    author: "gemini-cli (Google)"
    note: "GITHUB_TOKEN blanked, read_file only, 25 turns."
  - title: "gemini-cli: ci-policy.toml"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/tools/gemini-cli-bot/ci-policy.toml#L1-L16"
    author: "gemini-cli (Google)"
  - title: "gemini-cli: the bot's reasoning job"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/gemini-cli-bot-brain.yml#L46-L163"
    author: "gemini-cli (Google)"
    note: "read-only permissions (L46-L50); the agent runs with ci-policy.toml (L163)."
  - title: "gemini-cli: release-notes.yml"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-notes.yml#L23-L107"
    author: "gemini-cli (Google)"
    note: "the release notes interpolated into the agent's prompt in a job with contents: write."
  - title: "gemini-cli: chained_e2e.yml"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/chained_e2e.yml#L3-L181"
    author: "gemini-cli (Google)"
    note: "workflow_run; the PR's repository and SHA from an artifact, built and run with GEMINI_API_KEY; no environment."
  - title: "gemini-cli: lint.js, the pinning check"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/lint.js#L397-L471"
    author: "gemini-cli (Google)"
  - title: "gemini-cli: CODEOWNERS"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/CODEOWNERS#L1-L13"
    author: "gemini-cli (Google)"
  - title: "pi: issue-analysis.yml, the analyze job"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/issue-analysis.yml#L254-L362"
    author: "pi (earendil-works)"
    note: "a checkout that keeps its token, auth.json in RUNNER_TEMP, GH_TOKEN under the workflow's issues: write."
  - title: "sandcastle: agent-update-branch.yml"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/agent-update-branch.yml#L3-L24"
    author: "sandcastle (Matt Pocock)"
  - title: "sandcastle: agent-explore.yml"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/agent-explore.yml#L24-L102"
    author: "sandcastle (Matt Pocock)"
    note: "a read-only agent job; issue text through a JSON file; no GH_TOKEN in the agent's step."
---

## Why

An agent in CI runs with nobody watching: it triages issues, reviews pull requests, fixes what a bot asks. Its
guards live in the workflow file, a runner label, a flag in its arguments, the model name, the token in its
environment, and one edit drops any of them without a test failing. The job still succeeds, now able to reach any
host, run any command or write to the repository, often on input that a stranger wrote in an issue. This loop makes
the guards a check: a workflow that runs an agent without them does not merge.

## How it works

On every pull request and every push to the main branch, a script reads the workflows, finds each job that runs an
agent, and checks it:

- **The network is filtered.** The job runs on a runner that filters outbound traffic, and the allow list is in
  enforce mode, not empty, with every host named in full: no `*`.
- **Permissions are reviewed, not off.** Every agent step sets the permission mode the project chose (for Claude
  Code, `--permission-mode auto`, so a call outside the allowed tools runs only if the safety review passes it). None
  passes `--dangerously-skip-permissions`, sets a default mode in its settings, or loads a policy that allows shell
  and file writes outright, as gemini-cli's bot does: its policy "guarantees permission for shell commands and file
  writing", at `priority = 999`.
- **The model supports that mode.** The model named in the step, its environment or its settings is new enough;
  Anthropic's CLAUDE.md: "on an older one Claude Code falls back to its default permission mode."
- **The agent's reach is listed**: a tool allow list and a turn cap on each step (gemini-cli's triage: `"core":
  ["read_file"]`, `"maxSessionTurns": 25`).
- **Untrusted text meets no write token.** When the trigger carries text anyone can write (an issue, a comment, a PR
  title, release notes), the agent's job is read-only, its step holds no token (gemini-cli: `GITHUB_TOKEN: ''`), its
  checkout sets `persist-credentials: false`, and the text arrives as a file, never through `${{ }}` (sandcastle:
  "Never read issue titles or bodies into shell or `${{ }}`"). A separate job with one narrow write scope applies
  what the agent proposed, after the checks in [triage](../triage/card.md).
- **A fork's code runs with no secret.** A `pull_request_target` job runs only when `head.repo.full_name ==
  github.repository`; a `workflow_run` job that checks out a SHA the triggering run handed over waits for an
  environment's approval before any step with a secret.
- **Every `uses:` is pinned to a 40-character SHA**, so a tagged agent action cannot be repointed under the job
  (gemini-cli's lint prints the fix, `ratchet pin .github/workflows/*.yml .github/actions/**/*.yml`).

Each problem is one line that names the job and the fix, such as "add '--permission-mode auto' to 'claude_args'
under the step's 'with:'". A companion check warns once, on the pull request itself, when a change lets users
without write access trigger an agent.

## Set up

- **The rules in CLAUDE.md or AGENTS.md**, where an agent that edits a workflow reads them, ending with "Do not skip
  or weaken the check."
- **The allow list as a file** in the repository, each host with what uses it.
- **Exemption tables in the script**, keyed by workflow and job, each with a reason that every run prints. An
  exemption is a reviewed line in a diff, not a silent skip, and covers one rule: a job exempt from auto mode that
  sets any mode fails.
- **Find every agent job, by more than one pattern**: the agent's action, its sign-in inputs spelled with `_` and
  with `-`, its key's name, a `run` step that invokes its command line. Run on claude-plugins-official, Anthropic's
  check would miss the scan job, which calls Claude through a third-party action with `anthropic-federation-rule-id`,
  and print "OK: no workflow job calls Claude, so there was nothing to check." The rules list the repository's agent
  jobs, and finding fewer fails.
- **The writer neutralizes what it posts.** Agent output shaped by untrusted input reaches a public comment with
  Markdown control characters replaced, inside a code span, cut to a length, and with key-shaped strings redacted
  before any cache, artifact or comment (claude-plugins-official: `sk-ant-[A-Za-z0-9_-]{8,}` to `[REDACTED]`): "code
  spans neutralize auto-linked bare URLs that a prompt-injected upstream could smuggle in".
- **The model's credential is short-lived and out of the agent's reach**: OIDC where the provider allows it
  (claude-plugins-official: "a token that expires in minutes"), no login file the agent's shell can read, and an
  agent check that cannot sign in fails instead of skipping.
- **`run`** prints one line per problem, `<workflow>:<job>: <problem>. <fix>`, and one line per exemption with its
  reason. It exits non-zero on any problem.
- **Cases.** Must fire: an agent job on a plain runner; a step with `--dangerously-skip-permissions`; a model that
  predates the permission mode; an allow list with `*.example.com`, or not in enforce mode; `--permission-mode auto`
  commented out; an exempt job that sets a mode; a settings path outside the repository; `defaultMode` in a settings
  file an earlier step writes; a policy that allows shell and file writes behind a read-only token only; an
  issue-triggered agent step with the job's token under `issues: write`; an agent job whose checkout keeps its token
  in `.git/config`; a model login file the agent's shell can read (pi's issue analysis has these three); a prompt
  that interpolates PR titles or release notes in a job that can write; a `workflow_run` job that runs a fork's SHA
  with a model key and no environment; a `uses:` at a tag; an agent action with a hyphenated sign-in input; agent
  jobs present and none found. Must pass: the repository's workflows; an exempted job, whose reason is printed. The
  neutralizer's own cases: a Markdown link, an `<img>`, a `|` and a key-shaped string come out inert.
- **Wiring:** a required CI job on every pull request and on the main branch. Code owners review the workflows, the
  composite actions and the script, so an agent cannot loosen a guard and its check in one change (gemini-cli's
  cover `.github/workflows/` only).

## Notes

- [risky-action-gates](../risky-action-gates/card.md) checks that the gates of the agent's own session stand; this
  loop checks the agents a project runs unattended.
- A filtered network, a reviewed permission mode and a token the agent never holds are three different guards. Keep
  all of them: a review a prompt injection talks its way past still cannot reach a host the firewall blocks, or write
  with a token it never had.
