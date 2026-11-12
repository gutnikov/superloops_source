---
id: patch-backport
title: "Patch a shipped release from a merged fix"
summary: "/patch on a merged PR cherry-picks it onto the shipped tag, opens a PR that cannot merge with conflicts, tests it, checks the base and version did not move, publishes and reports each step on the PR."
sensor: computational
ilities: [deployability, correctness]
places: [remediation/release, maintenance/release]
stages: [ci]
speed: [minutes, hours]
needs: [ci]
related: [shipped-artifact-check, release-trust-boundary, risky-action-gates, reproduction-gate, human-diff-review, changelog-audit, backup-restore-rollback]
links:
  - title: "gemini-cli release-patch-0-from-comment.yml: the /patch comment"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-patch-0-from-comment.yml#L11-L157"
    author: "gemini-cli (Google)"
    note: "the dispatch action's permission: 'write', later steps gated only on the comment text and the PR state, unknown arguments read as both channels, runs matched by time."
  - title: "gemini-cli release-patch-1-create-pr.yml: one run per channel, in the prod environment"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-patch-1-create-pr.yml#L44-L135"
    author: "gemini-cli (Google)"
  - title: "gemini-cli create-patch-pr.js: release branch from the shipped tag, conflicts committed, the [CONFLICTS] PR"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/releasing/create-patch-pr.js#L57-L223"
    author: "gemini-cli (Google)"
  - title: "gemini-cli patch-create-comment.js: Step 2/4 on the original PR"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/releasing/patch-create-comment.js#L134-L329"
    author: "gemini-cli (Google)"
  - title: "gemini-cli patch-trigger.js: dry run read from the PR body"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/releasing/patch-trigger.js#L100-L130"
    author: "gemini-cli (Google)"
  - title: "gemini-cli release-patch-3-release.yml: the version computed twice, tests, publish"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-patch-3-release.yml#L94-L183"
    author: "gemini-cli (Google)"
  - title: "gemini-cli release-patch-3-release.yml: the failure issue and the comments"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-patch-3-release.yml#L207-L260"
    author: "gemini-cli (Google)"
  - title: "gemini-cli get-release-version.js: the patch version from the channel's npm version"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/get-release-version.js#L404-L450"
    author: "gemini-cli (Google)"
  - title: "gemini-cli patch-comment.js: Step 4/4, complete, concurrent or failed"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/releasing/patch-comment.js#L130-L197"
    author: "gemini-cli (Google)"
  - title: "gemini-cli ci.yml: CI on pull requests into release/**"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/ci.yml#L3-L11"
    author: "gemini-cli (Google)"
  - title: "gemini-cli releases.md: patching, code-owner review, the recovery commands"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/docs/releases.md#L190-L342"
    author: "gemini-cli (Google)"
    note: "the recovery for a hotfix branch with outdated workflows passes force_skip_tests=true, \"most common case\" included."
  - title: "slash-command-dispatch main.ts: a user below the permission is logged and skipped"
    url: "https://github.com/peter-evans/slash-command-dispatch/blob/40877f718dce0101edfc7aea2b3800cc192f9ed5/src/main.ts"
    author: "Peter Evans"
    note: "core.info and return, no failure: the step succeeds; the version gemini-cli pins."
  - title: "Workflow syntax: on.workflow_dispatch.inputs"
    url: "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onworkflow_dispatchinputs"
    author: "GitHub"
    note: "\"the inputs context preserves Boolean values as Booleans instead of converting them to strings\"."
  - title: "Evaluate expressions in workflows and actions: operators"
    url: "https://docs.github.com/en/actions/reference/workflows-and-actions/expressions"
    author: "GitHub"
    note: "\"If the types do not match, GitHub coerces the type to a number\": a string that is not a number becomes NaN, false becomes 0."
---

## Why

A fix merged to main reaches users with the next release, together with everything else merged since. When the shipped
version needs the fix now, someone carries it over by hand: checks out the tag, cherry-picks, resolves conflicts, bumps
the version, publishes. Each step can go wrong without a red check: the cherry-pick conflicts, or applies cleanly and
behaves differently on the older code; a conflict marker is committed; two patches take the same version, or the
second is built from a tag the first already replaced and ships without the first fix; the publish fails and the person
who asked never hears. This loop turns the backport into a chain of checked steps, started from the merged PR and
reported back to it.

## How it works

1. **Request.** A comment `/patch`, `/patch stable` or `/patch preview` on a merged PR. An unmerged PR gets gemini-cli's
   ":x: The `/patch` command failed. This pull request must be merged before a patch can be created." An argument the
   parser does not know is refused with the forms it accepts; gemini-cli reads any other text after `/patch` as both
   channels, so `/patch stabel` patches preview too.
