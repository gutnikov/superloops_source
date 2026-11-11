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
related: [agentic-manual-testing, browser-console-devtools, progress-file-feature-list, acceptance-loop, visual-stability-oracle]
links:
  - title: "Effective harnesses for long-running agents"
    url: "https://anthropic.com/engineering/effective-harnesses-for-long-running-agents"
    author: "Anthropic"
  - title: "Web server"
    url: "https://playwright.dev/docs/test-webserver"
    author: "Playwright"
  - title: "Dialogs"
    url: "https://playwright.dev/docs/dialogs"
    author: "Playwright"
  - title: "opencode site AGENTS.md: check in a production build"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/site/AGENTS.md#L27"
    author: "opencode (anomalyco)"
    note: "\"a change that only works hydrated looks right there\" (in vite dev)."
  - title: "opencode app-e2e-tests skill: run in built mode, as CI does"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.opencode/skills/app-e2e-tests/SKILL.md#L107"
    author: "opencode (anomalyco)"
---

## Why

Unit tests and `curl` can pass while the feature still does not work for a user: each part works on its own, but not
together. Walking the scenario through a browser is the first check that uses the feature the way a user does. Without
it, the agent reports done on a feature that is broken end to end.

## How it works

The agent starts the app and walks a scenario through it as a user would: open the page, fill in the form, press the
button, read the result. Playwright or Puppeteer drives the browser. A step that fails names the screen, the action
and what the agent saw instead: a screenshot, the URL, console errors, failed requests. The agent fixes the code and
walks the scenario again.

A walk that has to keep holding becomes a Playwright spec in the suite. In delivery that spec is an acceptance test of
the [acceptance loop](../acceptance-loop/card.md); for long work over many sessions, a feature is marked passing only
after its e2e check ([progress-file-feature-list](../progress-file-feature-list/card.md)).

## Set up

- **One command starts the app.** An `init.sh` that starts the dev server and runs a basic e2e, so no session spends
  time finding out how to run the app. Playwright's `webServer` starts the server before the tests and waits until
  its `url` answers; the wait "Defaults to 60000" ms, and a server that is not up by then fails the run.
- **Fixtures and Page Objects.** For a web app, the [`app-probing`](../../../app-probing/README.md) part walks the
  scenario through the fixtures and Page Objects the spec will use; `fixture-modify` and `pom-modify` add the ones
  that are missing.
- **Native dialogs in specs.** Playwright auto-dismisses `alert`, `confirm` and `prompt` dialogs unless the test
  handles them with `page.on('dialog')`. A scenario with a native dialog is checked by a spec that handles it, not by
  a free walk that cannot see it.
- **The build users get, not the dev server.** A dev server renders and bundles differently from production, and a
  change can work in one and not the other. opencode's site pages render as static HTML in production but hydrated
  under `vite dev`, "so a change that only works hydrated looks right there"; its e2e skill says "Run in built mode,
  as CI does", since dev mode serves unbundled modules with the API on another origin. Walk the scenario against a
  production build served locally; keep the dev server for the edit loop.
- **`run`** is the e2e suite in a headless browser against a fresh server. It prints each failed test as
  `file:line: message` with the step that failed, and exits non-zero on any failure.
- **Cases.** Must fire: a copy where the unit tests pass but the submit button's handler is not attached; a copy
  where the API returns 500 on submit. Must pass: the clean app.
- **Wiring.** The agent runs the scenario locally after the unit tests. A CI job runs the suite on a fresh server, out
  of the agent's reach, and "done" waits on that run, not on the agent's own walk. A spec the agent changes goes
  through review like the acceptance tests.

## Notes

- Anthropic: Claude "mostly did well at verifying features end-to-end once explicitly prompted to use browser
  automation tools and do all testing as a human user would". Before that prompt it tested with unit tests and
  `curl` and missed features that did not work end to end.
- Anthropic: "Claude can't see browser-native alert modals through the Puppeteer MCP, and features relying on these
  modals tended to be buggier as a result."

## Agent step

An explorer agent walks the scenario through the project's fixtures and Page Objects (`app-probing`) and returns what
it saw: the URL, the screen, console errors, failed requests. The explorer's walk does not block. Behaviour that has
to keep holding goes into a spec, and that spec blocks.
