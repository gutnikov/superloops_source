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
related: [health-checks-smoke, dast, lighthouse-ci, load-testing]
links:
  - title: "Review apps"
    url: "https://docs.gitlab.com/ci/review_apps/"
    author: "GitLab"
---

## Why

Some checks need the app deployed, not just built: e2e, DAST, Lighthouse and load tests. With an environment of
its own, each PR is checked alone, before it is merged, and the logs the agent reads belong to that change.
Without one, these checks wait until the change reaches a shared environment, mixed with other changes.

## How it works

Each push to a PR deploys the PR's build to an environment of its own, with its own address. The agent reads the
address, waits until the environment is healthy ([health-checks-smoke](../health-checks-smoke/card.md)), and runs the
checks that need a deployed app against it: e2e, [DAST](../dast/card.md), [Lighthouse](../lighthouse-ci/card.md) and
[load tests](../load-testing/card.md). It reads the environment's logs when a check fails. Merging or closing the PR
tears the environment down. In GitLab these are review apps: "temporary testing environments that are created
automatically for each branch or merge request".

## Set up

- **What it deploys** is written in the IaC template: the PR's build of each service the change touches, the other
  services at main's version, and a database of its own seeded from fixtures, never a copy of production data.
- **What starts it**: a CI job on every push to a PR. The environment always runs the PR's head commit, so the agent
  checks what it pushed.
- **The address.** The deploy job sets the environment's URL (in GitLab, `environment:url`, such as
  `https://$CI_ENVIRONMENT_SLUG.example.com`, which the merge request shows as **View app**) and writes it where the
  agent reads it with `gh` or `glab`: a job output or a comment on the PR.
- **The logs.** Every log line carries the environment's name (the PR number), so the agent queries only its own
  environment's logs.
- **Teardown.** In GitLab, `on_stop` on the deploy job and a stop job with `environment:action: stop` make the review
  app "automatically stop when the associated merge request is merged or the branch is deleted"; `auto_stop_in`
  stops one that sits idle. Set `auto_stop_in: 1 week`: an idle environment costs money and nobody looks at it.
- **`run`** checks one PR's environment and prints `<pr>: <status>`: `ready <url>`, `not deployed`,
  `stale (runs <sha>, PR at <sha>)`, `unhealthy`. It exits non-zero unless the environment is ready. The checks
  against the environment are loops of their own. A scheduled job lists environments of closed PRs that still run.
- **Cases** are recorded states of a PR and its environment. Must fire: the environment runs an older commit than the
  PR's head; the deploy job failed; the environment of a merged PR still runs. Must pass: the environment at the PR's
  head and healthy.
- **Wiring.** The deploy and stop jobs are in CI and deploy only what was pushed: the agent can start the deploy job
  but has no credentials to deploy by hand, so the environment cannot run code that is not on the branch. A
  PreToolUse hook denies the agent's writes to the IaC template and the deploy jobs.
