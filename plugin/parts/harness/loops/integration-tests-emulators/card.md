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
links: []
---

## Why

A test that replaces the database or the queue with a stand-in checks the code against what its author believes the
dependency does, not what it does. Running the tests against the real dependencies, or their emulators, catches the
errors in how the code talks to them. A unit test cannot catch these, since it replaces the dependency.

## How it works

In each round, the agent:

1. starts the database, the queue and the emulators with testcontainers or docker-compose
2. loads the seeds and fixtures
3. runs the tests against these dependencies
4. reads the failing tests, which show the errors in how the code works with the dependencies

## Set up

- testcontainers or docker-compose.
- Emulators for external APIs.
- Seeds and fixtures.

## Notes

The research cites no source for this loop.
