---
id: approved-fixtures
title: "Snapshot / golden / approved fixtures"
summary: "A test compares the output with a stored reference; the agent fixes an unexpected diff and proposes an expected one to a person as the new reference."
sensor: computational
ilities: [correctness, testability]
places: [delivery/work, remediation/work, maintenance/oracle, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
agent: [reviewer]
related: [human-acceptance-criteria, behaviour-invariance, prompt-snapshots, visual-stability-oracle]
links:
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Birgitta Böckeler"
  - title: "Snapshot Testing"
    url: "https://jestjs.io/docs/snapshot-testing"
    author: "Jest"
  - title: "What are approvals"
    url: "https://github.com/approvals/ApprovalTests.Documentation/blob/main/explanations/what_are_approvals.md"
    author: "ApprovalTests"
  - title: "merman layout-audit.test.ts: ceilings over a corpus of diagrams"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/merman/src/layout-audit.test.ts#L5-L60"
    author: "opencode (anomalyco)"
    note: "at least 100 flowcharts and 100 state diagrams; structural violations []; area, bends, crossings ceilings."
  - title: "merman layout-audit.ts: the report of the worst fixtures"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/merman/script/layout-audit.ts#L60-L90"
    author: "opencode (anomalyco)"
---

## Why

A test that compares the whole output with a stored reference catches any change in it, including changes no assertion
was written for. But a diff does not say whether the change was expected. An agent that could approve its own references
could make any regression the new expected output. So the agent fixes unexpected diffs, and only a person can approve an
expected diff as the new reference.

## How it works

A test renders an output (a response, a report, a rendered component, a generated file) and compares it with the
reference stored next to the test. When they differ, the test fails with the diff, and the agent sorts it:

- **unexpected**: the requirement of the change does not explain it. It is a regression, and the agent fixes the code
  until the output matches the reference again.
- **expected**: the requirement explains it. The agent proposes the new output as the reference, with the requirement
  that explains each changed part, and a person approves it or sends it back.

In maintenance the references are the oracle, the behaviour as it is, recorded before the work: every diff is
unexpected, and a diff the agent cannot remove goes back to triage
([behaviour-invariance](../behaviour-invariance/card.md)).

## Set up

- **References live in the repository** and are reviewed like code. Jest: "The snapshot artifact should be committed
  alongside code changes, and reviewed as part of your code review process."
- **CI never writes a reference.** Jest does not write snapshots in CI "without explicitly passing
  `--updateSnapshot`". The final run happens in CI without the update flag, so a missing or changed reference fails
  there.
- **The agent proposes; a person approves (H5).** A PreToolUse hook denies the agent's writes to the reference files
  (`__snapshots__/`, `*.approved.*`) and its runs of the update command (`jest -u`, `--updateSnapshot`). ApprovalTests
  approves a result "by copying the received file to the approved file"; here that copy is the person's step. The
  answer is logged with `loops.py hitl H5 --loop <loop id> --question … --answer …`, naming the reference files.
- **Scrub what changes on every run** (timestamps, generated ids, unordered collections) before the comparison. A
  reference that differs on every run teaches people to approve diffs without reading them.
- **A corpus with ceilings, where one reference per output is too many.** For output whose quality is a measure, such
  as a layout, a rendering or a summary, keep a corpus of inputs and approve ceilings over the aggregate instead of
  each output. opencode's diagram renderer lays out at least 100 flowcharts and 100 state diagrams at several widths;
  structural violations must be `[]`, and the corpus has ceilings such as area max 11,011 and p95 5,313, bends max
  30, crossings 40 in total, and 0 crossings for state diagrams. A family built to be hard gets its own ceilings, "so
  it cannot absorb the p95 headroom of the established families". A report lists the worst fixtures per measure,
  with their source and output, for the person who approves a new ceiling. Lower a ceiling when a change improves
  the measure, so the next regression shows.
- **`run`** is the test command without the update flag. It prints each failing comparison as `file:line: message`
  with the diff, and exits non-zero on any diff or missing reference. A CI step also fails when a reference file
  changed on the branch and no H5 answer in `superloops/hitl-log.jsonl` names it.
- **Cases.** Must fire: a seeded regression in the code under test; a reference changed on the branch without an
  approval. Must pass: the clean copy, with every output matching its reference.

## Notes

- Böckeler: "Some of my colleagues are seeing good results with the approved fixtures pattern", though it is easier
  to apply in some areas than others.
- Who approves references and how: [human-acceptance-criteria](../human-acceptance-criteria/card.md).

## Agent step

A guard checks each changed reference against the requirement of the change. It marks the change expected if the
requirement explains it, and unexpected (a regression) if not, with the evidence for each, as a Verdict. A person still
approves new references. The guard blocks only once calibrated ([agent-calibration](../agent-calibration/card.md)).
