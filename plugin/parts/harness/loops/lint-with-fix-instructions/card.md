---
id: lint-with-fix-instructions
title: "Linter with fix instructions"
summary: "The agent runs the linter and reads each violation together with a \"how to fix\" text. Then it either fixes the violation or suppresses it with a justification."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [commit, ci]
speed: [seconds]
needs: []
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
---

## Why

A lint error that says only what is wrong lets the agent make it go away the easy way. Where a rule had no fix
instruction, the agent raised the complexity threshold instead of fixing the code. A message that says
how to fix the violation puts the right fix in front of the agent at the moment it needs it.

The size and complexity rules `max-params`, `max-lines`, `max-lines-per-function` and `complexity` catch code that
grows hard to change. ESLint's default preset leaves them out.

## How it works

The linter runs from a hook, at pre-push and in CI. Each violation it reports carries a "how to fix" text. The text
comes from a custom formatter or from the messages of custom lint rules. The agent follows the text to fix the
violation, or suppresses the violation and writes a justification.

## Set up

To set up the loop:

- Make each lint message tell the agent how to fix the violation. The source calls these custom messages
  a positive prompt injection. It names two ways to add them:
  - Write an ESLint formatter of your own, as Böckeler did.
  - Write the messages of your custom lints so that they put fix instructions into the agent's context, as OpenAI
    does.
- Turn on `max-params`, `max-lines`, `max-lines-per-function` and `complexity`.
- Run the linter at three points: from a hook, at pre-push and in CI. The source does not say which hook. Each run
  takes seconds.

## Notes

- Where a rule had no fix instruction, Böckeler saw the agent raise the complexity threshold instead of fixing
  the code.
