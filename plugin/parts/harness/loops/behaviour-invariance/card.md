---
id: behaviour-invariance
title: "Behaviour invariance"
summary: "Maintenance must change no expected value. The gate fails on a changed expected value, red tests or a measure not improved against the baseline; a changed expected value goes back to triage."
sensor: computational
ilities: [correctness, maintainability]
places: [maintenance/oracle, maintenance/gate]
stages: [local, ci]
speed: [minutes]
needs: []
agent: [reviewer]
links:
  - title: "Refactoring"
    author: "Martin Fowler"
    note: "2nd edition, Addison-Wesley, 2018: changing the structure without changing the behaviour, with the tests as the check."
  - title: "Working Effectively with Legacy Code"
    author: "Michael Feathers"
    note: "Prentice Hall, 2004: characterization tests that record what the code does before it is changed."
---

## Why

Maintenance runs without a person approving any behaviour, so a change of behaviour that slips into it reaches users
unapproved. Green tests do not show that nothing changed: the same change can rewrite what the tests expect.
Comparing the expected values with the baseline separates an upgrade or a refactoring from a change of behaviour.
A change of behaviour goes back to triage.

## How it works

Before a maintenance change, the baseline is recorded: the expected values of every existing test, and the current
value of the measure the change should improve. After the change, the gate reports whether any expected value
changed, whether the tests pass, and whether the measure improved. A changed expected value sends the work back to
triage: it is delivery or remediation, not maintenance.

## Set up

- **The baseline** is the test suite at the commit the change starts from, and the measure's value there: the age of
  a dependency, known vulnerabilities, coupling, the bundle size, a benchmark.
- **Expected values, not test code.** A test may change how it reaches the code (an import, a mock, a setup for a new
  version of a library) but not what it asserts. The check compares the assertions and fixtures of the two versions:
  by a script where the test framework allows it (approved fixtures, snapshots, golden files), by a guard elsewhere.
- **The gate is the `run`.** One line per change: `expected value changed: <test>`, `tests red`,
  `measure not improved: <before> → <after>`, or `invariant, <measure> <before> → <after>`. The exit is non-zero for
  anything but the last.
- **Characterization tests first, where the tests are weak.** Where the tests do not cover the code the change
  touches, characterization tests come first and become part of the baseline
  ([approved-fixtures](../approved-fixtures/card.md), [code-coverage](../code-coverage/card.md)).
- **Cases.** Must fire: an assertion with a new expected value; a deleted test; a snapshot updated in the same change;
  a measure that did not improve. Must pass: a dependency bump where only the setup of a mock changed and the measure
  improved.

## Notes

- This is what makes maintenance safe to run without a person: a change of behaviour that would otherwise reach users
  unapproved stops here, as far as a test asserts that behaviour. A change in code that no assertion covers passes
  with green tests; this is why characterization tests come first where the tests are weak.
- At OpenAI, the pull requests of [garbage collection](../garbage-collection/card.md) were merged automatically. Where
  maintenance merges this way, no person checks its behaviour before users get it.
- An updated snapshot or golden file is a changed expected value, even when the tool updated it by itself.

## Agent step

Some changes to an assertion are ones a script cannot judge: a rewritten assertion, a loosened matcher, a new
tolerance. For these, a guard decides whether the meaning of the assertion changed and returns a Verdict. The guard is
a reviewer whose lens is the tests. It gets the diff of the tests only, and it blocks only once calibrated
([agent-calibration](../agent-calibration/card.md)).
