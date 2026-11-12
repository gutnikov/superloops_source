---
id: code-coverage
title: "Code coverage"
summary: "The agent runs coverage and writes tests for the uncovered branches; CI holds the diff to a threshold and the whole code to a floor that only rises."
sensor: computational
ilities: [testability]
places: [delivery/work, remediation/work, maintenance/oracle]
stages: [local, ci]
speed: [seconds]
needs: []
related: [mutation-testing, behaviour-invariance, red-green-tdd, test-admission, architecture-fitness-functions]
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
  - title: "coverage-floor.ts: a floor that only rises"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/scripts/coverage-floor.ts#L1-L17"
    author: "sandcastle (Matt Pocock)"
  - title: "coverage-floor-core.ts: the 0.1-point tolerance and the two failures"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/scripts/coverage-floor-core.ts#L25-L69"
    author: "sandcastle (Matt Pocock)"
  - title: "lint-shrink.yml: the floor raised after each push to main"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/lint-shrink.yml#L1-L72"
    author: "sandcastle (Matt Pocock)"
  - title: "CODING_STANDARDS.md: the coverage floor and the deletion gate"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/CODING_STANDARDS.md#L135-L139"
    author: "sandcastle (Matt Pocock)"
  - title: "coverage-gate-core.ts: the deletion gate's verdict"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/scripts/coverage-gate-core.ts#L145-L146"
    author: "sandcastle (Matt Pocock)"
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
- **A threshold on the diff**: `diff-cover coverage.xml --fail-under=80` exits non-zero below 80% of the changed
  lines. The threshold is a reference a person approves (H5) and is written in the loop's `LOOP.md`; 80 is a
  reasonable start. A fixed threshold on the whole code is the wrong tool: an old codebase sits far below any bar
  that means something, and a bar it already meets says nothing about the change.
- **The whole code is a ratchet.** Its coverage may fall a little, never far, and its floor only rises. sandcastle
  fails with "e2e line coverage fell to X%, more than 0.1 points below the floor of Y%. Cover the new or changed code
  from tests/ (through the public API); never lower the floor." The tolerance is for machines: one commit measures
  "53.81% on CI's Linux, 53.80% locally", and "a floor raised on one machine must not fail another". A change that
  lowers the floor file fails against the main branch: "scripts/coverage-baseline.json lowered the floor from X on
  origin/main to Y. It only rises." After each push to main a job raises the floor to what it finds, rounded down to
  one decimal, in a pull request; fix PRs leave the file alone, so they do not conflict on it. Count only the suite
  that tests through the public API: in sandcastle, "a legacy test next to it does not count".
- **A deleted test is measured on its own**, since a small test's lines fit inside the tolerance. sandcastle's
  deletion gate fails with "**Gate: fail.** <n> of the <m> lines that only `<file>` covers have no e2e coverage
  yet." ([test-admission](../test-admission/card.md)).
- **Exclusions count as uncovered.** coverage.py leaves any line with `pragma: no cover` out of the missing lines. A
  new exclusion comment in the diff is reported as an uncovered line, so the agent cannot raise the number by hiding
  code.
- **`run`** prints one line per uncovered changed line or branch, `file:line: not covered by any test`, then the
  floor's line when one fails, and exits non-zero when the diff is below the threshold or the whole code below the
  floor.
- **Cases.** Must fire: a change that adds a branch no test runs; the same change with the branch marked
  `pragma: no cover`; whole-code coverage 0.2 points under the floor; a floor file lower than on main. Must pass: the
  change with a test for each branch; coverage 0.05 points under the floor.
- **Wiring.** The agent runs it locally before it reports done; a CI job runs it on the PR and enforces the
  threshold and the floor. A PreToolUse hook denies the agent's writes to the coverage configuration (the omit list,
  the threshold, the floor), so it cannot move code out of the report.

## Notes

- Kent Beck: "I had the genie run a coverage tester & propose tests that would make the code more reliable."
- A test with no assertion covers a line as well as a good test does. [mutation-testing](../mutation-testing/card.md)
  checks whether the tests that ran the code would notice it change.
