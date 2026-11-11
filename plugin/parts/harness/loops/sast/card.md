---
id: sast
title: "SAST"
summary: "Semgrep or CodeQL reports a rule, a file and a line; the agent fixes the vulnerable pattern."
sensor: computational
ilities: [security]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, local, ci]
speed: [seconds, minutes]
needs: []
related: [security-review-agent, secret-scanning, dast, lint-with-fix-instructions]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Birgitta Böckeler"
  - title: "CLI reference"
    url: "https://docs.semgrep.dev/cli-reference"
    author: "Semgrep"
    note: "`--error`, `--json`, `--sarif`, `--baseline-commit` and the exit codes."
  - title: "Ignore files, folders, and code"
    url: "https://docs.semgrep.dev/ignoring-files-folders-code"
    author: "Semgrep"
  - title: "Analyzing your code with CodeQL queries"
    url: "https://docs.github.com/en/code-security/codeql-cli/getting-started-with-the-codeql-cli/analyzing-your-code-with-codeql-queries"
    author: "GitHub"
---

## Why

A vulnerable pattern can pass every test, because the tests check what the code should do, not what an attacker can
make it do. A scanner with the security team's rules names the rule, the file and the line, so the agent fixes the
pattern where it is. Semgrep runs in seconds, after an edit and in CI.

## How it works

For each finding, Semgrep or CodeQL reports the rule, the file and the line, in JSON or SARIF. The agent reads the
rule's message, fixes the pattern at that line, and scans again until the scan is clean. A finding the agent thinks is
false is not silenced by the agent alone: it adds `nosemgrep: <rule-id>` with the reason, and a person approves it in
review.

## Set up

- **Rules the project owns.** The ruleset is in the repository (a `.semgrep/` directory of YAML rules), taken from the
  security team's checklist or a registry pack. `--config auto` fetches rules "tailored to this project" and is a
  start; pin what it found into the repository, so a run gives the same result tomorrow.
- **Findings must fail.** `semgrep scan` exits 0 with findings unless `--error` is set: with it, it exits 1 on
  findings. Exit codes 2 and up are errors, not findings, and `run` reports them as a broken scan, not a pass.
  `semgrep ci` fails on findings by default.
- **Only new findings block.** On a codebase with old findings, `--baseline-commit <main sha>` shows only results
  not found in that commit. The agent fixes what its change brought in; the old findings go to a backlog.
- **CodeQL for deeper queries**, in CI where its database build has time:
  `codeql database analyze <db> --format=sarif-latest --output=results.sarif <queries>`. `run` reads the SARIF.
- **A suppression is a finding of its own.** A `nosemgrep: RULE_ID` comment hides the finding, and Semgrep records it
  as Ignored. `run` lists every suppression comment the change adds, so a person sees each one.
- **`run`** is `semgrep scan --error --json --baseline-commit <base>` on the directory. It prints
  `file:line: <rule id>: <message>` per finding and per new suppression, and exits non-zero on any of them or on a
  Semgrep error.
- **Cases.** Must fire: a copy with a seeded instance of a project rule, such as an SQL query built by string
  concatenation from a request parameter; a copy that adds a `nosemgrep` comment. Must pass: the same handler with a
  parameterized query.
- **Wiring.** A PostToolUse hook on `Edit|Write` runs Semgrep on the edited file and exits 2 on a finding, so the
  agent sees it seconds after writing the line; a CI job runs the full ruleset, and CodeQL. The final run is in CI,
  and a PreToolUse hook denies the agent's writes to the ruleset.

## Notes

- Böckeler lists "Semgrep, SAST tool prescribed by our internal AppSec team" among the sensors that run during the
  coding session.
- Rules that span files, such as where user data may go, are beyond a pattern on one line; the
  [security-review-agent](../security-review-agent/card.md) reads the code against those.
