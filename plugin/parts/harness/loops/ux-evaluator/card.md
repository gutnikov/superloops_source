---
id: ux-evaluator
title: "UX evaluator with thresholds"
summary: "A separate agent walks the app with Playwright MCP like a user, grades depth, functionality, design and code, and once calibrated fails a sprint below any threshold; the generator gets a breakdown."
sensor: inferential
ilities: [usability, correctness]
places: [delivery/gate]
stages: [sprint]
speed: [minutes]
needs: [browser]
agent: [explorer, judge]
related: [llm-judge-calibration, verification-subagent, e2e-browser, visual-screenshot-check]
links:
  - title: "Harness design for long-running application development"
    url: "https://www.anthropic.com/engineering/harness-design-long-running-apps"
    author: "Prithvi Rajasekaran, Anthropic"
    note: "2026: a planner, a generator and an evaluator; sprint contracts, criteria with hard thresholds."
  - title: "Playwright MCP"
    url: "https://playwright.dev/mcp/introduction"
    author: "Playwright"
---

## Why

Without this loop, a sprint can pass while the running app falls short for the person who uses it. The evaluator
catches shortfalls in depth, functionality, design and code, and tells the generator what failed, not just a bare
verdict.

## How it works

Before a sprint, the generator, the agent whose work is graded, and the evaluator agree on a sprint contract: what
the sprint builds and how each item will be checked. After the sprint, the evaluator walks through the running app
with Playwright MCP the way a user would, and grades it on four criteria: product depth, functionality, visual design
and code quality. The evaluator is two agents: an explorer that walks the app, and a judge that grades the walk (see
Agent step).

If any criterion is below its threshold, the sprint fails, and the generator gets a breakdown per item of the
contract. In Rajasekaran's harness, the item "User can reorder animation frames via API" failed with
"PUT /frames/reorder route defined after /{frame_id} routes". The generator fixes what failed, and the evaluator walks
again.

## Set up

- **A sprint contract per sprint**, in the repository (`sprints/<n>/contract.md`, say): the generator proposes what it
  will build and how success will be checked, the evaluator reviews it, and they revise it until both agree. The
  generator cannot change it once the sprint starts.
- **The rubric and the thresholds**: the four criteria, what passes on each, and a hard threshold per criterion, in
  the judge's prompt and the loop's `LOOP.md`. The thresholds are a reference a person approves (H5).
- **The explorer's tools.** Playwright MCP (`claude mcp add playwright npx @playwright/mcp@latest`) or, for an app
  with Playwright fixtures and Page Objects, the [`app-probing`](../../../app-probing/README.md) part. It walks every
  item of the contract and records each step, screenshot, console error and failed request.
- **Calibrate the judge.** One expert grades a sample of walks pass or fail with a critique, and the judge's prompt
  is revised until its grades agree ([llm-judge-calibration](../llm-judge-calibration/card.md)). Until then its grades
  are advice. Rajasekaran calibrated his evaluator the same way: few-shot examples with detailed score breakdowns,
  then rounds of reading its logs and revising its prompt where its judgement differed from his.
- **A limit on rounds.** After 3 failed walks of the same sprint, the loop stops and shows a person the breakdowns:
  either the contract asks for too much (H1) or the judge is wrong, which is an outcome to log.
- **`run`** gives the judge the contract and the explorer's record and prints one line per criterion,
  `<criterion>: <score> (threshold <t>): pass|fail`, then each failed item with its evidence. It exits 1 when any
  criterion is below its threshold, only once the judge is `gate` in `superloops/agents.yaml`; until then it exits 0.
- **Cases.** Must fire: a build where one contract item does nothing in the app (an API route shadowed by another);
  a build where a feature is a stub behind a working screen. Must pass: a build that meets its contract. Recorded
  walks of these builds are also the judge's eval cases.
- **Wiring**: the orchestrator of the sprints runs the loop at the end of each sprint, not the generator. The
  evaluator runs in its own session, with no Edit or Write tool on the product, and gets the contract and the app,
  never the generator's reasoning.

## Notes

- Rajasekaran: "Out of the box, Claude is a poor QA agent." He watched it find real issues, then talk itself into
  deciding they were not a big deal, and test superficially instead of probing edge cases. After several rounds of
  tuning, its grading was one he "found reasonable", and some subtle bugs still got through.
- Rajasekaran reports a solo run at 20 minutes and $9, and a run of the full harness (planner, generator and
  evaluator) at 6 hours and $200: "The harness was over 20x more expensive, but the difference in output quality was
  immediately apparent." The difference is not the cost of this loop alone.
- On when to use it: "It is worth the cost when the task sits beyond what the current model does reliably solo."
  With a stronger model, Rajasekaran dropped the sprints and ran the evaluator once, at the end of the run; the
  contract and the thresholds work the same way for one pass.

## Agent step

Two agents: an explorer walks the app the way a user would and records what it saw; a judge grades the walk on the
rubric (product depth, functionality, visual design, code quality). The judge fails a sprint only after a person has
graded a sample of walks, its grades agree with the person's
([llm-judge-calibration](../llm-judge-calibration/card.md)), and it is `gate`
([agent-calibration](../agent-calibration/card.md)). Until then, the judge's grades are advice.
