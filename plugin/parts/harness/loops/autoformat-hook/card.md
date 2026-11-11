---
id: autoformat-hook
title: "Auto-formatting hook"
summary: "After every file write a hook formats the code, so the agent does not spend iterations fixing formatting by hand."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, local]
speed: [sub-second]
needs: []
links:
  - title: "Boris Cherny on X"
    url: "https://x.com/bcherny/status/2007179861115511237"
  - title: "claude-code-best-practice"
    url: "https://github.com/shanraisshan/claude-code-best-practice"
---

## Why

Without the hook, the agent spends iterations on formatting, and a formatting error it misses fails CI later. A hook that formats the code after every write settles formatting before any other check runs.

## How it works

The agent writes a file, and a PostToolUse hook then runs a formatter on the code. Boris Cherny says the hook "handles the last 10% to avoid formatting errors in CI". The source quotes only this part of his sentence and does not say what the 10% is a share of.

## Set up

Add a PostToolUse hook that formats the code after every file write.

## Notes

The source does not say the following, so you have to settle these in your own project:

- which tool calls trigger the hook
- which formatter command the hook runs, or whether it must match the formatter that CI checks against
- what the agent sees when the formatter fails on a file
- what happens when the hook rewrites a file the agent has read and is about to edit again
