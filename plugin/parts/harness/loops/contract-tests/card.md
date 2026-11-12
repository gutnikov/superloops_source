---
id: contract-tests
title: "Contract tests"
summary: "The agent changes a provider and verifies it against its consumers' pacts, a standard's suite or its own past releases; before a deploy, `can-i-deploy` exits 0 (yes) or 1 (no)."
sensor: computational
ilities: [compatibility, testability]
places: [delivery/work, delivery/gate, remediation/work, maintenance/gate]
stages: [local, ci]
speed: [minutes]
needs: [ci]
related: [api-breaking-changes, integration-tests-emulators, shipped-artifact-check]
links:
  - title: "Can I Deploy"
    url: "https://docs.pact.io/pact_broker/can_i_deploy"
    author: "Pact docs"
  - title: "Pact Broker Client CLI"
    url: "https://docs.pact.io/pact_broker/client_cli/readme"
    author: "Pact docs"
    note: "`can-i-deploy` options: `--retry-while-unknown`, `--dry-run`, `record-deployment`."
  - title: "Provider verification (JavaScript)"
    url: "https://docs.pact.io/implementation_guides/javascript/docs/provider"
    author: "Pact docs"
    note: "`pactUrls` with local files, `publishVerificationResult` only in CI."
  - title: "MCP conformance: what the baseline means"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/scripts/mcp_conformance/README.md#L35-L66"
    author: "Codex (OpenAI)"
    note: "the official MCP suite, pinned; a reviewed baseline of passing and failing checks."
  - title: "MCP conformance: the reviewer regression gate"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/scripts/mcp_conformance/README.md#L70-L100"
    author: "Codex (OpenAI)"
    note: "review findings kept as a suite of their own: 186 checks, 21 required cases."
  - title: "run_codex_compliance.py: the regression gate"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/scripts/mcp_conformance/run_codex_compliance.py#L1744-L1809"
    author: "Codex (OpenAI)"
  - title: "sdk.yml: the job that runs the MCP suite is advisory"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/sdk.yml#L38-L41"
    author: "Codex (OpenAI)"
  - title: "blocking-ci.yml: Bazel is not among the required checks"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/workflows/blocking-ci.yml#L53-L61"
    author: "Codex (OpenAI)"
  - title: "resolve_exec_server_releases.py: the latest stable release and the one closest to 60 days old"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/resolve_exec_server_releases.py#L1-L36"
    author: "Codex (OpenAI)"
  - title: "codex_release_archive.bzl: each release fetched by its sha256"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/bazel/extensions/codex_release_archive.bzl#L22-L35"
    author: "Codex (OpenAI)"
  - title: "exec-server BUILD.bazel: the current build against itself and against two releases"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/exec-server/BUILD.bazel#L37-L52"
    author: "Codex (OpenAI)"
  - title: "exec_server_compat_test.rs: both directions"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/bazel/rules/testing/compat/exec_server_compat_test.rs#L48-L83"
    author: "Codex (OpenAI)"
    note: "the test returns early, and passes, when no released binary is set."
  - title: "exec_server_compat_test.rs: what a turn must have done"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/bazel/rules/testing/compat/exec_server_compat_test.rs#L294-L321"
    author: "Codex (OpenAI)"
  - title: "pi CI: MCP client conformance"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.github/workflows/ci.yml#L120-L138"
    author: "pi (earendil-works)"
---

## Why

A provider's own tests pass even when a change breaks a consumer, because they do not know what the consumer expects:
another team's service, a published standard, or an older release of the same product. Contract verification checks
the change against those expectations. Before the deploy, `can-i-deploy` answers with a plain yes or no whether the
version can go out, so an incompatible change stops there and not in a running system.

## How it works

1. The agent changes the provider.
2. The agent runs provider verification against a locally running provider: each consumer's pact is checked against
   the provider's real responses.
3. In CI, the verification results are published to the Pact Broker.
4. Before the deploy, the pipeline runs
   `pact-broker can-i-deploy --pacticipant <provider> --version <sha> --to-environment production`. Exit code 0 means
   yes ("Computer says yes"); exit code 1 means no. It prints a table of the consumer and provider versions, whether
   each pair succeeded, and the missing or failed verification results.
