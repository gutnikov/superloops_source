---
id: dependency-updates
title: "Dependency updates"
summary: "A bot opens one PR per dependency; the agent runs the sensors and fixes what broke. A script collects the age and activity of the dependencies, and an LLM writes recommendations."
sensor: computational
ilities: [compatibility, maintainability]
places: [maintenance/entry, maintenance/work]
stages: [scheduled, ci]
speed: [minutes]
needs: [ci]
agent: [worker]
related: [dependency-scanning-sbom, third-party-extension-scan, behaviour-invariance, ci-clean-infra, config-validation]
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
  - title: "dependabot.yaml"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/dependabot.yaml#L5-L36"
    author: "Codex (OpenAI)"
    note: "a 7-day cooldown on each entry; the bun entry (L5-L10) names .github/actions/codex, which no longer exists, and the docker entry (L19-L24) a folder with no Dockerfile."
  - title: "dependabot.yml"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/dependabot.yml#L1-L41"
    author: "gemini-cli (Google)"
    note: "npm and GitHub Actions weekly, a 14-day cooldown, minor and patch grouped."
  - title: "bump-plugin-shas.yml: one PR per plugin, the cap"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/bump-plugin-shas.yml#L1-L26"
    author: "Anthropic"
  - title: "bump-plugin-shas.yml: release-only tracking and the dispatch of the required checks"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/bump-plugin-shas.yml#L60-L110"
    author: "Anthropic"
  - title: "bump tracking: enroll 8 constant-bumpers in releases-only (#4882)"
    url: "https://github.com/anthropics/claude-plugins-official/commit/7d48aaa124cc87605a7be242641fa115c48c28f5"
    author: "Anthropic"
  - title: "revert-failed-bumps.yml: the trigger on the batched branch"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/revert-failed-bumps.yml#L23-L55"
    author: "Anthropic"
    note: "head_branch == 'bump/plugin-shas'; the bump job has opened bump/<slug> branches since #2051."
  - title: "revert-failed-bumps.yml: a broken scan, the budget, the tamper check"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/revert-failed-bumps.yml#L74-L248"
    author: "Anthropic"
  - title: "nix.yml: the pin refreshed only when stale, built on three systems, then committed"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/nix.yml#L49-L189"
    author: "pi (earendil-works)"
  - title: "update-model-catalog-pin.mjs: the staleness test"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/update-model-catalog-pin.mjs#L91-L127"
    author: "pi (earendil-works)"
  - title: "check-process-daemon.yml: the Zig patch that checks its target"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/check-process-daemon.yml#L123-L132"
    author: "opencode (anomalyco)"
---

## Why

A bot's update PR that turns red waits for a person, and meanwhile the dependency stays old. Here an agent fixes what
the update broke, or a pin of code the project cannot change is dropped; a script's data on each dependency's age and
activity grounds the recommendations.

## How it works

- **Red update PRs.** Renovate, Dependabot or the project's bump job opens one PR per dependency, and CI runs the
  project's sensors on it. When a check fails, a worker agent reads the failures and the dependency's changelog,
  adapts the code and pushes to the bot's branch. A third-party payload pinned at a commit, such as a plugin, is not
  adapted: the failing entry is dropped and retried at its next version
  ([third-party-extension-scan](../third-party-extension-scan/card.md)). A green PR needs no agent.
- **The freshness report**, Böckeler's "Dependency freshness report". On a schedule, a script collects per
  dependency the version used, the latest, how far behind it is, and its project's latest release date; an agent
  writes recommendations from it: what to upgrade, what is deprecated, what to replace.

## Set up

- **The bot's config is in the repository** (`renovate.json`, `.github/dependabot.yml`), with a schedule and a
  label, and each entry names a directory with a manifest of its ecosystem. A dead entry updates nothing,
  silently: Codex's `bun` entry names `.github/actions/codex`, which no longer exists, and its `docker` entry a
  folder with no Dockerfile.
