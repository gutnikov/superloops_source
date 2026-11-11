---
id: verification-subagent
title: "Verification subagent"
summary: "When the working agent says a task is done, a separate subagent with a fresh context tries to prove the claim wrong."
sensor: inferential
ilities: [correctness]
places: [delivery/gate, remediation/gate, maintenance/gate, discovery/gate]
stages: [task]
speed: [minutes]
needs: []
agent: [refuter]
related: [acceptance-loop, reproduction-gate, agent-code-review, stop-hook]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "review by a fresh subagent that never saw the conversation; ask for evidence"
  - title: "Create custom subagents"
    url: "https://code.claude.com/docs/en/sub-agents"
  - title: "Boris Cherny on X"
    url: "https://x.com/bcherny/status/2007179861115511237"
    note: "a verify-app subagent"
---

## Why

The agent that did the work grades it with the same reasoning that produced it, so it tends to confirm its own
claim. The verification subagent gets the claim and the requirement, not that reasoning, and tries to prove the claim
wrong by running the tests and opening the app. A claim of done then rests on evidence, not on the word of the agent
that made it.

## How it works

1. The working agent says a task is done.
2. A separate subagent starts with a fresh context: the claim, the requirement and the repository, never the working
   agent's conversation.
3. It reads the diff, runs the tests and, for a web app, opens the app and walks the requirement's scenario.
4. It returns a Verdict: `fail` with the reasons and the evidence (a command and its output, a screenshot), or
   `pass`.
5. On `fail`, the working agent fixes the work and claims done again, and a new subagent checks from scratch.

One round takes minutes. The verification subagent can be the fourth role of the
[acceptance loop](../acceptance-loop/card.md), next to the spec writer, the test writer and the implementing agent.

## Set up

- **Its definition**, `.claude/agents/verify.md` or the project's own (Boris Cherny's is named `verify-app`): a
  prompt that says to prove the claim wrong, tools to run the tests and open the app, and no Edit or Write tool. It
  runs in a scratch worktree, so whatever a command writes is thrown away.
- **What it gets**: the claim of done, the requirement (the spec, the ticket or the acceptance criteria) and the
  range of the diff, never the working agent's reasoning. Claude Code's `/code-review` runs in a fresh subagent for
  the same reason: "It isn't swayed by the reasoning that produced the code."
- **For a web app**, the [`app-probing`](../../../app-probing/README.md) part lets it open the app and check the
  claim there, not only in the diff.
- **`run`** starts the subagent with the `claude` CLI in print mode (`claude -p`), passes the claim and the
  requirement, and reads the Verdict. It prints the verdict and exits 1 on `fail` only once the agent is `gate` in
  `superloops/agents.yaml`; until then it exits 0 and the verdict advises.
- **A limit on rounds.** After 3 `fail` verdicts on the same claim, the loop stops and shows the person the evidence:
  either the work cannot meet the requirement as written (H1) or the subagent is wrong, which is an outcome to log.
- **Evals**, in `superloops/agents/<id>/evals/`. Must fire: a feature whose unit tests pass but which fails in the
  app; a claim of done with a test skipped; a change that leaves one of the requirement's examples unmet. Must pass:
  a complete, correct change. Each run three times and scored with `loops.py eval-score <id> --record`.
- **Wiring**: the loop's `run` at the gate, at the end of the task or as a CI job on the pull request. Log what
  happened to each verdict: `loops.py outcome <id> --loop <loop> --outcome confirmed|false-positive|missed|overridden`.

## Agent step

The verification subagent is a refuter. It gets the claim of done and the requirement, not the working agent's
reasoning; it may run the tests and open the app (`app-probing`), and changes nothing. It returns a Verdict with
evidence. Its verdict fails the loop only once the subagent is calibrated on claims known to be true and false
([agent-calibration](../agent-calibration/card.md)).
