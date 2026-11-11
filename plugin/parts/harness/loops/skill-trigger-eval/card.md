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
related: [guide-lift-eval, llm-evals, agent-calibration, document-review]
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
---

## Why

A skill, a subagent or a command is chosen by its description. A guide that helps when it is used still fails when
the agent does not pick it for the task it was written for, or picks it for a task that only shares a keyword. Both
failures are silent: the agent does the work some other way. [guide-lift-eval](../guide-lift-eval/card.md) measures
whether a guide helps once it is loaded; this loop measures whether it gets loaded, and tunes the description until
it does, without overfitting to the queries it was tuned on.

## How it works

1. **The queries.** About 20 realistic requests, the way people type them: file names, context, typos. Half should
   use the skill, phrased in different ways, some without naming it. Half should not, and those are near-misses that
   share its keywords but need something else. A person reviews the set before it is used.
2. **A run.** Each query runs in a fresh headless session with the description installed, 3 times. It counts as
   triggered only when the agent's first tool call loads that skill. A should-trigger query passes at a trigger rate
   of 0.5 or more; a should-not query passes below 0.5.
3. **The loop.** The set is split 60/40 into a training and a held-out test set, stratified by the expected answer. A
   model rewrites the description from the training failures only, and never sees the test scores. The loop stops
   when every training query passes, or after 5 iterations.
4. **The pick.** The description with the best test score wins, not the one with the best training score: Anthropic's
   skill-creator picks by test score "to avoid overfitting".

## Set up

- **A query set per skill**, kept with the skill, with the expected answer per query. Every failure in use, a skill
  that was not picked or one picked by mistake, becomes a new query.
- **A headless runner** that starts a session with the description installed and reads the first tool call from the
  event stream.
- **Rules for the rewriter**: generalize from the failures instead of listing the queries, and keep the description
  short (skill-creator: 100–200 words, and one retry to shorten anything over 1024 characters).
- **`run`** evaluates the current description on the whole set and prints one line per query that fails,
  `<query>: expected <trigger|no trigger>, rate <r> over <n> runs`, then `train <p>/<n>, test <p>/<n>`. It exits
  non-zero when any query fails.
- **Cases.** Must fire: a description that names only the file type, against a set with near-misses that share it; a
  description that never mentions the task its should-trigger queries ask for. Must pass: the skill's current
  description on its own reviewed set.
- **Wiring:** `run` on every change to a skill, a subagent's description or the model; the optimization loop on
  demand, with its chosen description reviewed by a person like any change to a guide.

## Notes

- Three runs per query turn a coin flip into a rate. A description that passes at a rate near 0.5 is not settled:
  add queries around it.
- Skills compete. When two skills fight over a query, the set of each includes it, with the answer decided once.

## Agent step

A worker rewrites the description. It gets the current description, the skill's body and the training failures with
their trigger rates, and returns one new description. It does not block: the held-out score chooses, and a person
approves the result.
