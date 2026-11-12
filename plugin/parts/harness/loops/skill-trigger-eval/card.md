---
id: skill-trigger-eval
title: "Does the skill trigger"
summary: "Realistic queries that should and should not use a skill run several times against its description; a loop rewrites it on a training split and keeps the best on held-out queries."
sensor: computational
ilities: [alignment, correctness]
places: [harness:delivery/gate, harness:maintenance/gate]
stages: [local]
speed: [minutes]
needs: []
agent: [worker]
related: [guide-lift-eval, llm-evals, agent-calibration, document-review, knowledge-base-doc-lint, tool-use-telemetry, third-party-extension-scan]
links:
  - title: "skill-creator: writing the trigger queries"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/SKILL.md#L336-L358"
    author: "Anthropic"
    note: "20 realistic queries; 8–10 should-trigger, 8–10 near-misses that should not."
  - title: "skill-creator: the optimization loop"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/SKILL.md#L392-L394"
    author: "Anthropic"
    note: "60/40 train and held-out test, 3 runs per query, up to 5 iterations, the best by test score."
  - title: "run_eval.py: a trigger is the first tool call"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/scripts/run_eval.py#L128-L141"
    author: "Anthropic"
  - title: "run_eval.py: pass and fail by trigger rate"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/scripts/run_eval.py#L227-L242"
    author: "Anthropic"
  - title: "run_loop.py: the stratified split"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/scripts/run_loop.py#L24-L44"
    author: "Anthropic"
  - title: "run_loop.py: when it stops, and test scores hidden from the rewriter"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/scripts/run_loop.py#L177-L206"
    author: "Anthropic"
  - title: "run_loop.py: the defaults"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/scripts/run_loop.py#L249-L254"
    author: "Anthropic"
  - title: "validate-frontmatter.ts: the description must parse and be there"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/scripts/validate-frontmatter.ts#L105-L171"
    author: "Anthropic"
    note: "agents need name and description, skills description or when_to_use; exit 1 on any error."
  - title: "run-test.sh: a trigger is a Skill call; planning tools before it do not count"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/explicit-skill-requests/run-test.sh#L71-L121"
    author: "superpowers (obra)"
  - title: "run-multiturn-test.sh: the request at turn 3 of a session"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/explicit-skill-requests/run-multiturn-test.sh#L1-L6"
    author: "superpowers (obra)"
  - title: "run-haiku-test.sh: a cheaper model with the user's CLAUDE.md"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/explicit-skill-requests/run-haiku-test.sh#L1-L31"
    author: "superpowers (obra)"
  - title: "discovery.md: a description says when, not what"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/writing-skills/references/discovery.md#L57-L85"
    author: "superpowers (obra)"
  - title: "test-skill-structure.sh: the description check"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/diagnosing-superpowers/test-skill-structure.sh#L31-L48"
    author: "superpowers (obra)"
    note: "starts \"Use when\", at most 1024 characters, no dispatch, then or step."
  - title: "Porting to a new harness: the unique-marker test"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/porting-to-a-new-harness.md#L194-L206"
    author: "superpowers (obra)"
  - title: "skill-timeline.md: missed and late triggers found in transcripts"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/diagnosing-superpowers/prompts/skill-timeline.md#L17-L30"
    author: "superpowers (obra)"
  - title: "using-superpowers: the 1% rule"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/using-superpowers/SKILL.md#L10-L16"
    author: "superpowers (obra)"
  - title: "grilling docs: a skill that names another does not load it"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/productivity/grilling.md#L72-L73"
    author: "skills (Matt Pocock)"
  - title: "invocation.md: call the Skill tool, one skill per call"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/.agents/invocation.md#L16-L22"
    author: "skills (Matt Pocock)"
  - title: "CHANGELOG: an unquoted colon-space hid six skills"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/CHANGELOG.md#L83"
    author: "skills (Matt Pocock)"
  - title: "CHANGELOG: a Codex manifest flag removed a skill from the model's list"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/CHANGELOG.md#L125-L129"
    author: "skills (Matt Pocock)"
  - title: "diagnosing-bugs docs: over-triggering on another model"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/diagnosing-bugs.md#L59-L60"
    author: "skills (Matt Pocock)"
  - title: "implement-spec docs: subagents do not inherit the parent's skill"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement-spec.md#L50-L52"
    author: "skills (Matt Pocock)"
