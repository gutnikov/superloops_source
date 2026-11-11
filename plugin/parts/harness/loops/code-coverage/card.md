---
id: code-coverage
title: "Code coverage"
summary: "The agent runs coverage and writes tests for the uncovered branches."
sensor: computational
ilities: [testability]
places: [delivery/work, remediation/work, maintenance/oracle]
stages: [local, ci]
speed: [seconds]
needs: []
related: [mutation-testing, behaviour-invariance, red-green-tdd]
links:
  - title: "Augmented Coding: Beyond the Vibes"
    url: "https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes"
    author: "Kent Beck"
  - title: "diff-cover"
    url: "https://github.com/Bachmann1234/diff_cover"
  - title: "Branch coverage measurement"
    url: "https://coverage.readthedocs.io/en/latest/branch.html"
    author: "coverage.py"
  - title: "Excluding code from coverage.py"
    url: "https://coverage.readthedocs.io/en/latest/excluding.html"
    author: "coverage.py"
---

## Why

Code that no test runs can change without any test failing. The coverage report shows the branches the tests never
reach, so the agent knows where tests are missing instead of guessing. It shows only that a line ran, not that a test
checked the result, which is why the signal is weak on its own.

## How it works

The agent runs the tests with coverage, reads which lines and branches of the changed code no test ran, and writes a
test for each. Each test checks a result, not only that the line ran. The signal is the coverage of the diff, not of
the whole code: diff-cover compares the coverage report with `git diff` and reports only the changed lines.

In maintenance the agent runs coverage before the work: code that no test runs has no behaviour pinned down, so it
gets a test of what it does now before anyone changes it ([behaviour-invariance](../behaviour-invariance/card.md)).

## Set up

- **Branch coverage on.** Line coverage counts an `if` as covered when only one side of it ran. coverage.py measures
  branches with `coverage run --branch` and shows a missed branch as a jump from line to line, such as `2->5`.
- **A report a tool can read**: Cobertura XML or LCov. diff-cover reads "Cobertura, Clover or JaCoCo XML format, or
  LCov format", and compares with `origin/main` unless `--compare-branch` says otherwise.
- **A threshold on the diff only**, never on the whole code: `diff-cover coverage.xml --fail-under=80` exits non-zero
  below 80% of the changed lines. The threshold is a reference a person approves (H5) and is written in the loop's
  `LOOP.md`; 80 is a reasonable start.
- **Exclusions count as uncovered.** coverage.py leaves any line with `pragma: no cover` out of the missing lines. A
  new exclusion comment in the diff is reported as an uncovered line, so the agent cannot raise the number by hiding
  code.
- **`run`** prints one line per uncovered changed line or branch, `file:line: not covered by any test`, and exits
  non-zero when the diff's coverage is below the threshold.
- **Cases.** Must fire: a change that adds a branch no test runs; the same change with the branch marked
  `pragma: no cover`. Must pass: the change with a test for each branch.
- **Wiring.** The agent runs it locally before it reports done; a CI job runs it on the PR and enforces the
  threshold. A PreToolUse hook denies the agent's writes to the coverage configuration (the omit list, the
  threshold), so it cannot move code out of the report.

## Notes

- Kent Beck: "I had the genie run a coverage tester & propose tests that would make the code more reliable."
- A test with no assertion covers a line as well as a good test does. [mutation-testing](../mutation-testing/card.md)
  checks whether the tests that ran the code would notice it change.
