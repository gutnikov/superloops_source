---
id: e2e-browser
title: "E2E through browser automation"
summary: "The agent starts the dev server and walks a scenario with Playwright or Puppeteer. That is how it finds out that a feature does not work end to end even though the unit tests and `curl` pass."
sensor: computational
ilities: [correctness, usability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [minutes]
needs: [browser]
agent: [explorer]
links:
  - title: "Effective harnesses for long-running agents"
    url: "https://anthropic.com/engineering/effective-harnesses-for-long-running-agents"
    author: "Anthropic"
---

## Why

Unit tests and `curl` can pass while the feature still does not work for a user: each part works on its own, but not
together. Walking the scenario through a browser is the first check that uses the feature the way a user does. Without
it, the agent reports done on a feature that is broken end to end.

## How it works

The agent runs the feature in a browser, as a user would. It starts the dev server, then uses Playwright or Puppeteer
to walk a scenario through the app's screens.

## Set up

What to set up:

- An `init.sh` that starts the server and runs a basic e2e.
- For a web app with Playwright fixtures and Page Objects: the [`app-probing`](../../../app-probing/README.md) part of
  superloops, which walks the scenario through those fixtures and Page Objects before a spec exists.

## Notes

- Anthropic observed that without an explicit prompt Claude "would fail to recognize that the feature didn't work
  end-to-end".
- Through Puppeteer MCP the agent does not see native alert modals.

## Agent step

An explorer agent walks the scenario through the project's fixtures and Page Objects (`app-probing`) and returns what
it saw: the URL, the screen, console errors, failed requests. The explorer's walk does not block. Behaviour that has
to keep holding goes into a spec, and that spec blocks.
