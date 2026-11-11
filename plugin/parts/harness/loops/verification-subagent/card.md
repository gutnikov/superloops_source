---
id: verification-subagent
title: "Verification subagent"
summary: "When the working agent says a task is done, a separate subagent with a fresh context tries to prove the claim wrong."
sensor: inferential
ilities: [correctness]
places: [delivery/gate, remediation/gate, maintenance/gate, discovery/gate]
stages: [task]
speed: [minutes]
needs: []
agent: [refuter]
related: [acceptance-loop]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
  - title: "Boris Cherny on X"
    url: "https://x.com/bcherny/status/2007179861115511237"
---

## Why

The agent that did the work grades it with the same reasoning that produced it, so it tends to confirm its own
claim. The verification subagent gets the claim and the requirement, not that reasoning, and tries to prove the claim
wrong by running the tests and opening the app. A claim of done then rests on evidence, not on the word of the agent
that made it.

## How it works

When the working agent says a task is done, a separate verification subagent tries to prove that claim wrong. One round takes minutes.

The source calls this subagent a fresh model and gives no more detail. It does not say:

- whether "fresh" means the same model started with a clean context, or a different model
- how the subagent checks the work, such as by reading the diff, running tests or opening the app
- what the subagent returns
- what happens when it finds a problem, or when the loop stops

The verification subagent can be the fourth role of the [acceptance loop](../acceptance-loop/card.md), next to the
spec writer, the test writer and the implementing agent (the working agent in this card).

## Set up

The source gives a principle and an example, but no setup steps:

- **Principle:** "the agent doing the work isn't the one grading it". The agent that made the change must not be the one that checks it.
- **Example:** Boris Cherny uses a subagent named `verify-app`. The source does not describe what `verify-app` does.

The source does not say what the subagent receives, what starts it or where its verdict goes.

For a web app, the [`app-probing`](../../../app-probing/README.md) part of superloops lets the subagent open the app and check the claim there, not
only in the diff.

Calibrate the subagent on claims known to be true and false before its verdict can fail the loop (see Agent step).

## Agent step

The verification subagent is a refuter. It gets the claim of done and the requirement, not the working agent's
reasoning; it may run the tests and open the app (`app-probing`), and changes nothing. It returns a Verdict with
evidence. Its verdict fails the loop only once the subagent is calibrated on claims known to be true and false
([agent-calibration](../agent-calibration/card.md)).
