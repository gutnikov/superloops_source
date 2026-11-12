---
id: platform-matrix
title: "Platform matrix"
summary: "CI runs the tests on several operating systems, runtimes and browsers. The agent sees which exact combination failed and fixes it."
sensor: computational
ilities: [compatibility, deployability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [minutes]
needs: [ci]
related: [ci-clean-infra, e2e-browser, shipped-artifact-check]
links:
  - title: "Running variations of jobs in a workflow"
    url: "https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations"
    author: "GitHub"
  - title: "Playwright: Projects"
    url: "https://playwright.dev/docs/test-projects"
  - title: "gh run view"
    url: "https://cli.github.com/manual/gh_run_view"
    author: "GitHub"
  - title: "test_environment.rs: where a test's commands run"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/common/test_environment.rs#L40-L45"
    author: "Codex (OpenAI)"
    note: "local, a Docker container running the exec server, or a Windows exec server under Wine."
  - title: "defs.bzl: a Wine variant of each integration test"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/defs.bzl#L294-L296"
    author: "Codex (OpenAI)"
  - title: "lib.rs: the skip macros"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/common/lib.rs#L644-L661"
    author: "Codex (OpenAI)"
  - title: "rust-ci-full.yml: the remote-environment job after merge"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/rust-ci-full.yml#L496-L510"
    author: "Codex (OpenAI)"
  - title: "bazel.yml: arm targets disabled, with a date and a reason"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/bazel.yml#L37-L42"
    author: "Codex (OpenAI)"
  - title: "gemini-cli ci.yml: the CI aggregator accepts skipped"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/ci.yml#L486-L519"
    author: "gemini-cli (Google)"
    note: "the skipper, #L34-L54; test_mac continue-on-error, #L238-L248."
  - title: "gemini-cli release-confidence.md: tests must pass on Linux and macOS"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/docs/release-confidence.md#L18-L24"
    author: "gemini-cli (Google)"
  - title: "opencode check-process-daemon.yml: the runner's architecture, the test run alone"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/check-process-daemon.yml#L135-L183"
    author: "opencode (anomalyco)"
  - title: "sandcastle ci.yml: fail, not skip, in CI"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/ci.yml#L37-L46"
    author: "sandcastle (Matt Pocock)"
  - title: "sandcastle releasing.md: what CI cannot run"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/docs/agents/releasing.md#L8-L21"
    author: "sandcastle (Matt Pocock)"
    note: "the release PR's title is in release.yml#L34-L41."
---

## Why

Tests that pass in one place show only that one combination of operating system, runtime and browser works. A
failure on another combination stays hidden until someone runs the code there. The matrix catches these failures.

## How it works

CI runs the tests once for each combination, as a separate job: a GitHub Actions matrix strategy can "automatically
create multiple job runs that are based on the combinations of the variables". When a job fails, its name tells the
agent the operating system, runtime and browser. The agent reads the failing steps' log with
`gh run view <run-id> --log-failed`, reproduces the failure locally when it can (a browser it has, a runtime it can
install), fixes the code and pushes. A combination it cannot run locally, such as another operating system, it
checks by pushing.

## Set up

- **The matrix is a support policy.** The project decides which operating systems, runtime versions and browsers it
  supports, and writes them in the CI config: the versions it declares (`engines`, `python_requires`), not every
  version there is. Start with the oldest and the newest supported runtime on each supported operating system, and
  add a version in between once a failure shows only there. A supported combination's job is never
  `continue-on-error`; gemini-cli's macOS job is, while its release doc says tests "must pass on Linux and macOS".
- **Run every combination to the end.** With `fail-fast: true`, "If any of the jobs with `continue-on-error: false`
  fail, all jobs that are in progress or queued will be cancelled." Set `fail-fast: false`, so that one run shows
  every combination that fails: a fix for one may not be the fix for the others.
- **Browsers through Playwright projects.** One project per browser (chromium, firefox, webkit) in
  `playwright.config.ts`, each with a preset from `devices`, such as `use: { ...devices['Desktop Chrome'] }`. The
  agent reruns one browser locally with `npx playwright test --project=firefox`.
- **Where the code runs is an axis too.** When the product runs commands somewhere other than its own process, in a
  container, on a remote host or on another OS, the same suite runs against each. Codex's integration tests take
  the environment as a setting, `Local`, `Docker` or `WineExec`: after merge they run against an exec server in a
  container, and each has a `-wine-exec-test` variant that runs a Windows exec server under Wine on a Linux runner, a
  Windows signal on every pull request without a Windows runner; a native Windows job stays as the confirmation.
- **A skip is counted, not passed.** A test that cannot run in a combination prints why and returns: Codex's macros
  print `Skipping test in <environment>: <reason>`, and the test counts as a pass. `run` counts skips per combination
  from those lines, and fails when a combination skips more tests than it did on the main branch, or runs none. A
  suite that proves one platform fails when it cannot run there: sandcastle's containment suite "fails,
  rather than skips, when CI is set and bwrap can't run". A combination taken out because it flakes is commented out
  with the date and the reason, as Codex's arm targets are ("2026-02-27 Bazel tests have been flaky on arm in CI"),
  and getting it back is an item.
- **What CI cannot run, the release waits for.** sandcastle titles its release PR "Version Packages (run npm run
  test:local before merging)", and that local run fails on a missing engine: "a run that skipped an engine must not
  look like a pass". A target the matrix builds but cannot run gets its shipped bytes checked
  ([shipped-artifact-check](../shipped-artifact-check/card.md)).
- **The runner is what the name says.** A job checks its architecture before it tests (opencode: "Expected native
  <arch> runner, got <arch>"), and runs a Windows test executable copied alone, since "Cargo adds native library
  paths to PATH, which can hide accidental DLL dependencies".
- **Names carry the combination.** Put the matrix values in each job's name and in the name of the test report it
  uploads, so the failing combination shows in the list of checks.
- **One aggregator job is the required check**: `if: always()`, it needs every combination and fails unless each is
  `success`; `skipped` counts only when the skip decision itself succeeded. gemini-cli's `CI` job accepts `skipped`
  from any job, so when its skipper job fails, every test is skipped and `CI` prints "All CI jobs passed!".
- **`run`** reads the reports of one CI run, one per combination, and prints one line per combination,
  `<os> / <runtime> / <browser>: <status>`: `passed`, `failed (<n> tests)` with the first failing test as
  `file:line: message`, `missing` for a combination whose job was cancelled, skipped or did not run, or
  `not gating` for one marked `continue-on-error`. It exits non-zero on anything but `passed`.
- **Cases** are recorded report directories. Must fire: one combination with a failing test (a path joined with `\`,
  which works only on Windows, say); a combination missing from the run; every combination skipped after the skip
  decision failed; a combination the support policy requires, marked `continue-on-error`; a job whose runner has
  another architecture. Must pass: every combination green.
- **Wiring.** The matrix runs on every PR, and its aggregator job is a required check on the protected branch.
  Dropping a combination changes the support policy: a PreToolUse hook denies the agent's writes to the workflow
  file, and a person approves such a change.

## Notes

- Codex runs a few combinations on each pull request and the full matrix only after merge (macOS, Linux and Windows
  on two architectures, four shards each). A combination that fails only after merge is an escape of the pull
  request's gate; record it as one, at the gate's phase.
- The matrix multiplies the cost of CI. Run it in full on PRs and on main; while it works, the agent runs one
  combination locally ([ci-clean-infra](../ci-clean-infra/card.md) limits the CI rounds).
