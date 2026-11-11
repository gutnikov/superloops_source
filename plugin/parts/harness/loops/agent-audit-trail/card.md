---
id: agent-audit-trail
title: "Audit trail of agent actions"
summary: "The agent leaves evidence: commands with their output, screenshots, videos, commits. The reviewer checks the evidence instead of re-running everything."
sensor: human
ilities: [security]
places: [delivery/gate, remediation/gate, maintenance/gate]
stages: [task]
speed: [minutes]
needs: []
when: [after]
initiator: rule
sync: blocking
assesses: [result]
related: [verification-subagent, human-diff-review, result-demo, progress-file-feature-list]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "ask Claude for evidence: the command it ran and its output, or the screenshot"
---

## Why

An agent's "done" is a claim. A reviewer who cannot see what the agent ran either trusts the claim or runs
everything again. Evidence left along the way (commands with their output, screenshots, commits) lets the reviewer
check the claim instead.

## How it works

1. As the agent works, it keeps the evidence of each claim: the command and its output, the screenshot or video,
   the commit.
2. When it says the task is done, it lists each claim with the evidence next to it.
3. A person reviews the claims against the evidence instead of rerunning everything.
4. A claim whose evidence is missing, partial or does not match goes back to the agent, with the list of what is
   missing for which claim. The agent produces the evidence by running the check again, not by restating the result.

Claude Code's best practices put it as: ask Claude for evidence, "the command it ran and its output, or the
screenshot. 'All tests pass' on its own tells you very little".

## Set up

- **The rule in CLAUDE.md**: every claim of done lists its evidence: the command with its full output, the path of
  the screenshot, the commit. CLAUDE.md is advice; `run` below makes it a check.
- **Where the evidence lives**: in the pull request's description, or in a file per task that the description links.
  The tools capture it: test reports and logs from CI, screenshots from the e2e run's output folder, not text the
  agent retyped. Over many sessions, the progress file keeps the record
  ([progress-file-feature-list](../progress-file-feature-list/card.md)).
- **Prefer evidence from outside the agent's session.** Output the agent pasted can be chosen or edited; a link to
  the CI run of the same commit cannot.
- **`run`** checks the record, not the work. For each claim it prints `<claim>: <status>`: `ok`, `no evidence`,
  `evidence older than the last commit` or `missing file`. It exits non-zero on anything but `ok`.
- **Cases.** Must fire: "tests pass" with no output; a screenshot older than the last commit; evidence that names a
  file that does not exist. Must pass: every claim with current output or a link to the CI run of the head commit.
- **The person's review** is the pull request review, at the autonomy levels where a person merges; it needs no
  separate call. A claim the evidence did not support is logged as a correction
  (`loops.py trace correction <super-loop>/gate --item <id> --note "…"`), so that a repeated one becomes a loop
  ([correction-becomes-rule](../correction-becomes-rule/card.md)).
- **Validation** is `manual` for the review; `run` is validated with its cases.
