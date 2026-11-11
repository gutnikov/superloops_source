---
id: accessibility-tree-navigation
title: "Agent navigation by the accessibility tree"
summary: "The agent drives the page by Playwright MCP's accessibility snapshot instead of pixels; a button it cannot find by role and name means poor accessibility and a broken scenario."
sensor: computational
ilities: [usability]
places: [delivery/work, remediation/work, discovery/work]
stages: [local]
speed: [seconds]
needs: [browser]
links:
  - title: "Playwright MCP"
    url: "https://playwright.dev/mcp/introduction"
  - title: "Playwright MCP: Browser Automation for AI Agents (2026)"
    url: "https://mcp.directory/blog/playwright-browser-mcp-guide-2026"
  - title: "Accessible web testing with Playwright and Axe Core"
    url: "https://dev.to/vitalyskadorva/accessible-web-testing-with-playwright-and-axe-core-2kg1"
  - title: "Playwright MCP Guide: Let Claude, Codex, and Cursor Control the Browser"
    url: "https://eastondev.com/blog/en/posts/ai/20260904-playwright-mcp-browser-automation-claude-codex-cursor/"
---

## Why

When the agent works the page through its accessibility tree, a button without a proper role and name is a button
it cannot find. That one miss says two things at once: the page has poor accessibility, and the scenario does not
work. The agent gets an accessibility signal from work it was doing anyway, with no separate check to run.

## How it works

Playwright MCP gives the agent an accessibility snapshot of the page instead of pixels. If the agent cannot find
a button by its role and name, the source reads that one miss as two signals at once: the page has poor accessibility,
and the scenario does not work.

## Set up

- Playwright MCP or playwright-cli.

## Notes

- `browser_run_code_unsafe` in Playwright MCP is effectively remote code execution.
