---
id: shipped-artifact-check
title: "Check what ships before the channel moves"
summary: "The release installs the exact package, binary or image it publishes into an empty place and runs it, publishes it unannounced, verifies it from the registry, and only then moves the channel forward."
sensor: computational
ilities: [deployability, correctness, compatibility]
places: [delivery/release, remediation/release, maintenance/release]
stages: [ci]
speed: [minutes]
needs: [ci]
related: [health-checks-smoke, release-trust-boundary, patch-backport, platform-matrix, build, canary-feature-flags, backup-restore-rollback, changelog-audit]
links:
  - title: "pi build-binaries.yml: binaries built from the release's source tarball, SHA256SUMS"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/build-binaries.yml#L25-L121"
    author: "pi (earendil-works)"
  - title: "pi build-binaries.yml: the draft re-checks every asset and refuses to change a published release"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/build-binaries.yml#L228-L302"
    author: "pi (earendil-works)"
  - title: "pi check-runtime-deps.mjs: every import declared in the package's runtime dependencies"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/check-runtime-deps.mjs#L35-L51"
    author: "pi (earendil-works)"
  - title: "pi local-package-install.mjs: each package installed alone from its tarball"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/local-package-install.mjs#L72-L94"
    author: "pi (earendil-works)"
  - title: "pi env.yml: the packed file list, missing and unexpected"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/env.yml#L59-L126"
    author: "pi (earendil-works)"
  - title: "pi publish-release-announcement.mjs: wait for npm, then move latest.json forward only"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/publish-release-announcement.mjs#L105-L127"
    author: "pi (earendil-works)"
    note: "every 5 s for up to 10 minutes; the pointer by compare-and-swap at #L254-L302."
  - title: "pi publish-release-announcement.test.mjs: the pointer never moves back"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/publish-release-announcement.test.mjs#L12-L47"
    author: "pi (earendil-works)"
  - title: "pi p2-cloud-bundle.yml: the manifest goes last"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/p2-cloud-bundle.yml#L62-L73"
    author: "pi (earendil-works)"
  - title: "pi preview-packages.mjs: a tag's commit must be on main and its CI green"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/preview-packages.mjs#L104-L136"
    author: "pi (earendil-works)"
  - title: "pi preview-packages.mjs: the release before the refs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/preview-packages.mjs#L183-L228"
    author: "pi (earendil-works)"
  - title: "pi preview-packages.yml: an expired build artifact means re-run CI"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/preview-packages.yml#L52-L60"
    author: "pi (earendil-works)"
  - title: "pi publish-model-catalog.mjs: revisions named by their sha256, immutable, the index last"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/publish-model-catalog.mjs#L302-L320"
    author: "pi (earendil-works)"
    note: "the revision is sha256-<digest> of the full catalog, #L156-L173."
  - title: "opencode lib.sh: versioned paths served as immutable, the stored size read back"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/lib.sh#L66-L82"
    author: "opencode (anomalyco)"
  - title: "opencode release.yml: one request records a release"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/release.yml#L36-L40"
    author: "opencode (anomalyco)"
  - title: "opencode service-smoke.ts: what only the compiled binary can break"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/cli/script/service-smoke.ts#L141-L158"
    author: "opencode (anomalyco)"
  - title: "opencode native-arch.ts: the architecture of every embedded image"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/script/native-arch.ts#L15-L49"
    author: "opencode (anomalyco)"
  - title: "opencode release-process-daemon.yml: the glibc ceiling"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/release-process-daemon.yml#L123-L129"
    author: "opencode (anomalyco)"
  - title: "opencode release.yml: the windows-arm64 Node build skips both smokes"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/release.yml#L235-L245"
    author: "opencode (anomalyco)"
  - title: "opencode publish-npm.sh: wait until the registry serves every dependency"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/publish-npm.sh#L47-L89"
    author: "opencode (anomalyco)"
    note: "every 10 s, up to 180 tries; \"rolling the dist-tag back does not repair an install that already failed\"."
  - title: "Codex rust-release.yml: tag-check"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/rust-release.yml#L27-L57"
    author: "Codex (OpenAI)"
  - title: "Codex rust-release.yml: arch, signature and entitlements in every wrapper"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/rust-release.yml#L1339-L1513"
    author: "Codex (OpenAI)"
  - title: "Codex rust-release.yml: one lock for every publisher, and the release job's gate"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/rust-release.yml#L1608-L1635"
    author: "Codex (OpenAI)"
  - title: "Codex rust-release.yml: platform packages before the wrapper"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/rust-release.yml#L1913-L2031"
    author: "Codex (OpenAI)"
  - title: "Codex npm_alpha_tag.py: an older version gets its own tag"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/npm_alpha_tag.py#L26-L44"
    author: "Codex (OpenAI)"
  - title: "Codex publish_r2_release.py: size and sha256 read back, aliases moved last"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/publish_r2_release.py#L222-L302"
    author: "Codex (OpenAI)"
  - title: "Codex verify_pypi_release.py: the exact file set on PyPI"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/verify_pypi_release.py#L24-L64"
    author: "Codex (OpenAI)"
  - title: "Codex build-codex-packages: host tools on PATH stop the smoke"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/actions/build-codex-packages/action.yml#L191-L211"
    author: "Codex (OpenAI)"
    note: "no workflow in the repository calls this action."
  - title: "Codex installed_sdk_smoke.py: the import must come from the installed package"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/sdk/python/tests/installed_sdk_smoke.py#L14-L35"
    author: "Codex (OpenAI)"
  - title: "Codex rust-release-provisioned-macos.yml: the one job that runs the package smoke"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/rust-release-provisioned-macos.yml#L199-L216"
    author: "Codex (OpenAI)"
  - title: "Codex test_macos_signing_entitlements.py, run only by the advisory bazel job"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/test_macos_signing_entitlements.py#L20-L33"
    author: "Codex (OpenAI)"
  - title: "Codex test_releases.py: DotSlash config against a real release's asset list"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/test_releases.py#L192-L263"
    author: "Codex (OpenAI)"
  - title: "gemini-cli publish-release: staging tag, verify the packed tarball, publish it, then move the channel"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/actions/publish-release/action.yml#L161-L298"
    author: "gemini-cli (Google)"
  - title: "gemini-cli verify-release: install, version, the integration suite on the installed binary"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/actions/verify-release/action.yml#L46-L103"
    author: "gemini-cli (Google)"
  - title: "gemini-cli publish-release: the bundle run, and macOS binaries attached unrun"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/actions/publish-release/action.yml#L309-L346"
    author: "gemini-cli (Google)"
  - title: "gemini-cli release-nightly.yml: force_skip_tests defaults to true"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-nightly.yml#L13-L17"
    author: "gemini-cli (Google)"
  - title: "gemini-cli get-release-version.js: versions without a git tag are ignored"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/get-release-version.js#L162-L196"
    author: "gemini-cli (Google)"
  - title: "gemini-cli ci.yml: npm pack and npx on every PR"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/ci.yml#L198-L215"
    author: "gemini-cli (Google)"
  - title: "gemini-cli push-sandbox: test the image for one architecture, then push both"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/actions/push-sandbox/action.yml#L69-L114"
    author: "gemini-cli (Google)"
  - title: "gemini-cli release-confidence.md: the post-publish smoke test as documented"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/docs/release-confidence.md#L40-L47"
    author: "gemini-cli (Google)"
    note: "the workflow it names, smoke-test.yml#L3-L41, runs on pushes to main and release/** against the bundle built there."
