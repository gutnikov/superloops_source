---
id: simplification-pass
title: "Simplification pass after the work"
summary: "When a piece of work is done, the agent simplifies it without changing behaviour; the checks stay green, tests are not weakened, and each significant removal waits for a person's approval."
sensor: inferential
ilities: [maintainability]
places: [delivery/work, maintenance/work]
stages: [task]
speed: [minutes]
needs: []
related: [agent-code-review, behaviour-invariance, garbage-collection]
links:
  - title: "/deslop: simplify a completed workpackage (a prompt template)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.pi/prompts/deslop.md"
    author: "pi (earendil-works)"
---

## Why

An agent that has just made something work leaves the traces of getting there: wrappers with one caller, flags for
cases that never come, defensive branches inside trusted code, a fallback for a state the types already forbid.
Review comments point at some of it, and nobody removes it, because the work already passes. A pass whose only goal
is to simplify, run while the work is fresh and held by the same checks, removes that complexity before other code is
built on it.

## How it works

1. The work is done, and its checks pass.
2. The agent reads the affected files in full, with their call sites, tests and public API. It simplifies the code
   the work added or touched: it inlines trivial helpers and pass-through layers, removes duplication, speculative
   options and defensive code inside trust boundaries, and tightens types so that invalid states cannot be
   represented. It does no unrelated cleanup.
3. It makes routine, behaviour-preserving changes on its own. It proposes each significant removal to a person
   first, one decision at a time: what it would remove, why it looks unnecessary, what could be affected, the simpler
   replacement, and its recommendation.
4. It runs the project's checks again and reviews the final diff for complexity it added and behaviour it changed.
5. It reports what it simplified, the invariants the code now relies on, the removals that were not approved, and the
   checks it ran.

## Set up

- **A prompt template or a skill** with the pass, such as pi's `/deslop`, so the pass is the same every time.
- **A written list of what is significant**: user-visible behaviour; public APIs, persisted formats and protocols;
  validation, authorization, security checks, retries and error handling; an extension point with several users;
  anything covered by tests or docs; anything whose purpose is unclear.
- **Tests are not weakened to permit a simplification.** A test changes only for an approved change of behaviour.
  Where [behaviour-invariance](../behaviour-invariance/card.md) runs, its gate checks this.
- **The invariants in the report.** pi's `/deslop`: "Passing tests and type checks is necessary but not
  sufficient". The stated invariants let a reviewer check what the tests do not.
- **A significant removal calls a person under H1**: whether the code is intentional is a question of intent. One
  question per removal, with the five points above and a recommendation first, logged with
  `loops.py hitl H1 --loop <id> --question "…" --answer "…"`. The answer goes into the pass's report, and a refused
  removal is not proposed again for the same code.
- **Validation** is `manual`: the pass changes code, and the project's own loops hold it. What a script checks: the
  project's verify `run` passes after the pass, and no test file changed unless an approved change of behaviour is
  in the log.
- **Wiring:** a prompt template or a skill the agent runs after the work's checks pass and before it reports the
  work done.

## Notes

- It differs from [agent-code-review](../agent-code-review/card.md): a reviewer returns findings and changes nothing;
  this pass changes the code, and the tests and a person's approval hold it.
- [Garbage collection](../garbage-collection/card.md) does similar work across the codebase on a schedule; this pass
  covers one piece of work, while its context is fresh.
