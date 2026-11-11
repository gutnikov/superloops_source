---
id: ai-judges-telemetry
title: "AI judges on telemetry"
summary: "An AI judge is an LLM that checks a sample of responses and a sample of logs. It marks the anomalies it finds."
sensor: inferential
ilities: [usability, correctness]
places: [remediation/entry]
stages: [continuous]
speed: [minutes]
needs: [logs]
agent: [judge]
related: [triage, llm-judge-calibration, llm-evals, sample-audit]
links:
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Birgitta Böckeler"
    note: "AI judges sampling response quality and flagging log anomalies, among continuous runtime sensors."
  - title: "Define success criteria and build evaluations"
    url: "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests"
    author: "Anthropic"
    note: "LLM-based grading: clear rubrics, a pass or fail output, reliability tested before scaling."
---

## Why

A response can be wrong or odd without raising an error, and nobody reads every response or every log line. A judge
reads a sample and marks the anomalies, so they reach remediation as a signal to start from. It reads a sample, not
everything, because a judge costs a lot to run and does not give the same answer every time.

## How it works

A job takes a sample from production for a window: responses of the product, and log lines. The judge reads each
item against a rubric of what counts as an anomaly and marks it `pass` or `fail` with a reason. Each `fail` becomes a
signal for [triage](../triage/card.md), which merges it with any open item on the same thing and routes it, usually to
remediation, where it gets a reproduction before any fix.

## Set up

- **What is sampled.** The product's responses that no script can judge: the answers of an LLM feature, generated
  text, search results. In the logs: warnings and errors that no alert rule matches. Start with the responses of the
  LLM feature, since no error rate shows when they go wrong, and write the choice in the loop's `LOOP.md`.
- **The rubric**, in the judge's prompt, as pass or fail criteria with an example each. For responses: answers a
  different question, contradicts its input, leaks internal data or another user's data, comes in the wrong
  language. For logs: a silent failure, such as a fallback taken, a retry storm or a swallowed exception.
- **The sample.** By default 100 responses a day at random, plus every response a user flagged: a random sample keeps
  the cost fixed as traffic grows. Log lines are grouped by their message template first, and the judge reads one
  example of each group that is new in the window.
- **A snapshot, then a verdict.** The job saves the sample into a directory, with each item's id, time, version and
  text; `run` judges the snapshot, so a window can be judged again.
- **Calibrate the judge before its marks count.** One expert grades a sample pass or fail with a critique, and the
  judge's prompt is revised until it agrees ([llm-judge-calibration](../llm-judge-calibration/card.md)). Until the
  judge is `gate`, a person confirms its marks before they go to triage.
- **`run`** prints one line per item, `<item id>: ok` or `<item id>: anomaly: <criterion>: <reason>`, and exits
  non-zero when any item is an anomaly and the judge is `gate`; otherwise it exits 0 and the marks are advice.
- **Cases are recorded samples.** Must fire: a response that answers a different question; a response with a stack
  trace or another user's email in it; a log window with a retry storm. Must pass: a window of normal responses and
  logs. They are also the judge's eval cases.
- **Wiring**: a scheduled job outside any agent's session pulls the sample from the logs, runs `run`, and files each
  anomaly as a signal for triage. The coding agent reads the signals and cannot change the rubric, the sample or the
  job: they live in the loop's folder and change through review.

## Notes

- Böckeler lists "AI judges continuously sampling response quality and flagging log anomalies" among the sensors of
  continuous runtime feedback, and says inferential sensors are "Slower and more expensive; results are more
  non-deterministic."
- Anthropic's guide on evaluations calls LLM-based grading "Fast and flexible, scalable and suitable for complex
  judgment. Test to ensure reliability first, then scale."
- A confirmed anomaly is a good eval case for the feature itself ([llm-evals](../llm-evals/card.md)), so the same
  failure is caught before the next release.

## Agent step

The judge is the loop. It gets one sampled item and the rubric, and returns a Verdict per item, with the criterion
it breaks as the reason. Its marks reach triage on their own only once it is calibrated on a person's grades
([llm-judge-calibration](../llm-judge-calibration/card.md)) and is `gate`
([agent-calibration](../agent-calibration/card.md)); a [sample audit](../sample-audit/card.md) checks it again later.
