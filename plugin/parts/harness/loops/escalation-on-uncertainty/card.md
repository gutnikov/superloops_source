---
id: escalation-on-uncertainty
title: "Escalation on uncertainty"
summary: "The agent stops by itself and asks a question when it cannot choose between options or has found a contradiction in the requirements."
sensor: human
ilities: [alignment]
places: [delivery/work, remediation/work, maintenance/work, discovery/work]
stages: [task]
speed: [minutes, hours]
needs: []
when: [during]
initiator: agent
sync: blocking
assesses: [intent]
related: [async-questions-with-assumptions, risky-action-gates, correction-becomes-rule]
links:
  - title: "Measuring AI agent autonomy in practice"
    url: "https://www.anthropic.com/research/measuring-agent-autonomy"
    author: "Anthropic"
    note: "18 February 2026: how often Claude Code stops to ask, and why."
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "CLAUDE.md holds guidelines; a rule that must hold every time is a hook, a deny rule or a managed setting."
---

## Why

An agent that guesses its way past a contradiction in the requirements builds on the guess, and the mistake shows
only in the result. This loop has the agent stop and ask at that point instead of guessing. A list of what to always
ask about and what never to ask about keeps the questions for the costly cases, such as the database schema or
deleting data.

## How it works

During the task, the agent stops by itself and asks the person a question in these cases:

- it cannot choose between options that behave differently;
- it has found a contradiction: between requirements, or between a person's instruction and the tests, the data or a
  contract;
- the work touches something on the project's always-ask list (see Set up).

Before it asks, the agent looks in the repository, its docs and its history, and runs commands: what these answer is
never a question. The question says what was checked, gives 2–4 options with the recommended one first, and says
what each answer changes. The agent waits for the answer before it goes on along that path.

Questions that need not block go to
[asynchronous questions with assumptions](../async-questions-with-assumptions/card.md) instead. An irreversible
action goes to a [gate](../risky-action-gates/card.md).

## Set up

- **Two lists in CLAUDE.md**, where the agent reads them every session: what to always ask about (the database
  schema, the public API, deleting data, new dependencies) and what never to ask about (style, names of internal
  variables). `never_ask` in `defaults/hitl.yaml` already covers what the repository can answer; the project's lists
  add their own. What the user does not want superloops to ask about goes into the Notes of
  `superloops/superloops.md`.
- **A list is advice.** Claude Code's best practices: "`CLAUDE.md` is for guidelines, and Claude is allowed to decide
  a guideline doesn't apply." An always-ask item that must hold every time becomes an `ask` rule in
  `.claude/settings.json` ([gates on risky actions](../risky-action-gates/card.md)).
- **The reason** is H1 for an ambiguous requirement or a contradiction, and H4 for a choice between valid options.
  Each call goes through the session's question tool and is logged:
  `loops.py hitl H4 --loop escalation-on-uncertainty --checked "…" --question "…" --answer "…"`.
- **The answer goes where the next task reads it**: a requirement's `answer` in the spec, a line in CLAUDE.md, or a
  test. `loops.py stats` lists the calls by reason and by loop, and the questions asked more than once; a question
  that comes back becomes a rule ([correction-becomes-rule](../correction-becomes-rule/card.md)).
- **What a machine checks.** The loop's `LOOP.md` has `validation: manual`: whether a question was worth asking is
  the person's call. `loops.py stats` shows the trend: a recurring type of question should disappear once it has
  become a rule.

## Notes

- Anthropic, "Measuring AI agent autonomy in practice" (18 February 2026): on the most complex tasks, Claude Code
  stops to ask for clarification more than twice as often as humans interrupt it. Its most common reason to stop is
  "to present the user with a choice between proposed approaches (35%)". Anthropic warns against overstating this:
  "Claude may not be stopping at the right moments, it may ask unnecessary questions".
