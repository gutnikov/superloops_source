---
id: type-check
title: "Type checking"
summary: "The agent runs `tsc --noEmit`, `mypy` or `pyright` and fixes the type mismatches it finds."
sensor: computational
ilities: [correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, local, ci]
speed: [seconds]
needs: []
related: [build, lsp-diagnostics, lint-with-fix-instructions]
links:
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Birgitta Böckeler"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "TSConfig Reference: strict"
    url: "https://www.typescriptlang.org/tsconfig/#strict"
    author: "TypeScript"
  - title: "The mypy command line"
    url: "https://mypy.readthedocs.io/en/stable/command_line.html"
    author: "mypy"
  - title: "Hooks reference"
    url: "https://code.claude.com/docs/en/hooks"
    author: "Anthropic"
  - title: "opencode AGENTS.md: Checks"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/AGENTS.md#L198-L203"
    author: "opencode (anomalyco)"
    note: "a fast checker while iterating; when the two disagree, tsc is the source of truth."
  - title: "opencode desktop AGENTS.md: the fast checker skips test files"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/desktop/AGENTS.md#L11"
    author: "opencode (anomalyco)"
  - title: "check.yml: CI runs the official compiler"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/check.yml#L33-L35"
    author: "opencode (anomalyco)"
---

## Why

Without a type check, a type mismatch shows up later, as a failing test or an error at run time. The checker finds
it in seconds without running the code. Strict mode and data parsed at the boundaries leave fewer places where a
wrong type can slip through.

## How it works

The agent runs `tsc --noEmit`, `mypy` or `pyright`. With `noEmit`, TypeScript checks the types and writes no output
files. Each error names the file, the line and the mismatch, as in mypy's
`prog.py:1: error: "str" has no attribute "trim"  [attr-defined]`. The agent fixes the code, not the types, and runs
the checker again until it reports nothing.

## Set up

- **Strict mode.** `"strict": true` in `tsconfig.json` turns on "all of the strict mode family options"; `mypy
  --strict` turns on a set of optional checks. Both sets may change with a new version, so a checker upgrade can
  bring new errors and is a change of its own.
- **Data parsed at the boundaries.** Data that comes in (a request, a file, an API response) is parsed into a typed
  value where it enters, so the code behind it has types the checker can trust. OpenAI: "we require Codex to parse
  data shapes at the boundary", without prescribing the library.
- **Suppressions count as errors.** A new `# type: ignore`, `@ts-ignore`, `@ts-expect-error` or cast to `any` in the
  diff is reported like a type error. A suppression the project accepts carries a reason on the same line, and the
  reviewer sees it.
- **A fast checker while iterating, the official one as the judge.** A faster checker keeps the loop after each edit
  short; the compiler that ships stays the source of truth in CI. opencode's agents run `bun typecheck` locally and
  "Never run `tsc` directly"; CI runs `typecheck:tsc`, and "When the two disagree, `tsc` is the source of truth". A
  disagreement is reproduced with the official compiler and reported upstream as a minimal repro, and errors that only
  one checker can raise by design are listed so they are not reported. Know what the fast checker skips: opencode's
  desktop note, "`bun typecheck` does not cover test files. Run `bun test <file>` for every test file you touch."
- **`run`** runs the checker, then scans the diff for new suppressions. It prints `file:line: message` for each and
  exits non-zero on any.
- **Cases.** Must fire: a copy that passes a string where a number is expected; a copy that silences that error with a
  suppression comment. Must pass: the clean tree.
- **Wiring.** A PostToolUse hook on `Edit|Write` runs the checker and exits 2 with the errors; Claude Code "Shows
  stderr to Claude; the tool already ran", so the agent sees them right after the edit. CI runs the full check, out of
  the agent's reach. A PreToolUse hook denies the agent's writes to the checker's configuration, so it cannot loosen
  strict mode to get a pass.

## Notes

- Böckeler: "A codebase written in a strongly typed language naturally has type-checking as a sensor".
- Diagnostics from the language server give the same signal without a separate run
  ([lsp-diagnostics](../lsp-diagnostics/card.md)); a full build catches what the checker alone does not
  ([build](../build/card.md)).
