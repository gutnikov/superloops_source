---
id: preview-environments
title: "Preview environments per PR"
summary: "Every PR gets its own deployed environment. The agent runs e2e, DAST, Lighthouse and load tests against it and reads its logs."
sensor: computational
ilities: [deployability, compatibility]
places: [delivery/release]
stages: [preview]
speed: [minutes]
needs: [deploy]
links: []
---

## Why

Some checks need the app deployed, not just built: e2e, DAST, Lighthouse and load tests. With an environment of
its own, each PR is checked alone, before it is merged, and the logs the agent reads belong to that change.
Without one, these checks wait until the change reaches a shared environment, mixed with other changes.

## How it works

Every PR gets its own deployed environment. The agent runs e2e, DAST, Lighthouse and load tests against it and
reads its logs.

## Set up

To add this loop to a project, build:

- an IaC template that deploys an environment for each PR
- automatic teardown that removes these environments

The source does not say:

- what the template must deploy
- what starts a deployment
- how the agent gets the environment's address and logs
- what triggers teardown

You need to decide these for your project.

## Notes

The research cites no source for this loop.
