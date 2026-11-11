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
links:
  - title: "Detect Breaking API Changes with TypeScript & OpenAPI"
    url: "https://www.sitepoint.com/detect-breaking-api-changes-typescript-openapi/"
  - title: "Detecting breaking changes — Buf Docs"
    url: "https://buf.build/docs/breaking/"
  - title: "oasdiff GitHub Action"
    url: "https://www.oasdiff.com/docs/github-action"
---

## Why

A breaking change in a schema can pass every test of the service itself: what breaks is the clients that rely on
the old schema. Comparing the schema with the one on main catches the break in the PR, while restoring
compatibility or adding a new API version is still cheap.

## How it works

The agent changes a schema, and CI compares it with the schema on main. The source names two tools for the check:

- `buf breaking` prints a line for each break it finds, such as `user.proto:2:3:Field "1" on message "User" changed type…`.
- `oasdiff breaking --fail-on ERR` exits with code 1 when it finds a break.

The agent then restores compatibility or introduces a new API version.

## Set up

To set up the loop:

- Always pass `--fail-on` to oasdiff. Without it, oasdiff exits with code 0.
- Add a GitHub Action that posts annotations on the PR. The source cites the [oasdiff GitHub Action](https://www.oasdiff.com/docs/github-action) for this step.
