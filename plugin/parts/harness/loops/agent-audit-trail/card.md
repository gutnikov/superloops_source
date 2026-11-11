---
id: agent-audit-trail
title: "Audit trail of agent actions"
summary: "The agent leaves evidence: commands with their output, screenshots, videos, commits. The reviewer checks the evidence instead of re-running everything."
sensor: human
ilities: [security]
places: [delivery/gate, remediation/gate, maintenance/gate]
stages: [task]
speed: [minutes]
needs: []
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
---

## Why

An agent's "done" is a claim. A reviewer who cannot see what the agent ran either trusts the claim or runs
everything again. Evidence left along the way (commands with their output, screenshots, commits) lets the reviewer
check the claim instead.

## How it works

As the agent works, it keeps the commands it ran with their output, screenshots, videos and commits. When the agent
says a task is done, the reviewer checks that claim against this evidence.

A progress file, updated after every session, keeps that record from one session to the next.

The card's source does not say what the reviewer does when evidence is missing, is partial or does not match the agent's claim. It also does not say what goes back to the agent in that case.

## Set up

- Tell the agent to follow the rule from the Claude Code docs: "show evidence rather than asserting success". The source does not say where to put this rule.
- Keep a progress file and update it after every session ([progress-file-feature-list](../progress-file-feature-list/card.md)). The source does not say who writes this file or where to keep it.
