---
id: human-acceptance-criteria
title: "Acceptance criteria and references from a person"
summary: "The person writes or approves references: acceptance tests, \"input → expected output\" examples and reference snapshots. From then on the agent works against them without the person."
sensor: human
ilities: [alignment, correctness]
places: [delivery/oracle]
stages: [task, ci]
speed: [seconds]
needs: []
agent: [reviewer]
when: [before]
initiator: human
assesses: [result]
related: [approved-fixtures, acceptance-loop, interview]
links:
  - title: "Human-in-the-loop cycles (in Russian)"
    author: "Alexander Gutnikov"
    note: "unpublished note, 2026-11-08"
  - title: "About code owners"
    url: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners"
    author: "GitHub"
    note: "code owners are requested for review on a pull request that changes their files; \"Require review from Code Owners\"."
---

## Why

Only a person can say which output is the right one. Without that, the agent checks its work against its own
reading of the task. The person gives their judgement once, at the start, and it becomes a check the agent repeats
on every run without them. The agent may not change an approved reference, so it cannot make a check pass by
changing what counts as right.

## How it works

1. At the start of a task, the person writes the references, or approves the ones the agent drafted.
2. On every run, the agent checks its work against the approved references. The person is not needed for this.
3. When the agent finds that a reference should change, it proposes the new value in a commit of its own and asks
   the person. The reference changes only with their approval.

[Approved fixtures](../approved-fixtures/card.md) are the automated side of the same references. The
[acceptance loop](../acceptance-loop/card.md) is where the approved references become the oracle of the whole task.

## Set up

- **The reason is H5**: approving a reference the loops will trust. The agent shows the reference itself (the
  example's input and expected output, the snapshot image, the test) through the session's question tool, with the
  options "Approve", "Approve with changes" and "Reject", and logs the call:
  `loops.py hitl H5 --loop human-acceptance-criteria --question "Approve the 3 examples in …?" --answer "approved"`.
- **The reference is the answer, written where the checks read it**: an acceptance test, an example file, a snapshot
  in the repository. With the [`spec`](../../../spec/README.md) part, examples live in the spec and are approved with
  their requirement file (`approved_by`).
- **One list of what is approved**, covering all three kinds: a file in the loop's folder with each approved path and
  its hash, as `sha256sum` writes them. A proposal changes a reference and its line in the list in one commit; a
  reference changed alone is what `run` catches.
- **`run`** recomputes the hashes and prints one line per reference, `<path>: approved`, `changed since approval` or
  `missing`. The exit is non-zero for anything but `approved`.
- **Cases.** Must fire: an approved example with its expected output edited; an approved snapshot deleted; an approved
  acceptance test with an assertion removed. Must pass: a change to the product code with every reference untouched.
- **Out of the agent's reach.** `run` runs in CI on every pull request. CODEOWNERS names the person for the approved
  paths and for the hash list: GitHub then requests their review on any pull request that changes them, and the branch
  rule "Require review from Code Owners" makes their approval a condition of the merge. A reference the agent changed
  reaches the main branch only through that person.

## Notes

- The person's time goes in at the start of a task; after that, each run against the references takes seconds.

## Agent step

A guard over the approved references catches what a hash cannot: a change elsewhere that weakens an approved check,
such as a shared fixture, a custom matcher, a looser comparison tolerance, or a script that rewrites snapshots on
every run. It gets the diff and the list of approved references, returns a Verdict that lists each such change for
the person, never approves a change itself, and may block only once it is calibrated
([agent-calibration](../agent-calibration/card.md)).
