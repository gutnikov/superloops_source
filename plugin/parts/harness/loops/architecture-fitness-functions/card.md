---
id: architecture-fitness-functions
title: "Architecture fitness functions"
summary: "The agent adds an import and runs `dependency-cruiser` or ArchUnit; a broken rule returns a message that names the rule and describes the layers, and the agent moves the code."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [commit, ci]
speed: [seconds]
needs: []
related: [lint-with-fix-instructions, coupling-analysis, correction-becomes-rule, pre-commit-pre-push]
links:
  - title: "Maintainability sensors for coding agents"
    url: "https://martinfowler.com/articles/sensors-for-coding-agents.html"
    author: "Böckeler"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "dependency-cruiser: rules reference"
    url: "https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md"
    note: "forbidden and allowed rules, the comment field, circular."
  - title: "ArchUnit User Guide"
    url: "https://www.archunit.org/userguide/html/000_Index.html"
    note: "layeredArchitecture(), beFreeOfCycles(), because(), FreezingArchRule."
  - title: "check-entry-graphs.mjs"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/scripts/check-entry-graphs.mjs"
    author: "pi (earendil-works)"
    note: "a budget per entry point of a package: the modules it must not reach."
---

## Why

An import in the wrong direction still builds and runs, so building and running the code do not catch it. Each such
import blurs the layers a little more. A rule for the direction of dependencies catches the import as soon as the
agent adds it. Its message describes the layers, so the agent learns where the code belongs instead of guessing.

## How it works

After adding an import, the agent runs `dependency-cruiser` (JavaScript, TypeScript) or the ArchUnit tests (Java). If
the import breaks a rule, the agent gets the rule's name and a text that describes the layers. In Böckeler's setup the
rule `clients-no-services` keeps the clients folder from importing the services folder, and its text says: "API
clients must not depend on the orchestration layer above them." The agent reads from the text which layer the code
belongs in, and moves the code there.

## Set up

- **Rules for the direction of dependencies.** In dependency-cruiser, a `forbidden` rule with `from` and `to` paths
  per pair of layers that must not meet, and `circular: true` for cycles. In ArchUnit, `layeredArchitecture()` with
  `whereLayer(...).mayOnlyBeAccessedByLayers(...)`, and `slices().matching(...).should().beFreeOfCycles()`.
- **A rule for where new files go.** In dependency-cruiser, `allowed` rules whose paths are the predefined folders: a
  dependency of a file outside them matches none and gets a `not-in-allowed` message. Böckeler's setup has a rule
  that every new file sits somewhere in the predefined folder structure.
- **A text that teaches the layers.** Every rule says what the layer is for and where the code goes instead. In
  dependency-cruiser it is the rule's `comment`, which `--output-type err-long` prints with each violation. In
  ArchUnit it is the rule text, set with `.because(...)` or replaced with `.as(...)`.
- **Old violations do not block new work.** On an existing codebase, record today's violations and fail only on new
  ones: dependency-cruiser's `--baseline` with `--ignore-known`, ArchUnit's `FreezingArchRule`. The agent never adds
  to the baseline; it shrinks as code moves.
- **The `run`**: `depcruise --output-type err-long --config .dependency-cruiser.js src`, or the ArchUnit test class.
  It prints each violating dependency (`from → to`) with the rule's name and text. dependency-cruiser exits with the
  number of violations of severity `error`; ArchUnit fails with an `AssertionError` that names the rule and each
  class and line. Any violation is a non-zero exit.
- **Cases.** Must fire: a copy where a client imports a service; a copy with a new file outside the predefined
  folders; a copy with an import cycle. Must pass: the real tree with its baseline.
- **Wiring.** A pre-commit hook ([pre-commit-pre-push](../pre-commit-pre-push/card.md)) and a CI job; the CI run is
  the final one. A PreToolUse hook in `.claude/settings.json` denies the agent's writes to the rules file, the ArchUnit
  tests and the baseline: a rule that is wrong goes to a person, it is not relaxed by the agent it stops.

## Notes

- Böckeler expanded the rule messages "to be self-correction guidance", and reports: "The agent violated the rules a
  handful of times after I introduced them, and then self-corrected."
- OpenAI's example of layers: every domain has the layers Types → Config → Repo → Service → Runtime → UI, and
  cross-cutting concerns come in only through Providers. Linters and structural tests check all of it.
- A package's entry points are a contract on what they load. In pi, one stray `export *` made a narrow entry pull in a
  whole barrel: about 37 MB of evaluated modules to import one small function, and nothing failed until someone
  measured a process. `check-entry-graphs.mjs` walks the value imports of every entry in each package's `exports`,
  following imports across the workspace, and fails with `<package> export "<name>" must not reach <pattern>` and the
  files that reached it. Type-only imports do not count. It runs in `npm run check`, so the regression fails at commit.
- A rule often starts as a person's correction about where code belongs
  ([correction-becomes-rule](../correction-becomes-rule/card.md)). The same message-as-instruction idea for lint
  rules is [lint-with-fix-instructions](../lint-with-fix-instructions/card.md).
