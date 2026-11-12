---
id: task-restatement
title: "Task restatement"
summary: "The agent restates the task in its own words: what it understood, what is out of scope, and what will show it is done. A person answers \"yes\" or corrects the restatement."
sensor: human
ilities: [alignment]
places: [delivery/oracle, discovery/oracle]
stages: [task]
speed: [seconds]
needs: []
when: [before]
initiator: agent
sync: blocking
assesses: [intent]
related: [interview, plan-approval, human-acceptance-criteria]
links:
  - title: "Human-in-the-loop cycles (in Russian)"
    author: "Alexander Gutnikov"
    note: "unpublished note, 2026-11-08"
  - title: "Keep Claude working toward a goal"
    url: "https://code.claude.com/docs/en/goal"
    author: "Anthropic"
    note: "/goal: a separate model checks a completion condition after every turn."
  - title: "implement SKILL.md: fetch the ticket and state its title"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement/SKILL.md#L9"
    author: "skills (Matt Pocock)"
  - title: "implement.md: #2 resolved against another numbered list"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement.md#L73-L75"
    author: "skills (Matt Pocock)"
---

## Why

A task can be read in more than one way, and the agent's reading shows only in the result. A restatement written
before the work starts takes the person under a minute to check. Mismatches show up in the list of what the agent
will not do and in the done criterion, and the person catches them there before the agent spends any work on them.

## How it works

Before starting work, the agent restates the task in its own words. When the task points somewhere, to a ticket, an
issue or a spec, the agent first fetches it from where it lives and opens the restatement with its id and title as
fetched. Pocock: "`/implement #2` in a fresh session worked on something completely unrelated. The agent resolved
`#2` against another numbered list in context". A reference that matches more than one item, or none, is asked about
before anything else. Then three parts:

- **I understood**: how the agent reads the task.
- **Not doing**: what is out of scope.
- **Done when**: the criterion that will show the task is done, as something a test or a command can show.

The person answers "yes" or corrects the restatement. After a correction, the agent restates again with the
correction folded in, and starts only on a "yes". After a second correction it switches to an
[interview](../interview/card.md): a reading that far off needs more than a restatement.

Example:

> Task: #482 "CSV export on the reports page" (fetched from the tracker).
> I understood: add an "Export CSV" button that downloads the rows shown in the current table.
> Not doing: PDF or Excel export, changes to the table layout.
> Done when: the button downloads a CSV file with the same rows and columns as the table, and a new test checks this.

A person who also needed Excel export spots the mismatch in "Not doing" and corrects it before the agent starts.

## Set up

- **The reason is H1**, intent. The restatement goes through the session's question tool as one question, with the
  options "Yes, go ahead" (recommended) and "Correct it", and room for a free answer. The call is logged:
  `loops.py hitl H1 --loop task-restatement --question "<the restatement>" --answer "yes"`.
- **The person who gave the task answers.** With the [`spec`](../../../spec/README.md) part, that is the
  `spec_approver` in `superloops/superloops.md`.
- **The reference is resolved from the tracker named in `superloops/superloops.md`** (`tools.tracker`), never from a
  list in the context such as a todo file or a plan's numbered steps. A full reference (`owner/repo#2`, a URL) leaves
  no doubt; a bare number in a session that holds other numbered lists is checked against the fetched title.
- **Skip it when done is already fixed.** An approved spec, or a failing test that says what done is, leaves nothing
  to restate.
- **No answer, no start.** The agent may read and explore while it waits, but changes nothing. A run nobody watches
  has nobody to answer: there the restatement goes at the top of the pull request as an
  [assumption](../async-questions-with-assumptions/card.md), and the person confirms it at the end.
- **The answer goes where a machine reads it.** The confirmed restatement goes at the top of the task's plan or pull
  request, so a reviewer can flag work that falls under "Not doing". Its "Done when" becomes a test, or the session's
  `/goal` condition in Claude Code: after every turn a separate model checks whether the condition holds. That model
  judges only what Claude has shown in the conversation and runs no commands itself, so the criterion names the
  command and the result that prove it.
- **What a machine checks.** The loop's `LOOP.md` has `validation: manual`: only the person knows whether the
  reading is right. From then on, the "Done when" is checked by its test or its goal.