2. **Approval.** One run per channel waits for a person to approve the release environment
   ([risky-action-gates](../risky-action-gates/card.md)). The commenter's write permission is checked by the step that
   dispatches, and a refusal fails it. gemini-cli sets `permission: 'write'` on its slash-command action, which for a
   user below it only skips its own dispatch and succeeds; the workflow's next steps check only that the comment starts
   with `/patch` and the PR is merged, so the `prod` environment's approval is the only gate.
3. **Cherry-pick onto the shipped tag.** A release branch from the channel's current tag, a hotfix branch from it, the
   cherry-pick. On a conflict, commit the markers and open the PR anyway, titled "[CONFLICTS]", with "Do not merge this
   PR until conflicts are resolved". A title does not stop a merge: a required check that fails on a conflict marker in
   the diff (`<<<<<<< `, `=======`, `>>>>>>> ` at the start of a line) does. The PR runs the full CI and needs a code
   owner's review. The agent may resolve the conflicts on that branch; the person who merges reviews the resolution.
4. **Release on merge.** Merging the hotfix PR starts the release, which waits for approval again, then:
   - **checks that nothing moved:** the channel's current tag is still the tag the branch was cut from, and the version
     to publish does not exist yet. gemini-cli computes the version twice, back to back, before the tests ("❌ RACE
     CONDITION DETECTED: Version calculations have changed!"), which catches only a release within those seconds. It
     derives the version from the channel's latest npm version while the code comes from the tag the branch was cut
     from, so a second patch cut from the same tag, released after the first, passes and ships without the first fix.
     Compare the base tag, and check both again right before the publish;
   - runs the full test suite on the patched code, then the steps of
     [shipped-artifact-check](../shipped-artifact-check/card.md), which move the channel last.
5. **Status on the request.** Each step comments on the original PR with its number: "[Step 2/4] Patch PR Created!",
   with "Resolve conflicts" when there were any; "[Step 4/4] Patch Release Complete!"; or the failure, with the run's
   link and what to do next. A failure files an issue, and the comment links that issue.

## Set up

- **A comment workflow, a release workflow, protected release branches.** The release branches need a code owner's
  review; the release workflow runs from the main branch, not from the shipped tag's older copy of it, under
  [release-trust-boundary](../release-trust-boundary/card.md).
- **Dry run is an input, carried through the chain.** gemini-cli's trigger treats a hotfix PR whose description
  contains "[DRY RUN]" as a dry run, so an edit to the description decides whether the patch publishes.
- **A recovery path is a path to production.** gemini-cli's docs answer a hotfix branch with outdated workflow files
  with a manual trigger that passes `force_skip_tests=true`, the example marked "most common case" included, which
  skips the patch's test suite. A recovery runs the same checks, or publishes under a staging tag only.
- **The failure alert fires.** gemini-cli files the failure issue under `failure() && github.event.inputs.dry_run ==
  false`. `github.event.inputs` holds dispatch inputs as strings, and GitHub compares a string with a boolean as
  numbers, `'false'` becoming `NaN` and `false` becoming 0, so the issue is never filed, while the failure comment tells
  the author "The maintainers have been notified via automatic issue creation". Compare `inputs.dry_run`, which stays a
  boolean, and keep a case that injects a failure.
- **`run`** reads one patch's runs and prints one line per step, `<step>: <status>`: `request: ok (#1234, stable)`,
  `cherry-pick: conflicts (2 files)`, `markers: fail (docs/usage.md:41)`, `base: fail (v0.5.3 is no longer the stable
  tag; v0.5.4 is)`, `tests: ok`, `publish: ok (0.5.5)`, `comments: 4 of 4`. It exits non-zero on a failed step, and
  on a step missing after a merge.
- **Cases**, each in a scratch repository with a fake registry. Must fire: `/patch` on an unmerged PR; `/patch stabel`;
  `/patch` from a user without write access; a conflict PR merged with markers left in a file the build does not read;
  a second patch cut from the same tag after the first was published; another release of the channel during the
  tests; "[DRY RUN]" added to a hotfix PR's description; an injected failure in a real run, which must file the issue
  and link it in the comment; the recovery path with tests skipped. Must pass: a clean cherry-pick onto the current
  tag, released with all four comments; a dry run, which publishes nothing and says so.
- **Wiring.** The chain runs in CI; the agent's part is the hotfix branch when it conflicts, and it reads each step's
  result through `ci` and the PR's comments.

## Notes

- A patch to two channels is two runs, each with its own branch, version and comments; one failing does not stop the
  other.
- Several fixes in one patch: push more cherry-picks to the hotfix branch before it merges, as gemini-cli's docs
  describe. The base check still applies.
- gemini-cli finds the runs it dispatched by their start time ("Within last 15 seconds") to link them on the PR, so two
  `/patch` comments close together can link each other's runs. Pass an id in the dispatch inputs and find the run by
  it.
- A fix that applies cleanly can still fail on the older code: the tests that came with the fix travel with the
  cherry-pick, and the patch's CI runs them against the shipped line ([reproduction-gate](../reproduction-gate/card.md)).
