---
id: architecture-fitness-functions
title: "Architecture fitness functions"
summary: "The agent adds an import and runs `dependency-cruiser` or ArchUnit; a broken rule returns a message that names the rule and describes the layers, and the agent moves the code."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [commit, ci]
speed: [seconds]
needs: []
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

An import in the wrong direction still builds and runs, so building and running the code do not catch it. Each such
import blurs the layers a little more. A rule for the direction of dependencies catches the import as soon as the
agent adds it. Its message describes the layers, so the agent learns where the code belongs instead of guessing.

## How it works

After adding an import, the agent runs `dependency-cruiser` or ArchUnit. If the import breaks a rule, the agent sees a message that names the rule and describes the layers, such as:

"clients-no-services: API clients must not depend on the orchestration layer…"

The agent finds in the message which layer the code belongs in, and moves the code there.

## Set up

Add these rules to `dependency-cruiser` or ArchUnit:

- rules for the direction of dependencies
- a rule that a new file goes only into one of the predefined folders

Give each rule a message that describes the layers. The agent uses that description to find the right layer.

Example of layers from OpenAI: every domain has the layers Types → Config → Repo → Service → Runtime → UI, and cross-cutting concerns come in only through Providers. Linters and structural tests check all of it.
