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
related: [e2e-browser, agentic-manual-testing, structured-logs]
links:
  - title: "Chrome DevTools MCP"
    url: "https://github.com/ChromeDevTools/chrome-devtools-mcp"
    author: "Chrome DevTools"
    note: "the Claude Code plugin."
  - title: "Chrome DevTools MCP tool reference"
    url: "https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md"
    author: "Chrome DevTools"
    note: "list_console_messages, list_network_requests, get_network_request."
  - title: "Page"
    url: "https://playwright.dev/docs/api/class-page"
    author: "Playwright"
    note: "the console, pageerror, requestfailed and response events."
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Playwright MCP Guide: Let Claude, Codex, and Cursor Control the Browser"
    url: "https://eastondev.com/blog/en/posts/ai/20260904-playwright-mcp-browser-automation-claude-codex-cursor/"
  - title: "claude-code-best-practice"
    url: "https://github.com/shanraisshan/claude-code-best-practice"
---

## Why

A page can look right while a script throws in the console or a request behind it fails with a 4xx or 5xx. These
errors show only in the running page, and the agent does not see them unless it reads the console and the network.
With them in front of it, the agent fixes the cause instead of guessing from what the screen shows.

## How it works

The agent opens the page it changed in a browser it drives, walks the path, and reads two lists: the console messages
and the network requests since the page loaded. Every uncaught exception, every console error and every request to
the app's own origins that failed or answered 4xx or 5xx is a problem to fix. The agent finds the cause in the code
or in the server's log ([structured-logs](../structured-logs/card.md)), fixes it, reloads and reads again until both
lists are clean.

Two tools give these lists:

- **Chrome DevTools MCP**: `list_console_messages` lists the messages since the last navigation (filtered by
  `types`, with stack traces on `includeStackTraces`); `list_network_requests` lists the requests, and
  `get_network_request` shows one with its headers and bodies.
- **Playwright**, in a probe or a test: `page.on('pageerror')` is "Emitted when an uncaught exception happens within
  the page", `page.on('console')` receives each console call, `page.on('requestfailed')` each request that failed,
  "for example by timing out", and `page.on('response')` each response with its status.

## Set up

- **Pick the tool by the project.** With Playwright fixtures and Page Objects, use the
  [`app-probing`](../../../app-probing/README.md) part: every probe collects `consoleErrors` and `failedRequests`
  from the app's own origins, and a probe can be run again and become a test. Without them, install Chrome DevTools
  MCP: `/plugin marketplace add ChromeDevTools/chrome-devtools-mcp`, then
  `/plugin install chrome-devtools-mcp@chrome-devtools-plugins`.
- **Only the app's own problems.** Messages and requests from other origins (analytics, ads, browser extensions) are
  noise: the DevTools console list includes messages from extensions' content scripts, so the loop keeps the app's
  origins only. An expected one, such as a deliberate 401 after logout, goes into an allow-list in the loop's
  `LOOP.md` with its reason.
- **The `run`** is a Playwright script over the project's key pages or scenarios. It prints one line per problem,
  `<page>: <kind> <detail>`, such as `/orders: pageerror TypeError: Cannot read properties of undefined (reading
  'id') (orders.js:42)` or `/orders: 500 GET /api/orders?page=2`, and exits non-zero when it prints any line.
- **Cases.** Must fire: a copy of a page whose script throws on load; a copy whose API call answers 500; a copy that
  loads a script that is not there (404). Must pass: the current pages, with only allow-listed messages.
- **Wiring and reach.** The agent runs it locally after a change to the front end. CI runs the same script in the
  e2e job against the preview, where the agent cannot change it. The allow-list changes only through review: an
  entry there is the easiest way to hide an error.

## Notes

- At OpenAI: "We also wired the Chrome DevTools Protocol into the agent runtime and created skills for working with
  DOM snapshots, screenshots, and navigation. This enabled Codex to reproduce bugs, validate fixes, and reason about
  UI behavior directly."

## Agent step

An investigator groups the console errors and failed requests by cause, since one exception can fail several
requests, and returns a Diagnosis for each cause. It never blocks; the `run` does.
