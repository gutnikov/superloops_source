---
id: correction-becomes-rule
title: "Steering: a repeated correction becomes a rule"
summary: "Every correction a person makes is logged at the phase that should have caught it; the second of a kind is an escape, and it becomes a lint, a test or a line in CLAUDE.md."
sensor: human
ilities: [alignment]
places: [harness:remediation/entry]
stages: [continuous]
speed: [minutes]
needs: []
initiator: human
related: [steering-loop, human-diff-review, taste-invariants, sample-audit, guide-lift-eval]
links:
  - title: "session-transcripts.ts"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/session-transcripts.ts"
    author: "pi (earendil-works)"
    note: "subagents find instructions the user repeated in the transcripts, with quotes, against AGENTS.md."
  - title: "skill-extraction-agent.ts: auto memory's prompt"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/agents/skill-extraction-agent.ts#L176-L268"
    author: "gemini-cli (Google)"
    note: "the minimum signal gate, the signal priority, default to no-op."
  - title: "memoryService.ts: which sessions, how often, which patches survive"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/services/memoryService.ts#L48-L59"
    author: "gemini-cli (Google)"
  - title: "Designing Human-in-the-Loop for Agentic Workflows"
    author: "AlignX"
    note: "logging escalations and corrections by type"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "Codex memories: the defaults"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/config/src/types.rs#L57-L62"
    author: "Codex (OpenAI)"
    note: "sessions idle 6 hours, at most 10 days old, 2 per startup; 256 memories kept; dropped after 30 days unused."
  - title: "Codex memories: outcome labels"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/memories/write/templates/memories/stage_one_system.md#L155-L200"
    author: "Codex (OpenAI)"
  - title: "Codex memories: verify before relying, cite what was used"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/ext/memories/templates/memories/read_path.md#L51-L90"
    author: "Codex (OpenAI)"
  - title: "Codex memories: which memories consolidation keeps"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/state/src/runtime/memories.rs#L441-L500"
    author: "Codex (OpenAI)"
    note: "used within max_unused_days, ranked by usage_count."
---

## Why

Without this loop the person makes the same correction from task to task, because nothing remembers it. A
correction that comes back is a sign of a missing constraint, tool or context. Turned into a lint or a
test, it is checked on every run, and the person does not have to make it again.

## How it works

1. A person corrects the agent: in the session, in a review comment, or by reverting a change.
2. The correction is logged at the phase that should have caught it, its kind first in `--note`:
   `loops.py trace correction <super-loop>/<phase> --item <id> --note "<kind>: <what was corrected>"`.
3. The first correction of a kind is only logged. The second of the same kind is an escape, and the
   [steering loop](../steering-loop/card.md) takes it: it records the corrected example as a must-fire case at that
   phase and fixes or adds the loop there.
4. The rule ends in one of two places: an automated sensor (a lint, a test, a fitness function), or a line in
   CLAUDE.md where no check can express it.

`loops.py stats` lists the places where corrections pile up; a place with two or more needs a loop or a stronger
one. The measure is that each kind of correction stops coming back.

## Set up

- **The agent logs a correction the moment a person makes it**: CLAUDE.md tells it to. The harness engineer logs
  the corrections made outside the session: review comments, reverts.
- **Corrections nobody logged are found in the transcripts.** Pi's `session-transcripts.ts --analyze` splits a
  project's session transcripts into files that fit a context and runs one subagent per file. Each reads the existing
  AGENTS.md, then the whole transcript in chunks, and writes down every instruction the user gave two or more times: a
  name, `NEW` or `EXISTING` against AGENTS.md, how often it came, exact quotes as evidence, and a draft rule. Each
  `NEW` pattern is logged as a correction of its kind; the harness engineer runs it weekly.
- **Or a background agent proposes the rules, and a person approves each.** gemini-cli's auto memory, on in the
  repository's own settings, reads sessions idle for 3 hours or more with at least 10 user messages, 10 new ones per
  run and at most one run in 30 minutes. It ranks "User messages — strongest signal… corrections, interruptions,
  redo instructions", reads "at least two sessions" before it proposes anything, and stops at a five-question gate,
  such as "Is this broader than a single incident…? If no, STOP." Its default is no change: "Prefer 0-5 memory
  patches and 0-2 skills per run." Every proposal is a patch in an inbox; code deletes one that has no hunks, targets
  a file outside the memory directory or does not apply cleanly, and "the user must approve each patch". The shared
  instructions are out of its reach: they are "managed by humans only". Use the same shape: a mined correction
  arrives as a proposed patch for the steering loop, never as a direct edit of CLAUDE.md.
- **A rule that is never used goes.** Codex's memories, off by default, keep a lesson only while agents use it. The
  agent ends a reply that relied on a memory with a citation block naming the memory files and lines; each citation
  raises the memory's use count, and consolidation keeps those used in the last 30 days, or created in them, up to
  256 ranked by use. Its extractor labels each session's outcome, and "only the assistant claims success without
  validation" counts as uncertain, so a lesson does not come from a success nobody checked. A memory read later is
  verified first when it "is likely to drift and is cheap to verify", and called possibly stale when it is not. For
  rules from this loop, have the agent name the rule it applied in its final message; a rule no session named in 30
  days goes back to the person who approved it, to keep or remove.
- **Short, stable kinds**, such as `unstructured log line` or `test edited instead of code`, so that two corrections
  of one kind are seen as one kind. Reuse a kind already in `superloops/trace.jsonl` before writing a new one.
- **Code before text.** CLAUDE.md is advice, not a guarantee. Prefer a [custom lint](../taste-invariants/card.md) or
  a test whose message says how to fix the violation; write a line in CLAUDE.md only for what no check can see.
- **Logging calls no one.** A person is asked only when two rules would both fix the correction and differ in a
  trade-off only they can weigh (H4), logged with `loops.py hitl H4 …`.
- **Validation** is `manual`: the person's correction is the signal. What a script checks: the loop the steering
  loop builds from it has the corrected example among its must-fire cases and the corrected version among its
  must-pass cases.

## Notes

- Keep a log of escalations and corrections by type: recurring types show where the agent lacks constraints, tools
  or context (AlignX).
- With sensors only, the agent repeats the same mistakes; with guides only, it never learns whether the rules worked
  (Böckeler). A rule that stays a line in CLAUDE.md is measured by [guide-lift-eval](../guide-lift-eval/card.md).
