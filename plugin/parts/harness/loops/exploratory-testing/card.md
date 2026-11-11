---
id: exploratory-testing
title: "Exploratory testing"
summary: "The person tries the product by hand and writes a bug report; the agent reproduces the bug with a failing test and fixes it."
sensor: human
ilities: [correctness, usability]
places: [delivery/release, remediation/entry]
stages: [preview, staging]
speed: [hours]
needs: []
agent: [explorer]
when: [after]
initiator: human
sync: async
assesses: [result]
related: [reproduction-gate, bug-failing-test-fix, agentic-manual-testing, triage]
links:
  - title: "Explore It!: Reduce Risk and Increase Confidence with Exploratory Testing"
    url: "https://pragprog.com/titles/ehxta/explore-it/"
    author: "Elisabeth Hendrickson"
    note: "charters to guide the exploration."
  - title: "Human-in-the-loop cycles (in Russian)"
    author: "Alexander Gutnikov"
    note: "unpublished note, 2026-11-08"
---

## Why

Tests check only what someone thought to write a test for. A person trying the product by hand finds what no test
covers. Each finding becomes a failing test before the fix and a regression test after it, so the person never has
to catch the same bug again.

## How it works

1. The person tries the product by hand, on a preview or staging, and writes a bug report.
2. [Triage](../triage/card.md) merges it with any open item on the same thing and routes it: a behaviour that differs
   from the spec to remediation, a wish for a new one to delivery.
3. An explorer reproduces the report in the running app, on a fresh state
   ([app-probing](../../../app-probing/README.md), a part of superloops, is how it does this).
4. The agent writes a failing reproduction from the explorer's steps and fixes the bug. That is
   [bug → failing test → fix](../bug-failing-test-fix/card.md) at remediation's work, and
   [reproduction-gate](../reproduction-gate/card.md) is the oracle and the gate: the reproduction was red before the
   fix, is green after it, and no other test changed.

## Set up

- **A session with a charter.** Each session has one line on what to explore and what to look for ("the checkout
  with a saved card that has expired"), and a time box of an hour, so the person explores one area in depth instead
  of clicking everywhere. It runs on the version under release, and the report names that version.
- **A bug report template** in the tracker, with steps, expected result, actual result, environment (the version,
  the browser or device, the account or the state used) and a screenshot. A report missing a field goes back to its
  author before any work.
- **Reproduction first.** Each report becomes a reproduction tagged with the report's id: a test that fails the way
  the report says. It stays in the suite as a regression test after the fix.
- **Called under H1**, only when the agent cannot go on alone: the report does not reproduce after the explorer's
  try, or the reported behaviour is what the spec says. The agent asks the person through the session's question
  tool with 2–4 options, the recommended one first: `a bug: fix the code`, `the spec is wrong: change the
  requirement`, `more detail: <what to add>`, and a free answer. It logs the call: `loops.py hitl H1 --loop
  <loop-id> --checked "<the explorer's steps>" --question "…" --answer "…"`.
- **Where the answer goes.** A bug goes into the failing reproduction. A changed requirement goes into the spec
  through the [`spec`](../../../spec/README.md) part, approved under H5. Every bug the person found is an escape,
  logged at the phase that should have caught it: `loops.py trace escape <super-loop>/<phase> --item <report id>
  --note "…"`; [steering-loop](../steering-loop/card.md) adds the must-fire case there.
- **Validation is `manual`**: no case can stand in for a person exploring. What is checked automatically is the
  reports and their reproductions. A check of new reports prints `<report id>: missing <field>` and exits non-zero
  for an incomplete one; must fire: a recorded report with no steps; must pass: a complete one.
  [reproduction-gate](../reproduction-gate/card.md)'s `run` prints one line per report id and exits non-zero while
  any report is not `green`.
- **Wiring.** The report check runs when a report is filed, in the tracker's automation or on a schedule; the
  reproduction gate runs in CI, out of the reach of the agent fixing the bug.

## Agent step

An explorer reproduces the person's bug report on a fresh state: the report's steps as Page Object calls on the state
a fixture creates. It returns a Finding whose `rule` is the report's id and whose evidence is the steps and the
screenshot, or, when the bug does not reproduce, no finding and what it tried. It does not block; the failing test
written from its steps does.
