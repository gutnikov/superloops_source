---
id: correction-becomes-rule
title: "Steering: a repeated correction becomes a rule"
summary: "Every correction a person makes is logged at the phase that should have caught it; the second of a kind is an escape, and it becomes a check, a reviewer's rule or a line in CLAUDE.md."
sensor: human
ilities: [alignment]
places: [harness:remediation/entry]
stages: [continuous]
speed: [minutes]
needs: []
initiator: human
related: [steering-loop, human-diff-review, taste-invariants, sample-audit, guide-lift-eval, tool-use-telemetry, agent-code-review]
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
  - title: "opencode /learn (a command)"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.opencode/command/learn.md#L5-L42"
    author: "opencode (anomalyco)"
    note: "lessons from errors that took several attempts, written into the AGENTS.md nearest the code."
  - title: "opencode glossary: a rule keeps its source"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.opencode/glossary/README.md#L58-L63"
    author: "opencode (anomalyco)"
  - title: "hookify: from the conversation to a hook rule"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/hookify/commands/hookify.md#L17-L80"
    author: "Anthropic"
    note: "an analyzer finds corrections; the person picks up to 4 and chooses warn or block."
  - title: "hookify: rules are active immediately"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/hookify/commands/hookify.md#L154"
    author: "Anthropic"
  - title: "hookify rule_engine.py: the operators"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/hookify/core/rule_engine.py#L166-L180"
    author: "Anthropic"
  - title: "hookify: a hook error lets the call through"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/hookify/hooks/pretooluse.py#L53-L62"
    author: "Anthropic"
  - title: "hookify example: require-tests-stop"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/hookify/examples/require-tests-stop.local.md#L1-L10"
    author: "Anthropic"
  - title: "writing-skills: match the form to the failure"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/writing-skills/SKILL.md#L248-L263"
    author: "superpowers (obra)"
    note: "a prohibition, a positive recipe, a required slot or a conditional; no nuance clauses."
  - title: "Positive-instruction redesign: a prohibition worse than no rule"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-06-10-positive-instruction-redesign-design.md#L6-L33"
    author: "superpowers (obra)"
  - title: "retro: classify the violation, a check for the mechanical, standards for the reviewer"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/retro/SKILL.md#L15-L42"
    author: "skills (Matt Pocock)"
  - title: "retro docs: prune checks that fire on good code; trace each candidate to a moment"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/retro.md#L37-L43"
    author: "skills (Matt Pocock)"
  - title: "chief-of-staff: a retro on about one session in five"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/chief-of-staff/SKILL.md#L53"
    author: "skills (Matt Pocock)"
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
4. The rule ends in one of three places: an automated sensor (a lint, a test, a fitness function); for a judgement
   call, the reviewer's standards, read at review time; or, for what the working agent must do as it works, a line
   in CLAUDE.md.

`loops.py stats` lists the places where corrections pile up; a place with two or more needs a loop or a stronger
one. The measure is that each kind of correction stops coming back.

## Set up

- **The agent logs a correction the moment a person makes it**: CLAUDE.md tells it to. The harness engineer logs
  the corrections made outside the session: review comments, reverts.
- **Corrections nobody logged are found in the transcripts.** Pi's `session-transcripts.ts --analyze` splits a
  project's session transcripts into files that fit a context and runs one subagent per file. Each reads the existing
  AGENTS.md, then the whole transcript in chunks, and writes down every instruction the user gave two or more times: a
  name, `NEW` or `EXISTING` against AGENTS.md, how often it came, exact quotes as evidence, and a draft rule. Each
  `NEW` pattern is logged as a correction of its kind; the harness engineer runs it weekly. For agents that run
  unattended, read about one session in five, those where something went wrong first (Matt Pocock's chief-of-staff).
  A mined candidate that cannot be traced to a moment in a transcript is dropped: a user of Matt Pocock's retro saw
  it invent "generic advice to satisfy the retro categories" once the session's struggles were forgotten.
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
  days goes back to the person who approved it, to keep or remove. A check that "fires constantly on good code" goes
  back the same way (Matt Pocock).
- **The agent's own struggles count as corrections too.** opencode's `/learn` mines the session for "errors that
  took multiple attempts" and "Debugging breakthroughs when error messages were misleading", skips "Things already
  in an AGENTS.md", and writes 1 to 3 lines per lesson into the AGENTS.md nearest the code it concerns, since parent
  AGENTS.md files "are automatically loaded" when the agent reads a file there. It has no approval step and no
  repeat threshold; here a lesson from `/learn` is logged as a correction of its kind and becomes a rule on its
  second occurrence like any other. Each rule carries its source: opencode's glossary asks to "Add or update the
  `Sources` section whenever you add a new rule"; here each rule names its trace entry or its pull request.
- **Short, stable kinds**, such as `unstructured log line` or `test edited instead of code`, so that two corrections
  of one kind are seen as one kind. Reuse a kind already in `superloops/trace.jsonl` before writing a new one.
- **Code before text, and text in the form that fits.** CLAUDE.md is advice, not a guarantee. A mechanical
  correction, such as a banned API, an import shape or a file location, becomes a
  [custom lint](../taste-invariants/card.md) or a test whose message says how to fix it: Matt Pocock's retro gives
  it "a deterministic check, full stop". First read the repository's own check commands: a check that exists but
  sits unwired or broken is the finding. A judgement call goes to the reviewer's
  standards, since the reviewer works under the least context pressure. A line in CLAUDE.md takes the form of the
  failure it fixes (superpowers' writing-skills):
  - the agent breaks a rule under pressure: a prohibition, with the rationalisations seen and red flags;
  - it complies, but the output has the wrong shape: a positive recipe that says what the output is, part by part;
  - it omits a required element: a required slot in the template it fills in;
  - the behaviour depends on a condition: a conditional on something observable.

  No nuance clauses ("Don't X unless it matters"), and no exemptions: they "don't scope". A prohibition aimed at a
  shape can do worse than no rule: superpowers measured "don't restate the brief" at 4.4 re-typed spec values, 3.6
  with no rule and 3.0 with a recipe.
- **A correction about an action can become a hook.** Anthropic's hookify plugin has an agent read the recent
  messages for "don't do X", reversions and repeated problems, and proposes a pattern for each; the person picks up to
  4 and chooses for each whether it warns or blocks. Each becomes a rule file with an event, conditions and the
  message, "active immediately". Give every such rule a must-fire and a must-pass case before it counts: hookify's
  hooks let the call through on any error of their own, and its shipped example that blocks stopping without a test
  run matches `npm test|pytest|cargo test` with `not_contains`, a literal substring test, so once enabled it blocks
  every stop unless that exact string appears.
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