- **One PR per dependency**, or per `groups` of packages that must move together. Anthropic's plugin bump: "Failing
  entries stay isolated in their own PR; passing bumps merge independently".
- **A new release waits**: a version published minutes ago is the likeliest to be withdrawn or compromised. Codex's
  Dependabot `cooldown` is 7 days on Cargo, GitHub Actions and the Rust toolchain, gemini-cli's 14 on npm and Actions
  (Renovate: `minimumReleaseAge`). A security fix comes through
  [dependency-scanning-sbom](../dependency-scanning-sbom/card.md) instead.
- **A git pin that churns moves only to release tags**, and holds when there is no newer release or the lookup
  fails: Anthropic's churning plugins made "~50 bump PRs/30d between them, mostly repo churn that never touches the
  plugin".
- **A bot PR starts its required checks.** A PR opened with the workflow's own token starts no `pull_request`
  workflow, so the bump job dispatches each required one on each branch, tries them all, and fails naming the
  re-dispatch command if one failed: it skips a dependency with an open PR, so nothing else would retry it. It then
  confirms the checks reached the PR ([ci-clean-infra](../ci-clean-infra/card.md)).
- **A failing pin is dropped, within limits.** A step restores only the failing entries to the base branch's pin,
  and refuses when an entry differs from it in anything but the pin. A scan with no verdict, or a failed scan with
  no failing entry, is an "infra error, not a policy failure. Not reverting." It stops after 3 passes per PR,
  counted as commits rather than as comments anyone can post, commits only onto the head it read, and closes a PR
  whose every entry failed.
- **Every trigger in the chain has a must-fire case.** Anthropic's revert fires only on `bump/plugin-shas`; since
  bumps moved to `bump/<slug>` it never fires, and a failing bump PR stays open, blocking that plugin's later bumps
  (a plugin with an open PR is skipped) until a person acts. Keep the branch name in one place both jobs read.
- **A pin a bot owns moves only when stale, and after a build.** pi's bot keeps its Nix model-catalog pin while it
  builds main with the same `provider/type/api` groups as the live catalog; otherwise it checks the new revision's
  sha256, builds and smoke-tests on three systems, then commits to main.
- **A patch to a dependency checks its target.** opencode's patch to Zig's standard library throws "Zig alignment
  workaround no longer matches; re-evaluate it" when the text it replaces is gone.
- **The worker** starts from a CI job on a failed check of a PR with the bot's label; after 3 rounds it comments what
  it tried, and a person takes over. The gate is [behaviour-invariance](../behaviour-invariance/card.md): a fix that
  changes an expected value fails. Renovate's `automerge` merges green patch and minor updates; a major one waits
  for a person.
- **`run`** prints `<config>:<line>: <ecosystem>: no manifest in <directory>` per dead config entry, and
  `<package>: <used> → <latest>, last release <date>` per dependency over a limit of the loop's `LOOP.md` (start
  with: more than one major version behind, or no release in 24 months). It exits non-zero on any line.
- **Cases**, with the registry data recorded. Must fire: a dependency two majors behind; one with no release within
  the limit; a config entry whose directory is gone or holds no manifest. For the bump chain: the drop step on a
  failing scan of a branch named as the bump job names it now; one failed dispatch; a patch whose target is gone.
  Must pass: a lockfile at the latest versions; a scan that failed with no verdict, left alone by the drop step.
- **Wiring.** The bot runs on its schedule; CI jobs start the worker and the bump chain; a scheduled job runs the
  freshness check and the report, which goes to [triage](../triage/card.md) as an issue.

## Agent step

A worker takes a red update PR with its failed checks' logs and the changelog, and pushes commits that adapt the
code. The same kind of worker writes the freshness recommendations, each with the numbers it rests on. It never
merges, opens a major upgrade on its own, or patches a pinned third-party payload; the loops on its PR decide.
