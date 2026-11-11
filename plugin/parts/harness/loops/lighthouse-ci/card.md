---
id: lighthouse-ci
title: "Lighthouse CI"
summary: "`lhci assert` fails when a preview page scores below an assertion's threshold, such as performance under 0.9. The agent reads the JSON report and `manifest.json`."
sensor: computational
ilities: [performance, usability]
places: [delivery/release]
stages: [preview]
speed: [minutes]
needs: [browser]
links:
  - title: "Performance Budgets with Lighthouse CI: Assertions & budget.json"
    url: "https://unlighthouse.dev/learn-lighthouse/lighthouse-ci/budgets"
    author: "Unlighthouse"
  - title: "Lighthouse CI configuration"
    url: "https://googlechrome.github.io/lighthouse-ci/docs/configuration.html"
  - title: "lighthouse-ci/docs/configuration.md"
    url: "https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md"
---

## Why

A page can get slower without any test failing, because unit tests do not load it in a browser. This loop checks a
page on the preview: `lhci assert` fails when a score falls below an assertion's threshold, such as a performance
score under 0.9. The JSON report tells the agent which assertion failed.

## How it works

`lhci assert` checks the assertions set in `lighthouserc`. For example,
`'categories:performance': ['error', {minScore: 0.9}]` fails the check when the performance score is under 0.9.
When an assertion fails, the agent reads the JSON report and `manifest.json`.

## Set up

The loop needs:

- `lighthouserc` with assertions, and `budget.json`
- a browser
- a preview of the site
