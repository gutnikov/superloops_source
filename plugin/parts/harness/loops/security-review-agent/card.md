---
id: security-review-agent
title: "Security and data-handling review by an agent"
summary: "A subagent checks the code against a security checklist or against rules such as \"user names never reach the frontend\", and returns findings with line numbers."
sensor: inferential
ilities: [security]
places: [remediation/entry]
stages: [scheduled]
speed: [minutes]
needs: []
agent: [reviewer]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
---

## Why

Some rules are not a pattern on one line: "user names never reach the frontend" is about where data goes. A reviewer
with the project's checklist reads the code against such rules. Run periodically, it catches what got past the checks
on each change.

## How it works

A reviewer subagent checks the code against a security checklist or against rules such as "user names never reach
the frontend". It only reads, and does not change the code. Each finding names the rule it breaks and the line. A
finding verifier then confirms each finding.

## Set up

- Use the `security-reviewer` subagent from the Claude Code docs. The source does not say where to write your own checklist or rules for it.
- Run the review periodically, not on every commit. Böckeler runs these reviews this way. The source gives no interval.

## Agent step

A reviewer whose lens is the project's security checklist (rules such as "user names never reach the frontend"). It
gets the diff, reads only, and returns Findings with the rule and the line; a finding verifier confirms each one. It
blocks only once calibrated on seeded vulnerabilities that must fire and clean diffs that must pass
([agent-calibration](../agent-calibration/card.md)).
