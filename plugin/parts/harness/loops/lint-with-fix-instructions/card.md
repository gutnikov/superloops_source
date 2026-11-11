---
id: lint-with-fix-instructions
title: "Linter with fix instructions"
summary: "The agent runs the linter and reads each violation together with a \"how to fix\" text. Then it either fixes the violation or suppresses it with a justification."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [commit, ci]
speed: [seconds]
needs: []
related: [taste-invariants, architecture-fitness-functions, pre-commit-pre-push, tool-use-telemetry]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "ESLint: Custom Formatters"
    url: "https://eslint.org/docs/latest/extend/custom-formatters"
    author: "ESLint"
  - title: "edit-diff.ts: the edit tool's errors"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/coding-agent/src/core/tools/edit-diff.ts"
    author: "pi (earendil-works)"
  - title: "agent-loop.ts: tool calls from a truncated response"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/agent/src/agent-loop.ts#L478-L513"
    author: "pi (earendil-works)"
  - title: "edit.ts: the edit tool's errors and its answer on success"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/tools/edit.ts#L366-L380"
    author: "gemini-cli (Google)"
  - title: "tool-utils.ts: getToolSuggestion"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/utils/tool-utils.ts#L65-L92"
    author: "gemini-cli (Google)"
    note: "an unknown tool's name answered with the 3 closest names."
  - title: "clippy.toml: banned methods, each with its fix as the reason"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/clippy.toml#L8-L28"
    author: "Codex (OpenAI)"
    note: "\"Audited against workspace sqlx 0.9.0. Revisit this SQLite escape-hatch list when bumping sqlx.\""
  - title: "apply_patch.rs: the patch is checked against the files before approval"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/src/tools/handlers/apply_patch.rs#L450-L521"
    author: "Codex (OpenAI)"
  - title: "file_update.rs: the lines that failed to match"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/apply-patch/src/file_update.rs#L152-L160"
    author: "Codex (OpenAI)"
  - title: "opencode edit.ts: the hint after an edit that missed"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/tool/plugin/edit.ts#L190-L241"
    author: "opencode (anomalyco)"
    note: "\"may already be applied\", or the closest lines numbered like a read: lines vote for the start, at least half agree, at most 12 lines."
  - title: "opencode runtime.ts: invalid arguments"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/tool/runtime.ts#L90-L101"
    author: "opencode (anomalyco)"
  - title: "opencode tool-input-repair.ts: repairs only where the schema is unambiguous"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/plugin/tool-input-repair.ts#L8-L24"
    author: "opencode (anomalyco)"
  - title: "anti-slop: require-safety-comment-for-type-assertion"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/script/oxlint/anti-slop/rules/require-safety-comment-for-type-assertion.ts#L81-L92"
    author: "opencode (anomalyco)"
  - title: "security-guidance patterns.py: a rule and its reminder"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/patterns.py#L104-L110"
    author: "Anthropic"
  - title: "security-guidance: each reminder shown once"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/security_reminder_hook.py#L564-L575"
    author: "Anthropic"
  - title: "security-guidance: the sweep at Stop, fixed and unresolved per rule"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/security-guidance/hooks/security_reminder_hook.py#L638-L711"
    author: "Anthropic"
    note: "every flagged file is read again at Stop; a deleted file counts as fixed."
---

## Why

A lint error that says only what is wrong lets the agent make it go away the easy way. Böckeler saw the agent
"frequently" raise the cyclomatic complexity threshold for a rule that had no fix instruction yet. A message that
says how to fix the violation puts the right fix in front of the agent at the moment it needs it.

The size and complexity rules `max-params`, `max-lines`, `max-lines-per-function` and `complexity` catch code that
grows hard to change. ESLint's recommended config does not turn them on.

## How it works

The linter runs at commit and in CI. Each violation it reports carries a "how to fix" text, from a custom formatter
or from the messages of custom lint rules. The agent follows the text to fix the violation, or suppresses the
violation with a comment that gives the reason.

## Set up

- **A fix instruction in every message.** Two ways:
  - A formatter of your own. An ESLint formatter is a function that gets the `results` (per file, `messages` with
    `ruleId`, `message`, `line` and `column`) and returns the text to print; run it with `eslint -f ./formatter.js`.
    It looks up each `ruleId` in a table of instructions and prints the instruction after the message. Böckeler built
    such a formatter.
  - The messages of your custom lint rules, written so that they put the fix into the agent's context, as OpenAI
    does ([taste-invariants](../taste-invariants/card.md)).
- **The instruction says what to do, and when an exception is fair.** For `complexity`: extract the branches into
  named functions, and raise the threshold only for a case where refactoring is unnecessary or impossible, saying
  why. Böckeler's message for thresholds allows a slight raise in exactly that case.
