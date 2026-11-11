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
related: [correction-becomes-rule, steering-loop, lint-with-fix-instructions]
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

- Transcripts hold prompts, code and tool output. Keep the reports local, or strip them before they leave the
  machine.
- The same transcripts feed [correction-becomes-rule](../correction-becomes-rule/card.md): this loop counts the
  failures of the tools, and that one counts the person's repeated instructions.
