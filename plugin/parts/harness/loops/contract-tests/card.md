---
id: contract-tests
title: "Contract tests"
summary: "The agent changes a provider and runs contract verification. Before a deploy, the agent runs `pact-broker can-i-deploy`. The command exits with code 0 (\"yes\") or 1 (\"no\")."
sensor: computational
ilities: [compatibility, testability]
places: [delivery/work, delivery/gate, remediation/work, maintenance/gate]
stages: [local, ci]
speed: [minutes]
needs: [ci]
related: [api-breaking-changes, integration-tests-emulators]
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
---

## Why

A provider's own tests pass even when a change breaks a consumer, because they do not know what the consumer expects.
Contract verification checks the change against those expectations. Before the deploy, `can-i-deploy` answers with a
plain yes or no whether the version can go out, so an incompatible change stops there and not in a running system.

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
- **`run`** verifies the provider in the directory against the pact files there. It prints one line per failed
  interaction, `<consumer>: <interaction>: <mismatch>`, and exits non-zero when there is any.
- **Cases.** Must fire: a provider that renames a field a consumer's pact reads; a provider whose state handler for a
  state the pact needs is missing. Must pass: the provider with the field kept and a new field added.
- **Wiring.** Verification in the provider's CI on every PR; can-i-deploy as a step of the deploy job, before the
  deploy; record-deployment after it. The deploy job runs outside the agent's session, and the pacts come from the
  broker, not from the provider's repository, so the agent cannot edit them.

## Notes

- **A contract with a standard, not with a consumer.** When the other side is a published specification with its own
  test suite, run that suite against the real build, pinned to one revision, and gate on a reviewed baseline of
  which checks pass and which fail. Codex does this for MCP on every pull request. The gate passes only when every
  check that passed still passes, no other check fails, and the required protocol versions, transports and auth
  scenarios "are actually run": a check missing from the run counts as a failure, so a suite that silently did not
  run cannot pass. The version that ships may have no known failures. A fixed check is listed as fixed, and the gate
  "does not relabel an existing failure as a pass". A baseline change is reviewed like code: "Review every baseline
  change; do not regenerate it to conceal a regression."
- Findings from review become checks of their own. Codex keeps "reviewer-derived MCP regressions" as a second suite
  with its own baseline, run in the same required job.
- [api-breaking-changes](../api-breaking-changes/card.md) catches a break in the schema before any consumer runs;
  contract tests catch the breaks that matter to the consumers who exist, including ones a schema diff cannot see.
