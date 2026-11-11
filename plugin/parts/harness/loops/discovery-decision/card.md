---
id: discovery-decision
title: "Discovery decision"
summary: "The agent answers an agreed question with prototypes, probes and spikes; the gate checks that each claim names evidence that exists and no spike code is in main, and a refuter tests each claim."
sensor: inferential
ilities: [alignment]
places: [discovery/oracle, discovery/gate, discovery/confirmation]
stages: [task]
speed: [hours, days]
needs: []
agent: [refuter]
related: [triage, verification-subagent, acceptance-loop]
links:
  - title: "Inspired"
    author: "Marty Cagan"
    note: "2nd edition, Wiley, 2017: product discovery before delivery."
  - title: "Documenting Architecture Decisions"
    url: "https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions"
    author: "Michael Nygard"
    note: "2011: a decision record kept with the code."
  - title: "math-proof siege: the claims ledger"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/SKILL.md#L354-L367"
    author: "Anthropic"
    note: "PROVED, REFUTED and OPEN lines, appended and never rewritten; RETRACT removes one from force."
  - title: "math-proof siege: the targeting, audit and retrieval rules"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/SKILL.md#L444-L469"
    author: "Anthropic"
  - title: "math-proof siege: the plan verdict and its four answers"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/SKILL.md#L119-L135"
    author: "Anthropic"
  - title: "math-proof siege: the progress test"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/SKILL.md#L549-L558"
    author: "Anthropic"
  - title: "ledger.py: the round's verdict, computed by the script"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/scripts/ledger.py#L483-L545"
    author: "Anthropic"
  - title: "ledger.py: the wave floor"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-proof/skills/siege/scripts/ledger.py#L364-L368"
    author: "Anthropic"
    note: "3 in 10 of a wave, at least 1, must come back answered or partial."
---

## Why

An answer written after a few prototypes can read as settled where nothing backs it. Agreeing on the question, and on
the evidence that would answer it, before the work keeps the question from shifting while the agent works. Checking
each claim against the evidence it names keeps a guess out of the decision.

## How it works

A question reaches discovery from [triage](../triage/card.md). Before the work, the question and the evidence that
would answer it are written down and agreed with the person who asked. The agent builds prototypes, probes and
spikes, and writes the answer. The gate then checks the answer in two parts:

- The `run` checks that every claim names its evidence, that this evidence exists, and that no spike code reached the
  main branch.
- A refuter checks that the evidence says what the claim says. It blocks only once calibrated, so until then a claim
  whose evidence says something else does not fail the gate.

The person who asked decides: build it, drop it, or ask again.

## Set up

- **A decision record** per question, in the repository, with these fields:
  - the question
  - the evidence that would answer it
  - the answer, with each claim and its evidence: a link, a screenshot, a measurement or a quote
  - the decision, with its date and who made it
- **A claims ledger, for an investigation that runs over many rounds.** Anthropic's math-proof siege keeps, next to a
  summary that is rewritten each round, a ledger that is only appended: one sentence per claim, `PROVED`, `REFUTED`
  or `OPEN`, with the file that holds its evidence; a claim leaves force only by a `RETRACT` line. A script, not the
  agent that writes the summary, reads the ledger after each plan and prints one verdict: run the next wave of
  queries, conclude, retry the plan with a named correction, or stop. It refuses to conclude early unless two
  independent checks of the full written argument are in the ledger, each naming files that exist. Its other rules:
  at least half of each round's work attacks the claims still open; a round that only narrows the open question is
  logged as "main line stalled", and the next round goes at that question itself; a wave in which fewer than 3 in
  10 queries come back is an outage, and the run stops; and before relying on an earlier result, the agent "read[s]
  that result's answer file", not the summary's paraphrase of it.
- **Two calls to the person who asked**: the question is agreed under H1 before the work, and the decision is asked
  for under H4 after it. Each call is logged with `loops.py hitl`, and each answer is written into the record.
- **Throwaway work stays out.** Prototypes live where the product does not build them (the
  [`ui-prototypes`](../../../ui-prototypes/README.md) part keeps them in `prototypes/`); spikes live on a branch that
  is never merged.
- **The gate is the `run`.** It prints one line per claim, `<claim>: <status>`, with one of these statuses:
  - `no evidence`: the claim names no evidence.
  - `evidence missing`: the claim names evidence that does not exist.
  - `ok`: the claim names evidence that exists.

  If there is spike code in main, it also prints `spike code in main`. The exit is non-zero while any claim is not
  `ok` or spike code is in main. The `run` does not check what the evidence says; the refuter does (see Agent step).
- **Cases.** Must fire: a claim with no evidence; evidence that does not exist; spike code merged. Must pass: an
  answer where every claim links its evidence.
- **Wiring**: the agent runs the gate before it hands the answer over; a CI job runs it on the pull request that adds
  the record, where the agent cannot change the gate. The refuter runs in its own session with read-only access to
  the repository and the evidence.

## Notes

- "Do not build it" is a good result: the record keeps the evidence, so nobody has to ask the question again.
- A decision to build becomes the input of delivery: the question, the answer and the evidence go into the spec
  ([acceptance-loop](../acceptance-loop/card.md)).
- Nygard's decision records keep five parts (title, context, decision, status, consequences) in the repository; the
  record here adds the claims and their evidence.

## Agent step

A refuter gets the answer and its evidence, never the agent's reasoning, and tries to prove each claim wrong: it
opens the evidence, reruns a measurement, checks a quote. It returns a Verdict per claim, and it blocks only once
calibrated ([agent-calibration](../agent-calibration/card.md)).
