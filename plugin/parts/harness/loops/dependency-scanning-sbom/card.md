---
id: dependency-scanning-sbom
title: "Dependency analysis (SCA) and SBOM"
summary: "The scanner reports a CVE in a dependency the agent added. The agent then picks a safe version."
sensor: computational
ilities: [security]
places: [delivery/work, remediation/work, maintenance/entry, maintenance/work]
stages: [ci, scheduled]
speed: [minutes]
needs: []
related: [dependency-updates, license-check, triage]
links:
  - title: "SBOM"
    url: "https://trivy.dev/latest/docs/supply-chain/sbom/"
    author: "Trivy"
    note: "writing an SBOM in CycloneDX or SPDX, and scanning one with `trivy sbom`."
  - title: "Others: exit code"
    url: "https://trivy.dev/latest/docs/configuration/others/"
    author: "Trivy"
    note: "Trivy exits 0 on findings unless `--exit-code` is set."
  - title: "Filtering"
    url: "https://trivy.dev/latest/docs/configuration/filtering/"
    author: "Trivy"
    note: "`.trivyignore` with an expiry date, and `--ignore-unfixed`."
  - title: "Output: return codes"
    url: "https://google.github.io/osv-scanner/output/"
    author: "OSV-Scanner"
  - title: "AGENTS.md: Dependency and Install Security"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/AGENTS.md#dependency-and-install-security"
    author: "pi (earendil-works)"
  - title: "check-pinned-deps.mjs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/check-pinned-deps.mjs"
    author: "pi (earendil-works)"
---

## Why

A dependency the agent adds brings code nobody in the project wrote, and its known vulnerabilities do not show in
the diff. The scan catches a reported CVE in that dependency while the change is still open. The SBOM, the list of
every component and version a release is built from, lets the same scan run again later, when a CVE is published for
something already shipped.

## How it works

A CI job writes the SBOM from the project's lockfiles and scans it against vulnerability databases. For each finding
the agent picks a safe version: the lowest version that fixes every blocking CVE of the package and that the build
and the tests accept. For a transitive dependency it first updates the direct dependency that pulls it in, and pins
the transitive version (an override in the package manager) only when no such update exists. With no fixed version,
it replaces the package, or proposes an exception to a person. The scan then runs again; the loop ends when it is
clean.

## Set up

- **The scanner.** With Trivy, `trivy fs --format cyclonedx --output sbom.cdx.json .` writes the SBOM, and
  `trivy sbom --exit-code 1 --severity HIGH,CRITICAL sbom.cdx.json` scans it. Trivy "exits with code 0 even when
  security issues are detected", so `--exit-code` is not optional. OSV-Scanner is the alternative: it exits 1 when it
  finds vulnerabilities, 127 on a general error and 128 when it found no packages.
- **Block on HIGH and CRITICAL, report the rest.** Lower severities on every PR make a noise the agent learns to step
  around. The project can set another level in the loop's `LOOP.md`.
- **Do not hide unfixed CVEs in the gate.** `--ignore-unfixed` skips every vulnerability with no fix, and those are
  the ones where the package has to be replaced or a person has to accept the risk.
- **Exceptions expire.** A CVE the project accepts goes into `.trivyignore` with a comment saying why and an expiry
  date (`CVE-2019-14697 exp:2023-01-01`); after the date it fires again. Accepting a risk is a person's decision
  (H5): the agent proposes the line, a person approves it.
- **The SBOM is kept with the release.** The release job stores `sbom.cdx.json` beside the build. A nightly job scans
  the SBOMs of the versions in production with `trivy sbom`; a new finding there is a maintenance signal for
  [triage](../triage/card.md), not a red PR.
- **Before the scan, limit what a change can bring in.** Pi pins every direct registry dependency to an exact version
  (`check-pinned-deps.mjs` fails on a range), installs with `--ignore-scripts`, and lets a dependency run a lifecycle
  script only from an allowlist that `npm run check` verifies. A lockfile change is blocked at commit unless it is
  allowed explicitly ([pre-commit-pre-push](../pre-commit-pre-push/card.md)).
- **`run`** scans the directory and prints one line per finding, `<package>@<version>: <CVE id> <severity>, fixed in
  <version>` or `no fix`. It exits non-zero on any finding at the blocking severity, and when the scanner failed or
  found no packages: a scan that saw nothing is not a pass.
- **Cases.** Must fire: a lockfile with a direct dependency at a version with a known HIGH CVE that a later version
  fixes; the same with the vulnerable package as a transitive dependency; a directory with no lockfile. Must pass: the
  lockfile with the fixed versions; a finding listed in `.trivyignore` before its expiry date. Keep the must-pass
  lockfile small: a new CVE published for it turns the case red, and that is news to act on.
- **Wiring.** A CI job on every PR that changes a manifest or a lockfile, and the nightly job over the SBOMs. The final
  run is in CI, and a PreToolUse hook denies the agent's writes to `.trivyignore`.

## Notes

- [dependency-updates](../dependency-updates/card.md) keeps versions current, so the fix for a CVE is a small step.
- The same Trivy job can check licences with `--scanners license` ([license-check](../license-check/card.md)).
