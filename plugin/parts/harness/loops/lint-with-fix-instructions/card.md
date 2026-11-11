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
related: [taste-invariants, architecture-fitness-functions, pre-commit-pre-push]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "ESLint: Custom Formatters"
    url: "https://eslint.org/docs/latest/extend/custom-formatters"
    author: "ESLint"
---

## Why

A lint error that says only what is wrong lets the agent make it go away the easy way. Böckeler saw the agent
"frequently" raise the cyclomatic complexity threshold for a rule that had no fix instruction yet. A message that
says how to fix the violation puts the right fix in front of the agent at the moment it needs it.

The size and complexity rules `max-params`, `max-lines`, `max-lines-per-function` and `complexity` catch code that
grows hard to change. ESLint's recommended config does not turn them on.

## How it works

The linter runs at commit and in CI. Each violation it reports carries a "how to fix" text, from a custom formatter
or from the messages of custom lint rules. The agent follows the text to fix the violation, or suppresses the
violation with a comment that gives the reason.

## Set up

- **A fix instruction in every message.** Two ways:
  - A formatter of your own. An ESLint formatter is a function that gets the `results` (per file, `messages` with
    `ruleId`, `message`, `line` and `column`) and returns the text to print; run it with `eslint -f ./formatter.js`.
    It looks up each `ruleId` in a table of instructions and prints the instruction after the message. Böckeler built
    such a formatter.
  - The messages of your custom lint rules, written so that they put the fix into the agent's context, as OpenAI
    does ([taste-invariants](../taste-invariants/card.md)).
- **The instruction says what to do, and when an exception is fair.** For `complexity`: extract the branches into
  named functions, and raise the threshold only for a case where refactoring is unnecessary or impossible, saying
  why. Böckeler's message for thresholds allows a slight raise in exactly that case.
- **Turn on the size rules**: `max-params`, `max-lines`, `max-lines-per-function`, `complexity`, with limits the
  project picks and writes in the ESLint config.
- **Every suppression carries its reason**: `// eslint-disable-next-line <rule> -- <reason>`. `run` fails on a
  disable comment without `--` and a reason. Böckeler: this "keeps the suppressions manageable, visible and
  reviewable."
- **The `run`**: the linter with the formatter, `file:line: <rule>: <message>. How to fix: <instruction>`, and a
  non-zero exit on any error.
- **Cases.** Must fire: a function with six parameters against `max-params: 4`; a function over the complexity
  limit; a disable comment with no reason. Must pass: the clean tree, and a suppression with a reason.
- **Wiring.** A pre-commit hook ([pre-commit-pre-push](../pre-commit-pre-push/card.md)) and a CI job; the CI run is
  the final one. The ESLint config and the formatter are protected by a PreToolUse hook: a limit the agent raises is
  a change a person approves (H5), not a fix.

## Notes

- Böckeler calls the extra context in lint messages "a good kind of prompt injection".
- The size rules "weren't even active in ESLint's default preset" (Böckeler); she had to configure their maximums
  first.
