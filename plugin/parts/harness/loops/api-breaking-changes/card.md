---
id: api-breaking-changes
title: "Breaking changes in the API"
summary: "The agent changes a schema; CI compares it with the schema on main and reports each break, and the agent restores compatibility or introduces a new API version."
sensor: computational
ilities: [compatibility, maintainability]
places: [delivery/work, remediation/work, maintenance/gate]
stages: [local, ci]
speed: [seconds]
needs: []
related: [contract-tests, executable-docs, behaviour-invariance]
links:
  - title: "Detecting breaking changes — Buf Docs"
    url: "https://buf.build/docs/breaking/"
  - title: "Breaking Changes and Changelog"
    url: "https://github.com/oasdiff/oasdiff/blob/main/docs/BREAKING-CHANGES.md"
    author: "oasdiff"
    note: "ERR and WARN levels, and `--fail-on`."
  - title: "Deprecating APIs, Parameters and Properties"
    url: "https://github.com/oasdiff/oasdiff/blob/main/docs/DEPRECATION.md"
    author: "oasdiff"
  - title: "oasdiff GitHub Action"
    url: "https://www.oasdiff.com/docs/github-action"
  - title: "opencode AGENTS.md: Experimental API"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/AGENTS.md#L172-L181"
    author: "opencode (anomalyco)"
    note: "new endpoints and new default behaviours start experimental; shipped API moves keep deprecated aliases until the next minor."
  - title: "experimental-identifiers.test.ts"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/protocol/test/experimental-identifiers.test.ts#L7-L24"
    author: "opencode (anomalyco)"
---

## Why

A breaking change in a schema can pass every test of the service itself: what breaks is the clients that rely on
the old schema. Comparing the schema with the one on main catches the break in the PR, while restoring
compatibility or adding a new API version is still cheap.

## How it works

The agent changes a schema, and the check compares it with the schema on main:

- For protobuf, `buf breaking --against '.git#branch=main'` prints one line per break, `file:line:column:message`, such
  as `user.proto:2:3:Field "1" on message "User" changed type from "int32" to "string".`
- For OpenAPI, `oasdiff breaking <base> <revision> --fail-on WARN` lists the breaking changes and exits with code 1
  when there is one. oasdiff marks each change ERR, "definite breaking changes", or WARN, potential ones that "cannot
  be confirmed programmatically as breaking".

The agent restores compatibility: it puts the field back, makes the new parameter optional, keeps the old type. Where
the break is wanted, it adds a new version of the API beside the old one and deprecates the old one; a person decides
that the break is wanted.

## Set up

- **The base comes from main.** The check reads the schema on main, never a copy in the branch the agent can edit:
  `--against '.git#branch=main'` for buf, `base: 'origin/${{ github.base_ref }}:openapi.yaml'` in the oasdiff action.
- **Pass `--fail-on`.** oasdiff returns an error only when told to: `--fail-on ERR` exits 1 on definite breaks, and
  `--fail-on WARN` on potential ones as well. Use WARN in the gate: a change oasdiff cannot decide on is the change a
  person should look at.
- **buf's strictness is a decision in `buf.yaml`.** `breaking.use` defaults to FILE, the strictest category; WIRE_JSON
  and WIRE allow more, for clients that only see the encoding. Keep FILE unless the project writes down why not.
- **Retiring an endpoint goes through deprecation.** Mark it `deprecated: true` with an `x-sunset` date; oasdiff lets
  it be removed "At the sunset date or anytime later" without a breaking-change error, and "An earlier removal will
  be considered a breaking change."
- **New API starts experimental.** A new endpoint is not yet a contract: opencode's rule, "New endpoints and new
  default behaviors start experimental", under `/api/experimental/…` with an `experimental.*` id and a description
  that says it "may change without compatibility guarantees". Run the break check over the stable API only, and
  test the boundary both ways: opencode fails when a route under `/api/experimental` lacks the `experimental.` id or
  a route outside it has one, and asserts more than 100 operations were read, so an empty list cannot pass.
  Graduating a route moves it out and notes it in the changelog; a breaking move of shipped API keeps the old names
  as `@deprecated` aliases until the next minor.
- **`run`** compares the schema files in the directory with those on main and prints one line per break: buf's
  `file:line:column:message` as it is, and oasdiff's changes with the path, the method and the change. It exits
  non-zero on any break at the blocking level.
- **Cases.** Must fire: a copy of the OpenAPI schema with a new required request field; one with a response field
  removed; a protobuf file with a field's type changed. Must pass: a copy that adds an optional field and a new
  endpoint.
- **Wiring.** The agent runs it locally before a commit, in seconds. A CI job runs it on every PR that changes a
  schema; the oasdiff action shows each break as an `::error::` annotation inline on the changed file. The CI run is
  the one that counts, since there the agent cannot change the base.

## Notes

- [Contract tests](../contract-tests/card.md) catch a break from the consumer's side, including one a schema diff
  cannot see, such as a field still present but filled differently.
- A schema that drifts from the code makes this check compare the wrong things;
  [executable-docs](../executable-docs/card.md) checks the API's responses against the schema.
