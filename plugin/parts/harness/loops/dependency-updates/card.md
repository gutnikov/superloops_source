---
id: dependency-updates
title: "Dependency updates"
summary: "Renovate or Dependabot opens a PR; the agent runs the sensors and fixes what broke. A script collects the age and activity of the dependencies, and an LLM writes recommendations."
sensor: computational
ilities: [compatibility, maintainability]
places: [maintenance/entry, maintenance/work]
stages: [scheduled]
speed: [minutes]
needs: [ci]
agent: [worker]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
---

## Why

A bot's update PR that turns red waits for a person, and while it waits the dependency stays old. This loop catches
those red PRs: an agent started on the PR fixes what the update broke. The script's data on the age and activity of
each dependency gives the recommendations facts to work from.

## How it works

The loop joins three parts:

- Renovate or Dependabot opens the update PR.
- A script collects the age and activity of each dependency.
- The agent takes the PR, runs the sensors and fixes what broke. It writes recommendations from the script's data.

## Set up

- Start the agent automatically on the bot's red PRs.

## Agent step

A worker takes the update PR, runs the sensors, fixes what broke and writes the recommendation from the dependency
data. It never merges; the loops on its PR decide whether to merge.
