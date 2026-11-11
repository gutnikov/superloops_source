---
id: debugger-repl
title: "Debugger and REPL"
summary: "The agent sets a breakpoint or opens a REPL and checks its hypothesis against real values instead of guessing."
sensor: computational
ilities: [observability]
places: [delivery/work, remediation/oracle, remediation/work, discovery/work]
stages: [local]
speed: [seconds]
needs: []
links: []
---

## Why

An agent that guesses at the cause of a bug changes code on a theory and tries again, round after round. A breakpoint
or a REPL shows the real values at the point in question, so the theory is checked before any code changes.

## How it works

The agent sets a breakpoint or opens a REPL at the point its hypothesis is about. It reads the real values there and compares them with what it expected, instead of guessing.

## Set up

- Use a non-interactive mode, such as scripted pdb or `node --inspect`.

The research behind this card names only these two modes. It gives no commands, harness steps or other runtimes, so you have to work out the setup for your project yourself.

## Notes

The research behind this card cites no source for this loop.
