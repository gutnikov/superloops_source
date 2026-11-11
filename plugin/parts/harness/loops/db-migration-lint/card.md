---
id: db-migration-lint
title: "Lint and run database migrations"
summary: "A migration linter points at a dangerous operation. The agent rewrites the migration, then applies it and rolls it back on a throwaway database."
sensor: computational
ilities: [compatibility, reliability]
places: [delivery/work, remediation/work, maintenance/gate]
stages: [ci]
speed: [seconds, minutes]
needs: []
links:
  - title: "ariga/atlas"
    url: "https://github.com/ariga/atlas"
  - title: "squawk CLI docs"
    url: "https://github.com/sbdchd/squawk/blob/master/docs/docs/cli.md"
  - title: "Verifying Migration Safety"
    url: "https://atlasgo.io/versioned/lint"
    author: "Atlas"
  - title: "Auditor plugin: Squawk (schema)"
    url: "https://github.com/AdamFrisby/CodeyBox/pull/609"
---

## Why

A migration runs against real data, and a destructive change or a long table lock does its damage the moment it
runs; reverting the code does not undo it. The linter names the dangerous operation while it is still a file in
the PR. The up → down → up run on a throwaway database shows that the migration applies and rolls back.

## How it works

1. The linter reads the migration file and names the dangerous operation in it.
2. The agent rewrites the migration.
3. The agent applies the migration, rolls it back and applies it again (up → down → up) on a throwaway database.

You can use either of these linters:

- Squawk, with the reporters `tty|gcc|json|gitlab`.
- Atlas `migrate lint`, with 50+ analyzers. They include checks for destructive changes and table locks. Since v0.38 `atlas migrate lint` is available only in Atlas Pro.

## Set up

To set up the loop:

- Set the linter to give JSON output. In Squawk, use the `json` reporter.
- Add an "up → down → up" test that applies the migration, rolls it back and applies it again on a throwaway database.

## Notes

- Squawk exits with code 1 when it finds a problem, and also when the tool itself fails. Exit code 1 alone does not tell you which of the two happened.
