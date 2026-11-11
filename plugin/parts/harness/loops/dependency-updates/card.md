---
id: dependency-updates
title: "Dependency updates"
summary: "Renovate or Dependabot opens a PR; the agent runs the sensors and fixes what broke. A script collects the age and activity of the dependencies, and an LLM writes recommendations."
sensor: computational
ilities: [compatibility, maintainability]
places: [maintenance/entry, maintenance/work]
stages: [scheduled, ci]
speed: [minutes]
needs: [ci]
agent: [worker]
related: [dependency-scanning-sbom, behaviour-invariance, ci-clean-infra]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Birgitta Böckeler"
    note: "the dependency freshness report: a script first, then an AI report with recommendations."
  - title: "Configuration Options"
    url: "https://docs.renovatebot.com/configuration-options/"
    author: "Renovate"
  - title: "Dependabot options reference"
    url: "https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference"
    author: "GitHub"
---

## Why

A bot's update PR that turns red waits for a person, and while it waits the dependency stays old. This loop catches
those red PRs: an agent started on the PR fixes what the update broke. The script's data on the age and activity of
each dependency gives the recommendations facts to work from.

## How it works

The loop has two parts:

- **Red update PRs.** Renovate or Dependabot opens an update PR, and CI runs the project's sensors on it. When a check
  fails, a worker agent starts on the PR: it reads the failures and the dependency's changelog, adapts the code to
  the new version, and pushes to the bot's branch. The loops on the PR decide; a green update PR needs no agent.
- **The freshness report.** On a schedule, a script collects for each dependency the version used, the latest
  version, how far behind the used one is, and the date of the project's latest release. An agent writes
  recommendations from that data: what to upgrade, what is deprecated, what to replace.

## Set up

- **The bot's config is in the repository**, `renovate.json` or `.github/dependabot.yml`, with a schedule and a label
  on every PR it opens (both support `labels`). Dependabot `groups` puts packages that move together into one PR.
- **Start the worker on red bot PRs.** A CI job starts the worker when a check fails on a PR with the bot's label.
  Give it 3 rounds per PR; after the third, it comments on the PR with what it tried, and a person takes it.
- **The update must not change behaviour.** The gate of the PR is
  [behaviour-invariance](../behaviour-invariance/card.md): a fix that changes an expected value fails it, so the
  worker cannot make an update pass by changing what the tests expect.
- **Merge green patch and minor updates automatically.** Renovate's `automerge` merges a PR once its status checks
  are green. Turn it on for patch and minor updates, and leave major updates to a person's review: they are where
  the behaviour of a dependency changes on purpose.
- **The freshness limits are a project decision**, written in the loop's `LOOP.md`. Start with: more than one major
  version behind, or no release of the dependency's project in 24 months.
- **`run`** is the freshness check over the lockfile in the directory. It prints one line per dependency over a
  limit, `<package>: <used> → <latest>, last release <date>`, and exits non-zero when there is any.
- **Cases.** The registry data is recorded in the case, so the case does not change with time. Must fire: a lockfile
  with a dependency two major versions behind; a dependency whose last release is older than the limit. Must pass: a
  lockfile at the latest versions.
- **Wiring.** The bot runs on its schedule; a CI job starts the worker on red bot PRs; a scheduled job runs the
  freshness check and the agent's report, and the report goes to [triage](../triage/card.md) as an issue.

## Notes

- Böckeler's "Dependency freshness report" "runs a script first to get the age and activity of the library
  dependencies, and then has AI create a report with recommendations about potential upgrades, deprecations, etc".
- A CVE in a dependency comes through [dependency-scanning-sbom](../dependency-scanning-sbom/card.md), which can open
  the same kind of update.

## Agent step

A worker takes a red update PR with the logs of its failed checks and the dependency's changelog, and pushes commits
to the bot's branch that adapt the code to the new version. The same kind of worker writes the freshness
recommendations from the script's data, one per dependency with the numbers it rests on. It never merges and never
opens a major upgrade on its own; the loops on its PR decide whether to merge.
