---
id: contract-tests
title: "Contract tests"
summary: "The agent changes a provider and runs contract verification. Before a deploy, the agent runs `pact-broker can-i-deploy`. The command exits with code 0 (\"yes\") or 1 (\"no\")."
sensor: computational
ilities: [compatibility, testability]
places: [delivery/work, delivery/gate, remediation/work, maintenance/gate]
stages: [ci]
speed: [minutes]
needs: []
links:
  - title: "Can I Deploy"
    url: "https://docs.pact.io/pact_broker/can_i_deploy"
    author: "Pact docs"
---

## Why

A provider's own tests pass even when a change breaks a consumer, because they do not know what the consumer expects.
Contract verification checks the change against those expectations. Before the deploy, `can-i-deploy` answers with a
plain yes or no whether the version can go out, so an incompatible change stops there and not in a running system.

## How it works

1. The agent changes the provider.
2. The agent runs contract verification, which checks the change against what the consumers expect.
3. Before the deploy, the agent runs `pact-broker can-i-deploy`.
4. The agent reads the result. Exit code 0 means "yes": the version can go out. Exit code 1 means "no". The command also returns a table of incompatible versions.

## Set up

Use Pact Broker.

Do not use Pact Broker's dry-run mode as a deploy check. In dry-run mode the check always succeeds, so the mode is only good for debugging.
