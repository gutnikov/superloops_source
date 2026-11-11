---
id: async-questions-with-assumptions
title: "Asynchronous questions with assumptions"
summary: "The agent writes down each non-blocking question with the assumption it made and keeps working; at the end of the task the person confirms or cancels each assumption in one batch."
sensor: human
ilities: [alignment]
places: [delivery/work, remediation/work, maintenance/work, discovery/work]
stages: [task]
speed: [minutes]
needs: []
when: [during, after]
initiator: agent
sync: async
related: [escalation-on-uncertainty, result-demo, correction-becomes-rule]
links:
  - title: "Human-in-the-loop cycles (in Russian)"
    author: "Alexander Gutnikov"
    note: "unpublished note, 2026-11-08"
---

## Why

An agent that stops for every question waits on the person, and an agent that never asks makes guesses nobody
sees. This loop puts each guess in front of the person next to its question, and the agent does not stop working.
Each assumption is built to be cheap to undo, so a wrong one costs a revert.

## How it works

1. When the agent has a non-blocking question, it does not ask it right away.
2. It makes the assumption that is cheapest to undo, writes the question down together with that assumption, and
   keeps working.
3. At the end of the task, the person gets all these questions as one batch, next to the result.
4. The person confirms or cancels each assumption. A cancelled one is undone, and the checks run again.

A question is non-blocking when the work it decides can be undone with one revert and touches nothing on the
always-ask list. Any other question is an [escalation](../escalation-on-uncertainty/card.md), and it blocks.

## Set up

- **Every assumption is cheap to undo**: it gets a commit of its own, or sits behind a feature flag.
- **One list, in the pull request**: a section "Assumptions", one line per question, with the question, the
  assumption, and the commit or flag that carries it. The assumptions that would cost most if wrong come first, under
  "assumptions worth checking".
- **The reason is H1**, intent, asked once at the end. The agent shows the list as one table in the session and asks
  one question through the session's question tool: "All confirmed" (recommended), "Cancel some" (the person names
  them), or a free answer. The call is logged:
  `loops.py hitl H1 --loop async-questions-with-assumptions --question "Confirm A1–A4?" --answer "cancel A3"`.
- **The answers go where a machine reads them.** A confirmed assumption about behaviour becomes a test or a line in
  the spec. A cancelled one is reverted, and logged as a correction at the place that should have settled the
  question: `loops.py trace correction delivery/oracle --note "A3: …"`.
- **What a machine checks.** The loop's `LOOP.md` has `validation: manual`: only the person can confirm an
  assumption. A script can still check the list's form: every line names a commit on the branch or a flag that
  exists, and the commit of every cancelled assumption is reverted.
- **The result goes with the list.** A [result demo](../result-demo/card.md) next to the assumptions lets the person
  judge each one by what it does, not by its description.
