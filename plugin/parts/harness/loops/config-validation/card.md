---
id: config-validation
title: "Configuration check"
summary: "Two checks catch configuration errors: a validator checks the configuration against its schema; a smoke start runs with each configuration profile."
sensor: computational
ilities: [deployability, compatibility]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, commit, ci]
speed: [seconds, minutes]
needs: []
related: [health-checks-smoke, preview-environments]
links:
  - title: "check-jsonschema"
    url: "https://github.com/python-jsonschema/check-jsonschema"
    note: "a JSON Schema CLI and pre-commit hook."
  - title: "check-jsonschema: Usage"
    url: "https://check-jsonschema.readthedocs.io/en/stable/usage.html"
    note: "`--schemafile` and `--output-format JSON`."
  - title: "JSON Schema: object"
    url: "https://json-schema.org/understanding-json-schema/reference/object"
    author: "JSON Schema"
    note: "`required` and `additionalProperties: false`."
---

## Why

A mistake in configuration is not in the code, so the compiler does not see it, and tests that run with one
profile miss the others. The mistake shows when the app starts with the configuration that contains it. The schema
catches a wrong or missing value without running anything. The smoke start catches what a schema cannot: a profile
that the app does not start with.

## How it works

The loop runs two checks on the configuration:

- **The schema check.** A validator checks every configuration file and every profile (dev, staging, production)
  against its schema, without starting the app, and names the file and the key of each wrong or missing value.
- **The smoke start.** The app starts with each profile in turn, with test values for the secrets, and must answer
  its readiness check; then it stops.

The agent fixes the configuration, or the schema when the configuration is right and the schema is behind it.

## Set up

- **A schema for each configuration.** A JSON Schema for YAML and JSON files, checked with
  `check-jsonschema --schemafile config.schema.json config/*.yaml`; or a typed configuration class the app loads at
  start, checked by loading every profile in a test. List every key the app needs under `required`, and set
  `additionalProperties: false`, so that "no additional properties will be allowed" and a misspelled key fails
  instead of being ignored.
- **The environment counts.** Variables the app reads from the environment are in the schema too, through an
  `.env.example` checked the same way: a missing variable breaks the start as surely as a missing key.
- **The smoke start.** For each profile in `config/`, start the app and poll its readiness endpoint every 5 seconds
  for up to 2 minutes; a timeout is red, since a slower start is a problem of its own. Secrets come from test values,
  so the smoke start needs no access to the real ones.
- **`run`** prints `<file>: <key path>: <message>` per schema error (`-o JSON` gives check-jsonschema's output as
  JSON), then one line per profile, `<profile>: started` or `<profile>: failed to start: <last log line>`. It exits
  non-zero on any schema error or failed start.
- **Cases.** Must fire: a profile with a misspelled key; a profile with a port given as a string where the schema
  wants an integer; a profile that passes the schema but the app refuses, such as a database URL with a scheme the
  driver does not support. Must pass: the real profiles.
- **Wiring.** check-jsonschema is also a pre-commit hook: run it there, and in a PostToolUse hook on edits under
  `config/`. The smoke start runs in CI. The final run is in CI, and a change to the schema is reviewed like code.

## Notes

- The smoke start checks that the app starts; [health-checks-smoke](../health-checks-smoke/card.md) checks it again
  after the deploy, against the real environment.
