---
id: run-tests-first
title: "Run the tests first"
summary: "Before changing anything the agent runs the whole suite. It learns the state of the project and which tests already fail, so later it does not mistake them for its own regressions."
sensor: computational
ilities: [testability]
places: [delivery/work, remediation/work, maintenance/oracle]
stages: [local]
speed: [minutes]
needs: []
links:
  - title: "Simon Willison's playbook for working with coding agents"
    url: "https://ai.sulat.com/simon-willisons-playbook-for-working-with-coding-agents-d56ccd3f959f"
---

## Why

An agent that has not run the suite before it changes anything cannot tell the failures it caused from the ones
that were already there. It then spends time on tests it did not break, or takes a real regression for an old
failure. One run before it changes anything gives it the baseline to compare with.

## How it works

Before it changes anything, the agent runs the whole suite. The run shows the state of the project and which tests
already fail, so later the agent does not mistake them for its own regressions.

## Set up

The source lists two things the project needs for this loop:

- A green main branch.
- A list of flaky tests.

## Notes

The source does not say:

- what the agent does when the run before it changes anything shows failing tests on main
- how the agent gets the list of flaky tests
- what the agent does when a flaky test fails, either before it changes anything or after
- what to do when the full suite is too slow to run before every change