---

## Why

The tests run against the workspace: they import sources, find dependencies the monorepo hoists, and call tools on
the runner's PATH. A user gets something else: a tarball with its own file list, a compiled binary with its assets
bundled in, a signed archive, and a pointer (`latest`, `stable`, an install script) that says which version to fetch.
Each can be broken while every test passes: a file left out of the tarball, an import that resolves only because the
workspace hoists it, an x64 library embedded in an ARM64 binary, an unsigned copy in one of four archives, a version
string that differs from the tag. opencode: "Bun once bundled the WebSocket server away, so every upgrade failed only
in the compiled binary."

Once the pointer moves, users install what it names, and moving it back does not help them: opencode: "rolling the
dist-tag back does not repair an install that already failed". This loop checks the bytes that will ship before the
pointer moves, and moves it last. A running service's checks are
[health-checks-smoke](../health-checks-smoke/card.md); this loop is for what users install.

## How it works

The release job runs these steps in order. A red step stops the release before any channel moves; a re-run continues
from where it stopped.

1. **The commit passed CI.** Before building, check that the tag points at a commit on the main branch whose required
   checks passed: pi's package publisher looks both up for a tag and refuses with "CI for <tag> did not pass; not
   releasing it". Codex's release checks the tag's format and that it equals the version in `Cargo.toml`, and nothing
   about the commit.
