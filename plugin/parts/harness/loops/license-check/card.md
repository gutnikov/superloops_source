---
id: license-check
title: "License check"
summary: "The check fails on a forbidden license; the agent replaces the package."
sensor: computational
ilities: [security]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [seconds]
needs: []
links: []
---

## Why

A package with a forbidden license looks like any other package in the diff. If reviewers do not read the license of
every dependency the agent adds, they will miss it. An allowlist in CI fails on it, and the agent replaces the package
before the change is merged.

## How it works

The project keeps a list of the licenses it allows. A check in CI compares each package's license with that list. If a
license is not on the list, the check fails, and the agent replaces that package with another one.

## Set up

- A license allowlist in CI.

## Notes

The research cites no source for this loop.
