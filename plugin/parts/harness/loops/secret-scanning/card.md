---
id: secret-scanning
title: "Secret scanning"
summary: "GitLeaks in pre-commit blocks a commit that contains a secret; the agent moves the secret into environment variables."
sensor: computational
ilities: [security]
places: [delivery/work, remediation/work, maintenance/work]
stages: [commit]
speed: [seconds]
needs: []
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
---

## Why

An agent writing code that needs a key can put the key in the code itself. Once committed, the secret stays in the
history. A pre-commit hook stops the commit before that happens, and the agent moves the secret into environment
variables.

## How it works

1. The agent starts a commit.
2. A pre-commit hook runs a secret scanner, GitLeaks or trufflehog, on the commit.
3. If the scanner finds a secret, the hook blocks the commit.
4. The agent moves the secret out of the code and into environment variables.

## Set up

- Run GitLeaks or trufflehog as a pre-commit hook.
- The source gives no setup steps and no reason to pick one tool over the other.

## Notes

- Böckeler explicitly calls this hook a sensor for the agent.
- The source does not say what to do in these cases:
  - the scanner flags something that is not a real secret
  - the agent skips the hook
  - the secret is already in an earlier commit
