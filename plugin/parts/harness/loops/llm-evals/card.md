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
related: [llm-judge-calibration, agent-calibration, ai-judges-telemetry]
links:
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
  runs on a different model from the feature's.
- **Three runs per case** (`--repeat 3`), because the output differs from run to run. A case that passes in some runs
  and fails in others is shown as flaky, not averaged away.
- **A baseline and a threshold.** The pass rate on the base branch is stored with the suite. A change fails when its
  pass rate falls below the threshold, or below the baseline by more than the spread between runs on the base
  branch. The threshold is a reference a person approves (H5), written in the loop's `LOOP.md`; with promptfoo,
  `PROMPTFOO_PASS_RATE_THRESHOLD` sets it, and it is 100% when not set.
- **`run`** runs the suite (`npx promptfoo eval --repeat 3 -o results.json`) and prints one line per failed case,
  `<case>: <assertion>: <reason>`, then `pass rate <now>% (baseline <b>%, threshold <t>%)`. It exits non-zero on a
  drop. A drop that only the judge's grades show fails the change only once the judge is `gate` in
  `superloops/agents.yaml`; until then `run` prints it and exits 0.
- **Cases.** Must fire: a copy of the prompt with its output-format instruction removed, so `is-json` fails; a copy
  that drops the instruction to answer only from the given document, so the judge's faithfulness case fails. Must
  pass: the prompt on the base branch.
- **Wiring**: the agent runs the evals locally after each change to a prompt; a CI job runs them on every pull request
  that touches a prompt or the model's configuration. The CI job takes the suite, the baseline and the threshold
  from the base branch, so a case deleted or a threshold lowered in the same pull request still counts against it.

## Notes

- Anthropic's guide on the graders: code-based grading is "Fastest and most reliable, extremely scalable"; human
  grading is "slow and expensive. Avoid if possible."; LLM-based grading: "Test to ensure reliability first, then
  scale." It also advises grading "with a different model from the one used to generate the evaluated output".
- `promptfoo eval` exits with code 100 when at least one test case fails and 1 on any other error.
- [agent-calibration](../agent-calibration/card.md) is the same loop for the agents of the harness itself.

## Agent step

When a metric needs judgement (a summary is faithful, a reply is helpful), the grader is a judge. One expert grades
a sample of outputs pass or fail with a critique, and the judge's prompt is revised until it agrees
([llm-judge-calibration](../llm-judge-calibration/card.md)); its grades fail a change only once it is `gate`
([agent-calibration](../agent-calibration/card.md)). A metric a script computes needs no agent.
