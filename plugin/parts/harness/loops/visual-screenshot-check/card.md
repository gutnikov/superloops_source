---
id: visual-screenshot-check
title: "Visual check with screenshots"
summary: "The agent takes a screenshot, compares it with the mockup, lists the differences and fixes them."
sensor: inferential
ilities: [usability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds, minutes]
needs: [browser]
agent: [judge]
related: [approved-fixtures, ux-evaluator, e2e-browser, llm-judge-calibration]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    author: "Anthropic"
    note: "a browser screenshot next to the mockup as a check Claude can run; ask for the screenshot as evidence."
  - title: "Visual comparisons"
    url: "https://playwright.dev/docs/test-snapshots"
    author: "Playwright"
    note: "toHaveScreenshot: a stored baseline, pixel comparison, rendering that differs between hosts."
  - title: "models.json: gpt-5.5's instructions for visual work"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/models-manager/models.json#L1584"
    author: "Codex (OpenAI)"
    note: "screenshots and canvas-pixel checks across desktop and mobile viewports before finishing."
---

## Why

A screen can pass every test and still look wrong: a misplaced element or a wrong colour breaks no assertion. A
screenshot compared with the mockup is the first check that sees the screen the way a user does. The differences come
back as a list the agent can fix one by one.

## How it works

The loop needs a mockup of the screen to compare with.

1. The agent takes a screenshot. Locally, the [`app-probing`](../../../app-probing/README.md) part of superloops
   takes a full-page screenshot once the screen has settled.
2. A judge compares the screenshot with the mockup and lists the differences (see Agent step).
3. The agent fixes the differences and takes a new screenshot, until the judge finds none.
4. Once the screen matches, a Playwright `toHaveScreenshot` test stores the screenshot as its baseline, and from then
   on CI compares pixels, with no judgement needed.

## Set up

- **A mockup per screen**, exported from the design tool at the viewport width it was drawn for, in the repository
  next to the screen's spec. Decide in the loop's `LOOP.md` where mockups live and how they are named
  (`design/<screen>@<width>.png`, say).
- **The screenshot at the mockup's width**, of a settled screen with the same data the mockup shows, so differences
  in content do not hide differences in layout.
- **What counts as a difference** is in the judge's prompt: a missing or extra element, its position or size off by
  more than a few pixels, a wrong colour, font or text. Anti-aliasing and the rendering of fonts do not count.
- **A pixel baseline once it matches.** `toHaveScreenshot` fails on the first run and writes the actual screenshot;
  that file is committed as the baseline. `maxDiffPixels` and `threshold` set the tolerance, and `stylePath` hides
  dynamic content such as dates. Playwright warns that "Browser rendering can vary based on the host OS, version,
  settings, hardware", so baselines are made in the CI environment, not on a laptop.
- **A changed baseline is a changed reference.** `--update-snapshots` in the same change as the UI shows the new image
  in the pull request, and a person approves it there ([approved-fixtures](../approved-fixtures/card.md)).
- **Without a mockup, check the pixels.** A canvas, such as a WebGL scene or a chart, has no DOM a test can assert on,
  and a new scene often has no mockup. Codex's instructions for gpt-5.5: "Before finishing, you verify with Playwright
  screenshots and canvas-pixel checks across desktop/mobile viewports that it is nonblank, correctly framed,
  interactive/moving". As a script, at a desktop and a phone viewport: the canvas is not one colour; the drawn pixels
  are not cut off at its edges; two screenshots taken a second apart, or before and after an input, differ. Each
  failure prints `<viewport>: blank`, `cut off at <edge>` or `static`, with no judge needed.
- **`run`** gives the judge the mockup and the screenshot of each screen and prints one line per screen,
  `<screen>: matches` or `<screen>: <n> differences`, then the judge's reasons. It exits 1 on a `fail` only once the
  judge is `gate` in `superloops/agents.yaml`; until then it prints the Verdict and exits 0. The pixel comparison in
  CI is a plain Playwright test and fails on a diff beyond its tolerance.
- **Cases.** Must fire: a screenshot with the primary button missing; one with the button in the wrong colour; one
  with a label cut off. Must pass: a screenshot of the matching screen; one that differs from the mockup only by
  anti-aliasing. They are also the judge's eval cases.
- **Wiring**: the agent runs the loop locally at the end of a UI change; the `toHaveScreenshot` tests run as a CI job
  on every pull request, and that run is the one that counts. The judge is a separate agent with read-only tools, and
  the baselines change only in a reviewed pull request.

## Notes

- Claude Code's best practices list "A browser screenshot next to the mockup" among the checks Claude can run, and
  say to ask Claude for evidence: "the command it ran and its output, or the screenshot".

## Agent step

A judge gets the mockup and the screenshot, never the code or the working agent's reasoning, and returns a Verdict
with one reason per difference: the element, what the mockup shows and what the screenshot shows. A person grades
pairs that match and pairs that do not, and the judge's prompt is revised until it agrees
([llm-judge-calibration](../llm-judge-calibration/card.md)); its Verdict blocks only once its agreement reaches the
approved threshold ([agent-calibration](../agent-calibration/card.md)).
