---
id: fuzzing
title: "Fuzzing"
summary: "The fuzzer finds an input that crashes the code. The agent turns the minimal crashing input into a regression test and fixes the code."
sensor: computational
ilities: [reliability, security]
places: [remediation/entry, remediation/oracle]
stages: [ci, scheduled]
speed: [minutes, hours]
needs: []
links: []
---

## Why

Tests check the inputs someone thought of. A fuzzer tries inputs nobody wrote down and finds the ones that crash the
code. Turning the minimal crashing input into a regression test keeps the fix from coming undone.

## How it works

1. The fuzzer tries inputs against the code until one crashes it.
2. The agent turns the minimal crashing input into a regression test.
3. The agent fixes the code.

## Set up

To set up the loop:

1. Use a fuzzer. The research names libFuzzer, AFL++, cargo-fuzz and Go fuzzing.
2. Keep the input corpus in the repository.
3. Run the fuzzer in CI or nightly.

## Notes

The research cites no source for this loop and notes that it did not check cargo-fuzz separately.
