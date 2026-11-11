---
id: taste-invariants
title: "Taste invariants: custom lints"
summary: "The agent breaks a team convention, such as an unstructured log line, a misnamed schema or a file over the size limit; a custom lint flags the violation in seconds and tells the agent how to fix it."
sensor: computational
ilities: [maintainability, observability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

A team's conventions, such as structured logging or how schemas are named, are not checked by the compiler or the
tests. An agent breaks them without noticing, and each break makes the code less uniform. A custom lint turns
each convention into a check, and its error tells the agent how to fix the violation.

## How it works

1. The agent changes the code.
2. Custom lints check the code statically against the team's conventions, locally or in CI, within seconds.
3. Each lint error names the violation and says how to fix it.
4. The agent follows that instruction.

## Set up

- Write custom lints that check your team's conventions statically. OpenAI checks these conventions:
  - structured logging
  - naming of schemas and types
  - file size limits
  - reliability requirements
- Make each lint error tell the agent how to fix the violation, not only what is wrong.
- Run the lints locally and in CI.
