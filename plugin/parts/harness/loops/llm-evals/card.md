---
id: llm-evals
title: "Eval suites for LLM features"
summary: "The agent changes a prompt and runs the evals; a drop in the metric counts as a failure."
sensor: computational
ilities: [correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [minutes]
needs: []
agent: [judge]
related: [llm-judge-calibration, agent-calibration, ai-judges-telemetry, guide-lift-eval, scripted-model-tests]
links:
  - title: "Pi evals"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/evals/README.md"
    author: "pi (earendil-works)"
    note: "a fresh container per run, a planned cohort, missing results kept apart from failures."
  - title: "get_trustworthy_evals.js: which evals gate a pull request"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/get_trustworthy_evals.js#L18-L21"
    author: "gemini-cli (Google)"
    note: "the last 6 nightly runs; at least 5 of them, every night above 60%, the total above 80%."
  - title: "run_regression_check.js: retries, then a check on main"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/run_regression_check.js#L126-L223"
    author: "gemini-cli (Google)"
    note: "up to 4 runs in the pull request, up to 3 on main; pre-existing or regression."
  - title: "withEvalRetries: provider errors kept apart"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/evals/test-helper.ts#L55-L91"
    author: "gemini-cli (Google)"
  - title: "Fixing behavioral evals (an agent skill)"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.gemini/skills/behavioral-evals/references/fixing.md#L28-L64"
    author: "gemini-cli (Google)"
    note: "fix the system prompt or tool descriptions first; a fix must not cheat through the test's GEMINI.md or prompt."
  - title: "LLMJudge.judgeYesNo"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/evals/llm-judge.ts#L33-L112"
    author: "gemini-cli (Google)"
    note: "a YES/NO question asked N times in parallel, decided by plurality."
  - title: "changed_prompt.js: when a diff changes the prompt"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/changed_prompt.js#L8-L21"
    author: "gemini-cli (Google)"
  - title: "CODEOWNERS: prompts, tools and evals to one team"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/CODEOWNERS#L19-L22"
    author: "gemini-cli (Google)"
  - title: "eval-validate.ts: the positive-assertion rule"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/scripts/utils/eval-validate.ts#L207-L230"
    author: "gemini-cli (Google)"
  - title: "Define success criteria and build evaluations"
    url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests"
    author: "Anthropic"
    note: "task-specific evals with edge cases; code-based, human and LLM-based grading."
  - title: "promptfoo: command line"
    url: "https://www.promptfoo.dev/docs/usage/command-line/"
    author: "promptfoo"
    note: "promptfoo eval, its exit codes, --repeat, the pass-rate threshold."
  - title: "promptfoo: assertions and metrics"
    url: "https://www.promptfoo.dev/docs/configuration/expected-outputs/"
    author: "promptfoo"
    note: "deterministic and model-graded assertions, weights, the test-level threshold."
---

## Why

The output of an LLM feature differs from run to run, so one good example says little about a prompt change. Evals
run the feature on a suite of cases against thresholds, and a drop in the metric fails the change. Without them, a
prompt that got worse on cases nobody looked at goes out unnoticed.

## How it works

1. The agent changes a prompt, or the model or a parameter the feature uses.
2. The agent runs the evals in the repository. They run the LLM feature on each case in the suite and grade each
   output.
3. The evals compare the pass rate with the baseline and the threshold. A drop fails the change, and the agent reads
   the failed cases, fixes the prompt and runs the evals again.

A script grades what it can: an exact value, a substring, valid JSON, a regular expression, a function. A judge grades
what needs judgement, such as whether a summary is faithful (see Agent step).

## Set up

- **The suite**, in the repository next to the feature (`evals/<feature>/`): cases from real use, plus the edge
  cases Anthropic's guide names, such as irrelevant input, overly long input and ambiguous cases. With promptfoo,
  `promptfooconfig.yaml` holds the prompts, the providers and the tests; `promptfoo eval` reads it by default.
- **Code before a judge.** Each case gets deterministic assertions where they can decide (`equals`, `contains`,
  `is-json`, `regex`, `javascript`, `python`), and a model-graded one (`llm-rubric`) only for the rest. The judge
  runs on a different model from the feature's. A yes/no question to the judge is asked 3 times in parallel and
  decided by a plurality; gemini-cli's `judgeYesNo` counts the votes and puts each raw answer in the failure.
- **Each case asserts what the agent did.** For an agent with tools, a lint rejects a case with no positive assertion
  on a tool call, and a case may not restrict the tools, so it runs against the default set (gemini-cli's
  `eval:validate` and `ForbiddenToolSettings`).
- **Three runs per case** (`--repeat 3`), because the output differs from run to run. A case that passes in some runs
  and fails in others is shown as flaky, not averaged away.
- **A baseline and a threshold.** The pass rate on the base branch is stored with the suite. A change fails when its
  pass rate falls below the threshold, or below the baseline by more than the spread between runs on the base
  branch. The threshold is a reference a person approves (H5), written in the loop's `LOOP.md`; with promptfoo,
  `PROMPTFOO_PASS_RATE_THRESHOLD` sets it, and it is 100% when not set.
- **Each run starts clean, and missing is not zero.** For a feature that acts, such as an agent with tools, each run
  gets a new workspace and session, so one run's files cannot help the next. Every `(case, run)` is planned before
  anything runs; a run that errored or produced no grade is reported as missing, never as a failure or a zero, and a
  comparison with a missing run is withheld. Pi's evals work this way, with a fresh container per run. A provider's
  outage is missing too: gemini-cli retries a case that failed on a 500 or 503 up to 3 times, then skips it and
  appends the event to `evals/logs/api-reliability.jsonl`, so outages are counted apart from behaviour.
- **A pull request is gated by stable cases, and a failure is checked on the base branch.** A case blocks a pull
  request only once its history is stable; gemini-cli's gate takes the last 6 nightly runs and keeps a case with at
  least 5 of them, every night above 60% and the total above 80%. A case that fails gets up to 4 runs: 2 passes clear
  it as noise; 3 failures send it to the base branch for up to 3 runs. It fails there as well: pre-existing, not this
  change's. It passes there: a regression.
- **The failure names the fix and forbids the shortcut.** Each regression in the report carries the command that
  reproduces it and a prompt the agent can take (gemini-cli: `The eval "<name>" in <file> is failing. Investigate and
  fix it using the behavioral-evals skill.`). The agent fixes the feature's prompt or tool descriptions; it changes
  the case's prompt only as a last resort, and never makes the case pass by editing its own context file or
  prompt.
- **`run`** runs the suite (`npx promptfoo eval --repeat 3 -o results.json`) and prints one line per failed case,
  `<case>: <assertion>: <reason>`, then `pass rate <now>% (baseline <b>%, threshold <t>%)`. It exits non-zero on a
  drop. A drop that only the judge's grades show fails the change only once the judge is `gate` in
  `superloops/agents.yaml`; until then `run` prints it and exits 0.
- **Cases.** Must fire: a copy of the prompt with its output-format instruction removed, so `is-json` fails; a copy
  that drops the instruction to answer only from the given document, so the judge's faithfulness case fails. Must
  pass: the prompt on the base branch.
- **Wiring**: the agent runs the evals locally after each change to a prompt; a CI job runs them on every pull request
  that touches a prompt or the model's configuration. Tool descriptions and schemas are prompt: gemini-cli's
  `changed_prompt.js` also matches a diff that touches a tool definition, and runs the evals when it cannot tell.
  The CI job takes the suite, the baseline and the threshold from the base branch, so a case deleted or a threshold
  lowered in the same pull request still counts against it. The prompts, the tool definitions and the evals have one
  set of code owners, so a pull request that changes a prompt and the eval that grades it needs the same reviewers
  for both: gemini-cli's CODEOWNERS sends `/packages/core/src/prompts/`, `/packages/core/src/tools/` and `/evals/`
  to its prompt approvers.

## Notes

- Anthropic's guide on the graders: code-based grading is "Fastest and most reliable, extremely scalable"; human
  grading is "slow and expensive. Avoid if possible."; LLM-based grading: "Test to ensure reliability first, then
  scale." It also advises grading "with a different model from the one used to generate the evaluated output".
- `promptfoo eval` exits with code 100 when at least one test case fails and 1 on any other error.
- [agent-calibration](../agent-calibration/card.md) is the same loop for the agents of the harness itself. To measure a
  guide with and without a change, see [guide-lift-eval](../guide-lift-eval/card.md); to test the code around the
  model without a real model, see [scripted-model-tests](../scripted-model-tests/card.md).

## Agent step

When a metric needs judgement (a summary is faithful, a reply is helpful), the grader is a judge. One expert grades
a sample of outputs pass or fail with a critique, and the judge's prompt is revised until it agrees
([llm-judge-calibration](../llm-judge-calibration/card.md)); its grades fail a change only once it is `gate`
([agent-calibration](../agent-calibration/card.md)). A metric a script computes needs no agent.
