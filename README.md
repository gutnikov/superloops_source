# superloops

A Claude Code plugin that makes an agent's work on a project checkable, from the task to the change confirmed where
it is used. Its command is `/superloops`; `/wizard` sets a project up from the site's form, and `/review-loop`
reviews a loop for the catalog:

| You run | What happens |
|---|---|
| `/superloops` in a project without `superloops/superloops.md` | The setup. It studies the project, recognizes the loops it already runs (CI jobs, hooks, linters, deploy checks, specs, agent loops) and places each in the project's super-loops. It asks only what the code does not tell: what the project is, how far superloops may go on its own, what it can reach, and where a change counts as done. It writes `superloops/superloops.md` and shows the map. It builds nothing |
| `/superloops <a task, or a ticket URL>` | The task, through its super-loop. Triage picks the level (product or harness) and the super-loop; each phase runs the loops the map has; the task ends at an exit, such as a change confirmed in production, or at the `done_at` the user chose |
| `/superloops` | The status: the map, the measures, the work in flight |
| `/review-loop <a loop's folder, or a pull request>` | The review of a loop before it enters the catalog: the formal checks, its evals with and without its skill (`claude plugin eval`), and whether the card's loop is new and its claims true. It drafts the review; for a pull request, it posts it as a comment only when you say so |
| `/wizard <answers>` | The setup from the wizard's answers (a JSON file from the site, or the questions asked here): it checks them against the repository, writes `superloops/superloops.md`, plans the loops the answers bring in (a core every project gets, plus what its kind, surfaces, stages, team, autonomy and pains add) and builds the first five with your go-ahead |

The commands are `superloops:superloops`, `superloops:wizard` and `superloops:review-loop` in the command list; typing
`/superloops`, `/wizard` or `/review-loop` runs them.

## The model

A **super-loop** is the path a piece of work takes, from its entry to a change confirmed where it is used:

```
entry → oracle → work → gate → release → confirmation
```

There are four, told apart by their oracle, the thing the work is checked against, fixed before the work and out of
the reach of the agent that does it:

| Super-loop | Starts with | Oracle | Ends with |
|---|---|---|---|
| delivery | an idea or a requirement | an approved spec and acceptance tests that fail | the change confirmed where it is used |
| remediation | a problem | a reproduction that fails, and the signal the problem was seen by | that signal gone |
| maintenance | a trigger: a new version, an end of life, a measure over budget | the behaviour as it is, and the measure | the measure improved, and nothing changed for users |
| discovery | a question | the question, and the evidence that would answer it | a decision, which may be "do not build it" |

They run at two levels. At the **product** level the agent does the project's work. At the **harness** level it works
on the loops themselves, and the product's trace is its signal. The boundary between the levels is a permission
boundary: a product task never changes a loop that checks it.

```
harness level   discovery · delivery · remediation · maintenance    over the loops, agents, guides and policy
      ▲ the trace: releases not confirmed, escapes, corrections, agents' misses
      ▼ new and fixed loops
product level   discovery · delivery · remediation · maintenance    over the product
```

The details: [`plugin/parts/harness/super-loops/`](plugin/parts/harness/super-loops/README.md).

## Install

```
/plugin marketplace add gutnikov/superloops
/plugin install superloops@superloops
```

## Layout

| Path | What |
|---|---|
| `.claude-plugin/marketplace.json` | The marketplace: one plugin, from `plugin/` |
| `plugin/skills/superloops/` | The command |
| `plugin/skills/wizard/` | The wizard's setup |
| `plugin/skills/review-loop/` | The review of a loop for the catalog |
| `plugin/parts/` | What it reads: the harness, wizard, spec, event-model, text-quality, app-probing, fixture-modify, pom-modify and ui-prototypes parts ([`plugin/parts/README.md`](plugin/parts/README.md)) |

## What it keeps in a project

Everything superloops keeps is in one folder, `superloops/`, so that one path is what the agent doing product work may
not write, and what a CODEOWNERS entry or a branch rule protects:

```
superloops/superloops.md          setup: the user's preferences, and the sign that the project is set up
superloops/map.yaml               setup: what superloops found, the facts the map of the super-loops is drawn from
superloops/wizard.json            wizard: the answers the project was set up from
superloops/hitl-log.jsonl         setup: every call to a person, with its answer
superloops/agents.yaml            setup: the registry of the agents that are steps of loops
superloops/.gitignore             setup: keeps .runs/ out of git
superloops/loops/index.yaml       setup: the registry of loops
superloops/loops/<id>/            task: a loop's LOOP.md, run, CHANGELOG.md, cases/must-fire/, cases/must-pass/
superloops/agents/<id>/           task: an agent's evals/, results/, report.md
superloops/trace.jsonl            task: escapes, corrections and reverts no system of the project records
superloops/agent-outcomes.jsonl   task: what happened to the agents' verdicts
superloops/specs/                 task: layers, glossary, requirements/, model/, once specs are set up
superloops/.runs/                 task: runs of the text-quality part, not committed
```

Outside it are only what tools read from fixed places: a loop's wiring (a job in `.github/workflows/`, a hook in
`.claude/settings.json`), an agent's definition in `.claude/agents/<id>.md`, and prototypes in
`<host>/prototypes/`, the package that has the design system. A task also writes the product's own files, such as
code, acceptance tests, fixtures and Page Objects, where the project keeps them.

The scripts need Python 3; the spec's also need PyYAML. The text-quality part needs the `claude` CLI and network
access.

## License

[MIT](LICENSE). The files in [`plugin/parts/text-quality/en/review/sources/`](plugin/parts/text-quality/en/review/sources/README.md)
keep their own licences, listed in that folder's README: public domain, CC0 1.0 and the Open Government Licence v3.0.
