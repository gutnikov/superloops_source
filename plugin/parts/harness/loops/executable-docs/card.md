---
id: executable-docs
title: "Executable documentation"
summary: "Doctests and a check of API responses against the OpenAPI schema turn a mismatch between the docs and the code into a failing test."
sensor: computational
ilities: [maintainability, correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
related: [knowledge-base-doc-lint, contract-tests, api-breaking-changes]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "doctest: Test interactive Python examples"
    url: "https://docs.python.org/3/library/doctest.html"
    author: "Python Software Foundation"
  - title: "Documentation tests"
    url: "https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html"
    author: "The Rust Project"
  - title: "Schemathesis: checks reference"
    url: "https://schemathesis.readthedocs.io/en/stable/reference/checks/"
    note: "response_schema_conformance validates each response body against the schema."
---

## Why

Docs and code drift apart quietly: the code changes, the example in the docs does not, and nothing fails. An agent
that reads those docs then works from a wrong description. Doctests and a check of API responses against the OpenAPI
schema turn that drift into a failing test on the change that causes it.

## How it works

The loop has three checks:

- Doctests run the examples in the docs as tests. An example that no longer matches the code fails.
- The schema check sends requests to the running API and compares each response with the OpenAPI schema. A response
  that does not match fails the check.
- Docs generated from the code, such as `docs/generated/db-schema.md` in OpenAI's repository, are generated again and
  compared with the committed copy. A difference fails.

The agent fixes the code or the doc, whichever is wrong, and runs the loop again.

## Set up

- **Doctests.** Python: `python -m doctest -v <file>` runs the examples in a module or a text file. A failure prints
  the file and line, `Failed example:`, `Expected:` and `Got:`. Rust: `cargo test --doc`. A Rust doc example passes
  when it compiles and runs without panicking, so examples state their results with `assert!` and `assert_eq!`.
- **The schema check.** Schemathesis generates requests from the schema and runs them against the API:
  `schemathesis run http://127.0.0.1:8080/openapi.json`. Its check `response_schema_conformance`, on by default,
  validates each response body against the schema; `status_code_conformance` flags a status code the schema does not
  document. Run it against the API started locally or on a preview.
- **Generated docs.** Every generated doc names its generator in its first line. `run` runs the generator into a
  temporary directory and diffs the result with the committed file.
- **The `run`** prints one line per failure: `file:line: example failed: expected 120, got 720` for a doctest,
  `GET /orders/{id}: response does not match the schema: <the check's message>` for the API,
  `docs/generated/db-schema.md: out of date, run <generator>` for a generated doc. It exits non-zero on any failure.
- **No way out by skipping.** `run` also fails on a change that adds `# doctest: +SKIP` or a Rust `ignore` attribute
  without a reason on the same line, or that removes an example without removing what it documents.
- **Cases.** Must fire: a doc whose example expects `factorial(6)` to be 120; a stub API that returns an order without
  a field the schema requires; a generated doc edited by hand; an example newly marked to be skipped. Must pass: the
  real repository.
- **Wiring.** The agent runs it before it commits; a CI job runs it on every PR, and that run is the final one. The
  schema, the generators and `run` are protected by a PreToolUse hook: a schema change is an API change, and goes
  through [api-breaking-changes](../api-breaking-changes/card.md).

## Notes

- A doc that is not code, such as a guide in `docs/`, is checked for links, structure and freshness by
  [knowledge-base-doc-lint](../knowledge-base-doc-lint/card.md).
- Checking one service's responses against its own schema does not show that the consumers agree with the schema;
  that is [contract-tests](../contract-tests/card.md).
