---
id: sample-audit
title: "Sample audit"
summary: "On a schedule, the person reviews a random sample of what the agent did or merged without them, and marks where it differs from what they expected."
sensor: human
ilities: [correctness, alignment]
places: [remediation/entry, harness:delivery/confirmation, harness:remediation/entry]
stages: [scheduled]
speed: [minutes]
needs: []
when: [after]
initiator: schedule
sync: async
assesses: [result]
links: []
---

## Why

What the agent did or merged without a person is checked only by the automated loops, and an error that all of
them miss stays unseen. A random sample brings the person back to that work without making them read all of it,
and shows the systematic errors that a pick of the most suspicious items would hide. The share of mismatches tells
whether the agent can be given more autonomy.

## How it works

1. On a schedule, a random sample is drawn from what the agent did or merged without the person.
2. The person reviews each item in the sample and marks where it differs from what they expected.

The share of mismatches in the sample shows whether the agent can get more autonomy in the work that the sample covers.

## Set up

- Draw the sample at random, not from "the most suspicious" items: otherwise systematic errors stay invisible.
- Run the audit on a schedule, for example weekly.
- Allow 30–60 minutes for one audit.

## Notes

- The note calls the share of mismatches a direct measure of whether the agent can get more autonomy. It does not say what share is acceptable or how many items to sample.
- The note gives no primary source: this loop generalizes common practice.
