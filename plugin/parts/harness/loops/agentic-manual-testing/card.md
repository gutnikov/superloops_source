---
id: agentic-manual-testing
title: "Agentic manual testing"
summary: "The agent tries the code by hand with `python -c`, temporary files, `curl` or a browser; each defect it finds becomes a permanent test, written red/green."
sensor: inferential
ilities: [correctness]
places: [delivery/work, remediation/oracle, remediation/work, maintenance/work, discovery/work]
stages: [local]
speed: [seconds, minutes]
needs: []
agent: [explorer]
related: [red-green-tdd, bug-failing-test-fix, e2e-browser, exploratory-testing]
links:
  - title: "Agentic manual testing — Agentic Engineering Patterns"
    url: "https://simonwillison.net/guides/agentic-engineering-patterns/agentic-manual-testing/"
    author: "Simon Willison"
---

## Why

Tests check only what someone thought to write a test for. Running the code by hand shows what it does with real input
and turns up defects no test covers. Each defect found this way becomes a permanent test, so the check is not lost
when the session ends.

## How it works

The agent runs what it just wrote the way a user of that code would, and reads what comes back:

- a Python library: `python -c` that imports it and calls the new function;
- another language: a small demo program in `/tmp`, compiled and run there, so it is never committed;
- a JSON API: `curl` against the dev server;
- a web UI: a browser driven from the command line, with screenshots the agent looks at.

Each defect it finds becomes a test that fails on the defect and passes after the fix: red/green
([red-green-tdd](../red-green-tdd/card.md); for a bug in remediation,
[bug-failing-test-fix](../bug-failing-test-fix/card.md)). The manual check leaves a record; the test is what keeps
holding.

## Set up

- **CLIs the agent learns from `--help`.** agent-browser wraps Playwright for coding agents; Rodney uses "the Chrome
  DevTools Protocol to directly control an instance of Chrome". The prompt names the tool and its help, as in "use
  `uvx rodney --help` to test the new homepage", so the agent reads how to use the tool before it starts.
- **A record of what really ran.** Showboat's `exec` records a command, runs it and records its output; `image` adds a
  screenshot. The agent keeps one Showboat document per task, `notes/<task>.md`, and writes command output into it
  only through `exec`. The record is the evidence a reviewer reads instead of running everything again.
- **For a web app**, the [`app-probing`](../../../app-probing/README.md) part: the browser check is a throwaway
  Playwright script on a fixture and Page Objects, so a defect it finds turns into a spec on the same fixture.
- **Scratch stays out of the repository.** Demo files go to `/tmp`; a script worth keeping becomes a test.
- **`run` tracks the defects, not the exploration.** It reads the task's Findings and prints one line per finding,
  `<finding id>: <status>`: `no test`, `test green before the fix`, `red`, `locked in`. The exit is non-zero while
  any finding is not `locked in`, that is, has no test that failed before the fix and passes after it.
- **Cases.** Must fire: a finding with no test; a finding whose test passed before the fix. Must pass: a finding
  whose test was red before the fix and green after it.
- **Wiring.** A Stop hook runs `run` at the end of the turn when the task has findings, so the agent cannot end it
  with a defect that has no test. CI runs the new tests, out of the agent's reach.

## Notes

- Simon Willison on Showboat's `exec`: it "is designed to discourage the agent from cheating and writing what it
  hoped had happened into the document."
- A manual check asserts nothing that lasts. What has to keep holding becomes a test or a spec.

## Agent step

An explorer, separate from the agent that wrote the change, checks it by hand and returns defects as Findings, with
the commands it ran and their output as `evidence`. It may run commands and open the app, and changes nothing in
the product or its tests. It does not block: each Finding becomes a failing test, and `run` tracks it until the test
is green.
