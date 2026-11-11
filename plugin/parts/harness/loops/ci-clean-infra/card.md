---
id: ci-clean-infra
title: "CI on clean infrastructure"
summary: "The agent pushes; autofixes apply themselves; the agent fixes the remaining failures locally."
sensor: computational
ilities: [deployability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [minutes]
needs: [ci]
agent: [investigator]
links:
  - title: "Minions: Stripe's one-shot, end-to-end coding agents — Part 2"
    url: "https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2"
---

## Why

Checks in the agent's workspace can pass because of something only that workspace has. CI runs on clean
infrastructure, so a green run there does not depend on the agent's machine. A CI round takes minutes, so cheap
checks run locally first and the number of rounds is limited.

## How it works

1. The agent pushes, and CI runs the checks on clean infrastructure.
2. Autofixes apply themselves.
3. For a job that still fails, an investigator reads the job's log and returns a Diagnosis (see Agent step).
4. The agent fixes the remaining failures locally and pushes again, until CI passes or the agent reaches the limit on CI rounds (see Set up).

## Set up

- Machine-readable logs (`gh run view --log-failed`).
- A limit on CI rounds. Stripe runs lint locally first, then gives the agent at most two CI rounds; beyond two, the returns drop.

## Agent step

An investigator reads the failing job's log and returns a Diagnosis: the cause, the log lines that show it, the next
step. It keeps thousands of log lines out of the working agent's context. It never blocks; the CI job does.
