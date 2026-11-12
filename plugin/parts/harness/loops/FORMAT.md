# The loop card

A loop is a check an agent runs on its own work, with a signal it can read: an exit code, `file:line:message`, JSON,
a screenshot, a verdict, a person's answer. Every loop has a place in the four [super-loops](../super-loops/README.md)
(delivery, remediation, maintenance and discovery). What the catalog holds: [README.md](README.md).

Each loop is one folder, `loops/<id>/`, with its card, `card.md`, its example, `example/`, its evals, `evals/`,
and its image, if it has one. The card is the one description of the loop: the plugin, the site and the loop's
skill all come from it, and nothing about a loop is written anywhere else. The example is the proof that the loop can
fire: a working loop that catches the failure the card names and leaves correct work alone. The evals are the proof
that an agent, given the loop's skill, builds that loop in a project, and loads the skill when the failure shows up
and not otherwise.

## Add a loop

1. Copy [`_template/`](_template/card.md) to a folder named after the loop's id.
2. Fill in the frontmatter and the sections.
3. Build the example ([The example](#the-example)) and run `python3 ../scripts/catalog.py example <id>` until it
   prints VALID.
4. Write the evals ([The skill and its evals](#the-skill-and-its-evals)) and run
   `python3 ../scripts/catalog.py eval <id>` until it writes a report that passed.
5. Run `python3 ../scripts/catalog.py index`: it adds the loop to [index.yaml](index.yaml) and to the list in
   [README.md](README.md).
6. Run `python3 ../scripts/catalog.py check` until it prints OK, and `python3 ../scripts/catalog.py links <id>`
   until it prints no error. CI runs both, and the example, and validates the skill. They need PyYAML
   (`python3 -m pip install pyyaml`); `skill` and `eval` need Claude Code 2.1.269 or later.

## The frontmatter

[`loop.schema.json`](loop.schema.json) defines the fields and every value they take, with what each value means.

| Field | Required | What |
|---|---|---|
| `id` | yes | The folder's name: lowercase words joined by hyphens. Links, the site's address and the plugin refer to it |
| `title` | yes | The loop's name, up to 60 characters |
| `summary` | yes | What the loop does, in one line of up to 200 characters |
| `image` | no | An illustration: an `svg`, `png`, `webp` or `jpg` file in the card's folder, up to 300 KB |
| `sensor` | yes | What gives the signal: `computational` (a program), `inferential` (an LLM agent) or `human` (a person) |
| `ilities` | yes | The quality attributes the loop checks, 1 to 3, the main one first |
| `places` | yes | Where it serves in the super-loops: `<super-loop>/<phase>`, or `harness:<super-loop>/<phase>` |
| `stages` | yes | Where it runs: `edit`, `local`, `commit`, `ci`, `production` and the rest |
| `speed` | yes | How long one round takes: one value, or a range `[from, to]` |
| `needs` | yes | What the agent must reach beyond the repository, such as `ci`, `logs` or `browser`; `[]` when nothing |
| `agent` | no | The kinds of agent that are a step of the loop, such as `reviewer` |
| `related` | no | The ids of loops that pair with this one |
| `links` | yes | Where to read more, at least one: each with a `title`, and a `url`, an `author` and a `note` where there are any. A tool's own documentation counts; an unpublished source has no `url` |
| `when`, `initiator`, `sync`, `assesses` | no | The axes of a human loop; only a card with `sensor: human` has them ([human loops](human-in-the-loop.md#how-the-loops-differ)) |

The `ilities` are a closed list:

| Value | What the loop checks |
|---|---|
| `correctness` | The product does what it was specified to do |
| `alignment` | The work is what the person meant: the intent, the plan, the result |
| `testability` | Behaviour can be checked by tests, and the tests catch what they should |
| `maintainability` | The code is easy to read, change and extend |
| `security` | Confidentiality, integrity, privacy, compliance, audit, licences |
| `compatibility` | It works with other systems, versions, platforms and locales |
| `performance` | Time behaviour, resource use, capacity, scalability |
| `reliability` | Availability, fault tolerance, recoverability, resilience |
| `observability` | What the system does can be seen and explained |
| `deployability` | A change reaches where it runs, reproducibly and safely |
| `usability` | People can use it: accessibility, UX |

`ilities` and `needs` answer different questions. A loop over the logs checks `observability` and needs `logs`: the
first is the quality it checks, the second the tool the project must have for it to run.

## The sections

The body has no H1, since the title is in the frontmatter. These sections come in this order:

| Section | Required | What |
|---|---|---|
| `## Why` | yes | What goes wrong without the loop, and what it catches that nothing earlier does. It is the harness's own reasoning from what the card says, not a claim of a source |
| `## How it works` | yes | What the agent does, the signal it gets back, and what it does with the signal |
| `## Set up` | yes | What has to exist in a project for the loop to work, and how the agent is kept from getting around it |
| `## Notes` | no | Evidence and warnings |
| `## Agent step` | when `agent` is set | What the agent gets, what it returns and whether it may block ([agent formats](../agent-formats.md)) |

A link to another loop is `../<id>/card.md`. A section may have `###` subsections.

## The voice

A card tells the harness engineer what to build and the agent what to do. Where a source stops short, the card
decides: a default with its reason ("poll `/ready` every 5 seconds for up to 2 minutes; a timeout is red"), or the
decision the project makes and where it is recorded. It does not list what its sources say or leave out: where the
text came from is in `links`, and a quote or a number keeps its author in the sentence (Böckeler: "…"). A fact about
a tool comes from the tool's documentation, and that page is in `links`.

Set up ends in what the plugin builds from the card ([the harness](../README.md)): what the loop's `run` prints and
when it exits non-zero, its must-fire and must-pass cases for `loops.py validate`, and its wiring. A human loop says
which reason of `defaults/hitl.yaml` calls the person and where the answer is written so that a machine reads it.

`catalog.py check` fails on a sentence about the card's source, such as "the source does not say" or "the research
cites no source".

## The example

`example/` is a loop the way the harness builds one in a project (`superloops/loops/<id>/`), so that
`loops.py validate` runs it:

| Path | What |
|---|---|
| `LOOP.md` | The loop's file, from the [template](../templates/LOOP.md): `id` and `type` are the card's id, `validation: cases`, `run`, `wiring` with what triggers it; the sections say what each case stands for |
| `run` | Executable. Takes the directory to check as its only argument; exits 0 when the check passes, non-zero when it fires, and prints `file:line: message` or JSON that says how to fix the problem |
| `cases/must-fire/<case>/` | At least one per kind of failure the card's `## Why` names: a small copy of a project, or the input the loop reads, that has that failure |
| `cases/must-pass/<case>/` | At least one: correct work the loop must leave alone, including the case nearest to a failure (the same tool on twenty files, a debugging cycle with a different edit each time) |
| `setup` | Optional, executable: installs the tools `run` calls that CI does not have, pinned to a version |
| any other file | What `run` and the wiring need: a script, a config, the hook settings to merge |

`python3 ../scripts/catalog.py example <id>` copies the folder into a scratch project, runs `setup`, and runs
`loops.py validate`: every must-fire case fires with output, every must-pass case passes, each twice with the same
result, within `budget_seconds`.

What runs depends on who gives the signal:

- **computational**: the check itself.
- **inferential**: everything around the model, with a scripted model in its place
  ([scripted-model-tests](scripted-model-tests/card.md)): the input the agent gets, the parsing of its answer, the
  verdict and the exit code. Its eval cases, with the expected verdicts, are in the folder; a reviewer runs them on
  a real model by hand, since CI holds no model key.
- **human**: the machine side: where the person's answer is written and the `run` that reads it. Must fire: no
  answer, or a negative one; must pass: a positive one.

The example runs as code from a pull request: CI runs it on `pull_request` only, with a read-only token, no secrets
and a time limit.

[`examples-baseline.txt`](examples-baseline.txt) lists the loops that are in the catalog without an example yet. It
only shrinks: a loop leaves it in the change that adds its example, and a new loop enters the catalog with one.

## The skill and its evals

`python3 ../scripts/catalog.py skill <id> --out DIR` builds the loop's skill from the card, as a plugin with one
skill: `skills/<id>/SKILL.md`, whose `description` is the card's `summary` followed by "Use when" and its `use_when`,
and whose body is the card's How it works, Set up and Agent step with the commands that install and validate the
example; the example and `loops.py` beside it; and `evals/`. Without `--out` it builds each skill in a scratch folder
and runs `claude plugin validate --strict` on it. The skill is never edited by hand: change the card.

`evals/` holds cases for [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals.md), one folder each
with a `prompt.md` and `graders/`, and a `case.yaml` when the case needs a project to start from. Three kinds, named
by the prompt's `tags`, each at least once:

| Tag | The case | Its graders |
|---|---|---|
| `build` | A small project, written by `case.yaml`'s `scaffold_script` (it cannot read the case's folder), and the task a person would give there, without naming the loop | `file_exists` for the loop's `run`; `regex` on the trace for `VALID: \d+ cases`, the line `loops.py validate` prints only when every case passed; an `llm` rubric for what the card's How it works says the loop does, and for the wiring: in place, or shown to the person for approval |
| `trigger` | The failure in the words of a person who has just hit it | `tool_used: Skill` with the skill's name |
| `no-trigger` | An ordinary task near the loop's subject | `tool_used: Skill` with `min: 0`, `max: 0`, `arm: both` |

`python3 ../scripts/catalog.py eval <id>` builds the skill, runs every case 3 times with the skill and 3 times
without it, on Sonnet with a Sonnet judge, and writes `evals/REPORT.json`: each case's score and its difference from
the run without the skill, the cost, and a hash of the skill, the example and the cases. It needs a model key and
costs money (about $2.50 for `stall-detector`); `--max-cost-usd` caps it. Its scaffold scripts run on your machine,
so read a case's `fixture.sh` before you run someone else's evals.

The report is the evidence: `catalog.py check` fails when it is missing, when it did not pass, or when its hash is
not the current one, so a change to the card's How it works or Set up, to the example or to the cases needs a new
run. A run without the skill scores low partly because the run's sandbox refuses writes to `.claude/`: read the
difference as a lower bound of what the skill adds, not its size.

## What the check verifies

`catalog.py check` fails on a card that does not match `loop.schema.json`, and on what a schema cannot say: a
sentence about the card's source ([The voice](#the-voice)); the `id` is not the folder's name; a section is missing,
unknown, repeated or out of order; `agent` without `## Agent step`, or the other way round; a `speed` range with the
slower value first; a place whose super-loop has no such phase; a `related` id or a link that names no loop; an
image that is missing or too large; a super-loop's Phases table that does not name a loop with that place;
[human-in-the-loop.md](human-in-the-loop.md) not listing exactly the cards with `sensor: human`; a card without
an example that is not in the baseline, an example whose `LOOP.md`, `run` or cases are missing, a loop with an
example and no `use_when`, no case of each eval kind, or no passing report for its current skill, and, with
`--base`, a baseline that gained a line. It checks the template as well, and fails when `index.yaml` or the list in the README
is out of date.

`catalog.py example` runs the examples; `catalog.py links` fetches every GitHub link pinned to a commit and fails
when its file or its lines do not exist. It also warns when a quote in the card is not in the files the card links
and when a GitHub link is not pinned to a full commit; a warning does not fail, since a card also quotes pages that
are not on GitHub and its own messages.
