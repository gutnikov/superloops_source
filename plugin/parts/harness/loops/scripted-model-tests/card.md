---
id: scripted-model-tests
title: "Tests against a scripted model"
summary: "Code around an LLM is tested against a fake provider that replays scripted replies and tool calls: deterministic, in CI, with no network and no tokens."
sensor: computational
ilities: [correctness, testability]
places: [delivery/work, remediation/oracle, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
related: [llm-evals, reproduction-gate, red-green-tdd]
links:
  - title: "faux.ts: the faux provider"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/ai/src/providers/faux.ts"
    author: "pi (earendil-works)"
  - title: "Coding agent suite tests"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/coding-agent/test/suite/README.md"
    author: "pi (earendil-works)"
    note: "the rule: the faux provider only, no real APIs, keys, network or paid tokens."
  - title: "Regression tests named by issue"
    url: "https://github.com/earendil-works/pi/tree/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/coding-agent/test/suite/regressions"
    author: "pi (earendil-works)"
  - title: "fakeContentGenerator.ts: strict and non-strict replay"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/core/fakeContentGenerator.ts#L83-L114"
    author: "gemini-cli (Google)"
  - title: "Integration tests: regenerating model responses"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/docs/integration-tests.md#L59-L76"
    author: "gemini-cli (Google)"
    note: "REGENERATE_MODEL_GOLDENS, and the warning to review the new responses for personal and system details."
  - title: "test-rig.ts: record or replay"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/test-utils/src/test-rig.ts#L545-L557"
    author: "gemini-cli (Google)"
  - title: "responses.rs: protocol invariants on every request the agent sends"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/common/responses.rs#L1634-L1773"
    author: "Codex (OpenAI)"
    note: "every tool output has its call in the same input, and every call has its output."
  - title: "responses.rs: a sequence of replies, each requested exactly once"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/common/responses.rs#L1553-L1592"
    author: "Codex (OpenAI)"
  - title: "responses.rs: pausing the stream before an event"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/tests/common/responses.rs#L630-L643"
    author: "Codex (OpenAI)"
---

## Why

Code around a model has bugs of its own: the agent loop, tool dispatch, retries, compaction, a queue of the user's
messages. A real model makes them hard to test, because each run differs, costs tokens and needs a key and the
network. Evals measure the model; they cannot tell a regression in the loop from a bad day of the model. A fake
provider that replays a script fixes the model's side, so a failing test points at the code.

## How it works

A test registers a fake provider and gives it the replies to return, in order: text, thinking, tool calls with their
arguments, or a function that builds a reply from the request it gets. The code under test runs as it does in
production: it sends requests, executes the tool calls the script asks for, and sends the results back. The test
asserts on what the code did: the events it emitted, the messages it kept, the tools it ran, what it did on an
error or an abort.

## Set up

- **A fake provider in the test library.** Pi's `fauxProvider()` takes replies built with `fauxText`,
  `fauxThinking`, `fauxToolCall` and `fauxAssistantMessage`, and response factories for replies that depend on the
  request.
- **A rule that the suite uses it**, in the suite's README or AGENTS.md. Pi's: "Do not use real provider APIs, real
  API keys, network calls, or paid tokens. Keep these tests CI-safe and deterministic". Tests that need a real model
  live apart and run only when their credentials are present.
- **A shared harness** that builds the session around the fake provider, so a test states only the script and the
  assertions.
- **Scripts recorded from the real model, replayed in order.** A long script is recorded, not written by hand.
  gemini-cli keeps one `.responses` file per integration test, a JSON line per model call; with
  `REGENERATE_MODEL_GOLDENS=true` the CLI runs against the real model with `--record-responses` and the file is
  written back over the golden. Otherwise the fake replays it in order and fails with `No more mock responses for
  <method>, got request: …` or `Unexpected response type` when the code makes a call the script does not hold. A
  non-strict mode takes the next response of the right kind, for calls whose order varies, such as background ones.
  A regenerated golden is a diff a person reviews before it is committed: it can hold details of the machine or the
  person who recorded it.
- **The fake checks what the code sends, on every request.** A test that asserts only on the events it sees passes
  on a history the real API would reject. Codex's mock server checks each request body it receives, whatever the test
  asserts: every tool output has its call in the same input and every call has its output, or the test fails with
  `function_call_output without matching call in input: <id>` or `Function call output is missing for call id: <id>`.
  Put the provider's rules there once, and every test checks the history after a compaction, an abort or a resume.
- **A scripted reply that is never requested fails as well.** Codex mounts a sequence "in order for each POST" and
  "asserts the exact number of expected calls": a code path that skips a call fails the test, as one that makes an
  extra call does.
- **A reply can be held mid-stream.** A gate on one chunk or event of the stream releases it only when the test says
  so, and the test interrupts, steers or queues input at that exact point. Codex: "Pause before the next matching
  event until the sender is released."
- **Regressions named by their issue**: `test/suite/regressions/<issue>-<what>.test.ts`, 93 of them in pi, such as a
  queued slash command that runs as a follow-up and a retry after a lost network connection. Each script reproduces
  the failure its issue reported, red before the fix ([reproduction-gate](../reproduction-gate/card.md)).
- **No real key within reach.** Pi's `test.sh` runs the tests in a temporary home with an empty environment, so a
  test that tries a real provider fails instead of spending tokens.
- **`run`** is the project's test command over the scripted-model suite. It prints the runner's failures,
  `<file>:<line>: <assertion>`, and exits non-zero on any failure.
- **Cases.** Must fire: the code with a known regression put back, such as a retry that drops the session's state,
  with the regression test that caught it; a test that calls a real provider. Must pass: the main branch.
- **Wiring:** the project's test command, locally and in a CI job on every pull request, and the rule in AGENTS.md
  that the suite uses the fake provider.

## Notes

- It complements [llm-evals](../llm-evals/card.md): evals measure the model's answers on cases; these tests check
  that the code does the right thing with whatever answer comes back.
- A script replays only what someone wrote down. A bug that depends on what a real model does for the first time is
  left to the evals and to production.
