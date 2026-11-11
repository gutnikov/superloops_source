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
related: [property-based-tests, bug-failing-test-fix, reproduction-gate]
links:
  - title: "Go Fuzzing"
    url: "https://go.dev/doc/security/fuzz/"
    author: "The Go Authors"
  - title: "libFuzzer – a library for coverage-guided fuzz testing"
    url: "https://llvm.org/docs/LibFuzzer.html"
    author: "LLVM Project"
  - title: "Fuzzing with cargo-fuzz"
    url: "https://rust-fuzz.github.io/book/cargo-fuzz.html"
    author: "Rust Fuzz Book"
---

## Why

Tests check the inputs someone thought of. A fuzzer tries inputs nobody wrote down and finds the ones that crash the
code. Turning the minimal crashing input into a regression test keeps the fix from coming undone.

## How it works

1. A fuzz target, a function that takes generated input and calls the code, runs under the fuzzer. The fuzzer
   mutates inputs, guided by coverage, until one makes the target fail: a panic, a sanitizer report, a failed
   assertion, a timeout.
2. The fuzzer minimizes the failing input and writes it to a file.
3. The crash enters remediation with its reproduction already in hand. The agent adds the input to the corpus the
   regression tests replay, sees the test fail, fixes the code and sees it pass
   ([bug-failing-test-fix](../bug-failing-test-fix/card.md)). The
   [reproduction gate](../reproduction-gate/card.md) checks that the input failed before the fix and passes after it.

## Set up

- **Fuzz targets for code that reads untrusted input**: parsers, decoders, protocol handlers. Go fuzz tests run with
  `go test -fuzz`; for C and C++, libFuzzer with `-fsanitize=fuzzer,address`; for Rust, cargo-fuzz, "a tool to invoke
  a fuzzer" (libFuzzer).
- **Sanitizers on.** libFuzzer: "In most cases you may want to combine libFuzzer with AddressSanitizer (ASAN),
  UndefinedBehaviorSanitizer (UBSAN), or both." Without them a memory error that does not crash goes unseen.
- **The corpus lives in the repository**: the seed inputs and every failing input that was fixed. In Go, a failing
  input is written to `testdata/fuzz/<FuzzTest>/` and "it will now be run by default with `go test`, serving as a
  regression test once the bug has been fixed". The libFuzzer binary, given files instead of directories, re-runs
  them "as test inputs but will not perform any fuzzing". So every PR replays the corpus in seconds.
- **Fuzzing runs on a schedule, with a time limit.** Go's `-fuzztime` and libFuzzer's `-max_total_time` both run
  indefinitely by default. A nightly job of 10 minutes per target is a start; a target that keeps finding crashes
  gets more time.
- **`run`** of the nightly job prints one line per new failing input, `<target>: <input file>: <first line of the
  report>`, and exits non-zero on any. Failing inputs with the same stack are one problem: triage merges them by that
  fingerprint ([triage](../triage/card.md)).
- **Cases.** Fuzzing is random, so the cases replay the corpus. Must fire: a parser copy with a seeded out-of-bounds
  read, against a corpus that holds the input that reaches it. Must pass: the fixed parser against the same corpus.
- **Wiring.** A scheduled CI job fuzzes each target and opens a problem per new failure with the minimized input
  attached. Every PR's CI replays the corpus. A PreToolUse hook denies the agent's deletes under the corpus folder,
  so it cannot make a crash go away by removing its input.

## Notes

- A fuzzer finds crashes, not wrong answers. A target that asserts a property, such as a round trip or agreement
  with a reference implementation, turns it into a property test on generated input
  ([property-based-tests](../property-based-tests/card.md)).
- A Go fuzz target that runs longer than 1 second on one input counts as a failure.
