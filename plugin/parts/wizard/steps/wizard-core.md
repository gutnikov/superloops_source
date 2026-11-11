# The core: loops every project gets

These loops go into every plan, whatever the answers. Each one catches a failure that agents cause in almost any
project, costs little to run, and needs nothing beyond the repository. They are the 20% that catch most of what goes
wrong; everything else in the catalog waits for a failure that shows the project needs it.

Card paths are `${CLAUDE_PLUGIN_ROOT}/parts/harness/loops/<id>/card.md`. Read a card before you build its loop.

## One `verify` loop

`build`, `type-check`, `lint-with-fix-instructions`, `red-green-tdd` and `stop-hook` are one loop in the project, not
five: `verify`, one command over the project's build, type check, lint and tests.

- **Why.** The most common failure of an agent is a change that does not build, does not type-check, breaks a lint
  rule or a test, and is called done anyway. One command makes "done" mean "green".
- **How it is wired.** The Stop hook (`stop-hook`) runs `verify` before the agent may end its turn, and CI runs it
  where the agent cannot change it. The lint messages say how to fix each problem (`lint-with-fix-instructions`); the
  tests are written red first (`red-green-tdd`).
- **Reuse.** Wire in the project's own commands (`make check`, `npm test`, `go vet ./... && go test ./...`). Build a
  second check for the same thing only when the existing one cannot be run or read by the agent.
- **What the stack changes.** `type-check` joins `verify` only for a stack whose compiler does not check types
  (`wizard-stack.md`). For Go, Java, Rust, Swift and C#, `build` is the type check.

## The rest of the core

| Loop | What it catches | Why every project |
|---|---|---|
| `autoformat-hook` | Rounds spent on formatting, and diffs full of whitespace | A PostToolUse hook runs the formatter after every edit: no round of the agent goes to formatting |
| `secret-scanning` | A key, token or password in a commit | The cost of one leak is unbounded, and agents paste credentials from logs and `.env` files |
| `dependency-scanning-sbom` | A vulnerable or abandoned package the agent added | Agents add dependencies freely; the scanner names the CVE and the safe version |
| `bug-failing-test-fix` | A bug "fixed" with no test that shows it | Every bug starts from a test that fails, so the fix is proven and the bug cannot come back silently |
| `stall-detector` | An agent repeating the same calls without progress | It burns time and tokens while every call succeeds; no other check sees it |
| `risky-action-gates` | An irreversible action without a person: a deploy, a deletion, a migration on shared data | One such action can cost more than every other failure together |
| `plan-approval` | Work that is not what the person meant | For a non-trivial task, a person approves the plan before the agent writes code; the cheapest point to correct intent |
| `correction-becomes-rule` | The same correction from a person, again and again | The second time a person corrects the same thing, it becomes a lint, a test or a line in AGENTS.md. This is how the set of loops grows from the project's own failures, not from the catalog |

## What the core is not

- **Not all built at once.** The plan builds at most 5 loops in its first wave (`first_wave` in `wizard.json`); the
  rest are `proposed` and wait their turn.
- **Not a replacement for what exists.** A check the project already runs at the same place is wired in, not rebuilt.
  A project that already has a Stop hook over its tests has `verify` built: record it, and move on.
- **Not every human loop is a step.** `plan-approval` and `risky-action-gates` are mostly settings: a plan mode the
  agent uses for non-trivial tasks, and ask rules in `.claude/settings.json` (or the Codex equivalent) for the
  irreversible commands the project has.
