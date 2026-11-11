---
id: discovery
title: "Discovery: from a question to a decision backed by evidence"
entry: question
phases: [entry, oracle, work, gate, confirmation]
exits: [build, drop, open]
---

# Discovery: from a question to a decision backed by evidence

## Super-loop

A question comes before a change: is it worth building, will users understand it, can it be done this way, what does
the app really do now. The agent answers it with prototypes, probes, spikes and interviews. Nothing it builds for the
answer reaches the product. The super-loop ends with a decision of the person who asked, and "do not build it" is a
good result.

```
question
  → oracle: the question, and the evidence that would answer it
  → work: prototypes, probes, spikes, interviews
  → gate: every claim in the answer has its evidence; no code from the work reached main
  → confirmation: the person who asked decides
      build: delivery, with the evidence as input to the spec
      drop: closed, and the evidence kept
      open: another round, with a narrower question
```

## Oracle

The question, and the evidence that would answer it, written down before the work: "on the prototype, three of five
people find the plan switch without help"; "the library writes 1,000 rows a second on our data". Fixing it first means
the answer cannot choose its evidence afterwards. The question does not change during the work; a new question is a
new round.

## Phases

| Phase | What happens | Loop types |
|---|---|---|
| entry | A question, a hypothesis or an idea not decided yet arrives | [triage](../loops/triage/card.md), [production-users](../loops/production-users/card.md), [user-feedback](../loops/user-feedback/card.md) |
| oracle | The question and its evidence are written down and agreed | [discovery-decision](../loops/discovery-decision/card.md), [interview](../loops/interview/card.md), [task-restatement](../loops/task-restatement/card.md), [plan-approval](../loops/plan-approval/card.md) |
| work | Prototypes, probes and spikes, thrown away afterwards | [isolated-environment](../loops/isolated-environment/card.md), [agentic-manual-testing](../loops/agentic-manual-testing/card.md), [benchmarks-vs-baseline](../loops/benchmarks-vs-baseline/card.md), [debugger-repl](../loops/debugger-repl/card.md); the `ui-prototypes` and `app-probing` parts |
| gate | Every claim in the answer has its evidence: a link, a screenshot, a measurement, a quote. The work's code stays out of main | [discovery-decision](../loops/discovery-decision/card.md), [verification-subagent](../loops/verification-subagent/card.md), [document-review](../loops/document-review/card.md) |
| confirmation | The person who asked decides | [discovery-decision](../loops/discovery-decision/card.md), [choose-from-options](../loops/choose-from-options/card.md), [result-demo](../loops/result-demo/card.md) |

## Gate

Each claim of the answer names its evidence, and the evidence exists and says what the claim says. A refuter can try
to prove a claim wrong, as it does with a "done" in delivery. Code written for the answer lives on a branch or in a
scratch directory, and is not merged. The loop is [discovery-decision](../loops/discovery-decision/card.md).

## Confirmation

The person who asked reads the answer and decides: build it, drop it, or ask again. There is no release: discovery
changes what the team knows, not the product.

## Exits

| Exit | What it means | Where it goes |
|---|---|---|
| `build` | The decision is to build it | Delivery: the question, the answer and the evidence go into the spec |
| `drop` | The decision is not to build it | Closed; the evidence is kept, so nobody has to ask the question again |
| `open` | The evidence does not settle it | Another round, with a narrower question |

## Trace

For every question: the decision, and the evidence it rests on. A delivery that started from a `build` and ended
`not-confirmed` because users did not take up the change says that the evidence of discovery was weak.

## When a project needs it

When the agent is asked whether to build something, or how, and not only to build it. If every idea the product team
brings gets built, discovery happens outside the harness.

## Sources

- Marty Cagan, *Inspired* (2nd edition, Wiley, 2017): product discovery against the value, usability, feasibility
  and business-viability risks, before delivery.
