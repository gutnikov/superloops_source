---
id: prompt-snapshots
title: "Snapshots of what the model sees"
summary: "A scripted scenario captures every request the code sends to the model and compares it, as readable text grouped by prompt-cache prefix, with a reviewed snapshot."
sensor: computational
ilities: [correctness, performance]
places: [delivery/work, maintenance/work, maintenance/gate]
stages: [local, ci]
speed: [seconds]
needs: []
related: [scripted-model-tests, approved-fixtures, llm-evals, behaviour-invariance]
links:
  - title: "context_snapshot.rs: readable snapshots of captured model context"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/common/context_snapshot.rs#L268-L312"
    author: "Codex (OpenAI)"
    note: "a new window starts when a request no longer extends the previous input or changes its settings."
  - title: "context_snapshot.rs: grouping requests into windows"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/common/context_snapshot.rs#L204-L238"
    author: "Codex (OpenAI)"
  - title: "normalize.rs: a hash for clipped content, and platform wording pinned by hash"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/common/context_snapshot/normalize.rs#L426-L462"
    author: "Codex (OpenAI)"
  - title: "scenarios.rs"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/suite/scenarios.rs#L1"
    author: "Codex (OpenAI)"
    note: "\"Multi-turn Astra scenarios snapshot the model-visible request history of shipped features.\""
  - title: "A snapshot: compaction, then a resumed session"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/suite/snapshots/all__suite__compact__compaction_cold_resume_after_completion.snap#L69-L73"
    author: "Codex (OpenAI)"
  - title: "scenarios_strict_3p_cache.rs: the tool prefix stays the same in every request"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/suite/scenarios_strict_3p_cache.rs#L131-L144"
    author: "Codex (OpenAI)"
  - title: ".bazelrc: CI never writes a snapshot"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.bazelrc#L114-L115"
    author: "Codex (OpenAI)"
  - title: "Prompt caching"
    url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching"
    author: "Anthropic"
    note: "the cache matches a prefix of the request; a change early in the prompt invalidates what follows."
---

## Why

In a product built on a model, the model's input is the output of code: the system prompt, the tool schemas, the
context the code injects, what compaction keeps, what a resumed session replays. A change to any of them changes
what the model sees, and no functional test notices: the scripted model replies the same, and an eval run is too
slow and too noisy to show one moved sentence. A change near the start of the input also breaks the prompt cache,
which costs latency and money on every request and fails nothing. This loop makes the model's input a reviewed
artifact: every change to it shows in a pull request as a diff.

## How it works

A test runs a multi-turn scenario against a [scripted model](../scripted-model-tests/card.md): a user message, a tool
call, its output, a compaction, a resumed session. The mock server captures every request the code sends. The test
renders them as text, one numbered input item per line, and compares the text with a stored snapshot.

The requests are grouped into windows. A request that extends the previous request's input stays in its window; a
new window starts when it does not, and its header says why: `input diverged at item 05`, `input truncated at item
12`, `input repeated`, or `settings changed (model, tools, …)`. One window for a whole scenario means the cached
prefix held. A new window header in a diff is a broken cache, named at the item where it broke.

The snapshot fails on any difference. The agent reads the diff: a change it meant goes into the pull request, with
the new snapshot, for a person to review; a change it did not mean is a bug in the code that builds the input.

## Set up

- **Scenarios for the features that shape the input**: a plain turn, tool calls, compaction, resume and fork, a change
  of model or tools mid-session, a subagent. Codex's core test suite snapshots its shipped features this way.
- **Normalization, so that only meaning changes.** Paths, ids, cache keys and times become stable placeholders.
  Routine blocks the scenario does not test can collapse to a tag, such as `<PERMISSIONS_INSTRUCTIONS>`. Text
  clipped for readability keeps a hash of the full value, so a change inside the clipped part still changes the
  snapshot. Wording that differs by platform folds into a placeholder, and the exact text is pinned by its hash:
  Codex, "A change to its wording must be reviewed explicitly."
- **Exact assertions for what must never move.** Next to the snapshot, assert the invariants the cache depends on:
  Codex checks that the tool prefix is identical in all 8 requests of a scenario, and fails with "MCP registration
  or refresh changed the eager tool prefix".
- **CI never writes a snapshot.** It runs with updates off (`INSTA_UPDATE=no` for `insta`), so a failure prints the
  diff and leaves no new file behind. Snapshots change only in a commit a person reviews
  ([approved-fixtures](../approved-fixtures/card.md)).
- **`run`** runs the scenario suite and prints, per failing snapshot, `<scenario>: window <n>: <first differing
  line>`, then the diff. It exits non-zero on any difference.
- **Cases.** Must fire: one sentence changed in the system prompt; a tool registered mid-session (a new window,
  `settings changed (tools)`); the current time inserted before the instructions (`input diverged at item 00`). Must
  pass: the main branch; a temporary directory with a different path, which normalization absorbs.
- **Wiring:** the suite in the test command, locally and in a CI job on every pull request; snapshot updates
  accepted only with the snapshot tool's review command, locally.

## Notes

- [llm-evals](../llm-evals/card.md) measure what the model does with its input; this loop shows the input itself.
  A prompt change gets both: the snapshot shows what changed, the evals show whether it helped.
- A snapshot that a person accepts without reading protects nothing. Keep each scenario short enough that its diff
  can be read in a minute, and split one that is not.
