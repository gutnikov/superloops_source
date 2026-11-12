---
id: interview
title: "Interview"
summary: "Before writing code the agent asks the person about requirements, edge cases and trade-offs in rounds, writes the answers into a spec, and builds only after the person confirms it."
sensor: human
ilities: [alignment]
places: [delivery/oracle, discovery/oracle]
stages: [task]
speed: [minutes]
needs: []
agent: [reviewer]
when: [before]
initiator: agent
sync: blocking
assesses: [intent]
related: [plan-approval, task-restatement, spec-check, acceptance-loop, choose-from-options, async-questions-with-assumptions]
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
    note: "AI Hero, AI Coding Dictionary: the agent interviews the user, with a recommended answer for each decision."
  - title: "grilling SKILL.md: rounds, the frontier, facts and decisions, the confirmation gate"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/grilling/SKILL.md#L6-L30"
    author: "skills (Matt Pocock)"
  - title: "grilling.md: thirteen questions in about three rounds"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/productivity/grilling.md#L5"
    author: "skills (Matt Pocock)"
  - title: "grilling.md: one question at a time as an opt-out, the skipped gate, self-answered questions"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/productivity/grilling.md#L45-L64"
    author: "skills (Matt Pocock)"
  - title: "native-question-tool.md: why grilling does not use AskUserQuestion"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/.out-of-scope/native-question-tool.md#L1-L11"
    author: "skills (Matt Pocock)"
  - title: "CHANGELOG: \"yes\" accepts the recommended answer (#706)"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/CHANGELOG.md#L19"
    author: "skills (Matt Pocock)"
  - title: "CHANGELOG: the confirmation gate, and facts split from decisions"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/CHANGELOG.md#L271-L275"
    author: "skills (Matt Pocock)"
  - title: "brainstorming SKILL.md: the builder check and the gate before building"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/brainstorming/SKILL.md#L250-L283"
    author: "superpowers (obra)"
  - title: "builder-check-prompt.md"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/brainstorming/builder-check-prompt.md#L6-L23"
    author: "superpowers (obra)"
---

## Why

An agent that starts on a vague goal fills the gaps with its own guesses about requirements and edge cases, and
learns it guessed wrong only when the person sees the result. Before any code is written, a misunderstanding is
cheapest to fix. The answers go into a spec in the repository instead of staying in the chat, so the build, its tests
and its reviewer all read the same definition of done.

## How it works

1. **Facts are the agent's.** It reads the ticket, the code, the docs and the history, and runs commands; what they
   answer is not asked. Only the questions that depend on a fact a subagent is still finding wait for it.
2. **Decisions are the person's, asked in rounds.** A round holds every open decision whose prerequisites are
   settled; one that depends on a question still open waits for the next round. Each comes with the agent's
   recommended answer, worded so that "yes" accepts it. The agent never answers a decision itself, even inside a
   task such as "resolve the ticket". Each answer goes into the spec at once.
3. **A reader without the conversation looks for gaps.** For a project-sized spec, a fresh subagent reads it as its
   builder (Agent step). The agent writes in what was already answered, decides minor points as marked calls of its
   own, and asks the rest in a last round.
4. **The person confirms, then the build starts.** Running out of questions is not consent: the agent waits for
   the person to say the spec is what they meant (Pocock: "Weaker and faster models still skip the gate"). The build
   starts from the spec in a fresh session, as Claude Code's best practices advise.

A [plan](../plan-approval/card.md) fits when the person roughly knows what they want; an interview, when the goal
is vague. For a small task whose reading is the only doubt, a [restatement](../task-restatement/card.md) is enough.

## Set up

- **The reason is H1**, intent; a choice between options that behave differently is H4. Every question says what
  was already checked (`never_ask` in `defaults/hitl.yaml`).
- **A round is one call of the question tool**, as in the first `/superloops` form (the harness's README): up to 4
  questions, the most `AskUserQuestion` takes; a larger round is several calls in a row. Each question has 2–4
  options, the recommended one first, and `Other` for the person's own words. Rounds, because each call costs the
  person a turn and independent questions lose nothing asked together (Pocock: thirteen questions land "in about
  three rounds rather than thirteen"). The tool, because each answer comes back as a field to log and write into the
  spec. Pocock keeps it out of grilling: "Structured pickers push the model towards multiple-choice questions with
  pre-baked answers". So every option is one the agent would defend: for an open question, its recommendation and
  the strongest alternative. A person who wants one question per call says so in the Notes of
  `superloops/superloops.md`.
- **Answers go where a machine reads them.** With the [`spec`](../../../spec/README.md) part: each question and its
  `answer` in the requirement file `superloops/specs/requirements/<KEY>.yaml`, then in the spec elements it changes.
  Without the part: a `SPEC.md` in the repository. Never only in the chat.
- **Every question is logged**:
  `loops.py hitl H1 --loop interview --checked "<what was read>" --question "…" --answer "…"`.
- **Nobody there to answer.** An interview nobody answers yields the agent's opinion. In a run nobody watches, the
  open decisions go out as [assumptions](../async-questions-with-assumptions/card.md), and the spec stays unapproved.
- **What a machine still checks.** The loop's `LOOP.md` has `validation: manual`: no case can stand in for the
  person's answers. But `specs.py check` fails on a requirement file that is `approved` while a question has no
  `answer`, or with no `approved_by`, and the [spec check](../spec-check/card.md) runs on every change under
  `superloops/specs/`.
- **The agent does not approve its own spec.** The `spec_approver` in `superloops/superloops.md` approves the
  requirement file (H5). The approved spec then becomes acceptance tests
  ([acceptance loop](../acceptance-loop/card.md)).

## Notes

- Plan for 5–20 minutes of the person's time.
- Matt Pocock calls the technique grilling. His reason for it: "agents fill gaps silently."

## Agent step

The builder check is a reviewer with a fresh context and superpowers' prompt: a builder who "will not be able to
talk to the person who wrote it" reports "only the questions you'd still need answered before you could plan this
well", ranked, or "nothing important left". It returns one Finding per question, with why the answer changes the
build as its `evidence`, and never blocks.
