---
id: choose-from-options
title: "Choose from options"
summary: "On questions of taste — UI, naming, the shape of an API, the structure of a module — the agent makes 2–3 options. The person picks one and briefly explains why."
sensor: human
ilities: [alignment]
places: [delivery/oracle, delivery/work, discovery/confirmation]
stages: [task]
speed: [minutes]
needs: []
when: [during, after]
initiator: agent
assesses: [result, code]
related: [correction-becomes-rule, taste-invariants, escalation-on-uncertainty]
links:
  - title: "Tools reference"
    url: "https://code.claude.com/docs/en/tools-reference"
    author: "Anthropic"
    note: "multiple-choice questions, with an Other row for a free answer."
  - title: "Human-in-the-loop cycles (in Russian)"
    author: "Alexander Gutnikov"
    note: "unpublished note, 2026-11-08"
  - title: "snippets.ts: the Consult step of plan mode"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/prompts/snippets.ts#L603-L609"
    author: "gemini-cli (Google)"
    note: "the depth of consultation in proportion to the task; no draft in the same turn."
  - title: "ask-user.ts: validation"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/tools/ask-user.ts#L57-L64"
    author: "gemini-cli (Google)"
    note: "a choice question takes 2 to 4 options."
---

## Why

No test can say which name or layout is right: on a question of taste, the person is the only judge. An open
question makes them write an answer; with 2–3 options that really differ, they only have to pick one. The reason they
give is recorded as a rule, so the same choice is not asked again.

## How it works

1. The agent meets a question of taste: UI, naming, the shape of an API or the structure of a module.
2. It checks CLAUDE.md and the project's lints for a rule that already answers it. If one does, it follows the rule
   and does not ask.
3. It makes 2–3 options and shows them.
4. The person picks one and briefly explains why.
5. The explanation becomes a rule, so that next time no choice is needed
   ([correction-becomes-rule](../correction-becomes-rule/card.md)).

## Set up

- **Options that differ in substance.** Each option is named by its trade-off ("one call, a larger payload" against
  "paged, two calls"), not by a cosmetic change. If the agent cannot name a trade-off, there is no question of
  taste: it decides by the project's conventions and says what it decided.
- **As many options as the choice deserves.** gemini-cli's plan mode scales the question to the task: for a simple
  one the agent states its approach and stops for a yes; where several approaches are viable it shows pros, cons and
  its recommendation; for a complex one it "MUST present at least two viable approaches with detailed trade-offs".
  It "MUST NOT proceed … in the same turn", and its question tool takes 2 to 4 options. One option is a statement to
  confirm, not a choice; more than 4 means the agent has not narrowed the question yet.
- **Show them, do not describe them.** UI: a screenshot of each option side by side, rendered from real components
  (the [`ui-prototypes`](../../../ui-prototypes/README.md) part makes one prototype file per option). An API: the
  call and the response of each. A name: a real call site with each name. A module: the tree and one import of
  each. The options are built in scratch files, and only the chosen one lands.
- **Called under H4**: two or more valid options differ in a trade-off only the person can weigh. The agent asks
  through the session's question tool with the options, the recommended one first, and a free answer for "none of
  these". In Claude Code that tool is `AskUserQuestion`: the person picks an option or types their own text in its
  `Other` row. The question asks for one sentence on why. The call is logged: `loops.py hitl H4 --loop <loop-id>
  --checked "<the rules searched>" --question "…" --answer "…"`.
- **Where the answer goes.** The reason, said as a rule, goes where a machine reads it: a lint or a custom check
  ([taste-invariants](../taste-invariants/card.md)) where it can be checked, a line under the conventions in
  CLAUDE.md where it cannot. A chosen screen's screenshot becomes the reference of a
  [visual check](../visual-screenshot-check/card.md), under H5. The same kind of choice asked twice is a correction
  to record: `loops.py trace correction <place> --note "…"`, and
  [correction-becomes-rule](../correction-becomes-rule/card.md) makes it a sensor.
- **Validation is `manual`**: no case can stand in for a judgement of taste. What is checked automatically is the
  rule it leaves: a lint written from the answer has its own cases, a must-fire copy with a rejected option and a
  must-pass copy with the chosen one. `loops.py stats` lists repeated calls to a person, so a choice that keeps
  coming back shows there.
- **Wiring.** None of its own: the agent calls it from the task when it meets a question of taste. The rule it
  produces is wired where that lint runs.
