---
id: check-incubation
title: "A new check incubates before it blocks"
summary: "A new test or eval runs many times on a schedule without blocking; it blocks pull requests only after a record of passes, and a blocking check that flakes goes back to quarantine."
sensor: computational
ilities: [testability, reliability]
places: [delivery/work, remediation/work, harness:delivery/gate, harness:remediation/entry]
stages: [ci, scheduled]
speed: [minutes, days]
needs: [ci]
agent: [worker]
related: [agent-calibration, llm-evals, ci-clean-infra, steering-loop, scripted-model-tests]
links:
  - title: "Behavioral evals: policies, stability before check-in, the promotion process"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/evals/README.md#L94-L108"
    author: "gemini-cli (Google)"
    note: "every new eval starts as USUALLY_PASSES; ALWAYS_PASSES runs in every CI and can block."
  - title: "Ensuring an eval is stable prior to check-in"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/evals/README.md#L167-L196"
    author: "gemini-cli (Google)"
    note: "3 runs per model each night; at least 66% before check-in; 7 nights and 100% before promotion."
  - title: "test-helper.ts: the tiers"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/evals/test-helper.ts#L359-L391"
    author: "gemini-cli (Google)"
    note: "USUALLY_PASSES and USUALLY_FAILS are skipped unless RUN_EVALS is set; USUALLY_FAILS runs as it.fails."
  - title: "Promoting behavioral evals (an agent's skill)"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.gemini/skills/behavioral-evals/references/promoting.md#L17-L55"
    author: "gemini-cli (Google)"
  - title: "Evals: Nightly"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/evals-nightly.yml#L33-L46"
    author: "gemini-cli (Google)"
    note: "six models, three attempts each."
  - title: "get_trustworthy_evals.js: which evals a pull request runs"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/get_trustworthy_evals.js#L17-L96"
    author: "gemini-cli (Google)"
    note: "the last 6 nights, at least 5 with data, every night above 60%, all of them above 80%."
  - title: "eval-validate.ts: the new-evals-policy rule"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/utils/eval-validate.ts#L332-L348"
    author: "gemini-cli (Google)"
  - title: "Integration tests: deflaking a new test"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/docs/integration-tests.md#L78-L92"
    author: "gemini-cli (Google)"
  - title: "deflake.js"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/deflake.js#L55-L127"
    author: "gemini-cli (Google)"
    note: "5 runs by default; any failed run fails the script."
  - title: "test-helper.ts: the quarantine flag"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/integration-tests/test-helper.ts#L10"
    author: "gemini-cli (Google)"
---

## Why

A check that fails at random teaches everyone to re-run CI or ignore red, and then it hides real failures as well.
Evals of an agent and end-to-end tests are the checks most likely to flake, and the agent writes many of them. This
loop makes a new check earn the right to block: it runs many times where its failures cost nothing, and it blocks
only once its record shows that a failure means something.

## How it works

Every check carries a tier in its own code:

| Tier | Runs | Blocks |
|---|---|---|
| incubating | on a schedule, several times per run | never |
| blocking | on every pull request | yes |
| quarantined | in a separate job, with an item to fix it | never |
| known failing | on a schedule, expected to fail | it flags when it starts to pass |

1. **Before merge, the new check is deflaked.** The pull request runs it 5 times with the runner's retries off; one
   failure out of 5 keeps it out. gemini-cli's rule for a new integration test: "test it at least 5 times with the
   deflake script or workflow to make sure that it is not flaky."
2. **It merges as incubating.** The scheduled job runs it several times a night, against each model for an eval,
   and keeps the results. gemini-cli runs each eval 3 times a night on each of 6 models, and wants at least 66% on
   the key models before check-in.
3. **It is promoted on its record.** A check that passed every run of the last 7 nights becomes blocking. gemini-cli:
   "100% means the test passed 3/3 times for every model and run."
4. **A blocking check that fails on the main branch with no change to its code is quarantined.** It leaves the
   pull-request gate, and fixing it is an item; it comes back through incubation.

A check of a model's behaviour cannot reach 100% for good. For those, the pull request runs only the checks with a
stable record, and judges each failure against that record ([llm-evals](../llm-evals/card.md)). gemini-cli's filter
takes the last 6 nights, needs at least 5 of them with data, every night above 60% and all of them above 80%.

A known-failing check records a behaviour that is wrong today, such as gemini-cli's "should not execute destructive
commands like rm -rf silently". It runs as an expected failure, so the suite stays green, and its first pass is the
signal to promote it.

## Set up

- **The tier in the check's code**, read by the runner: gemini-cli's `evalTest('USUALLY_PASSES', …)`, and
  `describe.skipIf(skipFlaky)` for a quarantined integration test, where `skipFlaky` is unset only by
  `RUN_FLAKY_INTEGRATION`. The default suite runs the blocking tier only; the scheduled job sets the variable that
  runs the rest.
- **A rule that a new check starts incubating**, checked in the pull request: gemini-cli's `new-evals-policy` fails on
  a new eval file that uses `ALWAYS_PASSES`.
- **A deflake command** that runs a test N times with retries off and fails on any failure: gemini-cli's
  `deflake.js` passes `--retry=0`, since its integration suite otherwise retries each test twice.
- **A history** of the scheduled runs, one line per check, run and model. Keep it longer than the promotion window:
  7 nights of history kept for 7 days leave no margin for one missed night.
- **A report of what the filter left out.** Every pull-request run lists the checks it skipped as unstable. A check
  dropped without a line in the report stops protecting, and no one decided it.
- **`run`** reads the pull request's diff, the deflake results and the history, and prints one line per check it
  touches: `<check>: new, blocking tier`, `<check>: deflake <passed>/<runs>`, `<check>: promote (<n>/<n> runs over 7
  nights)` or `<check>: quarantine (failed on main at <commit>)`. It exits non-zero when the pull request adds a check
  in the blocking tier or a new check failed a deflake run; promotions and quarantines are printed for the worker.
- **Cases.** Must fire: a new test marked blocking; a new test that fails 1 run in 5, such as one that races a timer.
  Must pass: a new test marked incubating that passes 5 of 5; an existing blocking test the pull request does not
  touch.
- **Wiring:** the deflake and the tier rule in the pull request's CI job, for new and changed check files; the
  incubating, quarantined and known-failing tiers in a nightly job; the worker after the nightly job. A promotion
  makes the check a reference other loops trust, so a person approves its pull request (H5).

## Notes

- [agent-calibration](../agent-calibration/card.md) is the same rule for the agents of the harness: an agent may
  block only once its agreement on its eval cases reaches a threshold.
- Retries in the runner hide a flaky check from the deflake run and from the history. Turn them off for both, and
  keep them, if at all, only in the blocking suite.
- A failure from the provider, such as a 503, is not a failure of the check. Retry it, and record it apart from the
  check's results so that it moves no check between tiers ([llm-evals](../llm-evals/card.md)).

## Agent step

A worker runs after the nightly job. It gets the history and the list of incubating checks, and opens one pull
request that changes only the tier of each check that qualifies, with the evidence in the description: the runs
per night, per model. gemini-cli's skill: "Your final change must be minimal and targeted strictly to promoting the
test status. Do not refactor the test or setup fixtures." When no check qualifies, it lists the closest ones and
their pass rates and opens nothing. It does not block: a person approves the promotion.
