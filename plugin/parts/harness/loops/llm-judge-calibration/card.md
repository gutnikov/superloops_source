---
id: llm-judge-calibration
title: "Calibrating an LLM judge on an expert (critique shadowing)"
summary: "One expert grades a sample pass or fail, each with a critique; the judge's prompt is revised until its grades agree. The graded sample becomes the judge's eval cases."
sensor: human
ilities: [alignment]
places: [harness:delivery/oracle]
stages: [scheduled]
speed: [hours]
needs: []
when: [after]
initiator: rule
sync: async
assesses: [result]
related: [agent-calibration, llm-evals, ai-judges-telemetry, ux-evaluator]
links:
  - title: "Using LLM-as-a-Judge For Evaluation: A Complete Guide"
    url: "https://hamel.dev/blog/posts/llm-judge/"
    author: "Hamel Husain"
    note: "critique shadowing, step by step"
  - title: "Creating a LLM-as-a-Judge that drives business results"
    url: "https://simonwillison.net/2024/Oct/30/llm-as-a-judge/"
    author: "Simon Willison"
    note: "a retelling of Hamel Husain's method"
---

## Why

An expert cannot grade every result. An LLM judge can grade them all, but its grades mean little until they are
checked against the expert's. This loop gets the expert's grades once, in a form the judge can be scored against,
and keeps them as the judge's eval cases. It takes hours of the expert's time; after that the judge takes seconds
per grade.

## How it works

Critique shadowing, Hamel Husain's method:

1. One principal expert grades a sample of results. For each result the expert answers pass or fail to "Did the AI
   achieve the desired outcome?" and writes a critique that explains why, detailed enough for a new employee to
   follow. No 1–5 scales.
2. The critiques become few-shot examples in the judge's prompt.
3. The judge grades the same sample. Where it disagrees with the expert, the prompt is revised, round after round,
   until they agree.
4. The graded sample stays as the judge's eval set. [agent-calibration](../agent-calibration/card.md) scores the
   judge against it before the judge may block, and again when its prompt or model changes.

The person gives the oracle; agent-calibration does the scoring and decides whether the judge may block. A judge
calibrated this way serves [eval suites](../llm-evals/card.md), [AI judges on telemetry](../ai-judges-telemetry/card.md),
the [UX evaluator](../ux-evaluator/card.md), and the judges of the harness itself.

## Set up

- **One expert, named in the loop's `LOOP.md`**: the person whose judgement the product has to satisfy. Grades from
  several people contradict each other. Do not let a developer or a manager stand in: Hamel Husain calls a
  convenient proxy "a recipe for disaster".
- **The sample** comes from real use and covers the kinds of input the judge will see. Start with 50–100 results,
  with failures well represented, about half if the data allows.
- **The call to the expert** is H5, a person's grades for calibrating an LLM judge, logged with `loops.py hitl H5
  --loop <id> …`. The grades become eval cases in `superloops/agents/<judge>/evals/`: the input, the result, and an
  `expected.json` with the verdict and the critique (`agent-formats.md`, Evals). `human_grades: true` in
  `superloops/agents.yaml` records that a person graded them; `loops.py check` refuses a judge at `gate` without it.
- **Measure the true-positive and true-negative rates separately**, not raw agreement. With 5% failures, a judge
  that always says pass agrees 95% of the time and catches nothing. The threshold is a reference the expert or the
  owner approves under H5.
- **The harness engineer revises the prompt**; the expert only grades. A judge that stays below the threshold after
  a few revisions is split into narrower judges, one per criterion, or stays advisory.
- **Grade again later.** Hamel Husain: "This process never truly ends. It repeats periodically or when material
  changes occur." On a schedule, a [sample audit](../sample-audit/card.md) gives the expert a fresh random sample of
  the judge's verdicts; each disagreement becomes a new eval case.
- **Validation** is `manual`: the expert's grades are the reference. A script still checks that every case has a
  verdict and a critique, and `loops.py eval-score` scores the judge against them.

## Notes

- At Honeycomb, Hamel Husain reached more than 90% agreement between the judge and the expert in three iterations,
  on a set where about half the results failed.
- He calls building a judge "a nice 'hack' I use to trick people into carefully looking at their data".
