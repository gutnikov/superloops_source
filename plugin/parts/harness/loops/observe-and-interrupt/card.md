---
id: observe-and-interrupt
title: "Observe and interrupt"
summary: "The person does not approve every step. They watch from the side and step in when they see the work going the wrong way."
sensor: human
ilities: [alignment]
places: [delivery/work, remediation/work, maintenance/work]
stages: [task]
speed: [minutes, hours]
needs: []
when: [during]
initiator: human
sync: async
related: [risky-action-gates, correction-becomes-rule, escalation-on-uncertainty]
links:
  - title: "Measuring AI agent autonomy in practice"
    url: "https://www.anthropic.com/research/measuring-agent-autonomy"
    author: "Anthropic"
    note: "18 February 2026"
  - title: "Human-in-the-loop"
    url: "https://www.aihero.dev/ai-coding-dictionary/human-in-the-loop"
    author: "Matt Pocock"
    note: "AI Hero, AI Coding Dictionary"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "Steer the session: Esc, /rewind, /clear."
---

## Why

Approving every step spends the person's attention on steps that are fine, and the approvals soon become a
formality. Watching from the side costs less: the person steps in only when the work drifts, and the agent stops at
once. This mode catches a wrong turn while the wrong turn is still cheap, but only while the person is watching.

## How it works

The agent works without asking the person to approve each step. The person watches its progress and steps in when
the work drifts. In Claude Code:

- `Esc` stops Claude mid-action and keeps everything up to that point, so the person can redirect it without losing
  work. Claude takes the correction as its next instruction.
- `/rewind`, or `Esc` twice on an empty prompt, rolls the code, the conversation or both back to an earlier prompt.
- After two failed corrections, `/clear` and one new prompt beat a third correction. Claude Code's best practices:
  "Watch the first minute, press `Esc` the moment Claude drifts, and after two failed corrections run `/clear` and
  write a better prompt instead of a third."

Decide at the start whether a task is watched. Matt Pocock: tasks that are "ambiguous, irreversible, or where you'd
struggle to review the finished result — a schema migration, a tricky design decision, anything touching production
— suit staying in the loop." A task nobody watches runs unattended, and the loops that need no person carry it: a
check it can run, [gates](../risky-action-gates/card.md) on irreversible actions, a review of the result at the end.

Watching does not undo a step that has already run. Claude Code's checkpoints cover only the files Claude edited with
its own file tools, not a file a Bash command touched, and nothing brings back a sent email or a dropped table. So an
irreversible step goes through a [gate](../risky-action-gates/card.md), watched or not.

## Set up

- **Progress is visible at a glance.** Before each step that changes something, the agent writes one line: what it
  did and what it does next.
- **No reason of `defaults/hitl.yaml` applies**: the person starts this loop, so there is no `loops.py hitl` call.
  What is logged is the correction. Each interruption that corrects the agent is logged at the place that should have
  caught the problem, `delivery/oracle` when the spec was silent, `delivery/work` when a check was missing:
  `loops.py trace correction delivery/oracle --note "…"`.
- **The correction goes where the next task reads it**: the spec, a test, or CLAUDE.md. The second correction of the
  same kind becomes a rule ([correction-becomes-rule](../correction-becomes-rule/card.md)).
- **What a machine checks.** The loop's `LOOP.md` has `validation: manual`: no case can stand in for a person
  watching. `loops.py stats` counts the corrections by place, which shows where a loop is missing.

## Notes

- Anthropic, "Measuring AI agent autonomy in practice": among new Claude Code users, "roughly 20% of sessions use full
  auto-approve, which increases to over 40% as users gain experience". Experienced users also interrupt more, in
  about 9% of turns against 5% for new users. Anthropic reads this as a move from approving each action to
  monitoring: "effective oversight doesn't require approving every action but being in a position to intervene when
  it matters."
- The most common reason people interrupt Claude Code, in the same study, is "to provide missing technical context or
  corrections (32%)": the corrections worth logging.
- In Anthropic's own use from August to December 2025, Claude Code's success rate on the hardest tasks doubled, while
  human interventions per session fell from 5.4 to 3.3 (Anthropic).
