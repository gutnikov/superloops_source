---
id: reproduction-gate
title: "Reproduction gate"
summary: "A fix counts only against a reproduction that failed first, on the reported symptom. The agent fixes until it passes; the gate reports red before, green after, and any other test changed."
sensor: computational
ilities: [correctness, testability]
places: [remediation/oracle, remediation/gate]
stages: [local, ci]
speed: [minutes]
needs: []
agent: [reviewer]
related: [bug-failing-test-fix, debugger-repl, acceptance-loop, release-confirmation, exploratory-testing, scripted-model-tests]
links:
  - title: "Regression tests named by issue"
    url: "https://github.com/earendil-works/pi/tree/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/coding-agent/test/suite/regressions"
    author: "pi (earendil-works)"
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
    note: "a failing test that reproduces the bug, before the fix."
  - title: "Genie Wants to Leap"
    url: "https://newsletter.kentbeck.com/p/genie-wants-to-leap"
    author: "Kent Beck"
    note: "agents that disable or delete tests."
  - title: "subagent-eviction: one reproduction run on the base, on the fix and as a control"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/script/drive/subagent-eviction.md#L26-L50"
    author: "opencode (anomalyco)"
    note: "BEFORE asserts the known bug; AFTER asserts the fix; DEMO_EVICT=false must wake even on the base."
  - title: "subagent-eviction.ts: the evidence must agree"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/script/drive/subagent-eviction.ts#L127-L152"
    author: "opencode (anomalyco)"
  - title: "timeline-suspense: a desired test and a forensic test"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/reproduction/timeline-suspense/timeline-suspense.repro.ts#L9-L45"
    author: "opencode (anomalyco)"
  - title: "timeline-suspense: its Playwright config"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/e2e/reproduction/timeline-suspense/playwright.config.ts#L11"
    author: "opencode (anomalyco)"
    note: "retries: 0."
  - title: "diagnosing-bugs: a red-capable command before any hypothesis"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/SKILL.md#L49-L66"
    author: "skills (Matt Pocock)"
    note: "the reproduction rate for a flaky bug; what to ask a person for when no loop can be built."
  - title: "diagnosing-bugs: the symptom matches, and the repro is minimised"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/SKILL.md#L72-L86"
    author: "skills (Matt Pocock)"
  - title: "diagnosing-bugs: diff a forced red against a pristine copy"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/SKILL.md#L124-L128"
    author: "skills (Matt Pocock)"
  - title: "CHANGELOG: the forced-red diff, after an edit that changed nothing"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/CHANGELOG.md#L13"
    author: "skills (Matt Pocock)"
  - title: "hitl-loop.template.sh: a script that drives the person"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/scripts/hitl-loop.template.sh#L1-L44"
    author: "skills (Matt Pocock)"
  - title: "verification-before-completion: revert the fix, the test must fail"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/verification-before-completion/SKILL.md#L82-L86"
    author: "superpowers (obra)"
  - title: "verify SKILL.md: a fix is proved by a pair"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.agents/skills/verify/SKILL.md#L96"
    author: "sandcastle (Matt Pocock)"
  - title: "verify.ts: doctor warns when the world is older than the checkout"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/verify/verify.ts#L47-L66"
    author: "sandcastle (Matt Pocock)"
    note: "\"A world freezes the build it was made from.\""
---

## Why

A fix with no failing reproduction shows only that the tests pass, and they may have passed before it too. A
reproduction that failed first, with the reported failure, shows that the fix is what changed the result. Keeping
the other tests out of the agent's reach stops it from making the problem go away by changing a test instead.

## How it works

A problem gets a reproduction before any hypothesis: one command (a test, a script, a curl) that the agent has run
and seen fail with the reported symptom. Pocock's `diagnosing-bugs`: "If you catch yourself reading code to build a
theory before this command exists, stop". The agent reads code to write the reproduction and changes none. Once it
is red, the agent shrinks it, cutting inputs, callers, config, data and steps one at a time and re-running after
each cut, until "every remaining element is load-bearing: removing any one of them makes the loop go green". Then it
fixes the code until the reproduction passes.

The gate reports, for each problem, whether its reproduction exists, failed before the fix on the reported symptom and
passes after it, and whether any other test changed on the way. The loop is a composite loop: its parts are the
project's reproduction and test loops, and its own check is the gate over them.

## Set up

