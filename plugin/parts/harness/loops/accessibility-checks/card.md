---
id: accessibility-checks
title: "Accessibility checks (axe, ARIA)"
summary: "`@axe-core/playwright` finds WCAG violations and gives the selector for each one. `toMatchAriaSnapshot` catches structural problems that axe misses."
sensor: computational
ilities: [usability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: [browser]
agent: [explorer]
links:
  - title: "Accessible web testing with Playwright and Axe Core"
    url: "https://dev.to/vitalyskadorva/accessible-web-testing-with-playwright-and-axe-core-2kg1"
  - title: "What's New in Playwright 2026: AI Agents, MCP, and Accessibility-First Testing"
    url: "https://qaskills.sh/blog/whats-new-playwright-2026"
---

## Why

A page can pass every e2e test and still fail someone who uses a keyboard or a screen reader: the tests check what
the page does, not who can reach it. This loop adds accessibility checks to those same tests, so the agent learns
which element breaks WCAG and needs a fix.

## How it works

The checks run inside your e2e tests:

- `@axe-core/playwright` names each WCAG violation it finds and the selector of the element, so the agent knows what to fix.
- `toMatchAriaSnapshot` catches structural problems that axe misses. The source does not say which structural problems these are.

## Set up

The axe package in this loop is built for Playwright, so the loop fits a project that has Playwright e2e tests.

The source gives 2 steps. It does not say whether you need both or whether one is enough.

1. Run axe inside your e2e tests.
2. Set a threshold on the Lighthouse accessibility score. Lighthouse has its own loop in this catalog: [lighthouse-ci](../lighthouse-ci/card.md).

The source does not say which pages to scan, which violations should fail the run, or what threshold to set. It gives no setup step for `toMatchAriaSnapshot`.

## Agent step

axe needs no agent. An explorer covers what axe cannot see: keyboard paths, focus order, what a screen reader
announces. It returns Findings and does not block; a problem it finds becomes a test.
