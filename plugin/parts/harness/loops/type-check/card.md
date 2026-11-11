---
id: type-check
title: "Type checking"
summary: "The agent runs `tsc --noEmit`, `mypy` or `pyright` and fixes the type mismatches it finds."
sensor: computational
ilities: [correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local]
speed: [seconds]
needs: []
links:
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

Without a type check, a type mismatch shows up later, as a failing test or an error at run time. The checker finds
it in seconds without running the code. Strict mode and data parsed at the boundaries leave fewer places where a
wrong type can slip through.

## How it works

The agent runs `tsc --noEmit`, `mypy` or `pyright`. The checker reports the type mismatches it finds, and the agent fixes them.

## Set up

- Turn on strict mode in the checker.
- Parse data at the boundaries (OpenAI's rule "parse, don't validate").

## Notes

- Böckeler: a strongly typed language gives you this sensor for free.
