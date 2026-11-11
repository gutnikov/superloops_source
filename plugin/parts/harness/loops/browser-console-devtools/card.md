---
id: browser-console-devtools
title: "Browser console and DevTools"
summary: "The agent reads the page's console errors and network requests and fixes JS exceptions and 4xx/5xx responses."
sensor: computational
ilities: [observability, correctness]
places: [delivery/work, remediation/oracle, remediation/work]
stages: [local]
speed: [seconds]
needs: [browser]
agent: [investigator]
links:
  - title: "Playwright MCP Guide: Let Claude, Codex, and Cursor Control the Browser"
    url: "https://eastondev.com/blog/en/posts/ai/20260904-playwright-mcp-browser-automation-claude-codex-cursor/"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "claude-code-best-practice"
    url: "https://github.com/shanraisshan/claude-code-best-practice"
---

## Why

A page can look right while a script throws in the console or a request behind it fails with a 4xx or 5xx. These
errors show only in the running page, and the agent does not see them unless it reads the console and the network.
With them in front of it, the agent fixes the cause instead of guessing from what the screen shows.

## How it works

The agent opens the running page with a browser tool and reads 2 things: the errors in the console and the requests in
the network. For each JS exception, and for each request that fails with a 4xx or 5xx, it fixes the cause.

OpenAI built this loop into its own harness. It connected its agent to CDP and gave the agent skills for working with
DOM snapshots. The source does not describe these skills.

## Set up

In a project with Playwright fixtures and Page Objects, the [`app-probing`](../../../app-probing/README.md) part of superloops collects console
errors and the app's failed requests in every probe, without third-party noise.

The source names 3 tools for this loop:

- Chrome DevTools MCP
- Playwright MCP
- Claude in Chrome

The source does not say whether to use one of these tools or combine them. It does not give setup steps for any of
them.

## Agent step

An investigator groups the console errors and failed requests by cause and returns a Diagnosis for each. It never
blocks.
