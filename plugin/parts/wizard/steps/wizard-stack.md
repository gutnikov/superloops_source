# Step: stack

Which languages? The stack changes the commands inside the loops far more than the choice of loops: `verify` runs
`tsc`, `go vet`, `mypy` or `cargo clippy`. It changes the plan in one place: whether a separate type check joins
`verify`.

Find the commands, do not ask for them: the manifest's scripts, the `Makefile` or `justfile`, the CI jobs
(`$H/profile.md` §1). Write them into `stack` in `superloops/map.yaml`.

## `typescript`: TypeScript or JavaScript

Adds `type-check` to `verify`: `tsc --noEmit`. A bundler or a test runner strips types without checking them, so the
build passes on a type error. For plain JavaScript, propose `checkJs` in `jsconfig.json` before anything else.

## `python`: Python

Adds `type-check` to `verify`: `mypy` or `pyright`, whichever the project uses, else `pyright` in basic mode on the
changed files. Nothing else in a Python project catches a wrong type before it runs.

Suggest `property-based-tests` (Hypothesis) for code with invariants: parsers, money, dates.

## `go`, `jvm`, `rust`, `csharp`, `swift`: compiled with types

Add nothing: the compiler is the type check, and `build` in `verify` runs it. Use `go vet`, `clippy` or the
compiler's warnings as errors inside `verify`.

Suggest `lsp-diagnostics` (`go`, `jvm`, `rust`, `csharp`) where a full build is slow enough that diagnostics after
each edit save rounds. For `jvm`, `architecture-fitness-functions` (ArchUnit) is the usual home of layer rules.

## `ruby`, `php`: dynamic, with optional types

Add nothing by default. Suggest `type-check` (Sorbet, PHPStan or Psalm) when the project already has the annotations
or the person wants them: a type checker over unannotated code mostly reports noise.

## `other`

Add nothing. Find the language's build, lint and test commands and put them in `verify`; ask (H1) only if the
repository does not show them.
