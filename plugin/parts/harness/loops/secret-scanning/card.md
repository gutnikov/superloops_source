---
id: secret-scanning
title: "Secret scanning"
summary: "GitLeaks in pre-commit blocks a commit that contains a secret; the agent moves the secret into environment variables."
sensor: computational
ilities: [security]
places: [delivery/work, remediation/work, maintenance/work]
stages: [commit, ci]
speed: [seconds]
needs: []
related: [pre-commit-pre-push, sast]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Birgitta Böckeler"
  - title: "Gitleaks"
    url: "https://github.com/gitleaks/gitleaks"
    note: "the pre-commit hook, exit codes, `gitleaks:allow`, `.gitleaksignore`, baselines and custom rules in `.gitleaks.toml`."
  - title: "TruffleHog"
    url: "https://github.com/trufflesecurity/trufflehog"
    note: "verifying found credentials, and exit code 183 with `--fail`."
  - title: "lint.js: the sensitive-keyword linter"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/lint.js#L245-L322"
    author: "gemini-cli (Google)"
    note: "unreleased model names in the changed files, a warning annotation, never a failure."
---

## Why

An agent writing code that needs a key can put the key in the code itself. Once committed, the secret stays in the
history, and once pushed it has to be revoked, not just deleted. A pre-commit hook stops the commit before that
happens, and the agent moves the secret into environment variables.

## How it works

1. The agent commits.
2. The pre-commit hook runs Gitleaks on the staged changes.
3. On a finding, the hook blocks the commit and Gitleaks prints the rule, the file and the line, with the secret
   redacted.
4. The agent moves the value out of the code: the code reads an environment variable or the project's secret store,
   `.env.example` gets a placeholder, and the agent commits again.

A secret that already reached a pushed commit is no longer the agent's to fix by editing. It goes to a person, who
revokes and rotates it (H2).

## Set up

- **The hook.** With pre-commit, the `gitleaks` hook from `https://github.com/gitleaks/gitleaks` in
  `.pre-commit-config.yaml`, installed with `pre-commit install`. It runs
  `gitleaks git --pre-commit --redact --staged --verbose`.
- **Tell a leak from a failed scan.** Gitleaks exits 0 when there are no leaks and 1 on "leaks or error encountered",
  so `run` reads its JSON report (`--report-format json`) to tell the two apart.
- **TruffleHog for the whole history.** It checks whether a found credential is live: `--results=verified` reports
  only credentials "confirmed as valid and active by API testing", and with `--fail` it exits 183 on results and 1 on
  an error. Use Gitleaks in the hook and a scheduled TruffleHog scan of the whole history in CI; a verified key is an
  incident for a person.
- **False positives are reviewed lines.** A test fixture that looks like a key gets a `gitleaks:allow` comment on its
  line, or its fingerprint goes into `.gitleaksignore`. `run` lists each one the change adds, so a person sees it.
- **An existing repository** starts from a baseline: `gitleaks git --baseline-path gitleaks-report.json` reports
  only new findings. The old ones go to a person to rotate.
- **`run`** is `gitleaks dir` on the directory with a JSON report. It prints `file:line: <rule id>` per finding, the
  secret redacted, and per new allow comment or ignore line, and exits non-zero on any of them or when no report was
  written.
- **Cases.** Must fire: a copy with a generated key in a provider's format in a config file; a copy with a private key
  block; a copy that adds `gitleaks:allow`; a copy that adds a name the confidential rule lists. Must pass: the same
  code reading the key from an environment variable, with a placeholder in `.env.example`.
- **Out of the agent's reach.** `SKIP=gitleaks git commit` or `git commit --no-verify` skips the hook, so a PreToolUse
  hook on Bash denies both in the agent's session, and a CI job scans the PR's commits again. The CI run is the one
  that counts.

## Notes

- Böckeler: "GitLeaks runs as part of the pre-commit hook, I consider it to be a sensor as well, as it will give the
  agent feedback when it tries to commit".
- Other fast checks at commit time: [pre-commit-pre-push](../pre-commit-pre-push/card.md).
- **Confidential is not only a credential.** An agent writes names it saw in training or in internal documents: an
  unreleased model, a codename, an internal host. A custom Gitleaks rule in `.gitleaks.toml` finds them: a pattern,
  and an allowlist of the names already public. gemini-cli's lint matches `gemini-\d+(\.\d+)?` in the changed files
  against its released names and annotates any other match, "Found sensitive keyword "X". Please make sure this
  change is appropriate to submit.", without failing. In the agent's `run` such a match fails like a secret, because
  an agent does not weigh a warning; the list of public names is a reviewed file that a person extends at a release.
