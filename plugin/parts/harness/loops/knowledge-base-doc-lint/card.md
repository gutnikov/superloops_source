---
id: knowledge-base-doc-lint
title: "Doc linters for the knowledge base"
summary: "CI checks that the `docs/` folder is current, cross-linked and correctly structured. The agent reads the errors CI reports and fixes the docs."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/entry, maintenance/work]
stages: [ci, scheduled]
speed: [minutes]
needs: []
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

When `docs/` is the main source of truth, a stale or broken document misleads every agent that reads it. Code
does not fail when the docs fall behind it, so no other check notices. The doc linters turn out-of-date, unlinked
or badly structured docs into errors the agent can fix.

## How it works

1. CI runs the doc linters on the `docs/` folder.
2. The linters report an error for each document that is out of date, missing its cross-links or wrongly structured.
3. The agent reads these errors and fixes the documents.

## Set up

To set up the loop:

- Make `docs/` the main source of truth.
- Keep AGENTS.md short (about 100 lines at OpenAI) and use it as a table of contents.
- Add doc linters to CI that check that `docs/` is current, cross-linked and correctly structured.
- Add a "doc-gardening" agent that opens PRs for stale documents.
