---
id: garbage-collection
title: "Garbage collection"
summary: "On a schedule, background agents find code that breaks the repository's \"golden principles\" and open small PRs to fix it. At OpenAI most took under a minute to review and merged automatically."
sensor: inferential
ilities: [maintainability]
places: [maintenance/entry, maintenance/work]
stages: [scheduled]
speed: [minutes, hours]
needs: []
agent: [worker, reviewer]
related: [taste-invariants, sample-audit, agent-code-review, behaviour-invariance]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Claude Code GitHub Actions: run on a schedule"
    url: "https://code.claude.com/docs/en/github-actions#run-on-a-schedule"
    author: "Anthropic"
  - title: "check-bot-scope.yml: a bot branch may change only its one file"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/check-bot-scope.yml#L25-L63"
    author: "opencode (anomalyco)"
  - title: "validate.sh: the exact shape the bot may publish"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/nix-hashes/validate.sh#L1-L27"
    author: "opencode (anomalyco)"
  - title: "publish.sh: trusted scripts, auto-merge, the bot closes its own stale pull request"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/nix-hashes/publish.sh#L1-L64"
    author: "opencode (anomalyco)"
    note: "\"Uses git, gh and jq only; never runs repository code.\""
---

## Why

Code that breaks the golden principles piles up, and cleaning it up by hand took OpenAI every Friday. Background
agents on a schedule do that cleanup instead and open one small PR per finding, so each fix is quick to review. The
golden principles are written down in the repository, so the agents and whoever reviews their PRs judge code by the
same principles.

## How it works

1. On a schedule, a worker takes one golden principle, finds code that breaks it, and opens one small PR per finding.
2. The project's loops run on the PR as on any other, and a reviewer agent judges whether the PR does only what the
   principle asks.
3. A PR that passes merges automatically. One that does not waits for a person.

At OpenAI, most of these PRs took under a minute to review and were merged automatically.

## Set up

- **The golden principles**, in one file, such as `docs/golden-principles.md`: for each, an id, the rule in one line,
  and a short example of code that breaks it and of code that keeps it. A principle a lint can check moves to
  [taste-invariants](../taste-invariants/card.md) and leaves the list: a lint is cheaper and gives the same answer
  every time.
- **A score per principle**, in a file the worker updates on each run (OpenAI's repository has a `QUALITY_SCORE.md`):
  how many violations of each principle the last run found, so the trend shows whether cleanup keeps ahead.
- **What may merge on its own.** A PR fixes one principle, changes under 100 lines, keeps every test's expected value
  and every public API, its CI is green, and the reviewer passes it. Anything else waits for a person. A PR still open
  after a week is closed by the next run, and its finding is listed for a person in the score file.
- **A scope check per bot branch, for what merges with no review.** A bot whose pull request merges on its own gets
  a required check that holds its branch to its one job. opencode's hashes bot may change only `nix/hashes.json`:
  on `bot/nix-hashes` the check fails with `bot/nix-hashes may change only nix/hashes.json` when the diff holds any
  other file, then validates the file's exact shape (three systems, each an SRI hash, under 4096 bytes, in canonical
  form). The bot's publishing step runs only scripts from the trusted commit and "never runs repository code"; it
  closes its own pull request when the base branch already has the change, and only a pull request from the same
  repository counts as the bot's, since "a fork can use the same branch name".
- **The `run`** prints the reviewer's Verdict for each open PR of the loop, one line per PR, `<PR>: merge` or
  `<PR>: wait (<reason>)`. It exits non-zero for any `wait`, but only once the reviewer is calibrated; until then it
  prints the verdicts and exits 0, and every PR waits for a person.
- **Cases** for the reviewer's evals. Must fire: a cleanup PR that also changes a test's expected value; a PR that
  fixes two principles at once; a PR that renames a public function. Must pass: a one-principle PR of 30 lines with
  the tests untouched.
- **Wiring.** A scheduled CI job runs the worker, such as the Claude Code GitHub Action with a `prompt` on a `cron`
  schedule. The worker opens PRs and never merges: the merge belongs to branch protection, which requires CI and the
  reviewer's check. A PR that touches the principles file, the reviewer's prompt or the CI config never merges on its
  own.

## Notes

- Before this loop, OpenAI spent every Friday (20% of the week) cleaning up "AI slop" by hand.
- A person samples what merged without them ([sample-audit](../sample-audit/card.md)); each mismatch becomes an eval
  case for the reviewer.

## Agent step

A worker on a schedule finds code that breaks one golden principle and opens one small PR per finding. A reviewer,
not the worker, judges each PR before it merges and returns a Verdict; it gets the PR's diff and the principle, never
the worker's reasoning. The worker never merges its own PRs. The reviewer may block a merge only after it has been
calibrated ([agent-calibration](../agent-calibration/card.md)).
