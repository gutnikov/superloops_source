---
id: fault-injection
title: "Fault injection (Toxiproxy)"
summary: "A test makes a dependency slow, time out or go down through the Toxiproxy HTTP API; when the test fails, the agent fixes retries and error handling."
sensor: computational
ilities: [reliability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
related: [chaos-engineering, integration-tests-emulators, reproduction-gate]
links:
  - title: "toxiproxy README"
    url: "https://github.com/Shopify/toxiproxy/blob/main/README.md"
    author: "Shopify"
    note: "the HTTP API on port 8474, the toxics, enabled: false, POST /populate and POST /reset."
  - title: "toxiproxy Go package"
    url: "https://pkg.go.dev/github.com/Shopify/toxiproxy/v2"
---

## Why

In ordinary tests a dependency answers fast and never fails, so no test runs the code for retries, timeouts and
error handling. With Toxiproxy, a test can make the dependency slow, time out or go down on demand, locally and in
CI, and show whether the code copes. The agent then fixes what does not.

## How it works

In tests, the application reaches each dependency through a Toxiproxy proxy instead of directly. A test adds a toxic
to a proxy through the HTTP API on port 8474: `latency` delays the data, `timeout` stops the data and closes the
connection after a set time, `reset_peer` resets the TCP connection, `bandwidth` caps the throughput. To take a
dependency down, the test sets the proxy's `enabled` to `false`. Then it asserts what the code must do under the
fault: retry, fall back, give up within its time budget, return the right error. Toxiproxy reports nothing; the
test's assertion is the signal. When a test fails, the agent fixes retries, timeouts and error handling until it
passes.

## Set up

- **A Toxiproxy server** in the local stack and as a service in CI, with one proxy per dependency, created at start
  by `POST /populate` (each with a `name`, a `listen` address and an `upstream`). The test configuration points the
  application at the `listen` addresses.
- **One test per fault and dependency**, asserting the behaviour the spec names for that fault, such as "with
  payments 2 s slow, checkout answers 503 within 1 s". Where the spec names none, the agent asks under H1 instead of
  choosing: how the product behaves when a dependency fails is a requirement.
- **`POST /reset` in every test's teardown.** It re-enables all proxies and removes all toxics, so a failed test does
  not leave its fault for the next one.
- **The `run`** runs the fault tests (a tag or a directory) and prints each failure as `file:line: message`, such as
  `tests/faults/test_payments.py:41: expected 503 within 1s, got no answer after 30s`. It exits non-zero when any
  test fails.
- **Cases.** Must fire: a copy of the client with its timeout removed, under the `timeout` toxic; a copy that swallows
  the error when the dependency is down. Must pass: the real client.
- **Wiring and reach.** The fault tests run with the suite, locally and in CI. While the agent fixes the code, a
  PreToolUse hook denies its writes to the fault tests, as in [reproduction-gate](../reproduction-gate/card.md); a
  fault test that has to change goes through a person, and the final run is in CI.

## Notes

- The Toxiproxy README says it is "made specifically to work in testing, CI and development environments".
- [chaos-engineering](../chaos-engineering/card.md) does the same against the platform in staging: pods and zones
  instead of one connection.
