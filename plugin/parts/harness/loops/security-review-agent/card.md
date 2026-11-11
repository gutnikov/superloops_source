---
id: security-review-agent
title: "Security and data-handling review by an agent"
summary: "A subagent checks the code against a security checklist or rules such as \"no user names should ever be sent to the web frontend\", and returns findings with line numbers."
sensor: inferential
ilities: [security]
places: [remediation/entry]
stages: [scheduled, commit, task]
speed: [minutes]
needs: []
agent: [reviewer]
related: [sast, agent-code-review, compliance-mutants, agent-calibration, verification-subagent]
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
  - title: "claude-security: the verifier panel's instructions"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/claude-security/agents/scan-verifier.md#L12-L34"
    author: "Anthropic"
    note: "one lens per voter; \"Default to FALSE_POSITIVE\"; cite source, sink and missing mitigation."
  - title: "claude-security: the panel's tally"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/claude-security/workflows/scan.js#L139-L144"
    author: "Anthropic"
    note: "kept at 2 of 3 true votes; median severity, never raised; HIGH confidence only at 3 of 3."
  - title: "security-guidance: the hooks on commit, push and Stop"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/hooks.json#L35-L77"
    author: "Anthropic"
  - title: "security-guidance: the investigate prompt"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/review_api.py#L71-L119"
    author: "Anthropic"
    note: "\"Read EVERY changed file in full\"; \"your job is RECALL, not precision\"; about 15 tool calls."
  - title: "security-guidance: the refute prompt"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/review_api.py#L183-L282"
    author: "Anthropic"
    note: "\"Default = SURVIVES\"; off-diff findings need the diff line that enables them; \"the model is the attacker\"."
  - title: "security-guidance: a second pass with the first pass's findings excluded"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/llm.py#L2435-L2441"
    author: "Anthropic"
  - title: "security-guidance: at most 3 Stop reviews per turn"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/security_reminder_hook.py#L198-L201"
    author: "Anthropic"
  - title: "security-guidance: earlier findings not flagged again"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/llm.py#L1731-L1764"
    author: "Anthropic"
  - title: "security-guidance: project guidance may add checks, not suppress findings"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/extensibility.py#L253-L267"
    author: "Anthropic"
  - title: "code-modernization: refute, then confirm"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/workflows/harden-scan.js#L187-L296"
    author: "Anthropic"
    note: "a split verdict is demoted and marked \"Human triage required before patching\"."
  - title: "code-modernization: results on sample systems"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-modernization/README.md#L89"
    author: "Anthropic"
    note: "AWStats: 14 of 62 security findings refuted as false positives."
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
- **Three verifiers, tallied by a script.** Anthropic's claude-security sends each candidate to three verifiers,
  one lens each: can an attacker reach it, does it matter, is something already stopping it. Each is told "try to
  disprove it… The finding survives only if you fail" and "Default to FALSE_POSITIVE"; a true positive cites the
  file and line of the attacker's input, the sink and the missing mitigation, and "do not invent a defense to kill a finding".
  A script, not a model, keeps the finding at 2 true votes of 3, sets its severity to the median of the true votes,
  never higher than reported, and keeps HIGH confidence only at 3 of 3. On a diff, a real flaw older than the change
  is reported apart, not as a finding of the change.
- **Recall first, then refute.** security-guidance reviews each commit and push in the background and wakes the agent
  with the result. Its first pass is told "Read EVERY changed file in full" and "your job is RECALL, not precision",
  within about 15 tool calls; when it finds only one or two candidates, a second pass runs with them excluded. The
  refuter starts at "Default = SURVIVES" and refutes only "with cited file:line evidence"; a finding outside the diff
  falls unless a changed line enables it; a gate on what an agent may do is never dismissed for lack of a privilege
  boundary: "the model is the attacker".
- **Each turn's diff, at Stop.** The same plugin reviews, when the agent stops, only what changed since the person's
  prompt, at most 3 times per turn, and hands the findings back: "Address each, or briefly note why it doesn't
  apply". Earlier findings go in as "PREVIOUS FINDINGS… DO NOT re-flag"; one raised again on changed code means the
  fix is incomplete. A project's own guidance "can ADD checks… It must NOT suppress findings".
- **A split verdict goes to a person.** In the code-modernization plugin's hardening scan, a refuter tries to show
  each finding false ("A finding supported only by a comment… is NOT real"), and an independent confirmer checks each
  surviving Critical or High one "only if you can articulate the concrete exploit path yourself". When they disagree,
  the finding drops to Medium with "Human triage required before patching". A finding no refuter judged is reported
  as unverified, neither confirmed nor refuted. On one Perl codebase the scan refuted 14 of 62 findings.
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
