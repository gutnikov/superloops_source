---
id: migration-proof-pack
title: "A proof pack for a rewrite"
summary: "After a rewrite or an upgrade, a script re-runs the evidence and computes one verdict per module from six checks: tests ran, same outputs, fresh inputs, a canary, rules traced, legacy untouched."
sensor: computational
ilities: [correctness, compatibility]
places: [maintenance/oracle, maintenance/gate]
stages: [local, ci]
speed: [minutes, hours]
needs: []
related: [behaviour-invariance, approved-fixtures, reproduction-gate, agent-audit-trail, human-diff-review]
links:
  - title: "/modernize-verify: the command"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/commands/modernize-verify.md#L7-L13"
    author: "Anthropic"
    note: "\"A script computes the verdict, not you\"; counts only from files it parses; never type a count."
  - title: "/modernize-verify: tests from clean, and the canary"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/commands/modernize-verify.md#L34-L65"
    author: "Anthropic"
  - title: "/modernize-verify: equivalence, then inputs nobody used"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/commands/modernize-verify.md#L67-L101"
    author: "Anthropic"
  - title: "/modernize-verify: the verdict and the sign-off"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/commands/modernize-verify.md#L120-L139"
    author: "Anthropic"
  - title: "proof_pack.py: the six checks and the verdict rules"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/scripts/proof_pack.py#L1-L49"
    author: "Anthropic"
  - title: "compare.py: the comparator proves it can fail"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/scripts/compare.py#L338-L365"
    author: "Anthropic"
  - title: "extract-rules.js: a referee for each extracted rule"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/workflows/extract-rules.js#L449-L460"
    author: "Anthropic"
  - title: "/modernize-transform: a rule marked wrong is not the oracle"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/commands/modernize-transform.md#L42-L45"
    author: "Anthropic"
---

## Why

A rewrite or a major version upgrade must keep what the old code did, and the agent that did the work is the worst
judge of whether it did. Its notes say "all tests pass" and "outputs match", and a reviewer reads the notes. Tests
that never ran, a comparator whose masks hide every byte, inputs the new code was tuned on, and a rule that no test
pins all look like success in a summary. This loop re-runs the evidence in a fresh session and lets a script, not a
model, compute the verdict from files.

## How it works

For each module, a script reads the evidence files and runs six checks:

1. **Tests ran.** The build output is deleted and the full suite runs again. The counts come only from result files
   the script parses itself (JUnit XML, or the runner's saved log), and each must be newer than the code. A count
   typed into a file caps the check at a gap. Nothing executed is a failure, not a pass.
2. **Same behaviour.** The old and the new code run on the development cases, and a comparator checks every byte of
   their outputs, with masks and tolerances declared and explained. The comparator proves it can fail: it flips an
   unmasked byte of each output and must see a difference, and a tolerance must not hide a changed leading digit.
3. **Fresh inputs.** At least 10 inputs nobody used during the work, each giving an output unlike any development
   output, run on both sides with no difference.
4. **A canary.** One line that matters is broken in a scratch copy (a rounding mode, a threshold by one), and that
   run's own result file must show failing tests. Anthropic's command: "A `Canary:` line in the notes is a claim".
5. **Rules traced.** Every critical business rule is named by a test that ran and passed. A rule named only by a
   skipped test is "named, not run"; one named only in the notes is "claimed".
6. **Legacy untouched.** No file of the old code is newer than the analysis.

The verdict is **PROVEN** when all six pass, **NOT PROVEN** when any fails, and **PARTLY PROVEN** when nothing failed
but a check could not pass, such as when the old code cannot run here. The script exits 1 for anything but PROVEN.
Each failure becomes the next step: a missing test for a rule, a difference to fix or to have approved.

## Set up

- **The rules are the oracle**, extracted from the old code before the work and confirmed by a person. Anthropic's
  extraction runs rounds of extractors until a round adds little, and a referee checks each rule against the code it
  cites; a rule found only in a comment is refuted. A rule the person marks wrong is not the oracle for the rewrite.
- **The cases and the comparator** kept with the analysis: one entry per output, old and new paths, masks with the
  reason for each.
- **Differences only a person approves**, each with its reason, in a table the script reads. The agent never ticks
  an approval or edits an output.
- **For a version upgrade**, the old version's results are measured from files, not typed; a removed test file, or
  more than a quarter of test files changed, is a gap for a person to review.
- **`run`** is the proof script over every module. It prints one line per module, `<module>: PROVEN|PARTLY
  PROVEN|NOT PROVEN`, then one line per reason, `<module>: <check>: <reason>`, and writes the report. It exits 1
  unless every module is PROVEN.
- **Cases.** Must fire: a result file older than the code; a mask that covers the whole output; a canary run with no
  failing test; a critical rule named only by a skipped test. Must pass: a module whose six checks pass from their
  files.
- **Wiring:** `run` in a fresh session after each module is built, and in CI on the branch of the migration. PROVEN
  is evidence, not approval: a named person signs the report before the next module.

## Notes

- [behaviour-invariance](../behaviour-invariance/card.md) keeps the expected values of the existing tests; this loop
  is for the case where the code is replaced and the old program itself is the oracle.
- The verdict comes from fixed rules written into the report, so a reader can follow it. A model may explain a
  reason; it does not change one.
