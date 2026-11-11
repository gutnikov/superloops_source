---
id: spec-check
title: "Spec check"
summary: "The agent runs `specs.py check` and each layer's check on the changed spec; every gap comes back as a message naming the element and what is missing, before the test writer gets the spec."
sensor: computational
ilities: [correctness, testability]
places: [delivery/oracle]
stages: [edit, commit, ci]
speed: [seconds]
needs: []
related: [acceptance-loop]
links:
  - title: "Event Modeling"
    url: "https://eventmodeling.org/"
    author: "Adam Dymitruk"
---

## Why

A gap in the spec becomes a gap in the tests: nobody writes a test for an error that has no example, or for a
requirement no element covers. The check finds these gaps while they are still lines in the spec, before tests and
code are built on it. Syntax checks pass on such a spec, so this is the first check that sees them.

## How it works

The agent changes the spec under `superloops/specs/` and runs `specs.py check` and the check of each spec layer, such as
`em.py check --strict` for the event model. For each of these gaps, the check returns a message that names the element
and what is missing:

- a field that comes from nowhere
- an error with no example
- a decision-table row that no example checks
- a requirement that no spec element covers

The test writer gets the spec only after the check is clean, with `specs.py delta` as the list of what
to add, change and delete in the tests. The spec check is the first stage of the
[acceptance loop](../acceptance-loop/card.md).

## Set up

- The [`spec`](../../../spec/README.md) part of superloops: `specs.py` and, for the event model, `em.py` of the
  [`event-model`](../../../event-model/README.md) part.
  `superloops/specs/layers.yaml` lists each layer's check command.
- `run`: `specs.py check` followed by every layer's `check`; it fails when any of them fails.
- Cases: broken copies of the spec in `cases/must-fire/` (a field that comes from nowhere, a command error with no
  example, a `reqs:` reference to a missing requirement), the real spec in `cases/must-pass/`.
- Wiring: a Claude Code Stop hook or a pre-commit hook on changes under `superloops/specs/`, and a CI job.

## Notes

- The official tools of most spec formats check syntax only: the Context Mapper CLI let through 7 of 7 seeded
  semantic defects, and `gherkin-lint` let through 7 of 7. The semantic checks are the spec part's own.
- The check proves the spec is whole, not that it is right: approval of a requirement stays with a person.
