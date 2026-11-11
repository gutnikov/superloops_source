---
name: wizard
description: Set a project up from the superloops wizard's answers (the site's form, a JSON file, or questions asked here). It checks the answers against the repository, writes superloops/superloops.md and the map, plans the loops the answers bring in (a core every project gets, plus what the project's kind, surfaces, stages, team, autonomy and pains add), creates them as proposed, and builds the first wave of at most five.
disable-model-invocation: true
argument-hint: "[the wizard's answers: a path to a JSON file, or the JSON itself; nothing to answer the questions here]"
---

# wizard

Input: $ARGUMENTS

The wizard turns a few answers about a project into its first set of loops: the few that catch most of what agents get
wrong in a project like it, and nothing the project cannot run. It is the first `/superloops` with its form answered in
advance and the first choice of loops made: after it, every task runs through `/superloops` as usual.

**Paths.** `W` is `${CLAUDE_PLUGIN_ROOT}/parts/wizard`, `H` is `${CLAUDE_PLUGIN_ROOT}/parts/harness`, `P` is
`${CLAUDE_PLUGIN_ROOT}/parts`. They are not shell variables: write the full path in every command. `wizard.py` means
`python3 ${CLAUDE_PLUGIN_ROOT}/parts/wizard/scripts/wizard.py`, and `loops.py` means
`python3 ${CLAUDE_PLUGIN_ROOT}/parts/harness/scripts/loops.py`, both run from the project's root.

**Read first:** `$W/wizard.json` (the steps, their options and the rules), `$H/README.md` (Just enough loops;
Preferences; Talking to the user; Building a loop) and `$H/profile.md`. If `superloops/superloops.md` exists, read it
all: the project is set up, and this run updates it (§7).

## 1. Get the answers

The answers are one JSON object, `{"phase": "existing", "kind": ["web"], …}`, or the same under an `"answers"` key, as
the site writes it. A single-choice step takes a string, a multi-choice step a list.

- **A path** in the input: read that file.
- **JSON** in the input: use it as given.
- **Nothing**, or answers with steps missing: find out first, then ask what is left (§2).

Validate them: `wizard.py resolve <file> --json` (or `-` with the JSON on stdin). An answer that names no option, or an
exclusive option combined with others, is an error: ask the person which they meant (H1), with the options of that
step.

## 2. Find out before asking

Most steps are facts the repository shows. Find them out the way `$H/profile.md` §1 says, for every step not answered
yet, and for every answered step check the answer against what you found:

| Step | Where to look |
|---|---|
| `phase` | The history: a project with commits and tests is `existing` |
| `kind`, `stack` | Manifests, frameworks in the dependencies, `bin` entries |
| `surfaces` | Migrations, queue and cache clients, a published schema, locale files, an LLM SDK, payment SDKs |
| `checks` | `.github/workflows/`, `.gitlab-ci.yml`, other CI configs |
| `release` | Deploy jobs and their environments, preview jobs, store or registry publishing |
| `tools` | Each one called once from this session (`gh auth status`, one MCP query); `$H/profile.md` §2, Q3 |
| `team` | Contributors in the history, branch protection, `CODEOWNERS` |
| `provider` | `CLAUDE.md`, `.claude/`, `AGENTS.md`, `.codex/` |
| `pains` | Red CI runs, reverts and fix-up commits, repeated review comments |

**Facts win; preferences are the person's.** Where the repository contradicts a factual answer (the answer says no CI,
and there is a workflow), use what you found and say so in the report. `autonomy`, `runs` and `provider` are the
person's to decide; a `tools` entry counts only if it answers when you call it.

Ask what is left, in as few calls of the question tool as possible: up to 4 questions per call, the found answer or
the recommended one first, each question starting with what you found (`$H/profile.md` §2). `wizard.py questions
<file>` lists the steps still open. A step with more options than the tool takes offers the ones the repository makes
likely, and the free answer covers the rest. Log each call: `loops.py hitl H1 --loop wizard --question "…" --answer "…"`
(H7 for `autonomy`).

## 3. Resolve the plan

Run `wizard.py resolve <answers> --json` on the answers as they now stand. It returns:

- `profile`: `kind`, `stages`, `tools`, `pains`, `autonomy` and `done_at` for the project's files;
- `loops`: the plan, in order, each with its `type` (a card under `$H/loops/`), where it came from (`core`, a
  `step:option`, a `rule:n`), its `wave` (1 or 2) and, for a bundle such as `verify`, the loop types it `covers`;