- **Problems have ids and symptoms.** The id comes from the error tracker or the issue tracker and tags the
  reproduction. The id can be the file name: pi names its regression tests `<issue>-<what>.test.ts`, 93 of them in
  one folder, so `run` finds a problem's reproduction without a separate index. The symptom, the error message or
  the wrong value from the report, goes in the reproduction's header, and red counts only when the failing output
  contains it. Pocock: "not a different failure that happens to be nearby. Wrong bug = wrong fix."
- **Red first, before any edit.** The reproduction's run from before the fix is kept: a CI job on the commit that
  adds the reproduction, or a run in the task's evidence. In the session, a PreToolUse hook denies the agent's writes
  to source files until that red run is on record.
- **Red on the base, not only red once.** Where the fix is in a pull request, run the same reproduction on a clean
  checkout of the base branch and on the fix, and add a control arm that removes the trigger: opencode's
  `subagent-eviction` script runs with `DEMO_LABEL=BEFORE` on "an immutable base checkout" and asserts the known
  bug, with `AFTER` on the fix, and "`DEMO_EVICT=false` is a control and must wake even on the base". The control
  shows that the trigger, not the harness, causes the failure. Each arm is built fresh from its own checkout. Any
  pair but red-then-green is the verdict; sandcastle: "VERIFIED on both means your observable misses the bug."
- **A forced red is diffed.** Where the red cannot come from the base, the agent forces it by putting the bug back,
  superpowers' "Revert fix → Run (MUST FAIL) → Restore". Pocock: "`diff` against a pristine copy to prove the
  mutation landed before you trust it", so that "an edit that silently changed nothing can't pass as a failing
  test". The evidence holds the diff; an empty one, or one wider than the reverted fix, is no red.
- **Evidence from several sources must agree.** The script checks the answer, the notifications the API returns
  and the marker in the database, and fails with `Inconsistent completion evidence` when they disagree, before it
  judges the bug. One source alone can be wrong in the same way as the code.
- **A flaky problem is a rate.** The agent loops the trigger 100 times and raises the rate with stress and narrower
  timing windows; Pocock: "A 50%-flake bug is debuggable; 1% is not". Red is at least 5 failures in 100, so that 100
  clean runs after the fix are not luck (at 5%, 0.95^100 is under 1%); green is 0 in 100.
- **When no loop can be built**, the agent says so, lists what it tried and asks the person for "(a) access to
  whatever environment reproduces it, (b) a redacted captured artifact (HAR file, log dump, core dump, screen
  recording with timestamps), or (c) permission to add temporary production instrumentation" (Pocock). A person who
  has to click is driven by a script: Pocock's `hitl-loop` waits on `step "<instruction>"`, asks `capture VAR
  "<question>"` and prints `KEY=VALUE` lines; signing in stays a `step`, as a captured value reaches the agent. Only
  then is it `no reproduction: confirmation only` ([release-confirmation](../release-confirmation/card.md)).
- **A protected suite.** The agent fixing the problem cannot change the other tests: a PreToolUse hook denies its
  writes to them, and the final run of the gate happens in CI. A test that has to change goes through a person.
- **The gate is the `run`.** One line per problem, `<problem id>: <status>`: `no reproduction`,
  `green before the fix`, `red on another failure`, `forced red without a diff`, `red`, `green`,
  `other tests changed`. The exit is non-zero while any problem is not `green`.
- **Cases.** Must fire: a fix without a reproduction; a reproduction that passed before the fix; one red with another
  error than the reported symptom; a forced red with an empty diff; a source edit before any red run; a weakened test
  elsewhere. Must pass: a reproduction red on the symptom before the fix and green after it, other tests untouched.

## Notes

- Its part at the work phase is [bug-failing-test-fix](../bug-failing-test-fix/card.md), the agent's red/green
  for a bug. This gate checks the record that loop leaves: red before the fix, green after it, no other test
  weakened, and a bug no test can catch handed to the confirmation.
- It is to remediation what the [acceptance loop](../acceptance-loop/card.md) is to delivery.
- A bug in a mechanism no assertion reaches can get two tests: a `forensic:` test that proves the mechanism on the
  base, and a `desired:` test of the behaviour the fix must give, run with retries off (opencode's
  `timeline-suspense` reproduction).
- When the problem is in code around a model, the reproduction runs against a scripted model, so it fails the same
  way every time ([scripted-model-tests](../scripted-model-tests/card.md)).

## Agent step

A guard, a reviewer whose lens is the tests, returns a Verdict on whether the agent weakened any test other than the
reproduction: an assertion removed or loosened, a test skipped, an expected value changed. It gets the diff of the
tests, never the agent's reasoning, and it blocks only once calibrated ([agent-calibration](../agent-calibration/card.md)).
