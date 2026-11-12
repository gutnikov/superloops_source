---
id: knowledge-base-doc-lint
title: "Doc linters for the knowledge base"
summary: "CI checks that `docs/` and the skills the agent loads are current, cross-linked and correctly structured. The agent reads the errors CI reports and fixes the docs."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/entry, maintenance/work]
stages: [ci, scheduled]
speed: [minutes]
needs: []
related: [document-review, executable-docs, garbage-collection, skill-trigger-eval, guide-lift-eval]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "lychee"
    url: "https://github.com/lycheeverse/lychee"
    note: "a link checker; --offline checks only local files, exit code 2 on a broken link."
  - title: "test-skill-size.sh: a SKILL.md under the compaction cut"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/skill-size/test-skill-size.sh#L1-L31"
    author: "superpowers (obra)"
    note: "20,000 bytes; \"Move content the skill only needs sometimes into its references/ directory.\""
  - title: "test-no-dev-files-in-skills.sh: no pressure scenarios in an installed skill"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/skill-layout/test-no-dev-files-in-skills.sh#L1-L25"
    author: "superpowers (obra)"
  - title: "CLAUDE.md: the skill library's invariants, checked by no workflow"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/CLAUDE.md#L9-L21"
    author: "skills (Matt Pocock)"
  - title: "sandcastle CLAUDE.md: one term, one home, linked at its first mention"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/CLAUDE.md#L17-L27"
    author: "sandcastle (Matt Pocock)"
  - title: "docs-guide.test.ts"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/tests/docs-guide.test.ts#L146-L227"
    author: "sandcastle (Matt Pocock)"
---

## Why

When `docs/` is the main source of truth, a stale or broken document misleads every agent that reads it. Code
does not fail when the docs fall behind it, so no other check notices. The doc linters turn out-of-date, unlinked
or badly structured docs into errors the agent can fix.

## How it works

1. CI runs the doc linters on `docs/`, AGENTS.md and the skills on every PR, and on a schedule.
2. The linters report an error for each document that is out of date, not linked, or wrongly structured.
3. On a PR, the agent that made the change reads the errors and fixes the documents. On the schedule, each stale
   document becomes a maintenance item.

## Set up

- **AGENTS.md is the table of contents.** Keep it short (about 100 lines at OpenAI) and link every document in
  `docs/` from it, directly or through an index page.
- **Cross-linked.** Every relative link resolves: `lychee --offline docs/ AGENTS.md` checks local links only and
  exits 2 on a broken one. Every file in `docs/` is reachable from AGENTS.md by links: a short script walks them and
  lists the orphans.
- **Structured.** Each document starts with front matter: `describes:` (the code paths it documents) and `owner:`.
  Each kind of document (a design doc, a runbook, a guide) has its template's headings, listed in the linter's
  config.
- **Current.** On a PR, a change to code under a document's `describes:` paths that does not touch the document
  fails, unless the PR carries the `docs-unaffected` label. On the schedule, a document whose `describes:` paths
  changed in more commits since its own last change than the limit in the config (default 10) is stale.
- **One term, one home.** sandcastle's docs test fails on a first mention of a glossary term that does not link to
  its entry, on an entry whose "First explained in" line does not name the earliest page that mentions it, and on a
  link to a heading that does not exist.
- **Skills are documents the agent loads.** Each SKILL.md stays under 20,000 bytes, since "After a compaction,
  Claude Code re-attaches each invoked skill truncated to 20,000 characters" (superpowers). A skill's folder holds no
  pressure scenarios or creation logs: an agent that finds "This is a real scenario. You must choose and act" there
  can take it as live instructions. Every file a skill names exists, and the skills are exactly those in the plugin
  manifest and the router: Matt Pocock's library writes these rules in CLAUDE.md ("a router that lies") and checks
  none of them in CI.
- **The `run`** prints `file:line: message` per problem: `docs/billing.md:12: broken link ../api/refunds.md`,
  `docs/old-auth.md: not reachable from AGENTS.md`, `docs/billing.md: describes api/billing/, changed in 14 commits
  since this doc`. It exits non-zero on any problem.
- **Cases.** Must fire: a broken relative link; a document no page links to; a document without `describes:`; a code
  change under `describes:` with the document untouched; a SKILL.md of 20,000 bytes; a `test-*.md` in a skill's
  folder; a skill missing from the manifest. Must pass: the real `docs/` and skills.
- **Wiring.** A CI job on every PR, and a scheduled job that opens one maintenance item per stale document. A
  "doc-gardening" agent, a worker on the schedule as in [garbage-collection](../garbage-collection/card.md), opens
  PRs for them. The linter's script and config are protected by a PreToolUse hook, so the agent fixes the document,
  not the rule; the CI run is the final one.

## Notes

- The linters check structure and freshness, not whether a document is clear or true. A document's text is reviewed
  by [document-review](../document-review/card.md); examples and API responses are run by
  [executable-docs](../executable-docs/card.md).
