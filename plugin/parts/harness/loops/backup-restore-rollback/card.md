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
related: [chaos-engineering, db-migration-lint, health-checks-smoke, canary-feature-flags]
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
   ([db-migration-lint](../db-migration-lint/card.md)).

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
- **The `run`** judges the report the job saves: one line per item, `<item>: <status>`: `restore: ok (41m, newest
  row 3h old)`, `restore: failed (pg_restore: 3 errors)`, `restore: stale (newest row 52h old)`, `restore: too slow
  (3h10m > 2h)`, `rollback: ok`, `rollback: smoke failed on the previous release`. It exits non-zero for anything but
  `ok`.
- **The cases are recorded reports.** Must fire: a restore with errors; a stale backup; a restore slower than the
  recovery time; a rollback whose smoke suite fails. Must pass: a report with both items `ok`.
- **Out of the agent's reach.** The job runs with its own credentials, which read the backups and write only to the
  scratch database and to staging. The agent never gets them: it reads the report and changes the procedure through
  a PR. A restore or a rollback in production is H2 and stays with a person or the deploy pipeline.

## Notes

- Google's SRE book: "No one really wants to make backups; what people really want are restores", and "the only test
  that should let you sleep at night is a full end-to-end test."
- [chaos-engineering](../chaos-engineering/card.md) drills the other half of recovery: what the platform does by
  itself when a pod or a zone goes.
