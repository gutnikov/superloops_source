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
links:
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
---

## Why

A response can be wrong or odd without raising an error, and nobody reads every response or every log line. A judge
reads a sample and marks the anomalies, so they reach remediation as a signal to start from. It reads a sample, not
everything, because a judge costs a lot to run and does not give the same answer every time.

## How it works

The judge is the loop's only step. The Agent step below says what it gets and what it returns.

The card's source does not say:

- whose responses the judge checks
- what counts as an anomaly
- where the marks go, or how the coding agent gets them and acts on them

## Set up

- `/response-quality-sampling`, `/log-anomalies` (Böckeler).

The source gives these two names and credits them to Böckeler. It does not say what they are, where to get them, or what they need to run.

## Notes

- The source advises this for inferential sensors in general: they cost a lot to run and do not give the same result every time, so run them on a sample only. The source does not say whether it counts the AI judge as an inferential sensor. It gives no sample rate and no cost figures.

## Agent step

The judge is the loop. It gets a sample and a rubric of what counts as an anomaly, and returns a Verdict per item.
Its marks are trusted only after a person graded a sample and the judge agreed with the person's grades
([agent-calibration](../agent-calibration/card.md)), and a sample audit checks the judge again later.
