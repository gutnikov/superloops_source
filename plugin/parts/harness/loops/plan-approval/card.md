---
id: plan-approval
title: "Plan approval"
summary: "The agent studies the code read-only and proposes a plan; a person edits and approves it, and the agent then works by the plan on its own."
sensor: human
ilities: [alignment]
places: [delivery/oracle, discovery/oracle]
stages: [task]
speed: [minutes]
needs: []
when: [before]
initiator: agent
sync: blocking
assesses: [plan]
related: [interview]
links:
  - title: "Best practices for Claude Code"
    url: https://code.claude.com/docs/en/best-practices
    note: "plan mode"
  - title: "Claude Code day by day"
    author: Rick Hightower
  - title: "Spec-driven development"
    author: Towards AI
---

## Why

A misunderstanding is cheapest to fix before the work starts. An agent that works autonomously on a wrong plan
spends hours going the wrong way. A person who reads the plan first spends a minute and saves those hours. A plan
is also shorter to read than the diff it leads to.

## How it works

1. The agent studies the code in read-only mode and proposes a plan.
2. The person edits the plan and approves it. In Claude Code, the plan can be opened in the editor and edited
   directly (Rick Hightower).
3. The agent carries out the approved plan on its own.

Use a plan when you roughly know what you want. When the goal is vague, use an [interview](../interview/card.md)
instead (Towards AI).

## Set up

- In Claude Code, you can save the approved plan in the repository so that it outlives the session (Rick Hightower).
