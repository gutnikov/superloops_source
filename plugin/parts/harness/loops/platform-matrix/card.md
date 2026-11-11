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

- The matrix multiplies the cost of CI by the number of combinations. Run the full matrix on PRs and on main; while
  the agent works, it runs one combination locally ([ci-clean-infra](../ci-clean-infra/card.md) covers the limit on
  CI rounds).
