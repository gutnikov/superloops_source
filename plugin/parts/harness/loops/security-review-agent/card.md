---
id: security-review-agent
title: "Security and data-handling review by an agent"
summary: "A subagent checks the code against a security checklist or rules such as \"no user names should ever be sent to the web frontend\", and returns findings with line numbers."
sensor: inferential
ilities: [security]
places: [remediation/entry]
stages: [scheduled]
speed: [minutes]
needs: []
agent: [reviewer]
related: [sast, agent-code-review, compliance-mutants, agent-calibration]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Birgitta Böckeler"
    note: "a security review and a data-handling review among the sensors that run on a slower cadence."
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "a reviewer in `.claude/agents/` with only `tools: Read, Grep, Glob`."
  - title: "Create custom subagents"
    url: "https://code.claude.com/docs/en/sub-agents"
  - title: "claude-code-security-review"
    url: "https://github.com/anthropics/claude-code-security-review"
    author: "Anthropic"
    note: "the GitHub Action, and how to customise `/security-review`."
---

## Why

Some rules are not a pattern on one line: "no user names should ever be sent to the web frontend" is about where data
goes, across files. A reviewer with the project's checklist reads the code against such rules. Run on a schedule, it
catches what got past the checks on each change, and the drift that builds up over many changes.

## How it works

A reviewer subagent reads the code merged since its last run against the project's security checklist and its
data-handling rules. It only reads, and changes nothing. Each finding names the rule it breaks, the file and the line.
A finding verifier then checks each finding, and every confirmed one becomes a remediation item through
[triage](../triage/card.md).

## Set up

- **The reviewer is the project's own.** Claude Code has no built-in security reviewer subagent; the project writes
  one, `.claude/agents/security-reviewer.md`, with only `tools: Read, Grep, Glob`. That makes it a reviewer that
  cannot edit, "enforced by Claude Code rather than requested in a prompt". Its body is the checklist: the security
  team's items and the data-handling rules, each with an id that the findings name in `rule`.
- **`/security-review` for one change.** The built-in command analyzes "the changes on your current branch for
  security vulnerabilities", against origin's default branch: injection, auth, data exposure. It does not know the
  project's rules. To add them, copy `security-review.md` from `anthropics/claude-code-security-review` into
  `.claude/commands/` and edit it. The same repository's GitHub Action reviews PRs, but it "is not hardened against
  prompt injection attacks and should only be used to review trusted PRs".
- **On a schedule.** A weekly CI job writes the diff of what was merged since the last run to a file and runs the
  reviewer headless on it, `claude -p --agent security-reviewer "Review the changes in <file>"`; once a month it runs
  over each module in turn. The checks on every change catch patterns; this one catches rules that span files.
- **Findings are verified.** A finding verifier gets each Finding and the code, and returns CONFIRMED, PLAUSIBLE or
  REFUTED ([agent formats](../../agent-formats.md)). A confirmed `high` finding opens a remediation item.
- **`run`** prints the Findings, `file:line: [<rule>] <message>`, and exits non-zero on a `high` finding only once the
  reviewer is calibrated ([agent-calibration](../agent-calibration/card.md)); until then it prints them and exits 0.
- **Cases**, which are also the reviewer's evals. Must fire: a handler that returns the user's name in a JSON response
  to the frontend; an SQL query built from a request parameter. Must pass: the same handlers returning only an id
  and using a parameterized query.
- **Out of the agents' reach.** The scheduled job runs outside any working agent's session. A PreToolUse hook denies
  the working agent's writes to the reviewer's definition and its checklist.

## Notes

- Böckeler runs "A security review, prompt derived from our AppSec checklist for internal applications" and "A data
  handling review, prompt describes things like 'no user names should ever be sent to the web frontend'" among the
  "Sensors that run on a slower cadence to detect drift that accumulates over time".
- [SAST](../sast/card.md) catches the one-line patterns in seconds; this review is for what a pattern cannot express.

## Agent step

A reviewer whose lens is the project's security checklist and data-handling rules. It gets the code of the commit
range, never a working agent's reasoning, reads only, and returns Findings with the rule, the file and the line; a
finding verifier checks each one. It blocks only once calibrated on seeded vulnerabilities that must fire and clean
code that must pass ([agent-calibration](../agent-calibration/card.md)).
