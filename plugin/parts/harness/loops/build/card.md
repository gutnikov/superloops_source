---
id: build
title: "Build / compile"
summary: "The agent edits code and runs `build`. It reads compiler errors with file and line and fixes them until the command exits with code 0."
sensor: computational
ilities: [correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
links:
  - title: "Minions: Stripe's one-shot, end-to-end coding agents — Part 2"
    url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2"
---

## Why

Code that does not build cannot be tested or run, so every later check waits on this one. The compiler names the
file and line of each error, and the exit code says plainly when the work is done. An incremental build with warm
caches is fast enough to run after every edit.

## How it works

1. The agent edits code.
2. It runs `build`.
3. It reads each compiler error, with its file and line, and fixes the code.
4. It runs `build` again. It repeats steps 3 and 4 until the command exits with code 0 or your stop condition is met.

## Set up

- One build command, written in CLAUDE.md or AGENTS.md.
- Incremental build.
- Warm caches (Stripe pre-warms its Bazel and type-checking caches).
- Your own stop condition: a limit on attempts, and a rule for when the agent should stop and hand the task back, for example when editing code cannot fix the error. The source sets no limit on attempts and does not say when the agent should stop.
