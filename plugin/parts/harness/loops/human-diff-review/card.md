---
id: human-diff-review
title: "Diff review by a person"
summary: "The person comments on the PR; the agent fixes the comments and replies in the thread."
sensor: human
ilities: [alignment, maintainability]
places: [delivery/gate, remediation/gate, maintenance/gate]
stages: [ci]
speed: [hours, days]
needs: [ci]
when: [after]
assesses: [code, intent]
related: [agent-code-review]
links:
  - title: "Human review"
    author: "Matt Pocock"
    note: "AI Hero"
  - title: "Human-in-the-loop AI coding"
    author: "Kilo"
    note: "vendor material"
---

## Why

Tests check that the code works, and an AI review removes the obvious. Neither says whether this is the right
change, or whether the approach fits the codebase; a person reading the diff can.

## How it works

1. An AI review checks the PR first: [code review by another agent](../agent-code-review/card.md).
2. The person reads the diff and comments on the PR.
3. The agent fixes the comments and replies in the thread.

## Set up

- Have the person read the diff, not the description. The side under review writes the description; the diff is
  the primary source. Leave the person what only they can judge: is this the right change, and does the approach
  fit the codebase (AI Hero).
- Run an automated AI review first to remove the obvious, then have a person look (Kilo).
- Keep diffs small. A large diff all but guarantees a rubber-stamp review (the source note cites no source for this).
