# Step: kind

What does the project ship? It decides how the agent sees its own work run. Unit tests pass while the feature does
not work for real: the page does not render, the command prints the wrong thing, the endpoint returns 500. Each kind
gets one loop that runs the product the way its user does. A project can be several kinds (a web app with an API);
each part brings its own loop.

The answer maps to the `kind` field of `superloops/superloops.md`: web, mobile, library (for a CLI and a library),
api (for an API, a service and a bot), llm, data, infra. Confirm it from the dependencies (`$H/profile.md` §1): React
or Next is web; an HTTP server is api; `bin` in the manifest is a CLI.

## `web`: a web app

Adds `e2e-browser`: the agent starts the dev server and walks the scenario with Playwright. It is the loop that shows a
page that does not work even though the unit tests and `curl` pass. Run it on a production build when hydration
matters.

Suggest: `browser-console-devtools` (JS errors and failed requests, the cheapest browser signal),
`visual-screenshot-check` (against a design, when there is one), `accessibility-checks` (axe, for a public product),
`bundle-size-budget` and `lighthouse-ci` (when size or speed starts to matter).

## `mobile`: a mobile app

Adds `agentic-manual-testing`: the agent opens the app on a simulator and walks the changed screen. Without a simulator
in reach (`wizard-tools.md`), it becomes a script the person runs and an H3 call for the access.

Suggest: `approved-fixtures` (snapshot tests of screens), `platform-matrix` (OS versions and devices),
`accessibility-tree-navigation` (driving the app by its accessibility tree).

## `cli`: a CLI tool

Adds `agentic-manual-testing`: the agent runs the built binary with real arguments and reads the output and the exit
code, not only the unit tests of its functions.

Suggest: `approved-fixtures` (golden output of commands), `terminal-ui-tmux` (for a full-screen terminal UI),
`executable-docs` (the README's examples run as tests), `platform-matrix` (shells and operating systems).

## `library`: a library or SDK

Adds nothing beyond the core: its users are other code, and its unit tests are how they use it.

Suggest: `api-breaking-changes` (the public API compared with the last release; the first failure of a library),
`property-based-tests` (invariants over generated inputs), `executable-docs` (examples that run),
`platform-matrix` (runtime versions).

## `api`: an API

Adds `agentic-manual-testing`: the agent calls the changed endpoint with `curl` or `grpcurl` against a running server
and reads the status and the body.

Suggest: `api-breaking-changes` (when clients depend on the schema), `contract-tests` (when consumers are known),
`structured-logs` (so the agent can read what a request did).

## `service`: a backend service or worker

Adds `agentic-manual-testing`: the agent starts the worker, feeds it one real message or job, and reads its logs.

Suggest: `structured-logs` (the only window into a worker), `fault-injection` (what happens when a dependency is slow
or down), `config-validation` (a worker usually fails on its configuration first).

## `bot`: a chat bot

Adds `agentic-manual-testing`: the agent sends messages to a test chat, or to a fake of the platform's API, and reads
the replies.

Suggest: `approved-fixtures` (golden replies), `integration-tests-emulators` (the platform's API and the bot's store
started in tests), `structured-logs`.

## `agent`: an AI agent or LLM app

Adds `llm-evals` and `scripted-model-tests`. They catch different failures: evals measure what the model does with
the product's prompts; scripted-model-tests check the code around the model (the tool loop, retries, parsing) against
a fake that replays scripted replies, deterministic and with no tokens. Build `scripted-model-tests` first: it runs on
every change.

Suggest: `prompt-snapshots` (what the code sends the model, reviewed as a diff), `ai-judges-telemetry` (judging a
sample of production answers), `llm-judge-calibration` (before any LLM judge may block).

## `data`: a data pipeline

Adds `approved-fixtures`: the pipeline runs on sample input and its output is compared with an approved reference; a
changed number is a diff a person reviews.

Suggest: `property-based-tests` (invariants such as "no rows lost"), `config-validation`.

## `infra`: infrastructure as code

Adds `config-validation`: the plan or the template is validated against its schema before anything is applied.

Suggest: `sast` with IaC rules (open security groups, public buckets). The apply itself is an irreversible action
under `risky-action-gates`.
