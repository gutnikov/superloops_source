---
id: interview
title: "Interview"
summary: "Before writing code the agent asks the person about requirements, edge cases and trade-offs, and writes the answers into a spec in the repository."
sensor: human
ilities: [alignment]
places: [delivery/oracle, discovery/oracle]
stages: [task]
speed: [minutes]
needs: []
when: [before]
initiator: agent
sync: blocking
assesses: [intent]
related: [plan-approval]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
---

## Why

An agent that starts on a vague goal fills the gaps with its own guesses about requirements and edge cases, and
learns it guessed wrong only when the person sees the result. Before any code is written, a misunderstanding is
cheapest to fix. The answers go into a spec in the repository instead of staying in the chat.

## How it works

The agent asks its questions, the person answers them, and the agent records the answers in the spec. Only then
does the agent start on the code.

A [plan](../plan-approval/card.md) fits when the person roughly knows what they want; an interview, when the goal
is vague.

## Set up

- Claude Code's best practices: have the agent interview the person in detail with the AskUserQuestion tool —
  about the implementation, UI/UX, edge cases and trade-offs — skipping the obvious questions and digging into
  the hard parts.
- Give the person answer options instead of open questions.

## Notes

- An interview takes 5–20 minutes of the person's time.
- The source note behind the advice on answer options says such questions get answered faster and with less
  spread than open ones. It gives no data or source for this: its author lists choosing from options as common
  practice with no primary source of its own.
