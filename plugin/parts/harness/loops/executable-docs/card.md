---
id: executable-docs
title: "Executable documentation"
summary: "Doctests and a check of API responses against the OpenAPI schema turn a mismatch between the docs and the code into a failing test."
sensor: computational
ilities: [maintainability, correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

Docs and code drift apart quietly: the code changes, the example in the docs does not, and nothing fails. An agent
that reads those docs then works from a wrong description. Doctests and a check of API responses against the OpenAPI
schema turn that drift into a failing test on the change that causes it.

## How it works

The loop has two checks:

- Doctests run the examples in the docs as tests. An example that no longer matches the code fails.
- The schema check compares API responses with the OpenAPI schema. A response that does not match the schema fails the check.

## Set up

The source names these tools and artifacts for this loop but gives no setup steps:

- doctest
- rustdoc
- generated artifacts, such as `docs/generated/db-schema.md` in OpenAI's repository

The source does not say what `docs/generated/db-schema.md` contains, what generates it, or which check fails when it goes out of date.

The source names no tool for checking API responses against the OpenAPI schema.
