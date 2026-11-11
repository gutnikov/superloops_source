---
id: i18n-pseudolocalization
title: "i18n and pseudo-localization"
summary: "A linter finds missing keys and hard-coded strings. E2E on a pseudo-locale shows truncated text."
sensor: computational
ilities: [compatibility]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [seconds, minutes]
needs: []
links: []
---

## Why

A hard-coded string or a missing key goes unnoticed while the app is used in one language; it shows only in
another locale. Text that fits in one language can be cut off in a longer one or break in a right-to-left one.

## How it works

The loop has two checks:

- A linter looks through the code for missing keys and hard-coded strings.
- An E2E run on a pseudo-locale shows where text is cut off.

## Set up

The loop needs:

- i18n linters
- E2E tests with long strings and right-to-left (RTL) text

The research does not name a linter or a configuration. It does not say how to create the pseudo-locale. It also does not say whether the E2E tests with long strings and RTL text are the same run as the E2E on a pseudo-locale described under "How it works".

## Notes

The research cites no source for this loop.
