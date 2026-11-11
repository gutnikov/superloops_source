---
id: integration-tests-emulators
title: "Integration tests with emulators"
summary: "The agent starts the real dependencies of the code (database, queue, cloud emulators), runs the tests against them and sees the errors in how the code works with those dependencies."
sensor: computational
ilities: [compatibility]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [minutes]
needs: []
related: [contract-tests, fault-injection, db-migration-lint, ci-clean-infra]
links:
  - title: "Testcontainers"
    url: "https://testcontainers.com/"
    note: "throwaway containers for test dependencies, created for the run and deleted after it."
  - title: "Testcontainers LocalStack Module"
    url: "https://testcontainers.com/modules/localstack/"
  - title: "LocalStack: Overview"
    url: "https://docs.localstack.cloud/aws/getting-started/"
---

## Why

A test that replaces the database or the queue with a stand-in checks the code against what its author believes the
dependency does, not what it does. Running the tests against the real dependencies, or their emulators, catches the
errors in how the code talks to them. A unit test cannot catch these, since it replaces the dependency.

## How it works

In each round, the agent:

1. starts the database, the queue and the emulators, fresh for the run, with Testcontainers or docker-compose
2. loads the seeds and fixtures
3. runs the tests against these dependencies
4. reads the failing tests, which show the errors in how the code works with the dependencies, fixes the code and
   runs again

Fresh containers for every run mean that data left by an earlier run cannot make a test pass or fail.

## Set up

- **Dependencies as code.** With Testcontainers, the test code declares each dependency: "Define your test
  dependencies as code, then simply run your tests and containers will be created and then deleted." With
  docker-compose, `run` starts the stack before the tests and removes it, data included, after them.
- **The versions production runs.** Pin each image to the version in production (`postgres:16.4`, not
  `postgres:latest`): a test against another version checks another dependency.
- **Cloud APIs through an emulator.** LocalStack "provides a cloud service emulator that runs within a single
  container on your local machine or CI environment", and Testcontainers has a LocalStack module for Java, Go, .NET,
  Node.js and Python. An external API with no emulator gets a [contract test](../contract-tests/card.md) instead: a
  stand-in written by hand brings back the problem this loop removes.
- **Seeds are code** in the repository. Each test creates the data it reads, so the tests do not depend on their
  order.
- **Wait for readiness.** Wait until each dependency answers (a query, a health endpoint) for up to 60 s. A timeout is
  reported as `dependency not ready: <name>`, not as a failing test, so the agent does not look for the fault in its
  code.
- **`run`** runs the integration suite and prints the failing tests as `file:line: message`, preceded by
  `dependency not ready: <name>` for a container that did not start. It exits non-zero on either.
- **Cases.** Must fire: a copy of the code whose SQL names a column the schema does not have; a copy that inserts a
  duplicate into a column with a unique constraint, which an in-memory stand-in accepts; a copy whose image tag does
  not exist (`dependency not ready`). Must pass: the clean copy.
- **Wiring.** The agent runs the suite locally after a change to code that talks to a dependency. A CI job runs the
  same suite on every push, and the CI run is the one that counts. A PreToolUse hook denies the agent's writes to the
  CI config, so it cannot drop the suite or swap a container for a stand-in there.

## Notes

- An emulator is not the cloud service: a green run against LocalStack shows that the code works with LocalStack.
  Behaviour that differs between the two belongs in a contract test or a check in staging.
- To make a dependency slow or drop out in the same suite, put a proxy in front of the container
  ([fault-injection](../fault-injection/card.md)).
