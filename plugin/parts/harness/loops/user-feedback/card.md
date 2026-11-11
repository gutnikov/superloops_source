---
id: user-feedback
title: "User feedback"
summary: "A person writes acceptance criteria from user feedback. The agent works to those criteria and checks its work against them."
sensor: human
ilities: [alignment, usability]
places: [delivery/entry, delivery/oracle, remediation/entry, discovery/entry]
stages: [production]
speed: [days]
needs: []
related: [acceptance-loop]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
---

## Why

Users find what the existing spec missed. But feedback as users write it is nothing an agent can test against. No
sensor can check correctness until a person has said what the software should do.

## How it works

1. A person turns user feedback into acceptance criteria.
2. The agent gets these criteria and uses them as both the spec for its work and the test of that work.

The source does not say which person writes the criteria, where they are written down, or who turns them into a test that can run.

## Set up

The source names two tools for this loop, both from the Claude Code best practices (see the links):

- `gh issue view`, a GitHub CLI command
- a `/fix-issue` skill for the agent

The source does not say what the skill does, what input it takes or where to get it.

## Notes

- The human side of this loop: [production-users](../production-users/card.md).
- The [acceptance loop](../acceptance-loop/card.md) takes such criteria as its input and turns them into a spec, red acceptance tests and a gate.
