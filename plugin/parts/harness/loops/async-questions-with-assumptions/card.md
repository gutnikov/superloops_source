---
id: async-questions-with-assumptions
title: "Asynchronous questions with assumptions"
summary: "The agent writes down each non-blocking question with the assumption it made and keeps working; at the end of the task the person confirms or cancels each assumption in one batch."
sensor: human
ilities: [alignment]
places: [delivery/work, remediation/work, maintenance/work, discovery/work]
stages: [task]
speed: [minutes]
needs: []
when: [during, after]
initiator: agent
sync: async
links: []
---

## Why

An agent that stops for every question waits on the person, and an agent that never asks makes guesses nobody
sees. This loop puts each guess in front of the person next to its question, and the agent does not stop working.
If each assumption is set up as Set up asks, a wrong one is cheap to undo.

## How it works

1. When the agent has a non-blocking question, it does not ask it right away.
2. The agent writes the question down together with the assumption it made, and keeps working.
3. At the end of the task, the person gets all these questions as one batch.
4. The person confirms or cancels each assumption.

## Set up

- Every assumption must be cheap to undo: a separate commit, a feature flag.
- In the batch, the agent includes a list headed "assumptions worth checking".

## Notes

The card's earlier note on sources cites no source for this loop. It says the loop sums up accepted practice and has no primary source of its own.
