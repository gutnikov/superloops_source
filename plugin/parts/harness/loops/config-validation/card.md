---
id: config-validation
title: "Configuration check"
summary: "Two checks catch configuration errors: a validator checks the configuration against its schema; a smoke start runs with each configuration profile."
sensor: computational
ilities: [deployability, compatibility]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
links: []
---

## Why

A mistake in configuration is not in the code, so the compiler does not see it, and tests that run with one
profile miss the others. The mistake shows when the app starts with the configuration that contains it. The schema
catches a wrong or missing value without running anything. The smoke start catches what a schema cannot: a profile
that the app does not start with.

## How it works

The loop runs two checks on the configuration:

- A validator checks the configuration against its schema, without starting the app.
- A smoke start starts the app with each configuration profile.

## Set up

Describe the configuration with a JSON Schema or a typed config.

## Notes

The research cites no source for this loop.
