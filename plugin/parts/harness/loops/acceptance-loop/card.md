---
id: acceptance-loop
title: "Acceptance loop: from requirements to green acceptance tests"
summary: "A requirement becomes an approved spec, then acceptance tests that fail; the agent works until they pass. The gate reports, per requirement, whether its tests were red before and green after."
sensor: computational
ilities: [correctness, alignment]
places: [delivery/oracle, delivery/gate]
stages: [task, local, ci]
speed: [minutes, hours]
needs: []
agent: [reviewer, refuter]
related: [spec-check, progress-file-feature-list, reproduction-gate, verification-subagent]
links:
  - title: "Growing Object-Oriented Software, Guided by Tests"
    author: "Steve Freeman, Nat Pryce"
    note: "Addison-Wesley, 2009: the outer acceptance-test loop around the inner unit-test loop."
  - title: "Effective harnesses for long-running agents"
    url: "https://anthropic.com/engineering/effective-harnesses-for-long-running-agents"
    author: "Anthropic"
    note: "features that pass only after an e2e check."
  - title: "Genie Wants to Leap"
    url: "https://newsletter.kentbeck.com/p/genie-wants-to-leap"
    author: "Kent Beck"
    note: "agents that disable or delete tests."
---

## Why

Unit tests and the other inner loops check the code against what the agent thinks is wanted. No sensor can check
correctness until a person has said what they want, so the person says it once, as an approved spec, and every run
checks the work against it. The acceptance tests fail before the work and stay out of the agent's reach: an agent
that can edit them can turn any gate green.

## How it works

The acceptance loop is a composite loop: its stages are other loops of the project, and its own check is the gate
over them.

1. **Requirement → spec.** A ticket or a text becomes a spec with examples: a named state, the inputs, what the
   person sees or the error. [spec-check](../spec-check/card.md) keeps it whole. What the ticket and the texts do
   not settle goes to a person ([interview](../interview/card.md),
   [escalation-on-uncertainty](../escalation-on-uncertainty/card.md)), and a person approves the spec
   ([human-acceptance-criteria](../human-acceptance-criteria/card.md)).
2. **Spec → acceptance tests, red.** A test writer derives the tests from the spec's examples, one test per
   example, tagged with the example's id and its requirements. They run and fail: a test that passes before the
   work tests nothing.
3. **Work.** The agent implements with its inner loops: [build](../build/card.md), [types](../type-check/card.md),
   [lint](../lint-with-fix-instructions/card.md), [red/green TDD](../red-green-tdd/card.md) for the units,
   [e2e](../e2e-browser/card.md) to look at the app.
4. **Gate.** Every approved requirement is traced to at least one acceptance test, its tests failed before the work
   and pass after it, and the spec and the acceptance tests are the ones that were approved. A
   [Stop hook or `/goal`](../stop-hook/card.md) keeps the agent working until the gate passes.
5. **A person** checks intent only: the spec before the work, and, if the project wants it, the behaviour after it
   ([result-demo](../result-demo/card.md)).

The acceptance loop ends at "ready to release". It is the fast part of the
[delivery](../../super-loops/delivery.md) super-loop, which ends later, at the release's confirmation in production
([release-confirmation](../release-confirmation/card.md)). The spec hands that confirmation the production
signal of every requirement in the release (`specs.py signals` of the `spec` part), so the trace runs on from the
acceptance test to production.

A test that is red after the work goes back to where the mistake is:

| The test fails because | It goes back to |
|---|---|
| the code does not do what the example says | the agent's inner loops |
| the test does not do what the example says | the test writer |
| the example is wrong or ambiguous | the spec, with a question to a person and a new approval |

## Set up

- **Roles kept apart.** The spec writer, the test writer and the implementing agent are separate agents or
  sessions; a [verification subagent](../verification-subagent/card.md) can be a fourth. The agent doing the work is not
  the one grading it.
- **A protected oracle.** The implementing agent cannot change the spec or the acceptance tests: a PreToolUse hook
  denies its writes to them, and the final run of the gate happens in CI, out of its reach. A change to an example
  goes through the spec and a new approval.
- **Red first.** Keep the acceptance run from before the work: a CI job on the branch's first commit, or a run in
  the task's evidence. The gate compares that run with the final run.
- **The gate is the `run`.** One command prints one line per requirement, `<requirement id>: <status>` (`no test`,
  `red`, `green`, `green before the work`, `changed without approval`), and exits non-zero while any approved
  requirement is not `green`. It reuses the acceptance suite's report and the requirement trace (with the `spec`
  part: `specs.py trace`, and tests tagged with example ids); it adds no check a part already makes.
- **Parts.** `parts:` in the loop's `LOOP.md` lists the project's loops for each stage, such as `spec-check`, the
  inner loops and the Stop hook. The acceptance loop is validated after its parts, and is `active` only while they
  are.
- **Cases.** Must fire: a requirement without a test; a test that was green before the work; an acceptance test the
  implementing agent weakened; an example changed without a new approval. Must pass: a requirement whose tests went
  from red to green with the spec and the tests untouched.

## Notes

- In the double loop of acceptance-test-driven development, an outer acceptance test that fails first runs around
  an inner loop of unit tests. This loop starts that double loop one step earlier: at the requirement and the
  approved spec, not at a hand-written acceptance test.
- It is this catalog's answer to its main caveat, that no sensor can check correctness if a person has not
  specified what they want.
- Over many sessions, [progress-file-feature-list](../progress-file-feature-list/card.md) carries the state of the
  work: its feature list is this loop's list of requirements, and a feature passes when its acceptance tests pass.
- Kent Beck warns of the "genie" that disables or deletes tests. Without the protected oracle the loop proves
  nothing.

## Agent step

Besides the writers, two agents: a guard that returns a Verdict on whether the implementing agent touched or
weakened the spec or the acceptance tests, and a refuter that tries to prove each requirement's "done" wrong by
running its tests and opening the app. Both get the requirement and the artifacts, never the implementing agent's
reasoning, and both block only once calibrated ([agent-calibration](../agent-calibration/card.md)).
