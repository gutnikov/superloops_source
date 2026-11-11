---
id: dependency-scanning-sbom
title: "Dependency analysis (SCA) and SBOM"
summary: "The scanner reports a CVE in a dependency the agent added. The agent then picks a safe version."
sensor: computational
ilities: [security]
places: [delivery/work, remediation/work, maintenance/entry, maintenance/work]
stages: [ci]
speed: [minutes]
needs: []
links: []
---

## Why

A dependency the agent adds brings code nobody in the project wrote, and its known vulnerabilities do not show in
the diff. The loop catches reported CVEs in that dependency while the change is still open.

The SBOM lists what the project is built from.

## How it works

A dependency scanner in CI checks the dependencies the agent adds against reported CVEs. When it reports a CVE in
one of them, the agent picks a safe version.

The research describes only this case. It does not say:

- what counts as a safe version, or whether the scanner runs again to confirm the new version
- what the agent does when no fixed version exists, when the CVE is in a transitive dependency, or when the fixed version breaks the build
- when the loop stops or hands the problem to a person

## Set up

Use these in CI:

- a dependency scanner: osv-scanner, Trivy or Dependabot
- an SBOM (software bill of materials) in CycloneDX or SPDX format

## Notes

The research behind this card cites no sources for this loop.

The research did not check Trivy itself. It lists Trivy as common practice.

The research does not say who produces the SBOM, at which step, or whether the scanner reads it.
