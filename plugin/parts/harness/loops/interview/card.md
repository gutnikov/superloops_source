---
id: interview
title: "Interview"
summary: "Before writing code the agent asks the person about requirements, edge cases and trade-offs, and writes the answers into a spec in the repository."
sensor: human
ilities: [alignment]
places: [delivery/oracle, discovery/oracle]
stages: [task]
speed: [minutes]
needs: []
when: [before]
initiator: agent
sync: blocking
assesses: [intent]
related: [plan-approval, task-restatement, spec-check, acceptance-loop]
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "\"Ask Claude to interview you instead\", then build from the spec in a fresh session."
  - title: "Hooks reference: AskUserQuestion"
    url: "https://code.claude.com/docs/en/hooks#askuserquestion"
    author: "Anthropic"
    note: "the built-in tool that asks the user one to four multiple-choice questions."
  - title: "Grilling"
    url: "https://www.aihero.dev/ai-coding-dictionary/grilling"
    author: "Matt Pocock"
    note: "AI Hero, AI Coding Dictionary: one decision at a time, with a recommended answer for each."
---

## Why

An agent that starts on a vague goal fills the gaps with its own guesses about requirements and edge cases, and
learns it guessed wrong only when the person sees the result. Before any code is written, a misunderstanding is
cheapest to fix. The answers go into a spec in the repository instead of staying in the chat, so the build, its tests
and its reviewer all read the same definition of done.

## How it works

1. The agent reads what it can first: the ticket, the code, the docs, the history. It asks only what none of them
   answers.
2. It asks one question at a time, with 2–4 options, its recommended answer first, and room for a free answer. With
   the `spec` part, the open questions of one requirement file go in one batch instead, since their answers are
   needed together. Claude Code's best practices give the prompt: "Interview me until you could write the spec, then
   write it to SPEC.md." Claude then asks multiple-choice questions about the parts that are not pinned down yet.
3. Each answer goes into the spec at once. The interview ends when the spec has no open question the agent can name.
4. The build starts from the spec. Claude Code's best practices: start a fresh session to build from it, so the build
   begins with a clean context and a written definition of done.

A [plan](../plan-approval/card.md) fits when the person roughly knows what they want; an interview, when the goal
is vague. For a small task whose reading is the only doubt, a [restatement](../task-restatement/card.md) is enough.

## Set up

- **The reason is H1**, intent: the requirement is still ambiguous after the code, the docs and the history. A choice
  between options that behave differently is H4. A question the repository can answer is not asked (`never_ask` in
  `defaults/hitl.yaml`), and every question says what was already checked.
- **The session's question tool.** In Claude Code it is the built-in `AskUserQuestion` tool, which asks one to four
  multiple-choice questions. Picking an option is faster than writing an answer, and the answers spread less.
- **Answers go where a machine reads them.** With the [`spec`](../../../spec/README.md) part: each question and its
  `answer` in the requirement file `superloops/specs/requirements/<KEY>.yaml`, then in the spec elements it changes.
  Without the part: a `SPEC.md` in the repository. Never only in the chat.
- **Every call is logged**:
  `loops.py hitl H1 --loop interview --checked "<what was read>" --question "…" --answer "…"`.
- **What a machine still checks.** The loop's `LOOP.md` has `validation: manual`: no case can stand in for the
  person's answers. But `specs.py check` fails on a requirement file that is `approved` while a question has no
  `answer`, or with no `approved_by`, and the [spec check](../spec-check/card.md) runs on every change under
  `superloops/specs/`.
- **The agent does not approve its own spec.** The `spec_approver` in `superloops/superloops.md` approves the
  requirement file (H5). The approved spec then becomes acceptance tests
  ([acceptance loop](../acceptance-loop/card.md)).

## Notes

- Plan for 5–20 minutes of the person's time.
- Matt Pocock calls the technique grilling: "the agent interviews the user Socratically, one decision at a time,
  proposing a recommended answer for each." His reason for it: "agents fill gaps silently."
