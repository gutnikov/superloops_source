---
id: guide-lift-eval
title: "Guide lift eval"
summary: "The agent does the same tasks with and without a guide, each run in a fresh isolated environment; the guide stays only if the paired pass rates show that it helps."
sensor: computational
ilities: [correctness, usability]
places: [harness:delivery/gate, harness:maintenance/gate]
stages: [local, scheduled]
speed: [minutes, hours]
needs: []
related: [llm-evals, correction-becomes-rule, docs-audit, agent-calibration, skill-trigger-eval, test-admission]
links:
  - title: "Pi evals: documentation-lift evals"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/evals/README.md"
    author: "pi (earendil-works)"
    note: "paired without_docs and with_docs arms in fresh containers, deterministic grading, blocked pairs withhold the headline."
  - title: "Add custom streaming provider (an eval case)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/evals/evals/custom-provider.docs.eval.ts"
    author: "pi (earendil-works)"
    note: "a task graded by probing the configured runtime against a fake server."
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
    note: "with guides only, the agent never learns whether the rules worked."
  - title: "skill_extraction.eval.ts: scratchpad versus summary-only index"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/evals/skill_extraction.eval.ts#L798-L858"
    author: "gemini-cli (Google)"
    note: "paired arms on fresh rigs, scored on relevant and distractor reads."
  - title: "skill-creator: both arms in one turn; an existing skill's baseline is its old version"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/SKILL.md#L169-L186"
    author: "Anthropic"
  - title: "skill-creator grader: critique the evals"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/agents/grader.md#L68-L80"
    author: "Anthropic"
    note: "an assertion that would also pass for a clearly wrong output; an outcome no assertion covers."
  - title: "skill-creator analyzer: per-assertion patterns"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/skill-creator/skills/skill-creator/agents/analyzer.md#L210-L218"
    author: "Anthropic"
  - title: "writing-skills: no skill without a failing test, and micro-tests of the wording"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/writing-skills/SKILL.md#L272-L305"
    author: "superpowers (obra)"
    note: "the arm without the skill first, rationalisations verbatim; a no-guidance control that can stop the change; 5+ reps."
  - title: "testing-skills-with-subagents: pressure scenarios"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/writing-skills/references/testing-skills-with-subagents.md#L96-L161"
    author: "superpowers (obra)"
    note: "3+ pressures, a forced A/B/C choice, real file paths."
  - title: "Plan-scoped workspace: the gates set before the runs"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace.md#L144-L180"
    author: "superpowers (obra)"
  - title: "Plan-scoped workspace eval: the failure did not reproduce"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md#L36-L62"
    author: "superpowers (obra)"
  - title: "Plan-scoped workspace eval: fixtures with tells, and the sanity gate"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md#L120-L159"
    author: "superpowers (obra)"
  - title: "Positive-instruction redesign: wording measured against a no-guidance control"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-06-10-positive-instruction-redesign-design.md#L6-L18"
    author: "superpowers (obra)"
    note: "a prohibition 4.4, no guidance 3.6, a positive recipe 3.0 with zero variance; opus, 5 reps each."
  - title: "Positive-instruction redesign: the micro-test harness"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-06-10-positive-instruction-redesign-design.md#L125-L144"
    author: "superpowers (obra)"
  - title: "Fix-loop redesign: tuned sentences move, they are not reworded"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-07-15-sdd-fix-loop-redesign-design.md#L5-L9"
    author: "superpowers (obra)"
  - title: "systematic-debugging CREATION-LOG: no failing baseline recorded"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/systematic-debugging/pressure-scenarios/CREATION-LOG.md#L55-L75"
    author: "superpowers (obra)"
  - title: "test-worktree-native-preference.sh: a grader that passes on absence"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/claude-code/test-worktree-native-preference.sh#L72-L84"
    author: "superpowers (obra)"
  - title: "test-helpers.sh: run_claude passes no --plugin-dir"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/tests/claude-code/test-helpers.sh#L6-L19"
    author: "superpowers (obra)"
---

## Why

A guide, such as a section of AGENTS.md, a skill or a docs page the agent reads, is written in the hope that it
helps, and nothing checks that hope. A guide that does not help still costs context on every run, and one that
misleads costs more. Sensors check the code; this loop checks the guide. The same tasks run with and without it,
and only the difference in the results shows whether the guide earns its place.

## How it works

1. **Tasks with a deterministic grade**: the result is run or probed, not read by a model. A guide that teaches gets
   tasks it should help with. A guide that forbids, such as "no code before a failing test", gets pressure scenarios
   that tempt the agent to break it, each ending in a forced A/B/C choice that is the grade; superpowers: "Best tests
   combine 3+ pressures" (time, sunk cost, authority, exhaustion). Beside them, a legitimate-behaviour task, where
   what the guide forbids elsewhere is right, must still pass with the guide.
2. Every task runs in two arms, `without` the guide and `with` it. Everything else is the same: the model, the
   tools, the installed build.
3. Each arm runs in a fresh environment: a new container, home directory, workspace and session. Repetitions
   alternate the order of the arms.
4. **The arm without the guide fails first.** A new guide, or an edit, is written only after the arm without it shows
   the failure, and it answers each rationalisation that arm gave, copied verbatim. If that arm does not fail, the
   guide is not written (superpowers: "there is nothing to fix — stop"). One superpowers eval stopped there: in 25 of
   25 runs without the change, the agent already refused the stale progress file the change guarded against.
