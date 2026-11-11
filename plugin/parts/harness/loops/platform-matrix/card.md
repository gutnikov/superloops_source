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
related: [ci-clean-infra, e2e-browser]
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
  add a version in between once a failure shows only there.
- **Run every combination to the end.** With `fail-fast: true`, "If any of the jobs with `continue-on-error: false`
  fail, all jobs that are in progress or queued will be cancelled." Set `fail-fast: false`, so that one run shows
  every combination that fails: a fix for one may not be the fix for the others.
- **Browsers through Playwright projects.** One project per browser (chromium, firefox, webkit) in
  `playwright.config.ts`, each with a preset from `devices`, such as `use: { ...devices['Desktop Chrome'] }`. The
  agent reruns one browser locally with `npx playwright test --project=firefox`.
- **Where the code runs is an axis too.** When the product runs commands somewhere other than its own process, in a
  container, on a remote host or on another OS, the same suite runs against each. Codex's integration tests take
  the environment as a setting, `Local`, `Docker` or `WineExec`: a post-merge job runs them against an exec server in
  a Docker container, dumping the container's log on failure, and the build generates a `-wine-exec-test` variant of
  each test that runs a Windows exec server under Wine on a Linux runner. Wine gives a Windows signal on every pull
  request without a Windows runner; a native Windows job stays as the confirmation.
- **A skip is counted, not passed.** A test that cannot run in a combination prints why and returns: Codex's macros
  print `Skipping test in <environment>: <reason>`, and the test counts as a pass. `run` counts skips per combination
  from those lines, and fails when a combination skips more tests than it did on the main branch, or runs none. A
  combination taken out because it flakes is commented out with the date and the reason, as Codex's arm targets are
  ("2026-02-27 Bazel tests have been flaky on arm in CI"), and getting it back is an item.
- **Names carry the combination.** Put the matrix values in each job's name and in the name of the test report it
  uploads, so the failing combination shows in the list of checks.
- **`run`** reads the reports of one CI run, one per combination, and prints one line per combination,
  `<os> / <runtime> / <browser>: <status>`: `passed`, `failed (<n> tests)` with the first failing test as
  `file:line: message`, or `missing` for a combination whose job was cancelled or did not run. It exits non-zero on
  anything but `passed`.
- **Cases** are recorded report directories. Must fire: one combination with a failing test (a path joined with `\`,
  which works only on Windows, say); a combination missing from the run. Must pass: every combination green.
- **Wiring.** The matrix job runs on every PR and is a required check on the protected branch. Dropping a
  combination changes the support policy: a PreToolUse hook denies the agent's writes to the workflow file, and a
  person approves such a change.

## Notes

- Codex runs a few combinations on each pull request and the full matrix only after merge (macOS, Linux and Windows
  on two architectures, four shards each). A combination that fails only after merge is an escape of the pull
  request's gate; record it as one, at the gate's phase.
- The matrix multiplies the cost of CI by the number of combinations. Run the full matrix on PRs and on main; while
  the agent works, it runs one combination locally ([ci-clean-infra](../ci-clean-infra/card.md) covers the limit on
  CI rounds).
