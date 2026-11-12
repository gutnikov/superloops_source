---
id: debugger-repl
title: "Debugger and REPL"
summary: "The agent ranks 3 to 5 falsifiable hypotheses, then checks each against real values at a breakpoint or in a REPL instead of guessing; tagged debug logs must be gone before a commit."
sensor: computational
ilities: [observability]
places: [delivery/work, remediation/oracle, remediation/work, discovery/work]
stages: [local]
speed: [seconds]
needs: []
related: [bug-failing-test-fix, reproduction-gate, agentic-manual-testing, pre-commit-pre-push, profiling]
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
  - title: "diagnosing-bugs: ranked falsifiable hypotheses, one-variable probes, tagged logs"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/SKILL.md#L88-L112"
    author: "skills (Matt Pocock)"
  - title: "diagnosing-bugs: cleanup before done"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/SKILL.md#L130-L137"
    author: "skills (Matt Pocock)"
    note: "\"All `[DEBUG-...]` instrumentation removed (`grep` the prefix)\"."
---

## Why

An agent that guesses at the cause of a bug changes code on a theory and tries again, round after round. A breakpoint
or a REPL shows the real values at the point in question, so the theory is checked before any code changes.

## How it works

Before any probe, the agent writes 3 to 5 hypotheses, ranked, each with the prediction that would disprove it.
Pocock's `diagnosing-bugs`: "Single-hypothesis generation anchors on the first plausible idea", in the form "If <X> is
the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse"; one with no prediction
"is a vibe: discard or sharpen it." The list goes to the person, who may know what a recent change makes likely, and
the agent goes on with its own ranking without waiting.

Each probe tests one prediction and changes one variable. The agent states it as values at a line: "at
`billing.py:142`, `balance` is already reduced by `amount`". It runs the program, or the failing test, under a
debugger that stops at that line, prints the expressions and exits, with nobody at the keyboard. The values match the
hypothesis or they do not. A match tells the agent where to write the failing test; a mismatch crosses the hypothesis
off before any code has changed. Where no debugger attaches, a log line at the boundary between two hypotheses,
tagged with a prefix unique to the session, such as `[DEBUG-a4f2]`: "Untagged logs survive; tagged logs die."

A performance regression gets a baseline measurement and a bisect instead ([profiling](../profiling/card.md)).

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
- **The `run`** takes a probe file (the hypothesis's id, the location, the expressions and the values its prediction
  expects), runs the scripted session and prints one line per expression, `<H2> file:line: <expression> = <value>
  (expected <value>)`. It exits non-zero when a value differs or the line is never reached. A non-zero exit is a
  hypothesis disproved, not a failure of the code.
- **Tagged logs leave with the fix.** The pre-commit hook ([pre-commit-pre-push](../pre-commit-pre-push/card.md))
  greps the staged diff for `[DEBUG-` and blocks the commit with `file:line: leftover debug log`.
- **Cases.** Must fire: a small program where the value at the line differs from the expected one; a probe at a line
  the run never reaches; a staged diff with a `[DEBUG-a4f2]` line. Must pass: a probe whose expected values match.
- **Wiring.** The probes run in the agent's session whenever it has a hypothesis; probe files are scratch that stays
  out of git, and there is nothing to get around. The only gate is the tag check at commit. What a probe confirms
  becomes a failing test ([bug-failing-test-fix](../bug-failing-test-fix/card.md)), and the gates check that test.