- `suggest`: loop types to build later, when a failure shows the project needs them;
- `prompts`: the step prompts under `$W/steps/` that explain each choice. Read every one: they say why each loop fits
  and what to check before you plan it.

Then adjust the plan to the project, by the prompts and by `$H/README.md`, "Just enough loops":

- **Reuse.** A check the project already runs at the loop's place (a CI job, a hook, a linter config) is wired in, not
  rebuilt: the loop's `LOOP.md` names the existing command as its `run`. A loop already in `superloops/loops/` stays.
- **Nothing the project cannot run.** A loop whose card `needs` a tool that did not answer, or whose `stages` the
  project lacks, is not created: list it as waiting, with what it waits for (H3 for an access).
- **The stack's commands.** `verify` runs the project's own build, type check, lint and test commands, as
  `$W/steps/wizard-stack.md` says for the stack.

## 4. Write the project's files

1. `loops.py init` creates `superloops/` and keeps what exists.
2. `superloops/map.yaml`: what you found, by `$H/profile.md` §3: `stack` with the commands, `stages`, `super_loops`
   and `not_here`, `ends_at`, `existing_checks` with their places, and `pains` from the answers and the history, each
   as `"<pain>: <place> — <evidence>"`.
3. `superloops/superloops.md`: `kind`, `autonomy`, `done_at` and `tools` from `profile` and the calls you made; the
   body says what the project is, in the person's words where they gave any; Notes keep anything they said every task
   must know.
4. `superloops/wizard.json`: the answers as they now stand, `{"version": 1, "answers": {…}}`, so the next run starts
   from them.

## 5. Create the plan, and show it

For each loop of the plan, in order: `loops.py new <id> --type <type>`. Its status is `proposed`. For a bundle,
`loops.py new verify --type build --title "<the bundle's title>"`, and its `## Requirement` names every loop type it
covers. Fill each `LOOP.md`'s `places` from its card, and its `## Requirement` with the failure it catches, from the
step prompt that brought it in.

Show the plan before building anything:

```
Profile: web + api (TypeScript) · ci, staging, production · done at production · autonomy branch
Tools: ci (gh), errors (Sentry)

Wave 1, built now
| Loop                  | Catches                                         | From             | Runs where                 |
| verify                | a change that does not build, type or test     | core             | Stop hook, CI job          |
| verification-subagent | "done" that does not work for real             | pains            | at the end of a task       |
| …

Wave 2, proposed: e2e-browser, agentic-manual-testing, … (one line each: what it catches)
Later, when a failure shows the need: lighthouse-ci, contract-tests, …
Waiting: error-tracking (Sentry did not answer: H3)
```

Ask once (H4): build wave 1 now (recommended), only keep the plan, or change it. Skip the question when the input
already said to build. With the `ask` autonomy, every change is still proposed as a diff before it is made.

## 6. Build wave 1

Build each loop of wave 1 by `$H/README.md`, "Building a loop": the tools confirmed, `run`, the must-fire and
must-pass cases, the wiring for every agent the `provider` step named (`$W/steps/wizard-provider.md`), `loops.py
validate <id>`, one real trigger, `status: validated`. Settings-like loops (`risky-action-gates`, `plan-approval`)
are built as their settings and a `run` that checks the settings stand. Then `loops.py index` and `loops.py check`.

Commit `superloops/` and the wiring as far as the autonomy level lets a change go: a branch and a pull request at
`branch`, a merge once its gates pass at `merge` or `deploy`.

## 7. Report, and running it again

Report in a few lines: the profile, the map (`loops.py map`), wave 1 with its validation results, the facts that
overrode an answer, and what waits on access. Then the next steps as commands, one per proposed loop of wave 2, in
order:

```
/superloops build the e2e-browser loop from the wizard's plan
```

**Running the wizard again** with changed answers: resolve them, then compare with `superloops/loops/`. A loop the new
answers bring in is created as `proposed` and listed; a loop they no longer bring in is not retired by the wizard:
name it in the report, since retiring a loop is a harness task (`/superloops retire <id>`). `superloops.md` changes
only for the fields the new answers touch, with the person's approval (H7).

## Rules

- **The wizard proposes; failures decide the rest.** The plan is the core and what the answers bring in, nothing more.
  A loop type in `suggest` is built only when a failure shows the need: a pain in the history, an escape, a
  correction the person made twice (`correction-becomes-rule`).
- **Never more than five in a wave**, and the first wave built only with the person's go-ahead.
- **Product code stays as it is.** The wizard writes `superloops/`, the loops' wiring (hooks, CI jobs, guides) and
  the dependencies a loop needs, such as Playwright; it changes no feature.
