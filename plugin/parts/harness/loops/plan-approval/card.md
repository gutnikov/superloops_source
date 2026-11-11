---
id: plan-approval
title: "Plan approval"
summary: "The agent studies the code read-only and proposes a plan; a person edits and approves it, and the agent then works by the plan on its own."
sensor: human
ilities: [alignment]
places: [delivery/oracle, discovery/oracle]
stages: [task]
speed: [minutes]
needs: []
when: [before]
initiator: agent
sync: blocking
assesses: [plan]
related: [interview, task-restatement, agent-code-review]
links:
  - title: "Best practices for Claude Code"
    url: https://code.claude.com/docs/en/best-practices
    note: "reviewing the work against the plan; an interview when the goal is vague"
  - title: "Choose a permission mode"
    url: https://code.claude.com/docs/en/permission-modes
    author: Anthropic
    note: "plan mode: entering it, approving a plan, Ctrl+G, plan mode as the default"
  - title: "All settings: plansDirectory"
    url: https://code.claude.com/docs/en/settings-reference#plansdirectory
    author: Anthropic
  - title: "Claude Code day by day"
    author: Rick Hightower
  - title: "Spec-driven development"
    author: Towards AI
---

## Why

A misunderstanding is cheapest to fix before the work starts. An agent that works autonomously on a wrong plan
spends hours going the wrong way. A person who reads the plan first spends a minute and saves those hours. A plan
is also shorter to read than the diff it leads to.

## How it works

1. The agent studies the code without changing it and proposes a plan. In Claude Code this is plan mode: press
   `Shift+Tab` until the status bar shows plan mode, prefix a prompt with `/plan`, or start with
   `claude --permission-mode plan`. Claude reads files and runs commands to explore, and edits stay blocked until the
   person approves the plan.
2. The person edits the plan and approves it. Claude Code presents the plan and asks how to proceed: approve it, or
   keep planning and say what to change. `Ctrl+G` opens the plan in the person's editor to edit it directly before
   Claude proceeds.
3. The agent carries out the approved plan on its own.

Use a plan when you roughly know what you want. When the goal is vague, use an [interview](../interview/card.md)
instead (Towards AI).

## Set up

- **The reason is H1**, intent: the plan is the agent's reading of what is wanted, and only the person can confirm
  it. At the `ask` autonomy level of `superloops/superloops.md`, every change is proposed as a plan first. The question
  tool here is plan mode's own approval prompt, and the call is logged:
  `loops.py hitl H1 --loop plan-approval --question "Approve plans/<task>.md?" --answer "approved, step 3 changed"`.
- **The plan lives in the repository**, so that it outlives the session (Rick Hightower) and a reviewer can read it.
  Set `plansDirectory` to `"./plans"` in `.claude/settings.json`: Claude Code then writes its plan files there
  instead of `~/.claude/plans`. Commit the approved plan with the work.
- **The diff is checked against the plan.** A reviewer with a fresh context gets the approved plan and the diff, and
  reports each step that is missing and each change the plan does not name
  ([agent code review](../agent-code-review/card.md)). Claude Code's best practices show such a review prompt, one
  that checks the work against the plan instead of hunting for bugs in general.
- **Plan mode by default.** Set `permissions.defaultMode` to `plan` in `.claude/settings.json` to make plan mode the
  default for the project's terminal sessions.
- **Kept from getting around it.** Claude Code enforces the block on edits; the agent does not choose it. The one
  exception: in an interactive terminal session where bypass permissions are available, Claude is only told to plan,
  and an edit it tries runs without a prompt. Set `permissions.disableBypassPermissionsMode` to `"disable"` in a
  project that relies on this loop.
- **What a machine checks.** The loop's `LOOP.md` has `validation: manual`: the approval is the person's. The
  reviewer's report on the diff against the plan is the automated part.
