---
id: license-check
title: "License check"
summary: "The check fails on a forbidden license; the agent replaces the package."
sensor: computational
ilities: [security]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [seconds]
needs: []
related: [dependency-scanning-sbom, dependency-updates]
links:
  - title: "License Scanning"
    url: "https://google.github.io/osv-scanner/usage/license-scanning/"
    author: "OSV-Scanner"
    note: "`--licenses` with an allowlist of SPDX identifiers."
  - title: "License"
    url: "https://trivy.dev/latest/docs/scanner/license/"
    author: "Trivy"
    note: "licence categories and their severities, set in `trivy.yaml`."
---

## Why

A package with a forbidden license looks like any other package in the diff. If reviewers do not read the license of
every dependency the agent adds, they will miss it. An allowlist in CI fails on it, and the agent replaces the package
before the change is merged.

## How it works

The project keeps a list of the licenses it allows, by SPDX identifier. A check in CI reads the license of every
package in the dependency tree, transitive ones included, and compares it with the list. A license not on the list, or
one the tool could not identify, fails the check. The agent replaces the package with one under an allowed license
that does the same job; when there is none, it proposes an exception to a person.

## Set up

- **The list is a person's decision.** Which licenses are allowed is a legal question, so a person approves the list
  (H5) and it lives in the repository. Start with the permissive licenses (MIT, BSD-2-Clause, BSD-3-Clause,
  Apache-2.0, ISC) and treat every other license as not allowed until a person adds it: an allowlist fails on a
  license nobody has looked at, a denylist lets it through.
- **The tool.** OSV-Scanner takes the allowlist directly: `osv-scanner --licenses="MIT,Apache-2.0,BSD-3-Clause" .`
  shows the packages outside it. Trivy classifies instead: with `--scanners license` it maps each license to a
  category and a severity (forbidden is CRITICAL, restricted HIGH, unknown UNKNOWN), and the `license:` section of
  `trivy.yaml` says which licenses fall in which category. With Trivy, fail on `--severity UNKNOWN,HIGH,CRITICAL`, so
  an unidentified license fails too.
- **An exception names a package and its version**, not a license, with the reason, and a person approves it (H5). A
  new version of that package is checked again, since a package can change its license between versions.
- **`run`** prints one line per package, `<package>@<version>: <license> not allowed` or `license unknown`, and exits
  non-zero when there is any.
- **Cases.** Must fire: a lockfile with a GPL-3.0 package against the permissive list; a package whose license the tool
  cannot identify. Must pass: a lockfile with only MIT and Apache-2.0 packages; a GPL-3.0 package with an approved
  exception for its version.
- **Wiring.** A CI job on every PR that changes a manifest or a lockfile, in the same job as the vulnerability scan
  ([dependency-scanning-sbom](../dependency-scanning-sbom/card.md)). The final run is in CI, and a PreToolUse hook
  denies the agent's writes to the allowlist and the exceptions.