---

## Why

A skill, a subagent or a command is chosen by its description. A guide that helps when it is used still fails when
the agent does not pick it for the task it was written for, or picks it for a task that only shares a keyword. Both
failures are silent: the agent does the work some other way. [guide-lift-eval](../guide-lift-eval/card.md) measures
whether a guide helps once it is loaded; this loop measures whether it gets loaded, and tunes the description until
it does, without overfitting to the queries it was tuned on.

## How it works

1. **The queries.** About 20 realistic requests, the way people type them: file names, context, typos. Half should
   use the skill, phrased in different ways, some without naming it, some asked a few turns into a session. Half
   should not, and those are near-misses that share its keywords but need something else. A person reviews the set.
2. **A run.** Each query runs in a fresh headless session with the description installed, 3 times. It counts as
   triggered only when the agent's first tool call, todo and planning tools aside, loads that skill; a later load is
   reported as `late` and counts as not triggered. A should-trigger query passes at a trigger rate of 0.5 or more; a
   should-not query passes below 0.5.
3. **The loop.** The set is split 60/40 into a training and a held-out test set, stratified by the expected answer. A
   model rewrites the description from the training failures only, and never sees the test scores. The loop stops
   when every training query passes, or after 5 iterations.
4. **The pick.** The description with the best test score wins, not the one with the best training score: Anthropic's
   skill-creator picks by test score "to avoid overfitting".

## Set up

- **First, the description reaches the model.** The frontmatter parses: in Matt Pocock's skills an unquoted
  colon-space made six invalid YAML, and the installer skipped them. Per harness, and after a compaction, a nonsense
  token in the skill listing must reach a fresh session's context without a tool call (superpowers).
- **A query set per skill**, kept with the skill, with the expected answer per query. Every miss in use becomes a
  query: superpowers' transcript analyst lists each turn that matches a description with no load, and each late
  load.
- **A headless runner per harness and model the skill ships to**, reading tool calls from the event stream, and a
  cheaper model with the user's real CLAUDE.md: Matt Pocock's diagnosing-bugs skill over-triggers on GPT-5.6-Sol.
- **Chained loads.** "A skill that names another skill does not reliably cause that skill to load", nor does a
  subagent inherit one: "the implementer subagents don't inherit the /tdd directive" (Matt Pocock). A case runs the
  parent and passes only when the trace, subagents included, holds a Skill call for each skill its steps name,
  written `Call the Skill tool with "grilling"`, not `/grilling`.
- **Rules for the rewriter**: say when to use the skill, never its steps, or agents follow the summary, not the body
  (superpowers: "code review between tasks" gave ONE review where the skill had TWO). Start with "Use
  when", stay under 1024 characters, avoid `dispatch`, `then` and `step`, and generalize from the failures.
- **`run`** checks the frontmatter and the rules above, then evaluates the description on the whole set and prints
  one line per query that fails, `<query>: expected <trigger|no trigger>, rate <r> over <n> runs`, then
  `train <p>/<n>, test <p>/<n>`. It exits non-zero when a check or a query fails.
- **Cases.** Must fire: a description that names only the file type, against near-misses that share it; one that
  never mentions the task its should-trigger queries ask for; one that lists the skill's steps; one with an unquoted
  colon-space; a session where the parent loaded and a child it names did not, or a dispatched subagent did not. Must
  pass: the skill's current description on its own reviewed set.
- **Wiring:** `run` on every change to a skill, a subagent's description, the harness or the model; the
  optimization loop on demand, with its chosen description reviewed by a person like any change to a guide.

## Notes

- Three runs per query turn a coin flip into a rate. A description that passes at a rate near 0.5 is not settled:
  add queries around it.
- Skills compete. When two skills fight over a query, the set of each includes it, with the answer decided once.
- A router that says to load a skill on "even a 1% chance" (superpowers) needs the should-not queries most.

## Agent step

A worker rewrites the description. It gets the current description, the skill's body and the training failures with
their trigger rates, and returns one new description that says when to use the skill, not its steps. It does not
block: the held-out score chooses, and a person approves the result.
