---
id: approved-fixtures
title: "Snapshot / golden / approved fixtures"
summary: "A test compares the output with a stored reference; the agent fixes an unexpected diff and proposes an expected one to a person as the new reference."
sensor: computational
ilities: [correctness, testability]
places: [delivery/work, remediation/work, maintenance/oracle, maintenance/work]
stages: [local]
speed: [seconds]
needs: []
agent: [reviewer]
links:
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
---

## Why

A test that compares the whole output with a stored reference catches any change in it, including changes no assertion
was written for. But a diff does not say whether the change was expected. An agent that could approve its own references
could make any regression the new expected output. So the agent fixes unexpected diffs, and only a person can approve an
expected diff as the new reference.

## How it works

A diff is expected if the requirement of the change explains it. If the requirement does not explain it, the diff is
unexpected: a regression.

A test compares the output with a reference. When the test shows a diff:

- if the diff is unexpected, the agent fixes it
- if the diff is expected, the agent proposes it to a person as the new reference

## Set up

- References live in the repository.
- The agent may not approve new references itself.

## Notes

- Böckeler reports good results with the approved-fixtures pattern where it applies.
- Who approves the references: [human-acceptance-criteria](../human-acceptance-criteria/card.md).

## Agent step

A guard checks each changed reference against the requirement of the change. It marks the change expected if the
requirement explains it, and unexpected (a regression) if not. For each change, it gives the evidence. A person still
approves new references. The guard blocks only once calibrated ([agent-calibration](../agent-calibration/card.md)).
