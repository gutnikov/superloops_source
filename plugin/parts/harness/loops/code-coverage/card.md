---
id: code-coverage
title: "Code coverage"
summary: "The agent runs coverage and writes tests for the uncovered branches."
sensor: computational
ilities: [testability]
places: [delivery/work, remediation/work, maintenance/oracle]
stages: [local, ci]
speed: [seconds]
needs: []
links:
  - title: "Augmented Coding: Beyond the Vibes"
    url: "https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes"
    author: "Kent Beck"
---

## Why

Code that no test runs can change without any test failing. The coverage report shows the branches the tests never
reach, so the agent knows where tests are missing instead of guessing. It shows only that a line ran, not that a test
checked the result, which is why the signal is weak on its own.

## How it works

The agent runs coverage, reads the report and writes tests for the uncovered branches.

Kent Beck asked the agent to propose tests from the coverage report.

## Set up

To set up the loop:

- Have the coverage tool write its report in lcov or JSON.
- Set the coverage threshold on the diff only. The source does not give a threshold value.

## Notes

- Without mutation testing ([mutation-testing](../mutation-testing/card.md)) the signal is weak.
