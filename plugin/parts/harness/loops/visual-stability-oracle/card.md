---
id: visual-stability-oracle
title: "Layout continuity under CPU stress"
summary: "A probe samples the layout of named regions on every frame while the CPU is slowed; declared invariants catch jumps, flashes, blank frames and overlaps that a final screenshot never shows."
sensor: computational
ilities: [usability, performance]
places: [delivery/work, remediation/oracle, maintenance/gate]
stages: [local]
speed: [minutes]
needs: [browser]
related: [e2e-browser, visual-screenshot-check, check-incubation, lighthouse-ci]
links:
  - title: "Timeline Layout Continuity (the suite's README)"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/stability/README.md#L1-L61"
    author: "opencode (anomalyco)"
    note: "what it proves, what it does not, the test layers and the evidence kept on failure."
  - title: "analyzer.ts: the invariants and their messages"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/utils/visual-stability/analyzer.ts#L77-L127"
    author: "opencode (anomalyco)"
    note: "moved, opacity below 0.65, blanked between visible frames, reversed more than allowed."
  - title: "analyzer.ts: order and overlap of adjacent regions"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/utils/visual-stability/analyzer.ts#L190-L203"
    author: "opencode (anomalyco)"
  - title: "probe.ts: a sample on every animation frame"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/utils/visual-stability/probe.ts#L196-L208"
    author: "opencode (anomalyco)"
  - title: "oracle.test.ts: the oracle's own tests"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/stability/oracle.test.ts#L15-L39"
    author: "opencode (anomalyco)"
  - title: "The suite's Playwright config"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/stability/playwright.config.ts#L13-L31"
    author: "opencode (anomalyco)"
    note: "a production build, one worker, no retries, video and trace kept on failure."
---

## Why

An end-to-end test checks where the page ends up. A screenshot shows one moment. Neither sees what happens in
between: a list that jumps up and back while new content streams in, a row that flashes blank while one component
replaces another, two rows that overlap for a frame, a scroll position the user was reading that moves away. These
are the bugs users report as "it flickers", and on a fast developer machine they often do not happen at all. This
loop samples the layout on every frame while the CPU is slowed, and checks invariants over the whole sequence.

## How it works

The test starts the app from a production build and slows the CPU fourfold through the browser's DevTools protocol
once the app is ready. A probe in the page records, on every animation frame, the bounds, visibility and opacity of
named regions: the message the user is reading, the composer, adjacent rows. The test drives a scenario, such as a
long answer streaming in, and declares what must hold over it. The analyzer returns one message per broken
invariant:

- `<region> moved <n>px in the viewport`, for a region that should stay put, over a 1 px tolerance;
- `<region> top reversed <n> times`, for one that should move in one direction, with one reversal allowed;
- `<region> opacity fell to <x> at <t>ms`, below 0.65;
- `<region> blanked between visible frames`;
- `<a> overlapped <b> by <n>px at <t>ms`, over 0.5 px, and `<a> rendered after <b>`;
- `<region> remounted <n> times`, where local state or focus depends on its identity.

A change of the scrollbar or of `scrollTop` alone does not fail. Movement of the anchor the user looks at does.

## Set up

- **The probe and the analyzer** in the test helpers, and named regions in the page, located by role or by a stable
  selector the tests already use.
- **Its own suite and config**: a production build, one worker, no retries, video, trace and screenshot kept on
  failure. opencode keeps it out of CI and runs it locally before a change to the timeline, since a slowed CPU on a
  shared runner adds noise of its own.
- **The oracle is tested itself.** Synthetic traces it must flag (a reversal, a blank frame, an overlap, a lost
  anchor) and traces it must accept (continuous motion, an overlap outside the clipped viewport) run before the
  browser tests.
- **The limits written down.** A sample after an animation frame is a layout observation, not proof of what the
  screen showed. opencode's README lists what the suite does not cover: compositor-only glitches, colour, canvas,
  real refresh rates.
- **`run`** runs the oracle's tests, then the suite, and prints one line per broken invariant,
  `<test>: <message>`, with the path of the kept trace. It exits non-zero on any.
- **Cases.** Must fire: a streaming answer that re-measures the list and moves the user's anchor 40 px; a component
  swap that renders one empty frame. Must pass: the main branch; a list that only grows at the bottom while the user
  is at the bottom.
- **Wiring:** `run` locally, required before merging a change to the code that lays out the stream; the result is
  pasted in the pull request.

## Notes

- Slowing the CPU makes the bug reproducible; it does not model a device. For a race that the slowdown does not
  show, delay the response instead ([check-incubation](../check-incubation/card.md)).
- [visual-screenshot-check](../visual-screenshot-check/card.md) compares a frame with a mockup; this loop checks
  the frames between.
