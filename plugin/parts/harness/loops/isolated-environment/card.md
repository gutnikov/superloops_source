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
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Minions: Stripe's one-shot, end-to-end coding agents — Part 2"
    url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2"
  - title: "Effective harnesses for long-running agents"
    url: "https://anthropic.com/engineering/effective-harnesses-for-long-running-agents"
    author: "Anthropic"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
---

## Why

In a shared or reused environment, a test can fail because of something an earlier task left behind, and the
agent chases a fault that is not in its code. A clean environment for each task removes that cause: a red result
no longer comes from what an earlier task left behind. A devbox that holds no production data also limits what a mistake can damage.

## How it works

At the start of every task, the agent gets a new environment of its own, so nothing an earlier task left behind is in it. The environment takes one of three forms:

- a devbox
- a devcontainer
- a worktree with its own instance of the app

The source does not say:

- what a fresh environment per task costs
- which causes of changing results such an environment does not remove
- for which projects this loop is not worth it

## Set up

The source gives no setup steps. It gives examples of how teams give each task its own environment:

- Stripe gives each agent a devbox. Devboxes are "cattle, not pets" and hold no production data. Stripe warms them up in advance, so a devbox is ready in 10 seconds.
- OpenAI gives each worktree its own running app and its own ephemeral telemetry stack.

It also says that Anthropic gives the agent an `init.sh` script, but not what the script does, so this example does not show whether the script isolates a task.

## Notes

- Check that your environment is a sandbox before you let the agent run without confirmations. The source says that a sandbox lets the agent run without confirming each action. It does not say which of the three forms (devbox, devcontainer or worktree) counts as a sandbox.
