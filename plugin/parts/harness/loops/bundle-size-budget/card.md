---
id: bundle-size-budget
title: "Bundle size budget"
summary: "size-limit \"throws an error if the cost exceeds the limit\". With `--why` the agent finds what bloated the bundle and removes it."
sensor: computational
ilities: [performance]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [seconds]
needs: []
links:
  - title: "size-limit README"
    url: "https://github.com/ai/size-limit/blob/main/README.md"
  - title: "ai/size-limit"
    url: "https://github.com/ai/size-limit"
---

## Why

Each change can add a little weight to the bundle, and no single change looks like the one that went too far. A size
limit in CI turns that slow growth into an error on the PR that added the weight. `--why` then shows the agent what
to remove.

## How it works

One round of the loop runs in CI on a PR:

1. size-limit "throws an error if the cost exceeds the limit".
2. The error shows on the PR.
3. With `--why` the agent finds what bloated the bundle.
4. The agent removes it.

## Set up

1. Add size-limit to CI.
2. Set it up to comment on the PR. In the project's words, it will "Show error in pull request if the cost exceeds the limit."

## Notes

The source does not say:

- how to set the limit, or which bundle and units to use
- which command the CI job runs, or which tool posts the PR comment
- what the agent should do if the task needs the extra weight, or if `--why` points to no single cause
- whether the agent may raise the limit, or who approves a change to it