5. The report pairs the two arms of each task and computes the lift: the pass rate with the guide minus the pass
   rate without it. A guide whose lift is zero or negative is rewritten or removed. A task that passes without the
   guide (a saturated control) cannot show lift, and is replaced; a legitimate-behaviour task stays, to show the
   guide breaks nothing.

In pi, `without_docs` removes the coding agent's README, CHANGELOG, `docs/` and `examples/`, and the docs-routing
section of the system prompt. One task is to configure a custom provider from an API description, graded by probing
the configured runtime against a fake server.

## Set up

- **The oracle out of the agent's reach.** The agent under test cannot read the eval definitions, graders or
  fixtures. Pi's harness makes them root-owned and drops to an unprivileged user before the agent starts.
- **The guide is the only difference, and the run shows it.** Both arms install the same build, and copies of the
  guide elsewhere, such as in dependency packages, are removed from both. Each arm records the guide files it
  installed, with their hashes; the same set in both arms blocks the pair. superpowers' worktree test calls
  `claude -p` without `--plugin-dir`, so both its arms load whatever skill is installed.
- **The cohort is planned first.** Every `(task, arm, model, run)` and the pass count each arm needs are written down
  before anything runs; superpowers set 5 of 5 with the change and at least 4 of 5 without it on the
  legitimate-behaviour task. A missing, errored or unscored arm blocks its pair, and a blocked pair withholds the
  headline pass rates. One run per arm cannot show stability: pi repeats with `--runs-per-variant 5` and flags
  flakiness, no lift and negative deltas.
- **Fixtures without tells.** An agent that sees a fixture is fake passes for the wrong reason: superpowers' first
  fixtures cited made-up commit hashes, which agents dismissed on sight, and held stub code, which they ruled false.
  A sanity gate runs before any repetition, for that eval "every cited hash resolves AND two authors across two
  dates"; it caught a generator bug that gave every commit one author.
- **Lift on the process as well as the result.** When the guide steers what the agent reads, plant relevant and
  distractor material and count the reads. gemini-cli's skill-extraction eval passes its scratchpad arm only when it
  reads at least 2 relevant sessions, no fewer than the summary-only arm and no more distractors.
- **For a changed guide, the baseline is the previous version.** Anthropic's skill-creator snapshots the old version
  before the edit, runs it as the other arm, and starts both arms in the same turn.
- **The wording is micro-tested first.** Before the cohort, which takes hours, each candidate wording runs as single
  fresh-context calls: the guide in the context it will live in, a task that tempts the failure, at least 5 samples
  and a no-guidance control. Read every flagged match, since a reply that quotes the rule matches its grep; the
  spread across samples is a score. superpowers measured a "don't restate the brief" rule at 4.4 re-typed spec
  values, worse than 3.6 with no rule, and a positive recipe at 3.0 with zero variance, at $0.15–0.30 a sample.
- **The evals are graded too.** skill-creator's grader flags an assertion "that passed but would also pass for a
  clearly wrong output" and an outcome no assertion covers. Its analyst sorts each assertion across the arms: always
  passing or always failing in both tells nothing, passing only without the guide means the guide hurts, varying
  from run to run is flaky. Every grader also runs on an empty reply, which must fail.
- **Tuned wording is frozen.** A change that only moves sentences this loop tuned skips the cohort: a script checks
  that each tuned sentence appears exactly once, word for word, in the new text. superpowers: "existing eval-tuned
  sentences move; they do not get reworded". A reworded sentence runs the whole loop.
- **`run`** runs the cohort for one guide and prints one line per task, `<task>: without <p>% with <q>% lift <d>`,
  with `saturated`, `flaky` or `blocked` where they apply, then the guide's paired lift. It exits non-zero when a pair
  is blocked, when both arms load the same guide, when a new or changed guide never failed without it, when a grader
  passes an empty reply, and when the lift is zero or below. `budget_seconds` in its `LOOP.md` allows for hours.
- **Cases** run on recorded observations, so validation costs no tokens. Must fire: both arms pass at the same rate;
  an arm missing; both arms with the same guide hashes; a new guide whose arm without it never failed (superpowers'
  debugging scenarios have no runner or grader, and their log reads "All tests passed. No rationalizations
  found."); a grader that passes an empty reply, as superpowers' worktree grader passes any reply without
  "git worktree add". Must pass: a complete cohort where the arm with the guide passes more tasks and the
  legitimate-behaviour task passes in both arms.
- **Wiring:** a CI job on a pull request that changes a guide (AGENTS.md, CLAUDE.md, `.claude/skills/`, `docs/`),
  which takes the eval definitions from the base branch; and a run after a change of the model, logged with
  `loops.py trace` when the lift falls.

## Notes

- This is the sensor that guides lack: with guides only, the agent never learns whether the rules worked
  (Böckeler). When a [repeated correction becomes a rule](../correction-becomes-rule/card.md) in CLAUDE.md, this loop
  checks that the rule changes the agent's results.
- A low score is data, not a failure; the suite fails only when an invariant of the harness breaks. Pi's containers
  still reach the model's provider, so they cannot prove that code the agent wrote stayed offline.
- Every arm costs a real model's tokens. Run the cohort when a guide or the model changes; the micro-tests carry the
  iterations in between.
