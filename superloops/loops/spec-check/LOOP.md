---
id: spec-check                   # the folder name under superloops/loops/
title: "Spec check"
type: spec-check            # from the plugin's loop-types/index.yaml, or custom
status: active                  # proposed | built | validated | active | retired
trigger: [edit, ci]                     # edit | local | commit | ci | preview | staging | production | scheduled | task | sprint | continuous
places: [delivery/oracle]       # where it stands in the super-loops, as <super-loop>/<phase>: delivery/confirmation
run: ./run                      # one command; exit 0 = passes, non-zero = fires; machine-readable output
budget_seconds: 10              # one run must finish within this time
validation: cases               # cases (cases/must-fire, cases/must-pass) or manual (say why below)
agents: []                      # agents whose execution is a step of this loop, e.g. .claude/agents/reviewer.md
parts: []                       # composite loop only: ids of the loops under superloops/loops/ it is made of
hitl: []                        # ids from the plugin's defaults/hitl.yaml this loop may call a person under
wiring: [.github/workflows/spec-check.yml] # where the loop is hooked in, e.g. .claude/settings.json hooks.PostToolUse
---

# Spec check

## Requirement

A spec with a gap reaches the test writer: a field that comes from nowhere, an error no example shows, a reference
to a requirement that does not exist, or a name the glossary avoids. The test writer then guesses, and the tests
check the guess. The owner asked for specs before the site's work (2026-11-11, `hitl-log.jsonl`). The loop's place
is `delivery/oracle`: the spec is checked before it is approved and handed off.

## Loop

```
 change under superloops/specs/ ──► ./run <repo> ──► specs.py check ──► em.py check --strict (each event-model layer)
                                                  └─► exit 1: <path>: <checker>: <message>  → fix the spec, or ask
                                                  └─► exit 0: the spec is whole            → approval, then the test writer
```

1. The agent changes the spec and runs `superloops/loops/spec-check/run .` from the repository's root.
2. `run` calls `specs.py check` and fires on any error or warning, not only on errors. This keeps the glossary
   checked: `specs.py check` reports a name that uses one of a term's avoided words (its `not` list) as a warning,
   and exits 0 on warnings.
3. `run` calls `em.py check --strict` on every `event-model` layer in `superloops/specs/layers.yaml`. It fires on an
   error or on a test obligation that no example pins down.
4. On a pull request and on every push to `main`, CI runs it again with the checkers of the base commit. That run
   is the one that counts: the agent can change neither the base commit nor a path in CODEOWNERS without the owner,
   so a local run is the agent's own check, and the CI run is the loop's verdict.

## Tools

- Python 3 with PyYAML: Python 3.9.6 and PyYAML locally on 2026-11-11; Python 3.12 in CI, PyYAML from pip.
- `plugin/parts/spec/scripts/specs.py` and `plugin/parts/event-model/scripts/em.py` of this repository, superloops
  0.5.0. `SUPERLOOPS_PARTS` points `run` at another copy of `plugin/parts`; CI sets it to the base commit's copy.

## Signal

One line per finding, `<path>: <checker>: <message>`, then a line with the number of findings; exit 1. The whole
output on the case `must-fire/glossary-synonym`:

```
superloops/specs/: specs.py: warning: superloops/specs/model/model.em.yaml: screen 'CycleListPage' uses 'cycle'; the glossary says 'loop'
spec-check: 1 finding(s). Fix each in the spec, or turn it into a question for the spec approver.
```

## Validation

`loops.py validate spec-check --runs 3`: every case 3 times, the same result each time, within `budget_seconds`. On
2026-11-11 it printed `VALID: 6 cases, 3 runs each`, at 0.19–0.22 seconds a run.

| Case | Stands for | Expected |
|---|---|---|
| `must-fire/field-from-nowhere` | a read-model field from an event that does not exist | fires (em.py) |
| `must-fire/error-without-example` | a command error that no example shows | fires (em.py --strict) |
| `must-fire/missing-requirement` | `reqs:` naming a requirement that does not exist | fires (specs.py) |
| `must-fire/glossary-synonym` | a screen whose name uses a word the glossary avoids | fires (specs.py warning) |
| `must-pass/real-spec` | this repository's spec as it was set up | passes |
| `must-pass/complete-model` | the event-model part's template: a command, a view, every obligation pinned down | passes |

## Wiring

- `.github/workflows/spec-check.yml`, job `spec-check`: on every pull request and every push to `main`. It checks out
  the change, puts the base commit in a worktree (the pull request's base, or the push's previous `main`) and runs
  that commit's `run` and checkers on the change, so a change cannot weaken the check that judges it. Where the base
  has no `run` yet, it uses the change's own. First real runs, 2026-11-11: it passed this loop's own pull request
  ([run 42990352039](https://github.com/gutnikov/superloops/actions/runs/42990352039)) and fired on a scratch pull
  request with a screen named `CycleIndexPage`
  ([run 42990418541](https://github.com/gutnikov/superloops/actions/runs/42990418541)).
- `superloops/` and `.github/` are in `.github/CODEOWNERS`: a change to the spec, this loop or its workflow needs the
  owner's review on the protected `main`.
