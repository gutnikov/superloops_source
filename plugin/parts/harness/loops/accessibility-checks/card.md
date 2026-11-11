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
related: [accessibility-tree-navigation, lighthouse-ci, e2e-browser, approved-fixtures]
links:
  - title: "Accessibility testing"
    url: "https://playwright.dev/docs/accessibility-testing"
    author: "Playwright"
    note: "AxeBuilder in Playwright tests: tags, include and exclude, disabled rules, a shared fixture."
  - title: "Aria snapshots"
    url: "https://playwright.dev/docs/aria-snapshots"
    author: "Playwright"
    note: "toMatchAriaSnapshot: the accessibility tree as YAML, compared with a stored template."
  - title: "Accessible web testing with Playwright and Axe Core"
    url: "https://dev.to/vitalyskadorva/accessible-web-testing-with-playwright-and-axe-core-2kg1"
    author: "Vitaly Skadorva"
---

## Why

A page can pass every e2e test and still fail someone who uses a keyboard or a screen reader: the tests check what
the page does, not who can reach it. This loop adds accessibility checks to those same tests, so the agent learns
which element breaks WCAG and needs a fix.

## How it works

The checks run inside the project's Playwright e2e tests, on the states the tests already reach:

- **axe** scans the page and returns its `violations`. Each one has the rule's `id` and, in `nodes[].target`, the CSS
  selector of every element that breaks it, so the agent knows what to fix and where.
- **An aria snapshot** pins the accessibility tree of a region: the role, the accessible name and attributes such as
  `checked`, `disabled`, `expanded`, `level` or `pressed` of each element, as YAML. `toMatchAriaSnapshot` compares the
  page with the stored template. It catches what no axe rule describes because the page is still valid: a button
  renamed, a heading moved to another level, a menu that no longer reports `expanded`, a landmark gone.

The agent fixes the markup and runs the tests again until both are clean.

## Set up

- **The package and one fixture.** `npm install @axe-core/playwright`. A Playwright fixture builds the `AxeBuilder`
  with the project's tags, so every test scans by the same rules; Playwright recommends a fixture for shared axe
  configuration. Default tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, the set Playwright's own example scans.
- **Which states are scanned.** One scan per distinct screen state the e2e scenarios reach: after load, with a dialog
  open, with a form showing its errors. A scan of the first load alone never sees a dialog or an error message.
- **What fails.** Any violation of the chosen tags: `expect(results.violations).toEqual([])`. A known issue is
  excluded by selector (`exclude()`) or by rule (`disableRules()`), each with a reason and a ticket in the loop's
  `LOOP.md`; there is no other way to silence a rule.
- **Aria snapshots for the screens whose structure matters**: navigation, forms, dialogs. Keep them in `.aria.yml`
  files (the `name` option of `toMatchAriaSnapshot`), so a change to one shows in the diff. An updated snapshot is a
  changed reference, reviewed like an approved fixture ([approved-fixtures](../approved-fixtures/card.md)).
- **A score at release.** A Lighthouse accessibility score on the preview is the same concern, coarser and later:
  [lighthouse-ci](../lighthouse-ci/card.md).
- **`run`** runs the accessibility tests and prints one line per problem: `<test>: <rule id> at <selector>` for a
  violation, `<test>: aria snapshot <name> differs` with Playwright's diff for a snapshot. It attaches the full scan
  to the test report (`testInfo.attach()`). The exit is non-zero on any violation or snapshot mismatch.
- **Cases.** Must fire: a copy of a page with an image without alt text; an input without a label; a button whose
  accessible name changed against its `.aria.yml`. Must pass: the same pages fixed.
- **Wiring**: the agent runs the tests locally after a UI change; a CI job runs them on every pull request, and that
  run is the one that counts. The fixture, the list of exclusions and the `.aria.yml` files change only through a
  reviewed pull request, so the agent cannot quiet a rule to get green.

## Notes

- Playwright: "Automated accessibility tests can detect some common accessibility problems such as missing or invalid
  properties. But many accessibility problems can only be discovered through manual testing." The explorer below and
  [accessibility-tree-navigation](../accessibility-tree-navigation/card.md) cover part of the rest.

## Agent step

axe needs no agent. An explorer covers what axe cannot see: keyboard paths, focus order, what a screen reader
announces. It returns Findings and does not block; a problem it finds becomes a test.
