---
id: agent-code-review
title: "Code review by another agent"
summary: "The coding agent asks one or more reviewer agents, each with a fresh context, for a review, and fixes their comments until the reviewers are satisfied."
sensor: inferential
ilities: [maintainability, correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local]
speed: [minutes]
needs: []
agent: [reviewer]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "Claude Code power user tips"
    url: "https://support.claude.com/en/articles/14554000-claude-code-power-user-tips"
---

## Why

An agent that reviews its own change reads it with the reasoning that produced it, and misses what that reasoning
missed. A reviewer in a fresh context gets only the diff and the requirement. It can catch what is a matter of
judgement, such as semantic duplication and over-engineering, though only partly, at a cost, and not the same way
every time.

## How it works

1. The coding agent asks one or more reviewer agents for a review. Each reviewer agent starts with a fresh context.
2. The reviewer agents return comments.
3. The coding agent fixes the comments.
4. The coding agent asks for a review again, until the reviewer agents are satisfied.

At OpenAI almost all review happens between agents.

The source does not set a limit on review rounds. It also does not say what the coding agent should do if a reviewer agent is never satisfied.

## Set up

The source names two ways to set up this loop:

- a reviewer agent that runs as a subagent
- `/simplify`, a command in Claude Code (source: Claude Code power user tips)

The source does not say:

- what the reviewer agent checks
- how its comments reach the coding agent
- what `/simplify` does
- whether you use the two together or pick one

For what each reviewer checks and what it returns, follow Agent step below. It is this catalog's setup for the reviewer.

## Notes

- Böckeler: an LLM partly catches semantic duplication and over-engineering, but expensively and
  probabilistically.

## Agent step

Use one reviewer per lens: correctness, security, tests, performance, and the project's conventions. Each reviewer:

- works in a fresh context
- gets the diff and the requirement, not the coding agent's reasoning
- only reads
- returns Findings

A finding verifier checks each high finding. The coding agent acts on a high finding only after that check.

A reviewer blocks only once calibrated ([agent-calibration](../agent-calibration/card.md)). Until then, its findings are advice.
