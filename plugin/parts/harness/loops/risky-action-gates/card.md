---
id: risky-action-gates
title: "Gates on risky actions"
summary: "Before an irreversible action, the agent stops and asks a person to confirm it. In this card, a risky action means an irreversible one."
sensor: human
ilities: [security]
places: [delivery/work, delivery/release, remediation/work, remediation/release, maintenance/work, maintenance/release]
stages: [task]
speed: [seconds, minutes]
needs: []
when: [during]
initiator: rule
sync: blocking
assesses: [action-risk]
related: [isolated-environment]
links:
  - title: "The human in the loop illusion"
    author: "Resilient Cyber"
    note: "secondary retelling of Anthropic's data"
  - title: "Anthropic's Agent Autonomy study"
    author: "Latent Space"
    note: "secondary retelling"
---

## Why

No loop after an irreversible action can undo it: deleted data stays deleted, and a sent email stays sent. A gate
puts a person in front of such an action before it runs. If only irreversible actions need confirmation, the requests
stay rare enough for the person to give each one real attention instead of approving it by habit.

## How it works

Before an irreversible action, the agent stops and asks a person for confirmation. The source lists these irreversible
actions:

- a deploy
- a migration
- deleting data
- an external payment or email

## Set up

- Gate only irreversible actions. Send every reversible action to an
  [isolated environment](../isolated-environment/card.md), a sandbox where it needs no confirmation.
- Plan for the cases where nobody confirms. The gate blocks the agent. The source does not say
  who confirms, what the agent does if a confirmation is refused, or what happens if nobody answers. It gives no time
  for that case either. Before you use the gate with an agent that runs unattended, check how your setup handles
  these cases.

## Notes

- The risk is confirmation fatigue. Anthropic's data, as retold by Resilient Cyber: users approve 93% of
  permission requests in Claude Code, and many of those approvals are no longer a meaningful check.
- Only about 0.8% of agent actions look irreversible (Latent Space).
