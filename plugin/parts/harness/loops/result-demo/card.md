---
id: result-demo
title: "Result demo"
summary: "The agent shows the working feature: a link to a preview environment, screenshots, a before/after video, recorded command output. The person judges the behaviour, not the code."
sensor: human
ilities: [alignment, correctness]
places: [delivery/gate, discovery/confirmation]
stages: [task]
speed: [minutes]
needs: []
when: [after]
initiator: agent
assesses: [result]
related: [agent-audit-trail, preview-environments]
links: []
---

## Why

Tests show that the code does what the tests say; they do not show that it is what the person wanted. Seeing the
feature work, the person can judge that in minutes, without reading the code. Real output and recordings, not a
description of what should work, keep the agent from claiming a result it does not have.

## How it works

The agent shows the working feature: a link to a preview environment, screenshots, a before/after video, recorded
command output. The person judges the behaviour, not the code.

The demo runs on a [preview environment](../preview-environments/card.md). The
[audit trail of agent actions](../agent-audit-trail/card.md) is the evidence the agent leaves.
[app-probing](../../../app-probing/README.md) (a part of superloops) gives the demo either the URL, credentials and
screenshot it needs, or a browser held open.

## Set up

Ask for evidence, not claims: real command output and recordings, not a description of what "should work".

## Notes

- A demo takes 1–5 minutes of the person's time.
- The note says that a demo is faster than reading the diff, and that it gives a signal about intent that tests do
  not. The note does not say how long reading a diff takes, or which tasks its claim holds for.
- The note does not say:
  - how the person's verdict and comments get back to the agent
  - whether the agent fixes the work and demos it again
  - what to do when a task has nothing visible to demo, such as a refactor or a library change
  - what to do when the preview environment fails to come up

The note cites no source for this loop.
