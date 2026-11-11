---
id: observe-and-interrupt
title: "Observe and interrupt"
summary: "The person does not approve every step. They watch from the side and step in when they see the work going the wrong way."
sensor: human
ilities: [alignment]
places: [delivery/work, remediation/work, maintenance/work]
stages: [task]
speed: [sub-second]
needs: []
when: [during]
initiator: human
sync: async
links:
  - title: "Measuring AI agent autonomy in practice"
    author: "Anthropic"
    note: "18 February 2026"
  - title: "Human-in-the-loop"
    author: "Matt Pocock"
    note: "AI Hero"
---

## Why

Approving every step spends the person's attention on steps that are fine, and the approvals soon become a
formality. Watching from the side costs less: the person steps in only when the work drifts, and the agent stops at
once. This mode catches a wrong turn while the wrong turn is still cheap, but only while the person is watching.

## How it works

The agent works without asking the person to approve each step. The person watches its progress and steps in when
the work drifts.

The source recommends this mode for ambiguous and irreversible tasks: a schema migration, a hard design decision,
anything that touches production (AI Hero).

The source covers only the case where the person is watching and spots the drift in time. It does not say:

- what happens if the person is not watching
- how the person interrupts the agent
- what the agent does once it is stopped
- how the person sees an irreversible step before it runs, not after

If you plan to use this loop for irreversible work, you need to settle these points yourself. This card cannot
answer them.

## Set up

- The agent shows its progress (what it did, what is next) briefly and often, so that a drift is visible at a
  glance. The source does not say how often the agent should report or how short a report should be.

## Notes

- New Claude Code users turn on full auto-approval in about 20% of sessions, and experienced users in more than 40%.
  But experienced users interrupt the agent more often (Anthropic).
- The same study looked at Anthropic's own use from August to December 2025. Over that time, the success rate on
  the hardest tasks doubled. The average number of human interventions per session fell from 5.4 to 3.3. The
  source does not say whether one caused the other, or what these figures mean for choosing this loop.
