---
id: changelog-audit
title: "Changelog audit before a release"
summary: "Before a release, every commit since the last tag is matched to an entry in the changelog of the package it changed, and a check fails when a released section differs from its tag."
sensor: computational
ilities: [deployability, compatibility]
places: [delivery/release, remediation/release, maintenance/release]
stages: [ci, task]
speed: [seconds, minutes]
needs: []
agent: [reviewer]
related: [api-breaking-changes]
links:
  - title: "check-released-changelogs.mjs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/check-released-changelogs.mjs"
    author: "pi (earendil-works)"
    note: "released sections compared with the newest release tag."
  - title: "/cl: audit changelog entries before release (a prompt template)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.pi/prompts/cl.md"
    author: "pi (earendil-works)"
---

## Why

Users of a library learn what changed from its changelog, and a breaking change without an entry breaks them without
warning. An agent writes entries as it goes, but a commit can land without one, an entry can land in the wrong
package, and a branch merged after a release can put its entry under the released version: the merge anchors on the
lines around the entry, which the release left under `## [x.y.z]`. Before a release, each commit is matched to its
entry, and the released sections are compared with what was released.

## How it works

Two checks:

1. **Released sections are fixed.** A script compares every released section of each package's changelog with the
   same file at the newest release tag. A difference fails with the changed lines and the fix: "Released sections
   are fixed. Move new entries to ## [Unreleased] and restore the rest as in the tag."
2. **Every commit has its entry.** For each commit since the last tag, a reviewer finds the packages it changed
   (`git show <hash> --stat`) and looks for an entry under `## [Unreleased]` in each. It skips changelog updates,
   doc-only changes, release housekeeping, and regenerated files with no change users see. A change in a lower-level
   package that users see needs an entry in the user-facing package's changelog too. The reviewer lists the commits
   without entries and the entries to copy, and the working agent adds them.

## Set up

- **One changelog per package**, with `## [Unreleased]` and fixed subsections: Breaking Changes, Added, Changed,
  Fixed, Removed.
- **The released-sections check in CI**, after fetching the newest tag. Pi runs it in CI and not in `npm run check`,
  because it needs the tag.
- **The audit as a prompt template** that runs before every release, such as pi's `/cl`, with the skip rules and the
  cross-package rule written in it.
- **Attribution in each entry**: the issue link for internal work; the PR and its author for an outside contribution.
- **`run`** runs the released-sections check, then prints the reviewer's findings, one line per commit:
  `<hash> <subject>: no entry in <package>` or `<hash> <subject>: copy to <package>`. It exits non-zero when a
  released section differs from the tag. The reviewer's findings make it exit non-zero only once the reviewer is
  `gate` in `superloops/agents.yaml`.
- **Cases.** Must fire: a changelog with a new entry under the newest released heading; a commit that changes a
  package with no entry under its `[Unreleased]`. Must pass: the changelogs as at the newest tag, plus a new entry
  under `[Unreleased]` for each changed package.
- **Wiring:** the released-sections check in the CI job of every pull request, after it fetches the newest tag; the
  audit at the start of the release job, or as the prompt a release starts with.

## Agent step

The auditor is a reviewer. It gets the commits since the last tag and the `[Unreleased]` sections, and returns
Findings: a commit without an entry, or an entry missing from the user-facing package. The script needs no agent and
may block at once; the reviewer's findings block only once it is calibrated
([agent-calibration](../agent-calibration/card.md)).
