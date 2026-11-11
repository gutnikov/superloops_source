# Step: surfaces

What does the code work with? Each surface is a place where unit tests lie: a mock says the query works, the real
database does not. Each one brings the loop that checks the code against the real thing, or against the contract
others rely on.

Confirm from the code: a migrations folder, a queue client in the dependencies, a published OpenAPI or proto file,
locale files, an LLM SDK.

## `database`: a database with migrations

Adds `integration-tests-emulators` and `db-migration-lint`. The first starts the real database in tests (a container
or an emulator), so a query, a transaction or a constraint fails in the test, not in production. The second points
at a dangerous migration (a lock on a big table, a dropped column still read) and applies it and rolls it back on a
throwaway database. A bad migration is among the most expensive failures and the cheapest to catch.

Suggest `backup-restore-rollback` once production holds data nobody can recreate.

## `queue`: queues or caches

Adds `integration-tests-emulators`: the broker or the cache runs in tests, so delivery, ordering and expiry are
exercised for real.

Suggest `fault-injection`: the dependency made slow or down in a test, to check retries and timeouts.

## `external-apis`: third-party APIs

Adds no loop: a real third-party API in every test run is slow, flaky and sometimes costs money.

Suggest `fault-injection` (the API slow, failing, rate-limited) and `contract-tests` (when the provider publishes a
contract, or when the team owns both sides). Recorded responses replayed in tests serve most projects first; see the
cassettes in `scripted-model-tests`' card for the shape.

## `public-api`: an API others depend on

Adds `api-breaking-changes`: the schema (OpenAPI, proto, GraphQL, the exported types of a package) is compared with
the main branch's, and each break is reported. The agent restores compatibility or adds a version. Clients break
silently otherwise, and far from the change.

Suggest `contract-tests` (known consumers), `executable-docs` (documented examples that run), `changelog-audit` (for
a published package).

## `translations`: a UI in several languages

Adds `i18n-pseudolocalization`: a lint for hard-coded strings and missing keys, and a pseudo-locale that shows cut-off
text. Agents add English strings inline by default.

Suggest `translation-sync`: each translation stamped with the source text it came from, so a changed English string
makes its translations stale.

## `llm-calls`: calls to an LLM

Adds `llm-evals` and `scripted-model-tests`, for the same reasons as the `agent` kind (`wizard-kind.md`): a prompt is
code whose output only an eval measures, and the code around the call needs deterministic tests.

Suggest `prompt-snapshots`: what the code sends the model, reviewed as a diff in each pull request.

## `money`: money, permissions or regulated data

Adds no loop by itself; it changes how the oracle is made. Rules that cost money or trust when wrong are written down
and approved by a person before the work (the spec part, `$P/spec/README.md`), and superloops never invents them
(`never_invent` in `superloops.md`).

Suggest `acceptance-loop` (the approved spec as acceptance tests that fail first), `property-based-tests` (invariants
such as "a balance never goes negative"), `mutation-testing` (do the tests notice a changed condition in this code),
`security-review-agent` (a checklist over permissions and data exposure).

## `none`: none of these

Adds nothing.