5. After the deploy, `pact-broker record-deployment` tells the broker which version is in the environment.

The agent reads the failed interactions and fixes the provider, never the consumer's pact.

## Set up

- **A Pact Broker**, or PactFlow, with the environments created. Consumers publish their pacts to it.
- **Verification in CI publishes, local verification does not.** `publishVerificationResult` is on only in CI builds,
  with `providerVersion` set to the commit and `providerVersionBranch` to the branch. Locally the agent verifies
  against pact files: `pactUrls` takes local paths.
- **An unknown result is not a yes.** When the provider's verification is still running, can-i-deploy finds no result.
  `--retry-while-unknown` with `--retry-interval` (10 seconds by default) makes it poll: set
  `--retry-while-unknown 30`, five minutes, and treat a timeout as no.
- **Dry run stays off in the gate.** When dry-run is enabled, with `--dry-run` or
  `PACT_BROKER_CAN_I_DEPLOY_DRY_RUN=true`, the command will "always exit process with a success code". It is meant
  for setting up the pipeline and for a "break glass" deploy of a known breaking change. A break-glass deploy is a
  person's decision (H2), and the variable is set for that one build only, as the Pact docs recommend.
- **Your own released versions are consumers.** Where two parts of the product ship separately and talk over a
  protocol, users run them at different versions. Test the current build against the latest stable release and the
  stable release closest to 60 days old (Codex's `STABLE_LOOKBACK_DAYS = 60`), in both directions, each fetched by
  the digest on its release. Each direction runs a whole exchange and asserts its effect: Codex runs a turn from the
  current app server on the released executor and back, and checks the file the command wrote. A release that could
  not be fetched is red, never a skip: Codex's test returns early, and passes, when no released binary is set; only
  its build rule ("Set CODEX_COMPAT_RELEASES … before building release compatibility targets.") makes that fail.
- **`run`** verifies the provider against the pact files in the directory and prints one line per failed
  interaction, `<consumer>: <interaction>: <mismatch>`, and one per skew release and direction,
  `<release> current->released: <status>`. It exits non-zero on any failure or unfetched release.
- **Cases.** Must fire: a provider that renames a field a consumer's pact reads; a provider whose state handler for a
  state the pact needs is missing; a current build that renames a message the released executor sends; a skew run
  whose release could not be fetched. Must pass: the provider with the field kept and a new field added; the current
  build tested against itself.
- **Wiring.** Verification in the provider's CI on every PR; can-i-deploy as a step of the deploy job, before the
  deploy; record-deployment after it. The deploy job runs outside the agent's session, and the pacts come from the
  broker, not from the provider's repository, so the agent cannot edit them. A gate counts only when the branch
  requires it: the harness checks that each job named here is a required check without `continue-on-error`.

## Notes

- **A contract with a standard, not with a consumer.** When the other side is a published specification with its own
  test suite, run that suite against the real build, pinned to one revision, and gate on a reviewed baseline of
  which checks pass and which fail. Codex does this for MCP, and pi runs the same kind of gate as a job of its CI on
  every pull request. The gate passes only when every check that passed still passes, no other check fails, and the
  required protocol versions, transports and auth scenarios "are actually run": a check missing from the run counts
  as a failure, so a suite that silently did not run cannot pass. The version that ships may have no known failures.
  A fixed check is listed as fixed, and the gate "does not relabel an existing failure as a pass". A baseline change
  is reviewed like code: "Review every baseline change; do not regenerate it to conceal a regression."
- Findings from review become checks of their own. Codex keeps "reviewer-derived MCP regressions" as a second suite
  with its own baseline, run in the same job.
- **A gate written as required can be advisory.** At Codex's pinned commit the job that runs the MCP suite has
  `continue-on-error: true` ("Keep it advisory while the BuildBuddy key is revoked"), and Bazel, which runs the skew
  tests, is not among the required checks: a red result in either still merges. An advisory gate is an exception
  with a reason and an end date, which the wiring check reports until it ends.
- [api-breaking-changes](../api-breaking-changes/card.md) catches a break in the schema before any consumer runs;
  contract tests catch the breaks that matter to the consumers who exist, including ones a schema diff cannot see.
