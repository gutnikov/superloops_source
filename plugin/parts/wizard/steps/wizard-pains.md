# Step: pains

What goes wrong most often now? A loop exists for a failure (`$H/README.md`, "Just enough loops"). Every other step
picks loops by what the project is; this one picks them by what actually hurts, and its loops go first in the plan,
right after `verify`. The answers become `pains` in `superloops/map.yaml`, each with the place that should catch it.

Check the answers against the history: red CI runs, reverts, fix-up commits, repeated review comments
(`$H/profile.md` §1). Write the evidence next to each pain; a pain the history also shows outranks one it does not.

## `breaks-build`: the agent's changes break the build or the tests

Adds nothing new: `verify` with the Stop hook is the answer, and it is already first in the plan. Make sure it covers
the commands CI runs, so green locally means green in CI.

Suggest `pre-commit-pre-push`: the fast part of `verify` at commit, for the cases where the agent commits mid-turn.

## `not-really-working`: tests pass, but the feature does not work for real

Adds `verification-subagent`: a subagent with a fresh context tries to prove "done" wrong by running the tests and
using the feature. The kind's own loop (`e2e-browser`, `agentic-manual-testing`) is already in the plan.

Suggest `acceptance-loop` (requirements become acceptance tests that fail before the work) and
`agentic-manual-testing` (where the kind did not bring it).

## `conventions`: the code ignores our conventions or architecture

Adds `taste-invariants`: each convention the agent breaks becomes a small check whose message says how to fix it. A
line in AGENTS.md is advice; a check is a rule.

Suggest `architecture-fitness-functions` (layer and dependency rules) and `agent-code-review` (only for what no check
can express).

## `escapes`: bugs reach staging or production

Adds `reproduction-gate`: a fix counts only against a reproduction that failed first, and the gate reports whether it
was red before and green after. Escapes repeat when fixes are not proven.

Suggest `release-confirmation` (the release judged where it runs) and `error-tracking` (the agent reads the new
errors after each release).

## `aging`: dependencies fall behind, and updates break things

Adds `dependency-updates`: a bot opens the update; the agent runs the loops and fixes what broke.

Suggest `behaviour-invariance`: the gate that an update changed no expected value of an existing test.

## `security`: vulnerabilities, secrets, licenses

Adds `sast`: Semgrep or CodeQL report a rule, a file and a line; the agent fixes the pattern. `secret-scanning` and
`dependency-scanning-sbom` are already in the core.

Suggest `security-review-agent` (a checklist reviewer for what rules cannot see, such as permissions) and
`license-check` (a forbidden license in a new dependency).

## `performance`: it gets slower or heavier

Adds `benchmarks-vs-baseline`: the hot path measured against the main branch, with a tolerance for noise.

Suggest `bundle-size-budget` (web), `perf-budgets-telemetry` (a budget checked against the service's traces),
`load-testing` (on staging), `profiling` (the agent compares profiles before and after).

## `compatibility`: it breaks clients

Adds `api-breaking-changes`: the schema compared with the main branch's, each break reported.

Suggest `db-migration-lint` (schema changes in the database), `contract-tests` (known consumers), `platform-matrix`
(versions and platforms).

## `agent-loops`: the agent goes in circles, or says done too early

Adds `verification-subagent`, for "done" that is not. `stall-detector` is in the core, for the circles.

Suggest `tool-use-telemetry`: the session transcripts read for which tools fail most, and why, so the guide or the
tool gets fixed.

## `none-yet`: nothing yet

Adds nothing. The pains come later, from the history and from `correction-becomes-rule`.
