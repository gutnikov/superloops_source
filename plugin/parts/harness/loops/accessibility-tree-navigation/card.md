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
related: [accessibility-checks, e2e-browser, agentic-manual-testing]
links:
  - title: "Playwright MCP"
    url: "https://playwright.dev/mcp/introduction"
    author: "Playwright"
    note: "structured accessibility snapshots, no vision models; element refs; the --caps=vision tools."
  - title: "Playwright MCP on GitHub"
    url: "https://github.com/microsoft/playwright-mcp"
    author: "Microsoft"
    note: "the tool list, browser_run_code_unsafe, the install command for Claude Code."
  - title: "Locators"
    url: "https://playwright.dev/docs/locators"
    author: "Playwright"
    note: "getByRole reflects how users and assistive technology perceive the page."
  - title: "Playwright MCP Guide: Let Claude, Codex, and Cursor Control the Browser"
    url: "https://eastondev.com/blog/en/posts/ai/20260904-playwright-mcp-browser-automation-claude-codex-cursor/"
    author: "Easton"
---

## Why

When the agent works the page through its accessibility tree, a button without a proper role and name is a button
it cannot find. That one miss says two things at once: the page has poor accessibility, and the scenario does not
work. The agent gets an accessibility signal from work it was doing anyway, with no separate check to run.

## How it works

Playwright MCP gives the agent the page as an accessibility snapshot (`browser_snapshot`): each element with its role,
its name and a ref such as `e5`, which the agent passes to the next action (`browser_click`). The agent looks for each
element of its scenario by role and name. When it cannot find one, it does not reach for coordinates or a CSS
selector: it records the miss in the task's evidence, with the role and name it looked for and what the snapshot shows
in that place (an element with no role, an image with no name), fixes the markup, takes a new snapshot and goes on.

## Set up

- **Playwright MCP without vision.** `claude mcp add playwright npx @playwright/mcp@latest`, without
  `--caps=vision`: that option adds tools that click at coordinates, and with them the agent can walk around an
  element that has no role or name.
- **No code tool.** A PreToolUse hook with the matcher `mcp__playwright__browser_run_code_unsafe` denies that tool:
  it reaches any element by a selector, around the tree, and the Playwright MCP README calls it "RCE-equivalent".
- **A miss is fixed in the markup, not in the scenario**: a real `<button>` instead of a clickable `div`, a label on
  an input, an accessible name on an icon button. The agent does not rename the step to match what the page offers.
- **The walk becomes a check.** The steps the agent walked are kept as role-and-name lookups, in an e2e test with
  `getByRole` or an aria snapshot of the region ([accessibility-checks](../accessibility-checks/card.md)), so a later
  change that drops a name fails there.
- **`run`** replays the recorded steps against the running app and prints one line per step, `<step>: found` or
  `<step>: not found: <role> "<name>"`. The exit is non-zero on any `not found`.
- **Cases.** Must fire: a copy of the page where Save is a `div` with a click handler and no role; an icon button with
  no accessible name. Must pass: the same page with `<button>Save</button>` and a labelled icon button.
- **Wiring**: the agent walks the page in its own session during the work; the replay runs with the e2e suite in CI,
  where the agent cannot change the recorded steps without the change showing in the pull request. The MCP server's
  configuration and the hook are checked into the repository, so a change to either shows in review too.

## Notes

- Playwright recommends role locators as "the closest way to how users and assistive technology perceive the page":
  what the agent cannot find this way, a screen reader user struggles to find too.
- The Playwright MCP README says "Playwright MCP is not a security boundary." Run it against a local or preview app,
  not against production with real accounts.
- This loop finds the elements the agent's own scenarios touch;
  [accessibility-checks](../accessibility-checks/card.md) scans the whole page by WCAG rules.
