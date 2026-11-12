---
id: tool-use-telemetry
title: "Tool-use telemetry from agent sessions"
summary: "A script reads the agent's session transcripts and reports, per tool, model and file type, how often calls fail and why; the worst cases show what to fix in the tool or the guide."
sensor: computational
ilities: [observability]
places: [harness:remediation/entry, harness:maintenance/entry]
stages: [scheduled]
speed: [seconds, minutes]
needs: []
related: [correction-becomes-rule, steering-loop, lint-with-fix-instructions, stall-detector, skill-trigger-eval, secret-scanning]
links:
  - title: "edit-tool-stats.mjs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/edit-tool-stats.mjs"
    author: "pi (earendil-works)"
    note: "failure rates and kinds of the edit tool, payload inflation, same-file clusters, worst examples."
  - title: "read-tool-stats.mjs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/read-tool-stats.mjs"
    author: "pi (earendil-works)"
    note: "full and partial reads, by model."
  - title: "session-context-stats.mjs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/session-context-stats.mjs"
    author: "pi (earendil-works)"
    note: "context use per session, filtered by model, cwd or the commands a session ran."
  - title: "edit.ts: the match strategies, each logged"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/tools/edit.ts#L306-L389"
    author: "gemini-cli (Google)"
    note: "exact, flexible, regex, then fuzzy; an EditStrategyEvent for the one that matched."
  - title: "EditStrategyEvent and EditCorrectionEvent"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/telemetry/types.ts#L1968-L2018"
    author: "gemini-cli (Google)"
  - title: "session-report: the anomalies to look for"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/session-report/skills/session-report/SKILL.md#L27-L32"
    author: "Anthropic"
    note: "cache-hit under 85%, one prompt over 2% of the total, subagent types over 1M tokens per call."
  - title: "analyze-sessions.mjs: a cache break"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/session-report/skills/session-report/analyze-sessions.mjs#L386-L404"
    author: "Anthropic"
    note: "more than 100,000 uncached input tokens in one call (--cache-break)."
  - title: "diagnosing-superpowers: scrub, audit, repeat until CLEAN, then the person approves"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/diagnosing-superpowers/SKILL.md#L55-L66"
    author: "superpowers (obra)"
  - title: "scrub-audit.md: the auditor's output"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/diagnosing-superpowers/prompts/scrub-audit.md#L22-L33"
    author: "superpowers (obra)"
  - title: "redaction-policy.md: the categories and their placeholders"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/diagnosing-superpowers/references/redaction-policy.md#L6-L19"
    author: "superpowers (obra)"
---

## Why

The agent's tools fail in ways no single session shows: an edit whose old text is not found, a match that is not
unique, a read that pulls a whole file into the context. In one session such a failure looks like noise, and the
agent recovers by trying again. Over hundreds of sessions the same failure has a rate, a model and a file type, and
the rate shows whether the tool, its error message or a guide needs to change.

## How it works

A script scans the session transcripts the agent already writes and pairs each tool call with its result. For the
edit tool, pi's `edit-tool-stats.mjs` reports:

- the success and failure rates, overall, per model and per file extension
- failures by kind, read from the error text: `not_found_exact_text`, `multiple_occurrences`, `no_changes_made`,
  `file_not_found`, `invalid_input`, `overlapping_edits`, `aborted`, and a result that never came back
- the payload inflation: the bytes a call sent against the bytes it changed, at the median and at p90 to p99, which
  shows a model resending unchanged text
- clusters: one message with several edit calls to the same file, against one call with several edits
- the worst examples with their paths, for a person to read

The harness engineer reads the report after a change to a tool, its description or the model, and on a schedule. A
rate that rose, or a failure kind that dominates, becomes an item at the harness level: fix the tool, the error
message that should tell the agent how to recover ([lint-with-fix-instructions](../lint-with-fix-instructions/card.md)),
or the guide.

## Set up

- **Transcripts kept.** The agent's session files stay on disk: `~/.pi/agent/sessions` for pi,
  `~/.claude/projects/<project>/*.jsonl` for Claude Code.
- **Events from the tool itself**, where you own the tool. A transcript shows that an edit failed, not how close
  it came. gemini-cli's edit tool tries an exact match, then whitespace-flexible, regex and fuzzy matches, and logs
  an `edit_strategy` event naming the one that succeeded; when an LLM rewrites a failed edit, it logs an
  `edit_correction` event, `success` or `failure`. A rising share of non-exact matches is the warning before the
  failure rate rises. Wrap a tool you do not own, such as a hook on the edit, and log the same: the kind of failure
  and whether the retry succeeded.
- **Windows, not all history.** Compare a window after a change with the one before it. Pi's scripts take `--since`,
  and by default start at the birth time of a given file, such as the build that changed the tool.
- **Filters and JSON.** `--model`, `--ext`, `--failed-only` and `--json`, so that a script or `loops.py stats` can read
  the numbers.
- **One report per tool that matters.** Pi has one for `edit`, one for `read`, and one for context use per session.
- **`run`** compares the window since the last change with the window before it and prints one line per tool and
  model, `<tool> <model>: <failed>/<calls> failed (<rate>%), top kind <kind> (<n>)`, then the worst examples. It
  exits non-zero when a failure rate rose by more than 5 percentage points with at least 100 calls in each window;
  the floor keeps a handful of calls from firing it. The project can set other values in the loop's `LOOP.md`.
- **Cases** are recorded transcript sets. Must fire: edit failures at 2% in the first window and 15% in the second.
  Must pass: the same rate in both windows; a rise in a window with 40 calls.
- **Wiring:** a weekly scheduled job on the machine that keeps the sessions, and a run after each change to a tool,
  its description, a hook or the model. A rise is logged as an escape at the harness level:
  `loops.py trace escape harness:remediation/entry --note "<tool>: <kind>"`.

## Notes

- **Transcripts hold prompts, code, tool output and secrets.** Keep the reports local. A bundle that must leave the
  machine goes through superpowers' scrub loop: a scrubber replaces each sensitive value with a stable placeholder
  by category (email, person, org id, secret, host, home path, repository, a term the person calls proprietary); a
  separate auditor reads every file and returns `CLEAN`, or `MISSED` with `<file>:<line> — <category>` per miss and
  never the value; the two repeat until the audit is `CLEAN`. Nothing is archived before the person approves the
  scrub log and the file list, and since "scrubbing can miss things", the person reads every file before sharing.
- **Tokens and the cache are a dimension too.** Anthropic's session-report plugin reads the same transcripts,
  subagents included, and counts a "cache break", a call with more than 100,000 uncached input tokens. It looks for a
  cache-hit rate under 85%, a single prompt over 2% of all tokens, subagent types that average over 1M tokens a call,
  and cache breaks that cluster, and ties each suggested fix to a row of the report. A tool or a guide that breaks the
  cache costs on every call, though no call fails.
- The same transcripts feed [correction-becomes-rule](../correction-becomes-rule/card.md): this loop counts the
  failures of the tools, and that one counts the person's repeated instructions.
