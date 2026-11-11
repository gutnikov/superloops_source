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
links: []
---

## Why

A backup that has never been restored, or a rollback that has never been run, may not work on the day it is needed.
Nothing in the delivery of a change runs them. A scheduled job that restores and rolls back finds a broken procedure
before an incident does.

## How it works

On a schedule, a job restores the database from a backup and rolls the release back. When the check fails, the agent
fixes the procedure.

The source does not say:

- which environment the job restores into and rolls back
- what the check verifies, or what counts as a failure
- which procedure the agent fixes
- whether the restore and the rollback run as one check or as two
- what happens if the agent cannot fix the procedure, or if the backup cannot be used

## Set up

- Run restore tests on a schedule. The source does not give an interval.

## Notes

The research cites no source for this loop.
