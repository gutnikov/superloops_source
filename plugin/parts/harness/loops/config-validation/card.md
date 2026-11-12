---
id: config-validation
title: "Configuration check"
summary: "Three checks catch configuration errors: a validator checks it against its schema, a probe checks that each endpoint it names answers, and a smoke start runs each profile."
sensor: computational
ilities: [deployability, compatibility]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, commit, ci]
speed: [seconds, minutes]
needs: []
related: [health-checks-smoke, preview-environments, third-party-extension-scan]
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
  - title: "check-mcp-urls.yml: what counts as alive"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/check-mcp-urls.yml#L1-L26"
    author: "Anthropic"
  - title: "check-mcp-urls.yml: the probe, and a fallback that would pass a dead host"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/check-mcp-urls.yml#L72-L137"
    author: "Anthropic"
  - title: "Skills improvements from user feedback: configuration change verification"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/plans/2025-11-28-skills-improvements-from-user-feedback.md#L27-L46"
    author: "superpowers (obra)"
    note: "status 200 from an \"OpenAI integration\" that was answering with an Anthropic model."
---

## Why

A mistake in configuration is not in the code, so the compiler does not see it, and tests that run with one
profile miss the others. The schema catches a wrong or missing value without running anything, and the probe a URL
that leads nowhere. The smoke start catches what neither can: a profile that the app does not start with, or starts
with on other values.

## How it works

The loop runs three checks on the configuration:

- **The schema check.** A validator checks every configuration file and every profile (dev, staging, production)
  against its schema, without starting the app, and names the file and the key of each wrong or missing value.
- **The endpoint probe.** Each URL the configuration names, such as an MCP server's, must lead to a server.
- **The smoke start.** The app starts with each profile in turn, with test values for the secrets, answers its
  readiness check and shows a value only that profile sets; then it stops.

The agent fixes the configuration, or the schema when the configuration is right and the schema is behind it.

## Set up

- **A schema for each configuration.** A JSON Schema for YAML and JSON files, checked with
  `check-jsonschema --schemafile config.schema.json config/*.yaml`; or a typed configuration class the app loads at
  start, checked by loading every profile in a test. List every key the app needs under `required`, and set
  `additionalProperties: false`, so that "no additional properties will be allowed" and a misspelled key fails
  instead of being ignored.
- **The environment counts.** Variables the app reads from the environment are in the schema too, through an
  `.env.example` checked the same way: a missing variable breaks the start as surely as a missing key.
- **Probe what it points at.** Anthropic sends each `http` or `sse` MCP server a HEAD that follows redirects, then,
  on no answer, 404 or 405, a JSON-RPC `initialize` POST: "401/403/405/5xx all pass — auth and method errors are
  expected without credentials. Only 404/410 and connection/DNS/TLS failures fail." Probe on configuration PRs and
  daily, for endpoints that "disappear after merge"; a red daily run opens an issue for [triage](../triage/card.md).
- **The smoke start.** For each profile in `config/`, start the app and poll its readiness endpoint every 5 seconds
  for up to 2 minutes; a timeout is red, since a slower start is a problem of its own. Secrets come from test values,
  so the smoke start needs no access to the real ones. Then read from the app a value only that profile sets (its
  name, the provider, the database host), since a start on defaults answers ready too. superpowers: an "OpenAI
  integration" test got status 200 while the response "contained `"model": "claude-sonnet-4-20250514"`".
- **`run`** prints `<file>: <key path>: <message>` per schema error (`-o JSON` gives check-jsonschema's output as
  JSON), `<file>: <server>: <url>: gone (<code>)` or `unreachable` per failed endpoint, then per profile
  `<profile>: started`, `failed to start: <last log line>` or `started without its values`. It exits non-zero on
  anything but `started`.
- **Cases.** Must fire: a profile with a misspelled key; a profile with a port given as a string where the schema
  wants an integer; a profile that passes the schema but the app refuses, such as a database URL with a scheme the
  driver does not support; an MCP URL on a host that refuses connections (Anthropic's probe warns that a fallback
  inside `$(curl … || echo 000)` yields `000000`, which matches no failure code); a profile started on a fallback
  provider. Must pass: the real profiles; an endpoint that answers 401 without credentials; an empty or templated
  URL (`${`, `{{`), which waits for the user's value.
- **Wiring.** check-jsonschema is also a pre-commit hook: run it there, and in a PostToolUse hook on edits under
  `config/`. The smoke start runs in CI. The final run is in CI, and a change to the schema is reviewed like code.

## Notes

- The smoke start checks that the app starts; [health-checks-smoke](../health-checks-smoke/card.md) checks it again
  after the deploy, against the real environment.
