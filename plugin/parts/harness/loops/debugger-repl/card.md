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
related: [bug-failing-test-fix, reproduction-gate, agentic-manual-testing]
links:
  - title: "pdb: The Python Debugger"
    url: "https://docs.python.org/3/library/pdb.html"
    author: "Python"
  - title: "Debugger"
    url: "https://nodejs.org/api/debugger.html"
    author: "Node.js"
  - title: "debugpy"
    url: "https://github.com/microsoft/debugpy"
    author: "Microsoft"
---

## Why

An agent that guesses at the cause of a bug changes code on a theory and tries again, round after round. A breakpoint
or a REPL shows the real values at the point in question, so the theory is checked before any code changes.

## How it works

The agent states its hypothesis as values at a line: "at `billing.py:142`, `balance` is already reduced by
`amount`". It runs the program, or the failing test, under a debugger that stops at that line, prints the
expressions and exits, with nobody at the keyboard. The values match the hypothesis or they do not. A match tells the
agent where to write the failing test; a mismatch sends it back to a new hypothesis before it has changed any code.

## Set up

- **A scripted session, not an interactive one.** Nobody types at the agent's prompt, so every command goes in up
  front:
  - Python: `python -m pdb -c 'break app/billing.py:142' -c continue -c 'p balance, amount' -c quit app/main.py
    < /dev/null`. Each `-c` runs a command "as if given in a `.pdbrc` file". pdb restarts the program after it ends,
    so the session finishes with `quit`, and stdin is closed: an end of file is the same as `quit`.
  - Node: `node inspect` is an interactive client. For a scripted session, start the program with
    `node --inspect-brk`, which breaks on the first line once a debugger attaches, and drive it with a small script
    over the Chrome DevTools Protocol. For a pure function, a REPL call with `node -e` is often enough.
  - A running Python service: `python -m debugpy --listen localhost:5678 --wait-for-client <file>`, with a Debug
    Adapter Protocol client. Keep it on `localhost`: debugpy's README says listening on a public interface should
    only be done on secure networks.
- **The `run`** takes a probe file (the location, the expressions and the values the hypothesis expects), runs the
  scripted session and prints one line per expression, `file:line: <expression> = <value> (expected <value>)`. It
  exits non-zero when a value differs or the line is never reached. A non-zero exit is a hypothesis disproved, not a
  failure of the code.
- **Cases.** Must fire: a small program where the value at the line differs from the expected one; a probe at a line
  the run never reaches. Must pass: a probe whose expected values match.
- **Wiring.** None beyond the agent's session: the agent runs it whenever it has a hypothesis, and probe files are
  scratch that stays out of git. It is not a gate, so there is nothing to get around. What it confirms becomes a
  failing test ([bug-failing-test-fix](../bug-failing-test-fix/card.md)), and the gates check that test.
