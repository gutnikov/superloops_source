---
id: agent-ci-hardening
title: "Agents in CI run with their guards on"
summary: "A CI check finds every workflow job that runs an agent and fails when one lacks the egress firewall, the reviewed permission mode or a model that supports it; exemptions carry a reason."
sensor: computational
ilities: [security]
places: [harness:delivery/gate, harness:maintenance/gate]
stages: [ci]
speed: [seconds]
needs: [ci]
related: [risky-action-gates, approval-reviewer-agent, isolated-environment, garbage-collection, repo-health-agent, triage]
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
  - title: "check_workflow_hardening.py: the permission-mode check"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/scripts/check_workflow_hardening.py#L109-L152"
    author: "Anthropic"
  - title: "check_workflow_hardening.py: the allow-list check"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/scripts/check_workflow_hardening.py#L277-L309"
    author: "Anthropic"
  - title: "egress-firewall.yaml"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/egress-firewall.yaml#L1-L5"
    author: "Anthropic"
  - title: "non-write-users-check.yml"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/.github/workflows/non-write-users-check.yml#L2-L44"
    author: "Anthropic"
    note: "a one-time warning on a pull request that lets users without write access trigger an agent."
---

## Why

An agent in CI runs with nobody watching: it triages issues, reviews pull requests, fixes what a bot asks. Its
guards live in the workflow file, a runner label, a flag in its arguments, the model name, and one edit drops any of
them without a test failing. The job still succeeds, now able to reach any host or run any command, often on input
that a stranger wrote in an issue. This loop makes the guards a check: a workflow that runs an agent without them
does not merge.

## How it works

On every pull request and every push to the main branch, a script reads the workflows, finds each job that runs an
agent, and checks it:

- **The network is filtered.** The job runs on a runner that filters outbound traffic, and the allow list is in
  enforce mode, not empty, with every host named in full: no `*`.
- **Permissions are reviewed, not off.** Every agent step sets the permission mode the project chose (for Claude
  Code, `--permission-mode auto`, so a call outside the allowed tools runs only if the safety review passes it), and
  none passes `--dangerously-skip-permissions` or sets a default mode in its settings.
- **The model supports that mode.** The model named in the step, its environment or its settings is new enough;
  Anthropic's CLAUDE.md: "on an older one Claude Code falls back to its default permission mode."

Each problem is one line that names the job and the fix, such as "add '--permission-mode auto' to 'claude_args'
under the step's 'with:'". A companion check warns once, on the pull request itself, when a change lets users
without write access trigger an agent.

## Set up

- **The rules in CLAUDE.md or AGENTS.md**, where an agent that edits a workflow reads them, ending with "Do not skip
  or weaken the check."
- **The allow list as a file** in the repository, each host with what uses it.
- **Exemption tables in the script**, keyed by workflow and job, each with a reason that every run prints. An
  exemption is a reviewed line in a diff, not a silent skip.
- **Find every agent job.** Match the agent's action, its marker variables and any `run` step that invokes the
  agent's command line. A job the script cannot see is the gap: name the patterns it matches in the rules, so a
  reviewer checks a new kind of job by hand.
- **`run`** prints one line per problem, `<workflow>:<job>: <problem>. <fix>`, and one line per exemption with its
  reason. It exits non-zero on any problem.
- **Cases.** Must fire: an agent job on a plain runner; a step with `--dangerously-skip-permissions`; a step whose
  model predates the permission mode; an allow list with `*.example.com`; an allow list in a mode other than enforce.
  Must pass: the repository's workflows; an exempted job, whose reason is printed.
- **Wiring:** a required CI job on every pull request and on the main branch. The workflow files and the script are
  reviewed by their code owners, so an agent cannot loosen both in one change.

## Notes

- [risky-action-gates](../risky-action-gates/card.md) checks that the gates of the agent's own session stand; this
  loop checks the agents a project runs unattended.
- A filtered network and a reviewed permission mode are two different guards. Keep both: a review a prompt
  injection talks its way past still cannot reach a host the firewall blocks.
