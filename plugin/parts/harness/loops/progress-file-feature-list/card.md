---
id: progress-file-feature-list
title: "Progress file and feature list"
summary: "An initializer creates a JSON list of features, each with `\"passes\": false`. Every session takes one feature and marks it as passing only after an e2e check."
sensor: computational
ilities: [correctness]
places: [delivery/oracle, delivery/gate]
stages: [task]
speed: [minutes, hours]
needs: []
related: [acceptance-loop]
links:
  - title: "Effective harnesses for long-running agents"
    url: "https://anthropic.com/engineering/effective-harnesses-for-long-running-agents"
    author: "Anthropic"
  - title: "Effective harnesses for long-running agents"
    url: "https://businessdatasolutions.github.io/ai-wiki/sources/2025-11-26-anthropic-effective-harnesses-long-running-agents"
    note: "AI wiki summary"
  - title: "Effective harnesses for long-running agents"
    url: "https://daily.dev/posts/effective-harnesses-for-long-running-agents-7clzunmmu"
    note: "daily.dev"
---

## Why

Work that spans many sessions loses its state between them, and an agent's word that a feature is done is not
evidence. With this loop, each new session reads from the list which features have passed an e2e check. One feature
per session keeps each claim small enough to check.

## How it works

1. An initializer creates a JSON list of features, each with `"passes": false`.
2. Every session takes one feature from the list.
3. The session marks that feature as passing only after an e2e check.

## Set up

- Use Anthropic's template from the article "Effective harnesses for long-running agents". The source entry gives no more setup steps than this.

## Notes

The source entry leaves out these points. Decide them yourself before you set up the loop:

- what the progress file is, and how it differs from the feature list
- what the initializer is, and what it builds the feature list from
- how a session picks which feature to take
- what a session does when the e2e check fails, or when the session ends before the feature passes

The [acceptance loop](../acceptance-loop/card.md) is the same idea built on requirements, an approved spec and
acceptance tests derived from it; it settles these points.
