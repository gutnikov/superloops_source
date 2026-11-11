---
id: bug-failing-test-fix
title: "Bug → failing test → fix"
summary: "The agent reproduces the bug with a test, fixes the code and shows a green run."
sensor: computational
ilities: [correctness, testability]
places: [remediation/oracle, remediation/work]
stages: [local]
speed: [seconds, minutes]
needs: []
agent: [explorer]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
---

## Why

A fix with no test that reproduced the bug is a guess: nothing shows that the bug was there or that the change removed
it. A test that fails before the fix and passes after it shows both. It stays in the suite, so the same bug cannot
come back unnoticed.

## How it works

The agent reproduces the bug with a test, fixes the code and shows a green run. The source does not say whether that run covers only the new test or the whole test suite.

At OpenAI the agent also records a video before and after the fix. The source does not say what the video shows, which bugs it is for or how to set it up.

## Set up

Give the agent this prompt: "write a failing test that reproduces the issue, then fix it". The source names no other step and does not say where the prompt goes.

For a bug in a web app's UI, the [`app-probing`](../../../app-probing/README.md) part of superloops first reproduces the bug in the running app. It works on the state a fixture creates and goes through Page Objects. The agent then writes the failing test on the same fixture and Page Objects.

## Notes

The source describes only the case where the new test fails, the fix makes it pass and nothing else goes wrong. It does not say what to do if:

- the new test passes before the fix, so it does not reproduce the bug
- the agent changes the test instead of the code
- an automated test cannot catch the bug, for example because the bug is flaky, depends on the environment or shows only in the UI

## Agent step

An explorer reproduces the bug in the running app before the agent writes the test. It returns the steps the test will
follow. It does not block.
