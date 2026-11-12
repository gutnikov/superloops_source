---
id: api-breaking-changes
title: "Breaking changes in the API"
summary: "The agent changes a schema, a library's public types or data released clients read; CI compares them with main or builds the latest release on them, and the agent restores compatibility."
sensor: computational
ilities: [compatibility, maintainability]
places: [delivery/work, remediation/work, maintenance/gate]
stages: [local, ci]
speed: [seconds]
needs: []
related: [contract-tests, executable-docs, behaviour-invariance, changelog-audit]
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
  - title: "api-report.ts: one API Extractor report per entry point"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/scripts/api-report.ts#L1-L10"
    author: "sandcastle (Matt Pocock)"
  - title: "sandcastle CI: the stale-report check"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/ci.yml#L54-L56"
    author: "sandcastle (Matt Pocock)"
  - title: "check-model-catalog-compat.mjs: why released clients are the consumer"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/check-model-catalog-compat.mjs#L3-L19"
    author: "pi (earendil-works)"
    note: "the incident: a catalog moved kimi-coding to another API, and pi 1.2.0 sent requests to the wrong one."
  - title: "check-model-catalog-compat.mjs: the latest release type-checked with the new catalog"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/check-model-catalog-compat.mjs#L79-L131"
    author: "pi (earendil-works)"
  - title: "model-catalog-minimum-version.mjs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/model-catalog-minimum-version.mjs#L1-L9"
    author: "pi (earendil-works)"
    note: "one catalog per minimum version; older clients keep the last one and stop receiving updates."
  - title: "publish-model-catalog.mjs: what a catalog must hold to be published"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/publish-model-catalog.mjs#L84-L156"
    author: "pi (earendil-works)"
  - title: "publish-model-catalog.yml: the publication window"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/publish-model-catalog.yml#L119-L156"
    author: "pi (earendil-works)"
---

## Why

A breaking change in a schema can pass every test of the service itself: what breaks is the clients that rely on
the old schema. Comparing the schema with the one on main catches the break in the PR, while restoring
compatibility or adding a new API version is still cheap.

## How it works

The agent changes an API, and the check compares it with the version on main, or with what the latest release needs:

- For protobuf, `buf breaking --against '.git#branch=main'` prints one line per break, `file:line:column:message`, such
  as `user.proto:2:3:Field "1" on message "User" changed type from "int32" to "string".`
- For OpenAPI, `oasdiff breaking <base> <revision> --fail-on WARN` lists the breaking changes and exits with code 1
  when there is one. oasdiff marks each change ERR, "definite breaking changes", or WARN, potential ones that "cannot
  be confirmed programmatically as breaking".
- A TypeScript library has no schema: API Extractor's report of every export per entry point is regenerated and
  compared with the committed one.
- Data that released clients fetch and use without updating, such as a model catalog, is checked against the latest
  release, not main: the check builds that release with the new data.

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
- **A library's report has an owner.** sandcastle commits one report per `exports` entry point under `api-report/`
  and checks it in CI with `npm run api:report -- --check`: "a public API change shows up in the PR as a report diff,
  which CODEOWNERS routes to Matt". The agent can regenerate the report; only its owner approves the change.
- **Data for released clients is built against the release.** pi.dev serves each model catalog to every released pi
  at or above a minimum version. Before publishing, pi takes the newest release's code from its git tag and its
  built-in models from npm, merges the new catalog as the client does, and runs `tsc --noEmit`: the types tie each
  provider to the APIs it implements, "so a model with an API its provider lacks is a type error". The failure names
  the way out: "If the change is intended, set MINIMUM_PI_VERSION in scripts/model-catalog-minimum-version.mjs to the
  next release in the same commit." Raising the minimum is the new API version: older clients keep the last catalog
  published for them.
- **Publishing data has floors.** A half-failed generator passes every check of form; pi refuses a catalog without a
  required provider or with too few models ("Refusing to publish only <n> models; expected at least 500"), and
  publishes only on weekdays from 10:00 to 15:00 Vienna time unless a person starts it: when maintainers are at work.
- **`run`** compares the files in the directory with those on main and prints one line per break: buf's
  `file:line:column:message` as it is, oasdiff's path, method and change, a report's diff, or the release it built
  and each compiler error. It exits non-zero on any break at the blocking level.
- **Cases.** Must fire: a copy of the OpenAPI schema with a new required request field; one with a response field
  removed; a protobuf file with a field's type changed; a stale API report; against the latest release, a catalog
  with a model whose provider lacks its API; a catalog of 499 models. Must pass: a copy that adds an optional field
  and a new endpoint; that catalog with the minimum version raised in the same commit.
- **Wiring.** The agent runs it locally before a commit, in seconds. A CI job runs it on every PR that changes a
  schema; the oasdiff action shows each break as an `::error::` annotation inline on the changed file. The CI run is
  the one that counts, since there the agent cannot change the base. The data check runs again before any upload.

## Notes

- [Contract tests](../contract-tests/card.md) catch a break from the consumer's side, including one a schema diff
  cannot see, such as a field still present but filled differently.
- A schema that drifts from the code makes this check compare the wrong things;
  [executable-docs](../executable-docs/card.md) checks the API's responses against the schema.
