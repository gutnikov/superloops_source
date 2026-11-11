---
id: exploratory-testing
title: "Exploratory testing"
summary: "The person tries the product by hand and writes a bug report; the agent reproduces the bug with a failing test and fixes it."
sensor: human
ilities: [correctness, usability]
places: [delivery/release, remediation/entry]
stages: [preview, staging]
speed: [hours]
needs: []
agent: [explorer]
when: [after]
initiator: human
sync: async
assesses: [result]
related: [bug-failing-test-fix]
links: []
---

## Why

Tests check only what someone thought to write a test for. A person trying the product by hand finds what no test
covers. Each finding becomes a failing test before the fix and a regression test after it, so the person never has
to catch the same bug again.

## How it works

1. The person tries the product by hand and writes a bug report.
2. The agent reproduces the report in the running app.
   [app-probing](../../../app-probing/README.md) (a part of superloops) is how it does this.
3. The agent writes a failing test from the report and fixes the bug. This step is the
   [bug → failing test → fix](../bug-failing-test-fix/card.md) loop.

## Set up

To get a good signal from this loop:

- Give people a bug report template with fields for steps, expected result, actual result and environment.
- Keep each failing test that the agent writes from a manual finding, so that it stays as a regression test.

## Notes

The note cites no source for this loop.

## Agent step

An explorer, the kind of agent that runs this step, reproduces the person's bug report on a fresh state and returns
the steps that reproduce it, or why it does not reproduce. It does not block; the failing test written from its steps
does.
