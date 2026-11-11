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
related: [preview-environments, bundle-size-budget, accessibility-checks]
links:
  - title: "Lighthouse CI configuration"
    url: "https://googlechrome.github.io/lighthouse-ci/docs/configuration.html"
    author: "Google Chrome"
  - title: "Lighthouse CI: Getting Started"
    url: "https://googlechrome.github.io/lighthouse-ci/docs/getting-started.html"
    author: "Google Chrome"
---

## Why

A page can get slower without any test failing, because unit tests do not load it in a browser. This loop checks a
page on the preview: `lhci assert` fails when a score falls below an assertion's threshold, such as a performance
score under 0.9. The JSON report tells the agent which audit made the score drop.

## How it works

`lhci collect` runs Lighthouse against the preview's URLs, 3 times each by default (`numberOfRuns`). `lhci assert`
checks the assertions in `lighthouserc`, such as `"categories:performance": ["error", {"minScore": 0.9}]`. An
`error`-level failure gives a non-zero exit; a `warn`-level one is printed, but its "failure will not result in a
non-zero exit code". `lhci upload --target=filesystem` writes "a `manifest.json` along with the Lighthouse reports
collected": for each run its `url`, `isRepresentativeRun`, `jsonPath`, `htmlPath` and the category scores. The agent
opens the JSON report of the representative run for the failing URL, reads the audits that cost the score, fixes them
and runs the loop again.

## Set up

- **`lighthouserc`** with `error`-level assertions for what blocks and `warn` for what only informs. The presets
  start a set: `lighthouse:recommended` "Asserts that every audit outside performance received a perfect score".
- **Budgets inside `assertions`.** Write size budgets as `resource-summary:<resourceType>:size` assertions, not as
  `budget.json`: `budgetsFile` "cannot be used in conjunction with any other assert option".
- **Judge the median.** By default an assertion takes the `optimistic` value, the one "most likely to pass from all
  runs". Set `"aggregationMethod": "median"` for the performance assertions, so that one fast run out of three does
  not hide a slower page.
- **The URL** comes from the PR's [preview environment](../preview-environments/card.md) and is passed to
  `collect.url`. Wait for the preview to be healthy first ([health-checks-smoke](../health-checks-smoke/card.md)).
- **Thresholds are the project's decision**, in `lighthouserc`. A PreToolUse hook denies the agent's writes to it; a
  lower threshold goes through a person (H5).
- **`run`** runs `lhci collect`, `lhci assert` and `lhci upload --target=filesystem` into the directory it is given,
  prints `lhci assert`'s failures, one per URL and assertion, and exits with `lhci assert`'s exit code.
- **Cases** are static pages, audited from a local directory (`staticDistDir`), so they need no preview. Must fire: a
  copy of the page with a large render-blocking script, which drops performance under the threshold; a copy with an
  image without `alt`, if accessibility is asserted. Must pass: the clean page.
- **Wiring.** A CI job runs after the preview deploy and is a required check. With the Lighthouse CI GitHub App token
  in `LHCI_GITHUB_APP_TOKEN`, `lhci autorun` "will also set the results as GitHub status checks".

## Notes

- Accessibility here is Lighthouse's category score; the WCAG violations with their selectors come from axe
  ([accessibility-checks](../accessibility-checks/card.md)).
