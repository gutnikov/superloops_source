---
id: escalation-on-uncertainty
title: "Escalation on uncertainty"
summary: "The agent stops by itself and asks a question when it cannot choose between options or has found a contradiction in the requirements."
sensor: human
ilities: [alignment]
places: [delivery/work, remediation/work, maintenance/work, discovery/work]
stages: [task]
speed: [minutes, hours]
needs: []
when: [during]
initiator: agent
sync: blocking
assesses: [intent]
related: [async-questions-with-assumptions]
links:
  - title: "Measuring AI agent autonomy in practice"
    author: "Anthropic"
    note: "18 February 2026"
---

## Why

An agent that guesses its way past a contradiction in the requirements builds on the guess, and the mistake shows
only in the result. This loop has the agent stop and ask at that point instead of guessing. A list of what to always
ask about and what never to ask about keeps the questions for the costly cases, such as the database schema or
deleting data.

## How it works

During the task, the agent stops by itself and asks the person a question in these cases:

- it cannot choose between options
- it has found a contradiction in the requirements
- the work touches something on the project's always-ask list in CLAUDE.md (see Set up)

The agent does not ask about anything on the never-ask list. It waits for the person's answer before it goes on.

Questions that need not block go to
[asynchronous questions with assumptions](../async-questions-with-assumptions/card.md) instead.

## Set up

- List explicitly in CLAUDE.md what to always ask about (the database schema, the public API, deleting data, new
  dependencies) and what never to ask about (style, names of internal variables).

## Notes

- Anthropic, "Measuring AI agent autonomy in practice" (18 February 2026): the harder the task, the more often
  Claude Code asks for clarification and the more often people interrupt it. On the hardest tasks Claude Code asks
  for clarification more than twice as often as a person interrupts it.
