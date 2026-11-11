---
id: taste-invariants
title: "Taste invariants: custom lints"
summary: "The agent breaks a team convention, such as an unstructured log line, a misnamed schema or a file over the size limit; a custom lint flags the violation in seconds and tells the agent how to fix it."
sensor: computational
ilities: [maintainability, observability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
related: [lint-with-fix-instructions, correction-becomes-rule, steering-loop, garbage-collection]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "ESLint: Custom Rules"
    url: "https://eslint.org/docs/latest/extend/custom-rules"
    author: "ESLint"
  - title: "pi's check scripts"
    url: "https://github.com/earendil-works/pi/tree/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts"
    author: "pi (earendil-works)"
    note: "check-ts-relative-imports.mjs, check-runtime-deps.mjs, check-pinned-deps.mjs, check-released-changelogs.mjs."
  - title: "omissionPlaceholderDetector.ts"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/tools/omissionPlaceholderDetector.ts#L7-L106"
    author: "gemini-cli (Google)"
    note: "the edit and write tools refuse 'rest of methods ...' and the like."
  - title: "Agent Session Drift Check (a workflow)"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/agent-session-drift-check.yml#L31-L132"
    author: "gemini-cli (Google)"
    note: "a comment on a PR that changes one file of a pair and not the other."
  - title: "lint-changed.ts: a touched file is left clean"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/script/lint-changed.ts#L1-L17"
    author: "opencode (anomalyco)"
    note: "warn-level rules included; untouched files and other packages are not checked."
  - title: "opencode gui-plugins AGENTS.md: lint:changed must pass before you finish"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/gui-plugins/AGENTS.md#L21"
    author: "opencode (anomalyco)"
  - title: "check.yml: the same check on every pull request"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/check.yml#L37-L43"
    author: "opencode (anomalyco)"
  - title: "anti-slop: the vendored rule pack and why it warns"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/script/oxlint/anti-slop/UPSTREAM.md#L1-L17"
    author: "opencode (anomalyco)"
  - title: "require-safety-comment-for-type-assertion.ts"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/script/oxlint/anti-slop/rules/require-safety-comment-for-type-assertion.ts#L81-L92"
    author: "opencode (anomalyco)"
  - title: "no-effect-catch-fail: a rule's own valid and invalid cases"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/script/ast-grep/effect-simplifications/rule-tests/no-effect-catch-fail-test.yml#L1-L20"
    author: "opencode (anomalyco)"
  - title: "check-test.yml: the rules' tests run before the rules"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/check-test.yml#L108-L114"
    author: "opencode (anomalyco)"
---

## Why

A team's conventions, such as structured logging or how schemas are named, are not checked by the compiler or the
tests. An agent breaks them without noticing, and each break makes the code less uniform. A custom lint turns
each convention into a check, and its error tells the agent how to fix the violation.

## How it works

1. The agent changes the code.
2. Custom lints check the code statically against the team's conventions, locally or in CI, within seconds.
3. Each lint error names the violation and says how to fix it.
4. The agent follows that instruction.

## Set up

- **One lint per convention.** OpenAI checks these conventions with custom lints:
  - structured logging
  - naming of schemas and types
  - file size limits
  - reliability requirements

  In JavaScript and TypeScript, a convention is an ESLint custom rule: it reports with `context.report()` and a
  message from its `meta.messages`. In another language, the language's linter plugin, or a script that prints the
  same `file:line: message`.
- **The message is the instruction.** It names the violation, shows the fix and says where the convention is written:
  `api/billing.ts:88: unstructured log: pass the values as fields, log.info("charge failed", { orderId }); see
  docs/conventions/logging.md`. For an ESLint rule, `meta.docs.url` points at the convention's page, which editors
  link from the violation.
- **A check for code the agent left out.** An agent that writes `// rest of methods ...` in place of code deletes
  that code, and the build and the types may still pass on a comment. gemini-cli's edit and write tools refuse new
  text with a line that is only such a placeholder: "rest of", "rest of method(s)", "rest of code", "unchanged code"
  or "unchanged method(s)", followed by `...`, bare, after `//` or in parentheses. An edit may keep a placeholder its
  old text already had. Run the same check over the added lines of the diff: `file:line: omission placeholder:
  write the code out in full`.
- **A ratchet on touched files, for a rule the code does not meet yet.** Turn the rule on at warning level everywhere,
  and fail the check on any finding in a file the change adds or edits, old findings included. opencode's
  `lint:changed`: "Touching a file means leaving the whole file clean, older warnings included. Fix the code; suppress
  only with a `SAFETY:` comment that states a real checked invariant." It diffs against the merge base, skips a file
  that was only moved, prints `file:line:col  rule  message` and a total, and runs on every pull request; the rules
  stay at warning "while existing findings are fixed package by package". The debt shrinks where agents work, with no
  baseline file to keep.
- **Rules aimed at what agents write.** opencode vendors an "anti-slop" pack of oxlint rules for TypeScript, each
  message naming the fix: "This assertion chain discards type evidence. Keep the original precise type, or parse
  untrusted input at its boundary before narrowing it."; "Parameter `{{parameter}}` leaves input unparsed. Accept a
  named domain type; run the expected schema or parser at the I/O boundary before calling this function."; "Replace
  module mocking with dependency injection through a real interface, service layer, or faithful test implementation."
  A type assertion needs a `SAFETY:` comment that states the checked invariant, so the shortcut costs a sentence a
  reviewer can check.
- **A rule has its own cases, run before it judges code.** Each opencode ast-grep rule has a test file of `valid:`
  near-misses that must not fire and `invalid:` code that must, and a snapshot of its autofix; CI runs the rules'
  tests first, then the rules over the packages. A rule that fires on a near-miss fails its own test, not every
  pull request.
- **The `run`** runs all custom lints over the directory, prints `file:line: message` per violation, and exits
  non-zero on any.
- **Cases.** One must-fire case per convention: a file that logs `"charge failed for " + orderId`; a schema named
  against the naming rule; a file over the size limit. Must pass: the clean tree.
- **Wiring.** The agent runs it locally before it commits (or a [Stop hook](../stop-hook/card.md) runs it at the end
  of each turn), and a CI job runs it on every PR; the CI run is the final one. The lint rules are protected by a
  PreToolUse hook. A suppression needs a reason on the same line, as in
  [lint-with-fix-instructions](../lint-with-fix-instructions/card.md).

## Notes

- A convention usually starts as a person's correction ([correction-becomes-rule](../correction-becomes-rule/card.md)).
  The second correction of the same kind is an escape, and [steering-loop](../steering-loop/card.md) turns it into a
  must-fire case of this loop.
- A convention no lint can check stays a golden principle for the scheduled cleanup
  ([garbage-collection](../garbage-collection/card.md)).
- A convention that is not about one line of code still fits a small script. Pi's `npm run check` runs such scripts
  next to the linter: no relative `.js` imports in `.ts` source, no runtime import a public package does not declare
  as a dependency, no direct dependency without an exact version. One of them carries its fix in the message: "Released
  sections are fixed. Move new entries to ## [Unreleased] and restore the rest as in the tag." The others name only the
  rule and the files, and would cost the agent less with a fix text.
- A rule over a pair of files fits a small check too. While gemini-cli migrates one implementation to another, a
  workflow lists the pairs that must change together; a pull request that changes one file of a pair and not the
  other gets a comment naming both, updated in place and deleted once both change. It warns and does not block: a
  fix that belongs to one side only is fair, and the comment says so.