2. **Build once, record the digests.** Build every asset once and write its sha256 to a `SHA256SUMS`; every later step
   checks these bytes against it and nothing rebuilds. pi builds its binaries from the release's source tarball, so the
   published source is proven to build too.
3. **Compare with the reviewed spec.** For each asset: its file list, no file missing and none unexpected (pi prints
   `{ missing, unexpected }` from `npm pack --dry-run`); the version it reports, equal to the tag; for a binary, its
   architecture, signature and entitlements. Check every form it ships in: Codex runs one function (`lipo
   -verify_arch`, `codesign --verify --strict`, a `diff -u` of the entitlements against the reviewed plist) on the
   signed binary, on its copies inside the `.tar.gz`, the `.zst` and the package archive, and again inside the mounted
   DMG. For a target no runner executes, check the bytes: opencode finds every PE, ELF and Mach-O header in a compiled
   file, the libraries embedded in it included, and fails with "<file> must contain only <arch> code, but has
   <format> <arch> at byte <offset>", because "2.0.27's ARM64 Windows CLI embedded an x64 rust_pty.dll and could not
   open a terminal". A Linux binary's highest `GLIBC_` symbol version stays at or below the oldest the project
   supports (opencode: 2.30).
4. **Install it alone and run it.** Install the packed artifact into an empty directory, with a throwaway HOME and
   install scripts off, and run what only the build can break: `--version` equal to the tag, `--help`, and a smoke
   through the bundled parts (a request to a fake model server, the embedded web UI, an authenticated route, the
   sandbox). Prove the test ran the artifact: pi fails when an internal package "did not resolve from a local
   artifact"; Codex asserts that the imported SDK lies inside the installed package, and stops when the runner has its
   own tools: "Host rg (or bwrap on Linux) is on PATH; CI must use packaged tools." gemini-cli runs its whole
   integration suite against the installed binary.
5. **Publish without moving a channel.** Upload under a staging tag (gemini-cli: `--tag staging-tmp`), as a draft
   release, or to a path that never changes once written: opencode serves `bin/<version>/` as `immutable`, and pi
   names each catalog revision by the sha256 of its content. Dependencies go first: Codex publishes the platform
   packages before the wrapper because "The root wrapper advances @openai/codex@latest as soon as it publishes".
6. **Verify from the registry.** Poll until the registry serves each version with its exact file set, then install
   from the registry and repeat step 4. opencode polls each dependency every 10 s, up to 180 tries, before it publishes
   what installs it; pi checks version, integrity and a tarball request every 5 s for up to 10 minutes; Codex polls
   PyPI 30 times, 10 s apart, until the files equal the expected set, and reads back each mirrored object's size and
   sha256.
