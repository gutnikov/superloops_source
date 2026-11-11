---
id: task-restatement
title: "Task restatement"
summary: "The agent restates the task in its own words: what it understood, what is out of scope, and what will show it is done. A person answers \"yes\" or corrects the restatement."
sensor: human
ilities: [alignment]
places: [delivery/oracle, discovery/oracle]
stages: [task]
speed: [seconds]
needs: []
when: [before]
initiator: agent
sync: blocking
assesses: [intent]
links: []
---

## Why

A task can be read in more than one way, and the agent's reading shows only in the result. A restatement written before the work starts takes the person under a minute to check. Mismatches show up in the list of what the agent will not do and in the done criterion, and the person catches them there before the agent spends any work on them.

## How it works

Before starting work, the agent restates the task in its own words, in three parts:

- I understood: how the agent reads the task.
- Not doing: what is out of scope.
- Done when: the done criterion, which will show that the task is done.

A person then answers "yes" or corrects the restatement.

## Set up

- Require the restatement to include an explicit "not doing" list and a measurable done criterion.

Example (made up to show the format, not taken from the source):

> Task: add CSV export to the reports page.
> I understood: add an "Export CSV" button that downloads the rows shown in the current table.
> Not doing: PDF or Excel export, changes to the table layout.
> Done when: the button downloads a CSV file with the same rows and columns as the table, and a new test checks this.

In this example, a person who also needed Excel export would spot the mismatch in the "not doing" list and correct it before the agent starts.

## Notes

- A restatement takes under a minute.
- The source does not say which person answers, for example the task author or a reviewer.
- The source does not say what the agent does after a correction, such as restating again or going ahead.
- The source does not say how long a blocking agent waits when nobody answers, or which tasks are too small to be
  worth the stop.

The note cites no source for this loop. It lists task restatement as a generalization of common practice.
