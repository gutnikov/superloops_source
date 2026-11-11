---
id: docs-audit
title: "Docs audit against the implementation"
summary: "An agent with read-only tools checks one documentation page against the code and returns match, mismatch or inconclusive; a mismatch quotes the claim and cites the code."
sensor: inferential
ilities: [maintainability, correctness]
places: [delivery/work, remediation/entry]
stages: [local, scheduled]
speed: [minutes, hours]
needs: []
agent: [reviewer]
related: [knowledge-base-doc-lint, executable-docs, guide-lift-eval]
links:
  - title: "Audit documentation against implementation (an eval suite)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/evals/evals/documentation-audit.eval.ts"
    author: "pi (earendil-works)"
    note: "one run per page, read-only tools, a verdict through a submit tool, and a check that the agent read the page and the source."
---

## Why

Doc linters check that a page is current and linked, and doctests run its examples. Most claims in docs are prose,
though: "this setting reloads without a restart", "the command exits non-zero when…". Nothing runs prose, so a
claim the code no longer keeps goes unnoticed, and every agent and person who reads the page works from it. An agent
can follow each claim to the code that runs it and say whether the code does what the page says.

## How it works

For each documentation page, one agent run:

1. The agent gets the page and the repository root, and only read tools: `read`, `grep`, `find`, `ls`.
2. It reads the whole page and follows each explicit claim to the runtime path that implements it.
3. It ends by calling a submit tool once, with a verdict and an explanation: `match`, `mismatch` or `inconclusive`. A
   mismatch quotes the claim, cites the implementation's path and symbol, and states what a user would see.
4. A mismatch becomes an item for [triage](../triage/card.md): the page is wrong, or the code is.

A mismatch is narrow: a clear, user-visible contradiction between an explicit claim and the runtime behaviour.
Missing detail, ambiguous wording, hypothetical misuse and undocumented edge cases are not mismatches. Names,
comments, types, isolated helpers and tests are not evidence on their own; the runtime path is. When the evidence
does not decide, the verdict is `inconclusive`.

## Set up

- **One page per run**, so that a verdict names one page and the run fits in the context.
- **The verdict through a tool with a schema.** The submit tool's parameters are the verdict enum and a bounded
  explanation, with constrained sampling where the provider has it, and the call ends the run. No prose is parsed.
- **The process is checked, not only the verdict.** A run counts only if the agent read the page and at least one
  file of the implementation, and called the submit tool exactly once. A verdict without those reads is not
  evidence.
- **On a change**, audit the pages that name a command, a setting or a module the change touched; **on a schedule**,
  audit every page. Pi runs the full audit on demand, because it reads every page.
- **`run`** audits the pages it is given and prints one line per page: `<page>: match`, `<page>: inconclusive:
  <why>`, or `<page>: mismatch: "<claim>" vs <path>:<symbol>: <what a user sees>`. It exits non-zero on a mismatch
  only once the auditor is `gate` in `superloops/agents.yaml`; until then it prints the line and exits 0.
- **Cases** are the auditor's evals. Must fire: a copy of a page with one stated default changed so the code no
  longer uses it; a copy that names a flag the command does not have. Must pass: a page that matched on the main
  branch; the same page with an internal detail removed.
- **Wiring:** a scheduled job over every page, whose mismatches go to [triage](../triage/card.md); and a step the
  agent runs on the pages its change touched before it reports the work done.

## Agent step

The auditor is a reviewer. It gets one page and read-only access to the code, never the reasoning of whoever wrote
the page, and changes nothing. It returns a Verdict with the claim and the code as evidence: `fail` for a mismatch,
`pass` for a match. The Verdict format has no third outcome, so an inconclusive page is a `pass` whose reason starts
with `inconclusive:`, and it never blocks. The auditor's `fail` opens an item; it blocks a change only once it is
calibrated on pages with known mismatches ([agent-calibration](../agent-calibration/card.md)).
