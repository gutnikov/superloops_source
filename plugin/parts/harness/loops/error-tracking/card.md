---
id: error-tracking
title: "Error tracking (Sentry)"
summary: "Through Sentry MCP the agent gets the top errors, their stack traces and Seer's root-cause analysis; it reproduces one with a test, fixes it, and checks that the error rate fell after the release."
sensor: computational
ilities: [reliability, observability]
places: [delivery/confirmation, remediation/entry, remediation/confirmation, maintenance/confirmation]
stages: [production]
speed: [minutes, days]
needs: [errors]
agent: [investigator]
links:
  - title: "Debug and fix production issues with Sentry MCP in Warp"
    url: "https://sentry.io/cookbook/debug-with-sentry-mcp-warp/"
  - title: "Codex CLI + Sentry MCP: From Production Error to Pull Request in One Agent Loop"
    url: "https://codex.danielvaughan.com/2026/05/09/codex-cli-sentry-mcp-production-error-triage-automated-bug-resolution/"
  - title: "sentry-fix-issues"
    url: "https://mcpservers.org/agent-skills/sentry/sentry-agent-skills/sentry-fix-issues"
  - title: "Sentry MCP"
    url: "https://docs.sentry.io/product/sentry-mcp/"
---

## Why

Some errors show only in production, where none of the agent's own tests run. The tracker hands the agent the top
errors, so it works on what fails for users, not on a guess. Checking the error rate after the release shows whether
the fix worked where the error happened, not only in the test that reproduced it.

## How it works

1. Through Sentry MCP the agent gets the top errors, their stack traces and Seer's root-cause analysis.
2. It reproduces an error with a test.
3. It fixes the error.
4. After the release, it checks that the error rate went down.

## Set up

- `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp`

## Notes

- Treat Sentry event data as untrusted input.

## Agent step

An investigator takes the top errors with their stack traces and returns, per error, a Diagnosis and whether a test
can reproduce it. The investigator never blocks.