- **Turn on the size rules**: `max-params`, `max-lines`, `max-lines-per-function`, `complexity`, with limits the
  project picks and writes in the ESLint config.
- **A banned API is a line of config, and its reason is the fix.** A rule that only forbids a call needs no custom
  code: Rust's clippy takes `disallowed-methods` with a `reason` it prints at each use, and ESLint has
  `no-restricted-imports` and `no-restricted-syntax` with a `message`. Write the reason as the instruction, as Codex
  does: "Create SQLite pools through codex-state's sqlite shim.", "Avoid yellow; prefer other colors in
  `tui/styles.md`." A list tied to a dependency says when to look at it again: "Revisit this SQLite escape-hatch list
  when bumping sqlx."
- **Every suppression carries its reason**: `// eslint-disable-next-line <rule> -- <reason>`. `run` fails on a
  disable comment without `--` and a reason. Böckeler: this "keeps the suppressions manageable, visible and
  reviewable."
- **For the riskiest escape hatches, ask for the invariant, not a disable.** opencode's anti-slop rules flag every
  type assertion except `as const` that has no `SAFETY:` comment before it: "State the checked invariant immediately
  before the assertion or its containing statement." The comment must say what was checked, so the reviewer can
  check it too; a disable comment only says the rule was in the way.
- **Measure whether a warning that does not block works.** A reminder that never blocks is cheap, and may change
  nothing. Anthropic's security-guidance plugin checks new text after each edit against its patterns and adds a
  reminder with the fix ("Use JSON.parse() for data, ast.literal_eval() for Python literals… If this is safe or is
  explicitly needed, briefly document that in a comment"), shown once per file and rule in a session. Each one is
  recorded as pending; at Stop every flagged file is read again and checked, and each rule gets a count of warnings
  fixed and warnings left. A rule whose warnings stay unresolved is the one to make blocking, or to rewrite.
- **The `run`**: the linter with the formatter, `file:line: <rule>: <message>. How to fix: <instruction>`, and a
  non-zero exit on any error.
- **Cases.** Must fire: a function with six parameters against `max-params: 4`; a function over the complexity
  limit; a disable comment with no reason. Must pass: the clean tree, and a suppression with a reason.
- **Wiring.** A pre-commit hook ([pre-commit-pre-push](../pre-commit-pre-push/card.md)) and a CI job; the CI run is
  the final one. The ESLint config and the formatter are protected by a PreToolUse hook: a limit the agent raises is
  a change a person approves (H5), not a fix.

## Notes

- Böckeler calls the extra context in lint messages "a good kind of prompt injection".
- The size rules "weren't even active in ESLint's default preset" (Böckeler); she had to configure their maximums
  first.
- The same holds for the errors of the agent's own tools: custom tools, MCP servers, hooks. Pi's edit tool answers a
  match that is not unique with "Found N occurrences of the text in <path>. The text must be unique. Please provide
  more context to make it unique.", and overlapping edits with "Merge them into one edit or target disjoint regions."
  When the model's output was cut off by the token limit, pi runs none of its tool calls and answers each with
  "Re-issue the tool call with complete arguments." [tool-use-telemetry](../tool-use-telemetry/card.md) counts how
  often each such error comes back.
- gemini-cli's tool errors name the next action, not only the fault. A failed edit: "please use ReadFile to inspect
  the target lines before retrying with an exact 'old_string'"; several matches: "set 'allow_multiple' to true"; an
  unknown tool: `Tool "x" not found. Did you mean one of: …?`, with the 3 closest names by edit distance. A
  successful edit answers with the changed lines and 5 lines around them, "so that the agent can avoid the need to
  spend a turn doing a verification read". Give a project's own tools and hooks both halves: on failure what to do
  next, on success the evidence that it worked.
- Codex checks a patch before anyone is asked about it. Every `apply_patch` is applied in memory to the current files
  first, so a person is never asked to approve a patch that cannot apply, and the model gets `apply_patch
  verification failed: Failed to find expected lines in <path>:` followed by the lines it expected. The match is
  tried exact, then without trailing whitespace, then trimmed, then with typographic punctuation folded to ASCII.
  Order a project's own gates the same way: the cheap mechanical check before the person.
- opencode's edit tool answers a miss with what the next call needs. When `newString` (20 characters or more) is
  already in the file: "newString is already in the file, so this edit may already be applied." Otherwise "The
  closest lines in the file:", numbered as a read shows them: each line of `oldString` votes for where the match
  starts, at least half must agree, and at most 12 lines of 200 characters are shown, only when the agent may read
  the file. Invalid arguments list up to 5 issues by path, echo the arguments and end "Update the arguments and call
  the tool again." Input is repaired silently only where the schema leaves one reading, such as `"20"` for a number
  field; a call to a `bash` tool that does not exist runs as `shell`, and the result says "Call "shell" directly."
