---
id: human-acceptance-criteria
title: "Acceptance criteria and references from a person"
summary: "The person writes or approves references: acceptance tests, \"input → expected output\" examples and reference snapshots. From then on the agent works against them without the person."
sensor: human
ilities: [alignment, correctness]
places: [delivery/oracle]
stages: [task]
speed: [seconds]
needs: []
agent: [reviewer]
when: [before]
initiator: human
assesses: [result]
related: [approved-fixtures, acceptance-loop]
links: []
---

## Why

Only a person can say which output is the right one. Without that, the agent checks its work against its own
reading of the task. The person gives their judgement once, at the start, and it becomes a check the agent repeats
on every run without them. The agent may not change an approved reference, so it cannot make a check pass by
changing what counts as right.

## How it works

1. At the start of a task, the person writes or approves the references.
2. On every run, the agent checks its work against the approved references. The person is not needed for this.
3. When the agent finds that a reference should change, it proposes a new value. It does not change the reference
   itself.

[Approved fixtures](../approved-fixtures/card.md) are the automated side of the same references. The
[acceptance loop](../acceptance-loop/card.md) is where the approved references become the oracle of the whole task.

## Set up

- The agent may not change approved references itself; it only proposes a new value. The source does not say
  whether this rule covers all three kinds (acceptance tests, examples and snapshots) or only some of them. The
  guard in Agent step checks changes to all three.

## Notes

- The person's time goes in at the start of a task; after that, each run against the references takes seconds.
- The note calls references locked in this way the strongest way to make a slow human signal reusable: the person
  gives their judgement once, and the check repeats on every run.
- The note cites no source for this loop.

## Agent step

A guard over the approved references: it returns a Verdict on whether a change touches an approved acceptance test,
example or snapshot, and lists each such change for the person. It never approves a change itself, and may block a
change only after it is calibrated ([agent-calibration](../agent-calibration/card.md)).
