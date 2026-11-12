---
id: backup-restore-rollback
title: "Restore from backup and rollback"
summary: "A job restores the database from a backup and rolls the release back. When the check fails, the agent fixes the procedure."
sensor: computational
ilities: [reliability]
places: [remediation/entry]
stages: [scheduled]
speed: [minutes, hours]
needs: [deploy]
related: [chaos-engineering, db-migration-lint, health-checks-smoke, canary-feature-flags, patch-backport, release-trust-boundary]
links:
  - title: "Data Integrity: What You Read Is What You Wrote"
    url: "https://sre.google/sre-book/data-integrity/"
    author: "Raymond Blum and Rhandeev Singh, Google"
    note: "Site Reliability Engineering, chapter 26: test the recovery, end to end and continuously."
  - title: "pg_restore"
    url: "https://www.postgresql.org/docs/current/app-pgrestore.html"
    author: "PostgreSQL"
  - title: "Deployments"
    url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"
    author: "Kubernetes"
    note: "kubectl rollout undo and kubectl rollout status."
  - title: "gemini-cli Release: Rollback change: inputs, dry run by default"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-rollback.yml#L5-L41"
    author: "gemini-cli (Google)"
  - title: "gemini-cli Release: Rollback change: the mutations and their read-backs"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-rollback.yml#L88-L212"
    author: "gemini-cli (Google)"
  - title: "get-release-version.js: deprecated versions skipped by the next version"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/get-release-version.js#L124-L285"
    author: "gemini-cli (Google)"
  - title: "Workflow syntax: jobs.<job_id>.steps[*].shell"
    url: "https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsshell"
    author: "GitHub"
    note: "`shell: bash` runs `bash --noprofile --norc -eo pipefail {0}`."
---

## Why

A backup that has never been restored, or a rollback that has never been run, may not work on the day it is needed.
Nothing in the delivery of a change runs them. A scheduled job that restores and rolls back finds a broken procedure
before an incident does.

## How it works

A scheduled job runs two drills and reports each as its own item:

1. **Restore.** It restores the latest production backup into a scratch database, never into production, and checks
   the result: the restore finished without errors, the schema is at the latest migration, the key tables hold data,
   the newest row is no older than the backup interval allows, and the whole restore took less than the recovery
   time the project promises.
2. **Rollback.** In staging, it deploys the release candidate, rolls back to the previous release (on Kubernetes,
   `kubectl rollout undo deployment/<name>`, then `kubectl rollout status` until it exits 0), and runs the smoke
   suite of [health-checks-smoke](../health-checks-smoke/card.md) on the previous release against the database the
   candidate migrated. This catches a migration that the previous release cannot run with
   ([db-migration-lint](../db-migration-lint/card.md)). For a package on a registry, the rollback is three
   mutations, each read back: the channel tag moves to the previous version, the bad version is deprecated so that
   installers and the next version calculation skip it (gemini-cli's takes the highest version that is not deprecated
   as its base), and the GitHub release is deleted and its commit tagged `v<version>-rollback`. The drill runs them
   against a scratch registry and a test repository with dry run off: gemini-cli's dry run, the default, skips the
   mutations and their read-backs alike.

A red item enters remediation as a problem. The agent fixes the procedure (the backup job, the restore script, the
migration), and the next run of the drill is the reproduction that must turn green.

## Set up

- **The procedure is code**: the backup and restore scripts and the rollback command live in the repository, so a
  drill runs exactly what an incident would.
- **A restore error fails the drill.** By default, pg_restore goes on after an error and reports the count at the
  end; run it with `--exit-on-error`, or fail the drill on any count above zero.
- **What counts as restored** is the project's decision, written in the loop's `LOOP.md`: the key tables with their
  minimum row counts, the freshness limit (recommended: the backup interval plus one hour), and the recovery time
  objective.
- **The schedule.** Restore weekly and after every change to the backup configuration. Drill the rollback nightly
  against the latest release candidate: any release can break it.
- **Every read-back has a must-pass case too.** A check after a mutation must fire when the mutation did not happen
  and pass when it did. gemini-cli's rollback deletes the GitHub release, then reads it back with
  `RELEASE_TAG=$(gh release view "$TARGET_TAG" …)` in a step GitHub runs as `bash -eo pipefail`: `gh` exits 1 for a
  release that is gone, so the step fails exactly when the deletion succeeded, and fails by design when it did not.
  Tried only on "the release is still there", it looks right and can never pass. Write "not found" as the expected
  answer (`if gh release view "$tag" >/dev/null 2>&1; then echo "$tag still exists"; exit 1; fi`) and test each
  read-back on both. The same workflow fetches the token for deprecating the core package with the CLI's package
  name; only a drill that runs the mutations finds such a step.
- **The `run`** judges the report the job saves: one line per item, `<item>: <status>`: `restore: ok (41m, newest
  row 3h old)`, `restore: failed (pg_restore: 3 errors)`, `restore: stale (newest row 52h old)`, `restore: too slow
  (3h10m > 2h)`, `rollback: ok`, `rollback: smoke failed on the previous release`, `rollback: read-back failed
  (<mutation>)`. It exits non-zero for anything but `ok`.
- **The cases are recorded reports.** Must fire: a restore with errors; a stale backup; a restore slower than the
  recovery time; a rollback whose smoke suite fails; a release still published after the rollback deleted it. Must
  pass: a report with both items `ok`; the deletion's read-back run on a release that is gone.
- **Out of the agent's reach.** The job runs with its own credentials, which read the backups and write only to the
  scratch database and to staging. The agent never gets them: it reads the report and changes the procedure through
  a PR. A restore or a rollback in production is H2 and stays with a person or the deploy pipeline.

## Notes

- Google's SRE book: "No one really wants to make backups; what people really want are restores", and "the only test
  that should let you sleep at night is a full end-to-end test."
- [chaos-engineering](../chaos-engineering/card.md) drills the other half of recovery: what the platform does by
  itself when a pod or a zone goes.
