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
related: [type-check, lsp-diagnostics, stop-hook, ci-clean-infra]
links:
  - title: "Minions: Stripe's one-shot, end-to-end coding agents — Part 2"
    url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2"
    author: "Alistair Gray"
  - title: "Hooks reference"
    url: "https://code.claude.com/docs/en/hooks"
    author: "Anthropic"
---

## Why

Code that does not build cannot be tested or run, so every later check waits on this one. The compiler names the
file and line of each error, and the exit code says plainly when the work is done. An incremental build with warm
caches is fast enough to run after every edit.

## How it works

1. The agent edits code.
2. It runs `build`.
3. It reads each compiler error, with its file and line, and fixes the code.
4. It runs `build` again, and repeats steps 3 and 4 until the command exits with code 0 or it reaches the stop
   condition below.

## Set up

- **One build command**, written in CLAUDE.md or AGENTS.md, so the agent does not have to find out how to build.
- **Incremental, with warm caches.** A build that takes minutes gets run once at the end instead of after each edit.
  Prepare the caches before the session starts: Stripe warms "Bazel and type checking caches" on a pool of devboxes
  it provisions in advance.
- **A stop condition.** The agent stops and hands the task back with the last build output after 5 rounds in which
  the number of errors did not fall, or at once when the error is outside the code it may change: a missing
  dependency, a broken toolchain, generated code. Editing code cannot fix those, and more rounds only spend tokens.
  The project can change the limit in the loop's `LOOP.md`.
- **`run`** is the build command. It prints the compiler's errors, each with its file and line, and exits non-zero
  on any error.
- **Cases.** Must fire: a copy with a syntax error; a copy that calls a function that does not exist. Must pass: the
  clean tree.
- **Wiring.** A Stop hook runs the incremental build at the end of each turn; on exit code 2 Claude Code "Prevents
  Claude from stopping, continues the conversation", so the agent cannot end a turn on a broken build. A CI job
  builds from a clean checkout, where the agent cannot skip it. A change to the build's configuration, such as
  excluded files or errors turned into warnings, shows in review like any other change.

## Notes

- Stripe also limits rounds against CI: a minion gets one CI run and one more chance to fix a failure locally, and
  "After the second push and CI run, we send the branch back to its human operator for manual scrutiny."
