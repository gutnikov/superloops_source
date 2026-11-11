---
id: profiling
title: "Profiling"
summary: "The agent takes a CPU or memory profile as text (the top N functions), makes a fix and compares the new profile with the original."
sensor: computational
ilities: [performance]
places: [remediation/work, maintenance/work]
stages: [local]
speed: [minutes]
needs: []
agent: [investigator]
links: []
---

## Why

Without a profile, the agent guesses where the time or the memory goes, and a fix based on a guess may change
nothing. A profile as text, the top N functions, shows it where to look. The new profile next to the original shows
whether the fix moved anything.

## How it works

1. The agent takes a CPU or memory profile as text (the top N functions).
2. It makes a fix.
3. It takes a new profile and compares it with the original.

The source does not say:

- which run or workload to profile
- which result shows that the fix worked
- what the agent should do when the new profile is no better or is worse

## Set up

- py-spy or pprof with text output.

## Notes

The research cites no source for this loop.

## Agent step

An investigator compares the two profiles and returns what changed and why, as a Diagnosis. It never blocks.
