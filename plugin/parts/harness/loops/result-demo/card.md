---
id: result-demo
title: "Result demo"
summary: "The agent shows the working feature: a link to a preview environment, screenshots, a before/after video, recorded command output. The person judges the behaviour, not the code."
sensor: human
ilities: [alignment, correctness]
places: [delivery/gate, discovery/confirmation]
stages: [task]
speed: [minutes]
needs: []
when: [after]
initiator: agent
assesses: [result]
related: [preview-environments, agent-audit-trail, human-diff-review, human-acceptance-criteria]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "ask for evidence: the command Claude ran and its output, or the screenshot; /verify."
  - title: "Videos"
    url: "https://playwright.dev/docs/videos"
    author: "Playwright"
  - title: "Human-in-the-loop cycles (in Russian)"
    author: "Alexander Gutnikov"
    note: "unpublished note, 2026-11-08"
---

## Why

Tests show that the code does what the tests say; they do not show that it is what the person wanted. Seeing the
feature work, the person can judge that in minutes, without reading the code. Real output and recordings, not a
description of what should work, keep the agent from claiming a result it does not have.

## How it works

Once the task's automated checks are green, the agent shows the working feature: a link to a preview environment
with a user to log in as, screenshots, a before/after video, recorded command output. The person judges the
behaviour, not the code, and answers pass or fail with a reason. A fail comes back as a test or a spec change; the
agent fixes the work and demos it again.

The demo runs on a [preview environment](../preview-environments/card.md), and its evidence is what the
[audit trail of agent actions](../agent-audit-trail/card.md) keeps. [app-probing](../../../app-probing/README.md)
(a part of superloops) gives the demo the URL and credentials to open the state by hand, a full-page screenshot, or
a browser held open with `--headed`.

## Set up

- **Green before shown.** The agent demos only after the gate's automated checks pass. In Claude Code, `/verify`
  "has Claude build and run the app and look at the result": run it before the demo, so the person does not spend
  minutes on what the agent could see itself.
- **Evidence, not claims.** Each acceptance criterion of the task gets a file a command produced: a screenshot of
  the state, a video, or the command with its real output. Claude Code's best practices say the same: ask for
  "the command it ran and its output, or the screenshot". For a video, Playwright's `video: 'on'` records each
  test, and the file appears in the test output directory, typically `test-results`, once the browser context
  closes. The files go in one folder per task, listed in the pull request.
- **One task per demo**, short enough for 5 minutes of the person's time. A longer demo means the task was too big
  to judge at once.
- **Nothing visible to show.** A refactor has no demo: it is maintenance, and
  [behaviour-invariance](../behaviour-invariance/card.md) is its gate. A library or an API change is shown by a
  short script that calls it, with its output.
- **Where it runs** is decided once, in the loop's `LOOP.md`: the pull request's preview environment, or, without
  one, the app started from a clean worktree ([isolated-environment](../isolated-environment/card.md)). If it does
  not come up, there is no demo: the agent fixes the deploy first.
- **Called under H1.** Whether the result is what the person meant is intent, and only they know it. The agent asks
  through the session's question tool (`AskUserQuestion` in Claude Code) with 2–4 options, the recommended one
  first: `pass`, `fail: <what differs>`, and a free answer. It logs the call: `loops.py hitl H1 --loop <loop-id>
  --checked "<the evidence shown>" --question "…" --answer "…"`.
- **Where the answer goes.** A fail's reason becomes a failing acceptance test or a changed requirement (the
  [`spec`](../../../spec/README.md) part), and a correction at the phase that missed it: `loops.py trace correction
  delivery/oracle --item <task> --note "<reason>"`. A screenshot the person approves as how a screen should look
  becomes the reference of a [visual check](../visual-screenshot-check/card.md), under H5.
- **Validation is `manual`**: no case can stand in for the person's verdict. What `run` checks is the evidence: one
  line per acceptance criterion, `<criterion>: <status>` (`shown`, `no evidence`, `file missing`, `text only`),
  and a non-zero exit while any criterion is not `shown`. Must fire: a folder missing the screenshot of one
  criterion; a video path that does not exist; a criterion backed only by the agent's prose. Must pass: a file a
  command produced for every criterion.
- **Wiring.** The evidence check runs as a CI job on the pull request, out of the agent's working tree, and the demo
  is the task's last step before the merge. Below `autonomy: merge` the merge is the person's anyway; at `merge`
  and above, a required approval on the protected branch keeps the agent from merging before the person's `pass`.

## Notes

- A demo shows behaviour, not how the code is built. Where the structure matters, pair it with [code review by
  another agent](../agent-code-review/card.md) or a [person's diff review](../human-diff-review/card.md).
- In discovery the demo shows a prototype or a spike's result, and the person's answer is the decision
  ([discovery-decision](../discovery-decision/card.md)).
