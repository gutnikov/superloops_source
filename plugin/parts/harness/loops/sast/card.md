---
id: sast
title: "SAST"
summary: "Semgrep or CodeQL reports a rule, a file and a line; the agent fixes the vulnerable pattern."
sensor: computational
ilities: [security]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
---

## Why

A vulnerable pattern can pass every test, because the tests check what the code should do, not what an attacker can
make it do. A scanner with the AppSec team's rules names the rule, the file and the line, so the agent fixes the
pattern where it is. It runs in seconds, locally and in CI.

## How it works

For each finding, Semgrep or CodeQL reports the rule, the file and the line, in SARIF or JSON. The agent reads the report and fixes the vulnerable pattern at that line.

## Set up

- Rules from the AppSec team (Böckeler used Semgrep, as her AppSec team prescribed).
- Output in SARIF or JSON.
