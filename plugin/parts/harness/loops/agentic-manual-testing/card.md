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

The agent checks the code by hand: `python -c`, temporary files in `/tmp`, `curl`, a browser. When the agent finds a
defect, it locks the fix in with a permanent test, written red/green ([red-green-tdd](../red-green-tdd/card.md)).

## Set up

Give the agent:

- tools with a detailed `--help`, such as Rodney and agent-browser
- Showboat, which records the real output of the commands the agent runs
- for a web app, the [`app-probing`](../../../app-probing/README.md) part of superloops: it runs the browser check as a throwaway Playwright script built on a test fixture and
  Page Objects

## Notes

- Because Showboat records what the commands really output, it is harder for the agent to describe what it hoped would happen
  instead of what happened.

## Agent step

An explorer, separate from the agent that wrote the change, checks it by hand and returns defects as Findings with
the steps to reproduce them. It does not block; a defect it finds becomes a failing test.
