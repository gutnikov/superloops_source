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
related: [dependency-updates, third-party-extension-scan, license-check, triage]
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
  - title: "npm-audit.yml: a daily audit and registry signatures"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/npm-audit.yml#L1-L31"
    author: "pi (earendil-works)"
  - title: "npm-audit.mjs: accepted advisories bound to a package, stale ones reported"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/npm-audit.mjs#L1-L75"
    author: "pi (earendil-works)"
  - title: "check-lockfile.js: integrity required, and a banned gaxios range"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/check-lockfile.js#L34-L113"
    author: "gemini-cli (Google)"
  - title: "setup-rusty-v8: a downloaded binary checked against checksums kept in the repository"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/actions/setup-rusty-v8/action.yml#L36-L62"
    author: "Codex (OpenAI)"
  - title: "publish-dotslash: uv by checksum, pip with --require-hashes"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/actions/publish-dotslash/action.yml#L23-L45"
    author: "Codex (OpenAI)"
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
- **Exceptions expire, and name what they excuse.** A CVE the project accepts goes into `.trivyignore` with a
  comment saying why and an expiry date (`CVE-2019-14697 exp:2023-01-01`); after the date it fires again. Bind it to
  the package as well as the advisory, and report it once it matches nothing: pi's audit requires that "Every
  accepted advisory must name the affected package and explain why it does not apply", and prints "Accepted advisory
  <id> no longer matches; remove it from scripts/npm-audit.mjs." Accepting a risk is a person's decision (H5): the
  agent proposes the line, a person approves it.
- **The SBOM is kept with the release.** The release job stores `sbom.cdx.json` beside the build. A nightly job scans
  the SBOMs of the versions in production with `trivy sbom`; a new finding there is a maintenance signal for
  [triage](../triage/card.md), not a red PR.
- **Before the scan, limit what a change can bring in.** Pi pins every direct registry dependency to an exact version
  (`check-pinned-deps.mjs` fails on a range), installs with `--ignore-scripts`, lets a dependency run a lifecycle
  script only from an allowlist that `npm run check` verifies, and checks the registry's signatures daily (`npm audit
  signatures`). A lockfile change is blocked at commit unless it is allowed explicitly
  ([pre-commit-pre-push](../pre-commit-pre-push/card.md)). gemini-cli fails a lockfile entry without `resolved` and
  `integrity`. A binary CI downloads is in no lockfile: keep its sha256 in the repository and check it before use,
  as Codex does for rusty_v8 and, with `--require-hashes`, for its Python tools.
- **A ban list for bugs with no CVE.** A version with a functional bug has no advisory, so no scanner stops a later
  update or dedupe from bringing it back. gemini-cli fails any `gaxios` 7.x below 7.1.6, with the incident's PR and
  "Please ensure gaxios resolves to a version containing the fix (>= 7.1.6)." Keep each banned range with its
  incident link and its fixed floor, checked over the lockfile on every PR.
- **`run`** scans the directory and prints one line per finding, `<package>@<version>: <CVE id> <severity>, fixed in
  <version>` or `no fix`, or `banned, use >= <version>`. It exits non-zero on any finding at the blocking severity or
  banned, and when the scanner failed or found no packages: a scan that saw nothing is not a pass. An exception that
  matches nothing prints `<id>: stale exception, remove it` and does not fail the scan.
- **Cases.** Must fire: a lockfile with a direct dependency at a version with a known HIGH CVE that a later version
  fixes; the same with the vulnerable package as a transitive dependency; the same advisory excepted for another
  package; a directory with no lockfile; a lockfile entry without `integrity`; a banned version reached through a
  transitive dependency; a downloaded archive whose sha256 differs from the recorded one. Must pass: the lockfile with
  the fixed versions; a finding listed in `.trivyignore` before its expiry date; a stale exception, printed. Keep the
  must-pass lockfile small: a new CVE published for it turns the case red, and that is news to act on.
- **Wiring.** A CI job on every PR that changes a manifest or a lockfile, and the nightly job over the SBOMs. The final
  run is in CI, and a PreToolUse hook denies the agent's writes to `.trivyignore`.

## Notes

- [dependency-updates](../dependency-updates/card.md) keeps versions current, so the fix for a CVE is a small step.
- The same Trivy job can check licences with `--scanners license` ([license-check](../license-check/card.md)).
