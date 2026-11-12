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
related: [health-checks-smoke, dast, lighthouse-ci, load-testing, release-trust-boundary, shipped-artifact-check]
links:
  - title: "Review apps"
    url: "https://docs.gitlab.com/ci/review_apps/"
    author: "GitLab"
  - title: "pi CI: preview packages packed for pushes and same-repo PRs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/ci.yml#L35-L50"
    author: "pi (earendil-works)"
  - title: "preview-packages.yml: the publisher never runs PR code"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/preview-packages.yml#L1-L9"
    author: "pi (earendil-works)"
  - title: "preview-packages.yml: the publish and cleanup jobs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/preview-packages.yml#L22-L132"
    author: "pi (earendil-works)"
  - title: "preview-packages.mjs: a push run re-verified against main and its tag"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/preview-packages.mjs#L104-L136"
    author: "pi (earendil-works)"
  - title: "preview-packages.mjs: the artifact read as data"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/preview-packages.mjs#L183-L228"
    author: "pi (earendil-works)"
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
automatically for each branch or merge request". For a library or a command-line tool, the preview is an installable
build: pi publishes each same-repo PR's packages under a `pr-<number>` ref, and closing the PR deletes it.

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
- **The job that deploys does not run the PR's code.** The PR's CI builds without secrets; a separate job, started
  when that run completes, holds the credential and reads the build as data. pi's publisher "reads the CI artifact as
  data and never checks out or runs PR code": it checks out only `scripts/` from main and re-verifies every claim the
  run makes about itself. The artifact must be packed for the run's head commit ("Artifact was packed for <sha>,
  expected <sha>"), a file name must be a bare `.tgz`, and a push run named `main` or `v*` must be on main, because
  "a branch or tag can carry its own copy of CI". The PR's ref moves only while the PR into main is open with that
  head. Event data reaches the script through `env`, "never interpolated into the script: branch names are
  PR-controlled". A fork's PR gets no preview.
- **`run`** checks one PR's environment and prints `<pr>: <status>`: `ready <url>`, `not deployed`,
  `stale (runs <sha>, PR at <sha>)`, `unhealthy`. It exits non-zero unless the environment is ready. The checks
  against the environment are loops of their own. A scheduled job lists environments of closed PRs that still run.
- **Cases** are recorded states of a PR and its environment. Must fire: the environment runs an older commit than the
  PR's head; the deploy job failed; the environment of a merged PR still runs; an artifact packed for another
  commit; a push run named `main` whose commit is not on main. Must pass: the environment at the PR's
  head and healthy.
- **Wiring.** The deploy and stop jobs are in CI and deploy only what was pushed: the agent can start the deploy job
  but has no credentials to deploy by hand, so the environment cannot run code that is not on the branch. A
  PreToolUse hook denies the agent's writes to the IaC template and the deploy jobs.
