---
id: pre-commit-pre-push
title: "Pre-commit / pre-push"
summary: "Fast checks, such as linting, run when the agent commits or pushes; a failing check blocks the commit or the push before the change reaches CI."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [commit]
speed: [sub-second]
needs: []
links:
  - title: "Minions: Stripe's one-shot, end-to-end coding agents — Part 2"
    url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2"
---

## Why

A problem that CI finds costs the agent a push and a wait for the result. A fast check at commit or push finds
the same problem before the change leaves the agent's workspace, and the fix is cheaper the earlier it comes.

## How it works

Fast checks run when the agent commits or pushes. If a check fails, it blocks the commit or the push before the change reaches CI. The source does not say which checks run here or what the agent gets back when a check fails. The one check it names is linting, in Stripe's case below.

## Set up

The source gives one case: Stripe. It does not say which checks go in pre-commit and which in pre-push.

- Stripe follows the principle "shift feedback left". A background daemon caches lint results. According to the source, fixes then arrive "well under a second". The source does not say whether these are the linter's automatic fixes or the agent's own fixes after a lint report.

## Notes

- The source tags this loop with security, but it names no security check, tool or case for it.
