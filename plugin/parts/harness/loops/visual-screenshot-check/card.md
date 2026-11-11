---
id: visual-screenshot-check
title: "Visual check with screenshots"
summary: "The agent takes a screenshot, compares it with the mockup, lists the differences and fixes them."
sensor: inferential
ilities: [usability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds, minutes]
needs: [browser]
agent: [judge]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
---

## Why

A screen can pass every test and still look wrong: a misplaced element or a wrong colour breaks no assertion. A
screenshot compared with the mockup is the first check that sees the screen the way a user does. The differences come
back as a list the agent can fix one by one.

## How it works

The loop needs a mockup of the screen to compare with.

1. The agent takes a screenshot. Locally, the [`app-probing`](../../../app-probing/README.md) part of superloops takes a
   full-page screenshot once the screen has settled; the comparison with the mockup stays with the agent.
2. The agent compares the screenshot with the mockup and lists the differences.
3. The agent fixes the differences.

## Set up

Set it up in two places:

- Locally: give the agent the prompt from the Claude Code docs: "take a screenshot of the result and compare it to the original".
- In CI: run pixel regression.

## Agent step

A judge compares the screenshot with the mockup and returns a Verdict listing each difference. Comparing images takes
judgement, so the judge's Verdict blocks only after a person graded pairs that match and pairs that do not, and the
judge agreed with that person's grades ([agent-calibration](../agent-calibration/card.md)).
