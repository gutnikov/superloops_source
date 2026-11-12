---
id: red-green-tdd
title: "Unit tests, red/green TDD"
summary: "The agent writes one test, sees it fail for the missing behaviour, then writes just enough code to pass it; a hook denies code edits until that red run is on record."
sensor: computational
ilities: [testability, correctness]
places: [delivery/work, remediation/work]
stages: [local]
speed: [seconds]
needs: []
agent: [reviewer]
related: [acceptance-loop, mutation-testing, test-admission, bug-failing-test-fix, simplification-pass, observe-and-interrupt]
links:
  - title: "Red/green TDD — Agentic Engineering Patterns"
    url: https://andrewmurphy.io/stdlib/b139fcdd-2733-435b-a97f-6d7e47836719
    author: Simon Willison
  - title: "agentic-engineering-patterns: Red/green TDD"
    url: https://github.com/lucas-flatwhite/agentic-engineering-patterns-simon-willison/blob/main/docs/en/03-testing-and-qa/01-red-green-tdd.md
  - title: "Augmented Coding: Beyond the Vibes"
    url: https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes
    author: Kent Beck
  - title: "Genie Wants to Leap"
    url: https://newsletter.kentbeck.com/p/genie-wants-to-leap
    author: Kent Beck
  - title: "Spec + TDD: The Combination That Actually Produces Shippable AI Code"
    url: https://www.augmentcode.com/guides/spec-tdd-shippable-ai-generated-code
  - title: "tdd SKILL.md: seams, anti-patterns, the rules of the loop"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/tdd/SKILL.md#L18-L38"
    author: "skills (Matt Pocock)"
    note: "test only at pre-agreed seams; horizontal slicing; \"Refactoring is not part of the loop.\""
  - title: "tdd docs: the refactor step dropped; an agent that wrote the code first; browser tests first"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/tdd.md#L27-L63"
    author: "skills (Matt Pocock)"
  - title: "test-driven-development: the Iron Law"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/test-driven-development/SKILL.md#L12-L45"
    author: "superpowers (obra)"
  - title: "test-driven-development: Verify RED"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/test-driven-development/SKILL.md#L113-L128"
    author: "superpowers (obra)"
    note: "\"Test fails (not errors)\"; \"Fails because feature missing (not typos)\"."
  - title: "test-driven-development: the whole suite, and failures not mentioned"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/test-driven-development/SKILL.md#L185-L193"
    author: "superpowers (obra)"
  - title: "testing-skills-with-subagents: how the TDD wording was tuned"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/writing-skills/references/testing-skills-with-subagents.md#L282-L306"
    author: "superpowers (obra)"
    note: "the author's own log of the iterations, with no transcripts."
---

## Why

If the agent writes a test after the code, it can fit the test to the code. That test checks what the code does, not
what it should do, so it passes. A test that failed before the change and passes after it shows that the change is
what made the difference. It runs in seconds, so the agent can run it after every change.

## How it works

The agent first lists the seams it will test at, the public boundaries, each with one line on what a test there
catches and misses, and has them confirmed: Pocock's `tdd`, "No test is written at an unconfirmed seam." Then one
slice at a time: one test, run and seen to fail because the behaviour is missing (red), then only enough code to pass
it (green), then the next test. A batch of tests before any code is horizontal slicing, tests of imagined behaviour.

Refactoring is a separate pass, not a step of this loop. Kent Beck's cycle and superpowers end in a refactor; Pocock's
`tdd` dropped it "because agents almost never performed it, and because review and implementation work better as
separate sessions". A step the agent can skip with no check failing does not hold, so the refactor runs once the
slices are green, as its own pass with the tests green before and after
([simplification-pass](../simplification-pass/card.md)).

The [acceptance loop](../acceptance-loop/card.md) is the outer loop around this one, from the requirements to the
acceptance tests. For a bug, the same cycle starts from a test that reproduces it:
[bug-failing-test-fix](../bug-failing-test-fix/card.md).

## Set up

- **The rule in the prompt, stated as the target.** In CLAUDE.md: "use red/green TDD, one slice at a time" (Simon
  Willison: any good model understands it). Browser tests come after the behaviour works: an agent that wrote a
  Playwright test first concluded "the *test* was broken for a feature that did not exist yet" (Pocock's docs).
- **Red is checked, not trusted.** Pocock's docs quote an agent that wrote the code first anyway: "I read it. I just
  defaulted to my normal habit." A PostToolUse hook on `Bash` records each test run, its exit code and its failing
  tests. A PreToolUse hook on `Edit|Write` to a guarded source file denies the write until a recorded run has a test
  the session added failing on an assertion: "Red first: run `<test>` and see it fail before you change `<file>`." An
  error is not red (superpowers: "Test fails (not errors)"). `LOOP.md` lists the guarded paths, the domain code;
  config, wiring and glue stay outside, where a test would restate the code.
- **Tests stay honest.** The agent may delete a test, skip it, remove its assertions or fake the implementation (see
  Notes). A PreToolUse hook denies its writes to the acceptance tests and the spec, the oracle of the acceptance loop.
  A guard reviews every unit-test diff (Agent step). A changed expected value goes through a person.
- **`run`** is the unit tests of the changed area. It prints each failing test as `file:line: message` and exits
  non-zero on any failure. In CI it also runs the added tests on the base's source, `<test>: green before the
  change` for each that passes there. The guard's Verdict is printed with it, blocking once calibrated.
- **Cases.** Must fire: a copy whose change breaks a unit test; an `Edit` of a guarded file with no red run on record;
  a "red" that is an import error; an added test that passes on the base; for the guard, test diffs that delete an
  assertion, skip a test or change an expected value. Must pass: a diff that adds a test which fails on the old code
  and passes on the new; an edit to a config file with no test.
- **Wiring.** The two hooks in `.claude/settings.json`. A Stop hook runs the whole suite at the end of the turn:
  superpowers, "A green run of the test you wrote is not a green suite". The final checks are ones the agent cannot
  edit: the suite and the red-on-base run in CI, and [mutation testing](../mutation-testing/card.md) over the new tests.

## Notes

- Kent Beck names as a warning sign "any indication that the genie was cheating, for example by disabling or
  deleting tests". He has also seen "deleting assertions from tests, deleting whole tests" and "faking large swathes
  of implementation".
- Wording guides, the hook checks. superpowers holds the order by wording ("Write code before the test? Delete it.
  Start over.") and its author's log, with no transcripts, claims "100% compliance under maximum pressure". Pocock,
  from users: "No instruction makes an agent comply 100% of the time." Where the wording works, the hook never fires.

## Agent step

A guard: a reviewer whose only lens is the test diff. It returns a Verdict on whether the change weakened a test
(deleted, skipped, a loosened assertion, a changed expected value, the code under test mocked out), and flags a test
at a seam outside the agreed list. It gets the test diff and the agreed seams, never the agent's reasoning, and
blocks only once calibrated on weakened and honest test diffs ([agent-calibration](../agent-calibration/card.md)).
