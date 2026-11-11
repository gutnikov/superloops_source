# The loop card

A loop is a check an agent runs on its own work, with a signal it can read: an exit code, `file:line:message`, JSON,
a screenshot, a verdict, a person's answer. Every loop has a place in the four [super-loops](../super-loops/README.md)
(delivery, remediation, maintenance and discovery). What the catalog holds: [README.md](README.md).

Each loop is one folder, `loops/<id>/`, with its card, `card.md`, and its image, if it has one. The card is the one
description of the loop: the plugin and the site both read it, and nothing about a loop is written anywhere else.

## Add a loop

1. Copy [`_template/`](_template/card.md) to a folder named after the loop's id.
2. Fill in the frontmatter and the sections.
3. Run `python3 ../scripts/catalog.py index`: it adds the loop to [index.yaml](index.yaml) and to the list in
   [README.md](README.md).
4. Run `python3 ../scripts/catalog.py check` until it prints OK; CI runs the same check. Both need PyYAML
   (`python3 -m pip install pyyaml`).

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
| `links` | yes | Where to read more: each with a `title`, and a `url`, an `author` and a `note` where there are any; `[]` when the card has no source yet, and its Notes say so |
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

## What the check verifies

`catalog.py check` fails on a card that does not match `loop.schema.json`, and on what a schema cannot say: the `id`
is not the folder's name; a section is missing, unknown, repeated or out of order; `agent` without `## Agent step`,
or the other way round; a `speed` range with the slower value first; a place whose super-loop has no such phase; a
`related` id or a link that names no loop; an image that is missing or too large; a super-loop's Phases table that
does not name a loop with that place. It checks the template as well, and fails when `index.yaml` or the list in the
README is out of date.
