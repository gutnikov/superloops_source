---
id: production-users
title: "Users in production"
summary: "The signal comes from users in production: feedback, support tickets, A/B tests, dogfooding. A person turns it into acceptance criteria, which the agent gets as a spec and a test."
sensor: human
ilities: [alignment, usability]
places: [delivery/entry, delivery/confirmation, remediation/entry, discovery/entry]
stages: [production]
speed: [days, weeks]
needs: []
when: [production]
initiator: human
sync: async
assesses: [intent]
related: [user-feedback]
links: []
---

## Why

Every earlier loop checks the work against what someone on the team believes users want. This loop checks whether those beliefs were right. The source note calls the user signal the only one of its loops that shows whether the work has real value, and also the slowest and noisiest; the note gives no data for these claims. Because of the noise, a person turns the signal into acceptance criteria tied to a reproducible scenario before the agent works on it.

## How it works

1. Users give a signal in production: feedback, support tickets, A/B tests or dogfooding.
2. A human operator turns the signal into acceptance criteria and ties each one to a reproducible scenario.
3. The agent gets the criteria as a spec and a test.

[User feedback](../user-feedback/card.md) is the same loop, from the automated catalog.

## Set up

- Take the problem from the user, not the solution.
- Tie every complaint to a reproducible scenario.

## Notes

The note cites no source for this loop.
