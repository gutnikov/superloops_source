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
  - title: "/review-and-fix (a command)"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.gemini/commands/review-and-fix.toml#L74-L90"
    author: "gemini-cli (Google)"
    note: "the manager verifies each worker's ticket by running the checks, then reverts or commits."
  - title: "math-olympiad: clean the solution, then verify adversarially"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-olympiad/skills/math-olympiad/SKILL.md#L142-L208"
    author: "Anthropic"
    note: "fresh verifiers with no tools; 4 HOLDS confirm, 2 HOLE FOUND refute; stop once the outcome is decided."
  - title: "math-olympiad: the interpretation check"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-olympiad/skills/math-olympiad/SKILL.md#L71-L81"
    author: "Anthropic"
  - title: "math-olympiad: revise, then vote again"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/math-olympiad/skills/math-olympiad/SKILL.md#L238-L253"
    author: "Anthropic"
  - title: "claude-security: the patch verifier"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/claude-security/agents/patch-verifier.md#L12-L50"
    author: "Anthropic"
    note: "TARGETED, NO_NEW_VULNERABILITY, BEHAVIOUR_UNCHANGED, each CONFIDENT, NOT_CONFIDENT or UNSURE."
  - title: "claude-security: judging a patch, and one revision round"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/claude-security/skills/claude-security/jobs/suggest-patches.md#L82-L88"
    author: "Anthropic"
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

## Notes

- An orchestrator that hands tickets to workers checks each the same way: by running, not by reading the worker's
  report. gemini-cli's `/review-and-fix` turns review findings into tickets and spawns one worker per ticket; the
  manager's rule is "IGNORE worker logs. DIRECTLY verify" with `git status`, `git diff`, build, tests, lint and type
  check. A ticket that fails is reverted with `git reset --hard`, and one that passes is committed, so every commit
  on the branch passed the checks on its own.

- **A vote, when one refuter is not enough.** Anthropic's math-olympiad skill strips the solver's reasoning and false
  starts before anyone checks the result: "The thinking trace biases the verifier toward agreement". Then up to 5
  fresh verifiers, with no tools and blind to each other's verdicts, attack the result with named checks. 4 that find
  it holds confirm it; 2 that find a hole refute it, "one flaky verifier shouldn't kill a correct proof; but two
  independent dissents is a real signal"; no more verifiers start once the outcome is decided. A reviser gets only the
  result and the hole, marks what it cannot close as `[GAP: …]`, and after 3 failed revisions the answer is "no
  confident solution". Before any of it, list 2 or 3 readings of the task and say which one is being solved.
- **Named claims for a fix.** The plugin's patch verifier starts at REJECT, derives the diff itself, runs the
  project's tests without installing anything, and states three claims, each `CONFIDENT`, `NOT_CONFIDENT` or `UNSURE`
  with one line of evidence: every hunk traces to the finding (`TARGETED`), the change opens no new attack path
  (`NO_NEW_VULNERABILITY`), and the code does what it did for every legitimate caller (`BEHAVIOUR_UNCHANGED`; "Any
  change to which inputs the code accepts is a behaviour change"). A separate adversary looks for an attack path the
  change opens or leaves. An objection gets one revision round from a clean workspace and fresh agents; a second
  objection or any `UNSURE` declines the fix. A fix that passes becomes a patch file a person applies.

## Agent step

The verification subagent is a refuter. It gets the claim of done and the requirement, not the working agent's
reasoning; it may run the tests and open the app (`app-probing`), and changes nothing. It returns a Verdict with
evidence. Its verdict fails the loop only once the subagent is calibrated on claims known to be true and false
([agent-calibration](../agent-calibration/card.md)).
