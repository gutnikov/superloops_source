---
id: agent-code-review
title: "Code review by another agent"
summary: "The coding agent asks one or more reviewer agents, each with a fresh context, for a review, and fixes their comments until the reviewers are satisfied."
sensor: inferential
ilities: [maintainability, correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local]
speed: [minutes]
needs: []
agent: [reviewer]
related: [verification-subagent, security-review-agent, human-diff-review, agent-calibration]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "Review locally with /code-review"
    url: "https://code.claude.com/docs/en/code-review-local"
    author: "Anthropic"
  - title: "Create custom subagents"
    url: "https://code.claude.com/docs/en/sub-agents"
    author: "Anthropic"
  - title: "Commands"
    url: "https://code.claude.com/docs/en/commands"
    author: "Anthropic"
    note: "/simplify and /code-review."
  - title: "/pr: review PRs (a prompt template)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.pi/prompts/pr.md"
    author: "pi (earendil-works)"
  - title: "Caretaker agent: the PR generator's orchestrator"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/tools/caretaker-agent/cloudrun/pr-generator/workflow/orchestrator.py#L228-L321"
    author: "gemini-cli (Google)"
    note: "coder and evaluator rounds, the 500-line limit, a person after the last attempt."
  - title: "Caretaker agent: the evaluator's prompt"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/tools/caretaker-agent/cloudrun/pr-generator/agent_prompts/code_evaluator_prompt.md#L74-L96"
    author: "gemini-cli (Google)"
    note: "the linter's output is read, not run; lint is judged only on the files in the diff."
  - title: "async-pr-review: the review script"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.gemini/skills/async-pr-review/scripts/async-review.sh#L70-L157"
    author: "gemini-cli (Google)"
    note: "CI's result reused, only the failing test files re-run, the change exercised by hand."
---

## Why

An agent that reviews its own change reads it with the reasoning that produced it, and misses what that reasoning
missed. A reviewer in a fresh context gets only the diff and the requirement. It can catch what is a matter of
judgement, such as semantic duplication and over-engineering, though only partly, at a cost, and not the same way
every time.

## How it works

1. The coding agent asks one or more reviewer agents for a review. Each reviewer agent starts with a fresh context.
2. The reviewers return Findings.
3. The coding agent fixes the high findings that the finding verifier confirmed.
4. The coding agent asks for a review again, up to 3 rounds. After the third, the open findings and the diff go to a
   person (H4): a fourth round of the same disagreement costs more than a person's look.

At OpenAI almost all review happens between agents.

## Set up

- **Reviewers as subagents.** One file per lens in `.claude/agents/`, such as `.claude/agents/review-correctness.md`,
  with `tools: Read, Grep, Glob`. The `tools` field is an allowlist, so Claude Code keeps the reviewer from editing
  anything. Each subagent runs in its own context window; the coding agent passes it the diff and the requirement,
  and it returns Findings ([agent formats](../../agent-formats.md)).
- **Or `/code-review`.** The bundled skill reviews the branch's changes for correctness bugs in a forked subagent
  with its own context window, and reports its findings in the conversation; `--fix` applies them. It follows
  `CLAUDE.md`, which is where the project's review rules go. Use it for the correctness lens, and the subagents above
  for the lenses it does not cover.
- **`/simplify` is not this loop.** The bundled skill runs four review agents in parallel, on reuse of existing
  helpers, simplification, efficiency and the level of abstraction, and applies the fixes; it does not look for
  correctness bugs. Run it as a cleanup step before the review if the project wants one, and write that choice in the
  loop's `LOOP.md`.
- **The loop runs the checks; the reviewer reads their output.** Run the linter on the changed files before the
  review and give the reviewer its output with the diff; tell it not to run the checks itself and to judge only the
  files in the diff. Every round then rests on one record of the checks, not on each reviewer's own run of them.
  gemini-cli's caretaker agent does this: the orchestrator runs `eslint --max-warnings 0` on the changed files into
  `linter_output.txt`, and the evaluator ("Do NOT run the linter yourself") writes `verdict.json`, `APPROVED` or
  `NEEDS_REVISION`, with its feedback in `pr_feedback.md` for the coder. A missing or unreadable verdict counts as
  `NEEDS_REVISION`.
- **A size limit as well as a round limit.** An approved diff of more than 500 changed lines goes to a person (H4)
  instead of becoming a PR: a reviewer's pass over that much code is not to be trusted alone. The caretaker agent
  stops at 500 lines and after 5 rounds, and an issue it has tried to fix in 2 runs goes to a person.
- **The `run`** runs the reviewers on the diff and prints their Findings, one JSON line each. It exits non-zero for a
  high finding the verifier confirmed, but only for a reviewer that is calibrated; until then it prints the findings
  and exits 0.
- **Cases** are the reviewers' evals: one must-fire diff per lens, such as an off-by-one in a page loop for
  correctness, a query built by string concatenation for security, a test that asserts nothing for tests; and a
  must-pass diff, a pure rename with the tests green.
- **Wiring.** The coding agent runs the loop after its tests pass and before it opens the PR. A CI job runs the same
  reviewers on the PR, outside the coding agent's session, so a skipped review still happens; the agent cannot edit
  the reviewers' definitions, which a PreToolUse hook protects.

## Notes

- Böckeler: "LLMs can partially address problems that require semantic judgment", such as "semantically duplicate
  code, redundant tests, brute-force fixes, over-engineered solutions", "but expensively and probabilistically."
- Pi's PR review (`/pr`) widens what a reviewer reads beyond the diff: the linked issues in full, the code paths the
  diff does not touch but the behaviour depends on, and the user docs that may need to change with the code. It never
  checks out the PR's branch; it reads the diff with `gh pr diff` and files with `git show <ref>:<path>`, so a review
  leaves the working tree as it was.
- gemini-cli's `async-pr-review` skill reviews a PR in a temporary worktree with five background tasks, each leaving
  an exit file. It reuses CI's result: green or pending CI means no local test run, and red CI means only the test
  files named in the failed job's log are run again. One agent exercises the changed code by hand, with "Do NOT
  modify any source code" ([agentic-manual-testing](../agentic-manual-testing/card.md)); a last one reads every log
  and exit code and recommends.
- The security lens has its own loop, [security-review-agent](../security-review-agent/card.md). A subagent that
  tries to prove a claim of done wrong, by running things, is [verification-subagent](../verification-subagent/card.md).

## Agent step

Use one reviewer per lens: correctness, security, tests, performance, and the project's conventions. Each reviewer:

- works in a fresh context
- gets the diff and the requirement, not the coding agent's reasoning
- only reads
- returns Findings

A finding verifier checks each high finding. The coding agent acts on a high finding only after that check.

A reviewer blocks only once calibrated ([agent-calibration](../agent-calibration/card.md)). Until then, its findings
are advice.
