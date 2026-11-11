---
id: platform-matrix
title: "Platform matrix"
summary: "CI runs the tests on several operating systems, runtimes and browsers. The agent sees which exact combination failed and fixes it."
sensor: computational
ilities: [compatibility, deployability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [minutes]
needs: [ci]
links: []
---

## Why

Tests that pass in one place show only that one combination of operating system, runtime and browser works. A
failure on another combination stays hidden until someone runs the code there. The matrix catches these failures.

## How it works

CI runs the tests once for each combination, as a separate matrix job. When a job fails, it names its operating
system, runtime and browser, so the agent knows where to look before it fixes the code.

## Set up

- In CI, add matrix jobs that run the tests on each combination of operating system, runtime and browser.
- For browsers, run the tests in Playwright across several browsers.

## Notes

The research cites no source for this loop.