7. **Move the pointer last, and only forward.** All publishers take one lock (Codex: "out-of-order builds cannot roll
   back GitHub, npm, R2, or the canary branch"). A pointer moves only to a higher version, by compare-and-swap, so a
   slow older run cannot move it back (pi's test: "does not regress an existing newer release marker"); an older
   version gets a tag of its own (Codex: `release-<version>-<tag>`). The pointer is written after everything it names,
   in one write: pi creates the release before it moves refs, "so `latest` never points at a commit whose release
   failed", and uploads a bundle's manifest and a catalog's index last ("The manifest goes last, so a build whose
   manifest exists is complete."); opencode records a release "in one request", so a cancelled run leaves only files
   nothing points at.

A re-run of the same version skips what is published and finishes the rest, from the same bytes: when the build's
artifact has expired, pi fails with "The CI artifact expired; re-run CI to publish this commit" instead of building
in the publisher. A published release is never changed (pi: "Refusing to mutate a public release."); a failure before
step 7 deletes the draft.

## Set up

- **The spec in the repository, reviewed**: the expected assets and packages, each one's file list, the entitlements
  per binary, the architecture and the libc ceiling per target. Its tests run in a required job: Codex pins its
  entitlement plists in a test that only an advisory job runs.
- **A cheap version on every PR.** gemini-cli packs the CLI in each test job, moves the tarball to an empty directory
  and runs `npx "./$TARBALL" --version`; pi fails a commit on "<file>:<line>: <specifier> is not declared in
  <package>'s runtime dependencies". A broken file list shows on the PR, not on release day.
- **Every check required by name.** The final job runs `if: always()` and requires `success` from each build and
  verify job, as Codex's release job does; `skipped` passes only where a recorded setting skipped it. A smoke no release
  path calls does not count: Codex's package smoke runs only in a job behind a repository variable, and the action
  that would run it on every release is called by no workflow.
- **No skip that moves a channel.** gemini-cli skips the verification on a dry run or with `force-skip-tests`, a manual
  nightly defaults that input to true, and the publish then moves the channel tag all the same. A run that skips a step
  may publish under the staging tag; it never moves a channel.
- **Every attached asset checked.** gemini-cli attaches macOS binaries to its releases that only an "exists" check has
  seen; opencode's windows-arm64 Node build skips both smokes and relies on the byte check. `run` names how each asset
  was checked, and "exists" alone is red.
- **`run`** prints one line per asset and step, `<asset>: <step>: <status>`: `pi-linux-x64.tar.gz: version: ok
  (1.4.2)`, `cli-windows-arm64.exe: arch: fail (PE x64 at byte 1048576)`, `@scope/cli@1.4.2: registry: timeout after
  1800s`, `latest: pointer: kept (1.5.0 is newer)`. It exits non-zero on any status but `ok`, `kept` and `already
  published`.
- **Cases.** Must fire: a tarball missing the file its `main` names; an import of an undeclared package that the
  workspace hoists; a binary whose `--version` differs from the tag; an archive holding an unsigned copy of a signed
  binary; an executable embedding a library of the other architecture; a run with skip-tests that would move a
  channel; a smoke job the release does not require; a post-publish check that runs the workspace's binary instead of
  the registry's; an older version that would move `latest`. Must pass: the last release's assets; a re-run of a
  half-published release, which skips what is published and finishes; an older patch release, published under its own
  tag with `latest` left alone.
- **Wiring.** A required part of the release workflow, on every tag and every dispatch. The spec and the checks sit in
  the release path under its code owners ([release-trust-boundary](../release-trust-boundary/card.md)), so the change
  that breaks an artifact cannot relax its check. The agent reads the result through `ci`; it does not run the release.

## Notes

- A promised check is not a check. gemini-cli's release doc says a smoke test runs "After a release is published to
  npm" with `npx -y @google/gemini-cli@<tag> --version`; the workflow it names runs on pushes to `main` and
  `release/**`, against the bundle built from the branch. The check after publication is a step of the release.
- A failed run must not shift later versions: gemini-cli computes the next version only from versions with a git tag,
  logging "Ignoring version … because it lacks a git tag (likely a failed release)".
- Manifests that name assets (an installer's config, a DotSlash file, a formula) are tested against a recorded real
  release's asset list: Codex keeps one as a fixture, and dropping one asset reports exactly the platform it breaks.
- A container image follows the same order: gemini-cli builds it for one architecture with `--load`, runs `gemini
  --version` and parses the installed manifests inside it, and only then builds and pushes both architectures.
- A publication started by another release's run re-checks what that run claims:
  [release-trust-boundary](../release-trust-boundary/card.md). Carrying a fix to a shipped line is
  [patch-backport](../patch-backport/card.md); it ends in these steps.
