---
id: garbage-collection
title: "Garbage collection"
summary: "On a schedule, background agents find code that breaks the repository's \"golden principles\" and open small PRs to fix it. At OpenAI most took under a minute to review and merged automatically."
sensor: inferential
ilities: [maintainability]
places: [maintenance/entry, maintenance/work]
stages: [scheduled]
speed: [minutes, hours]
needs: []
agent: [worker, reviewer]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

Code that breaks the golden principles piles up, and cleaning it up by hand took OpenAI every Friday. Background agents on a schedule do that cleanup instead and open one small PR per finding, so each fix is quick to review. The golden principles are written down in the repository, so the agents and whoever reviews their PRs judge code by the same principles.

## How it works

On a schedule, background agents look for code that breaks the "golden principles" written down in the repository, and open small PRs to fix it. At OpenAI, most of these PRs took under a minute to review and were merged automatically.

The source does not say:

- what the golden principles are, or give an example
- who reviews the PRs: a person, another agent or a CI check
- what lets a PR merge automatically
- what happens to the PRs that take longer to review

## Set up

- Write the golden principles down in the repository.
- Add a `QUALITY_SCORE.md` file to the repository.

The source does not say what `QUALITY_SCORE.md` contains, who updates it or how the agents use it.

## Notes

- Before this loop, OpenAI spent every Friday (20% of the week) cleaning up "AI slop" by hand.

## Agent step

A worker on a schedule finds code that breaks one golden principle and opens one small PR per finding. A reviewer,
not the worker, judges each PR before it merges; the worker never merges its own. The reviewer may block a merge only
after it has been calibrated ([agent-calibration](../agent-calibration/card.md)).
