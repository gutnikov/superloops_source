---
id: profiling
title: "Profiling"
summary: "The agent takes a CPU or memory profile as text (the top N functions), makes a fix and compares the new profile with the original."
sensor: computational
ilities: [performance]
places: [remediation/work, maintenance/work]
stages: [local]
speed: [minutes]
needs: []
agent: [investigator]
related: [benchmarks-vs-baseline, load-testing, perf-budgets-telemetry]
links:
  - title: "pprof: README"
    url: "https://github.com/google/pprof/blob/main/doc/README.md"
    author: "Google"
  - title: "runtime/pprof"
    url: "https://pkg.go.dev/runtime/pprof"
    author: "The Go Authors"
  - title: "py-spy"
    url: "https://github.com/benfred/py-spy"
    author: "Ben Frederickson"
  - title: "opencode-dev skill: compare three sources to find the broken layer"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.opencode/skills/opencode-dev/SKILL.md#L89-L93"
    author: "opencode (anomalyco)"
  - title: "opencode-dev skill: confirming a leak"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.opencode/skills/opencode-dev/SKILL.md#L172-L179"
    author: "opencode (anomalyco)"
---

## Why

Without a profile, the agent guesses where the time or the memory goes, and a fix based on a guess may change
nothing. A profile as text, the top N functions, shows it where to look. The new profile next to the original shows
whether the fix moved anything.

## How it works

1. The agent fixes the workload before the first profile: the benchmark, the slow test or the scenario that showed
   the problem. Both profiles are taken of that same workload.
2. It takes a profile as text. In Go, `go test -cpuprofile cpu.prof -memprofile mem.prof -bench .` writes the
   profiles, and `go tool pprof -text -nodecount=20 cpu.prof` prints the top entries, "one per line, including the
   flat and cum values". In Python, py-spy is "a sampling profiler for Python programs" that runs "without restarting
   the program or modifying the code in any way": `py-spy record --format speedscope -o profile.json -- python
   bench.py`, and `run` sums the samples per function into the same top 20.
3. It fixes the top entry it can explain.
4. It profiles the same workload again and compares. `go tool pprof -text -diff_base=before.prof after.prof` shows
   the difference; "some report entries may have negative values", which is where time went away.

## Set up

- **The workload is written in the task** before the first profile, with its input fixed. A profile of another
  workload compares nothing.
- **The measure decides, the profile explains.** The fix worked when the measure the task named (the benchmark's
  time, the budget, the load test's p95) improved and the function it targeted lost samples. A profile alone shows
  where the time moved, not that the product got faster.
- **No gain, or worse:** revert the fix, keep both profiles in the task's evidence, and try the next entry. After 3
  fixes without a gain, the agent reports to a person with the profiles.
- **Memory.** In Go, `-memprofile` gives the memory profile in the same format. py-spy samples where the time goes;
  for Python memory, the project picks a memory profiler and writes it in the loop's `LOOP.md`.
- **A leak takes two snapshots.** opencode: "A single snapshot explains what retains memory at one point in time, but
  does not by itself prove a leak." Take a baseline, run a repeated workload, let collection run, take a second
  snapshot and compare growth and retainer paths. Compare the heap with the process's RSS as well: a large gap points
  at native allocations or mappings no JavaScript retainer path explains.
- **Find the layer before the line.** For a wrong or slow screen, compare the same data at each layer: opencode's
  skill reads the live API, the durable `event` rows in the database (opened read-only) and the client's projection,
  to tell whether the fault is in the server state, the client data layer or the rendering. Profile only the layer
  where the data first goes wrong.
- **`run`** profiles the workload in the directory it is given, compares with the base profile saved there, and prints
  the top 20 entries as `<function>: <before>% -> <after>%`. It exits non-zero when the workload's total samples did
  not fall by at least 5% against the base: the fix moved nothing.
- **Cases.** Must fire: an unchanged copy against its own base profile. Must pass: a copy whose quadratic loop is
  replaced by a map lookup, against the base profile of the slow copy.
- **Wiring.** The agent runs `run` locally on a performance task; the base profile is taken before its first edit and
  kept in the task's evidence. The check that counts is the measure's own loop, which runs outside the agent's reach:
  [benchmarks-vs-baseline](../benchmarks-vs-baseline/card.md),
  [perf-budgets-telemetry](../perf-budgets-telemetry/card.md) or [load-testing](../load-testing/card.md).

## Agent step

An investigator gets the two text profiles and the diff of the code, compares the profiles and returns what changed
and why, as a Diagnosis. It never blocks.
