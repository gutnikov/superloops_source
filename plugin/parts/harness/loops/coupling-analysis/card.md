---
id: coupling-analysis
title: "Coupling analysis"
summary: "On a schedule a CLI reports fan-in, fan-out and cycles; what got worse than the baseline, minus intended hubs, becomes a maintenance item, and the refactoring must improve the numbers."
sensor: computational
ilities: [maintainability]
places: [maintenance/entry, maintenance/oracle]
stages: [scheduled]
speed: [minutes]
needs: []
related: [behaviour-invariance, architecture-fitness-functions, triage]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
  - title: "dependency-cruiser: command line interface"
    url: "https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md"
    note: "the metrics output: afferent and efferent couplings and instability per module and folder."
---

## Why

Coupling grows one dependency at a time, and no single change looks wrong. A tool can count it: how many modules
depend on a module (fan-in), how many it depends on (fan-out), and the cycles. The numbers alone do not say what is
wrong, though: a factory or a shared schema is a hub by design. So the loop reports what got worse against a
baseline, skips the hubs the project has accepted, and makes the numbers the measure a refactoring must improve.

## How it works

1. A scheduled job runs the CLI and compares its numbers with the baseline and the list of intended hubs.
2. Each new cycle, and each module whose fan-in or fan-out grew past the limit, becomes a maintenance item through
   [triage](../triage/card.md).
3. The agent refactors one item. The gate of maintenance, [behaviour-invariance](../behaviour-invariance/card.md),
   requires the behaviour unchanged and the module's numbers back under the limit.
4. A hub a person accepts goes onto the list with its reason, and the job stops reporting it.

## Set up

- **The CLI.** For JavaScript and TypeScript, `depcruise --output-type metrics src` prints, per module and per
  folder, Ca (modules outside that depend on it), Ce (modules outside it depends on) and the instability
  Ce / (Ca + Ce); a `no-circular` rule reports the cycles. For another stack, pick a tool that gives the same numbers
  per module as JSON, and write it and its version in the Tools section of `LOOP.md`.
- **What counts as worse**, written in the loop's config: every new cycle, and a module whose fan-in or fan-out rose
  more than 20% above its baseline. Use growth, not absolute limits: what a high fan-in is depends on the codebase,
  and growth is what the loop is for. The first run writes the baseline, and a person approves it (H5).
- **Intended hubs**, in the same config: the module, which number may grow, and why. Adding one is H5, logged with
  `loops.py hitl`.
- **Snapshot, then judge.** The job saves the CLI's JSON into a snapshot directory. `run` judges the snapshot against
  the config and prints one line per item, `<module>: <status>`: `new cycle a → b → a`, `fan-out 23 (baseline 17)`,
  `fan-in 41 (baseline 30)`. It exits non-zero while any item is open.
- **Cases** are recorded snapshots. Must fire: a new cycle; a module's fan-out 30% over its baseline. Must pass: the
  baseline itself; an intended hub that grew.
- **Wiring.** A scheduled CI job, weekly by default since coupling moves slowly: it takes the snapshot, runs `run`,
  and opens one item per line. The baseline moves only on the main branch, when a refactoring merges. A PreToolUse
  hook denies the refactoring agent's writes to the config and the baseline, so it cannot make an item go away by
  moving the limit.

## Notes

- Böckeler gave an agent such numbers from a CLI of her own (`npx coupling-analyser`) and called what it found "quite
  lackluster": it flagged a factory she had introduced on purpose and a shared schema as problems. Her conclusion: "I
  don't have the impression that this type of coupling data is useful to AI on its own." Hence the baseline and the
  list of intended hubs, instead of an agent judging the raw numbers.
- She suggests another use: "A more practical use I can imagine for this data is during risk triage for code
  review", such as the impact radius of the changed files.
- Rules that stop a wrong import before it lands are
  [architecture-fitness-functions](../architecture-fitness-functions/card.md); this loop finds what grew anyway.
