---
id: db-migration-lint
title: "Lint and run database migrations"
summary: "A migration linter points at a dangerous operation. The agent rewrites the migration, then applies it and rolls it back on a throwaway database."
sensor: computational
ilities: [compatibility, reliability]
places: [delivery/work, remediation/work, maintenance/gate]
stages: [local, ci]
speed: [seconds, minutes]
needs: []
related: [backup-restore-rollback, integration-tests-emulators, api-breaking-changes]
links:
  - title: "Squawk: Quick Start"
    url: "https://squawkhq.com/docs/"
    note: "a linter for Postgres migrations, and its rules."
  - title: "squawk CLI docs"
    url: "https://github.com/sbdchd/squawk/blob/master/docs/docs/cli.md"
    note: "reporters, `--exclude` and `squawk-ignore`."
  - title: "Verifying Migration Safety"
    url: "https://atlasgo.io/versioned/lint"
    author: "Atlas"
  - title: "Auditor plugin: Squawk (schema)"
    url: "https://github.com/AdamFrisby/CodeyBox/pull/609"
    author: "AdamFrisby"
    note: "reads Squawk's JSON violations rather than its exit code, and fails closed without them."
---

## Why

A migration runs against real data, and a destructive change or a long table lock does its damage the moment it
runs; reverting the code does not undo it. The linter names the dangerous operation while it is still a file in
the PR. The up → down → up run on a throwaway database shows that the migration applies and rolls back.

## How it works

1. The linter reads each new migration and names the dangerous operation in it. Squawk lints PostgreSQL migrations,
   with rules such as `adding-required-field`, `ban-drop-column`, `changing-column-type` and
   `require-concurrent-index-creation`. Atlas `migrate lint` reports destructive changes, breaking changes, and
   "Table locks or rewrites that could lead to downtime".
2. The agent rewrites the migration the safe way: the index created concurrently; the column added as nullable,
   filled, and made required in a later migration; a drop split into a release that stops using the column and a later
   one that drops it.
3. The agent applies the migration on a throwaway database, rolls it back and applies it again (up → down → up).

## Set up

- **One linter for the engine.** For PostgreSQL, `squawk 'migrations/*.sql' --reporter json`; its reporters are
  `tty`, `gcc`, `json` and `gitlab`. For Atlas, `atlas migrate lint --dev-url "docker://mysql/8/dev" --git-base main`;
  "Starting with v0.38, the `atlas migrate lint` command is available only to Atlas Pro users".
- **Lint only the new migrations.** A migration that has already run is history: rewriting it changes nothing in the
  databases it ran on. Atlas takes the changes since a branch with `--git-base`; Squawk takes the paths the PR adds.
- **Read the report, not only the exit code.** In the CodeyBox Squawk plugin, exit 1 covers both "ran with
  violations" and a failed run, so the plugin reads the JSON array of violations and fails closed when no array comes
  back. Do the same in `run`.
- **An ignored rule is a reviewed line.** `-- squawk-ignore <rule>` above the statement, or a rule left out with
  `--exclude`, carries its reason, and a person approves it in review: a dropped column that nothing reads any more
  is a fair reason.
- **The throwaway database** is a fresh container of the same engine and major version as production, with the
  migrations of main applied first. Then the new migration goes up, down and up again.
- **`run`** lints the migration files in the directory, then runs up → down → up on a throwaway database. It prints
  `file:line: <rule>: <message>` per violation and `<migration>: <up|down> failed: <error>` for a failed step, and
  exits non-zero on any of them, or when the linter returned no report.
- **Cases.** Must fire: a migration that adds a `NOT NULL` column without a default; one that creates an index
  without `CONCURRENTLY`; one whose down step fails. Must pass: a migration that adds a nullable column and creates
  its index concurrently, with a working down step.
- **Wiring.** A CI job on every PR that adds a migration; the agent runs the same locally before it commits. The CI
  run is the one that counts, and the linter's configuration and every ignore comment go through review.

## Notes

- The linter sees the SQL, not the data: a lock that is harmless on a small table is downtime on a large one. When a
  migration goes wrong anyway, restoring is [backup-restore-rollback](../backup-restore-rollback/card.md).
