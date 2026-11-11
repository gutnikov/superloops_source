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
  - title: "exit-plan-mode.ts"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/tools/exit-plan-mode.ts#L117-L254"
    author: "gemini-cli (Google)"
    note: "the plan file checked before approval; a rejection's feedback returned to the agent."
  - title: "snippets.ts: the plan's sections, and an approved plan"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/prompts/snippets.ts#L651-L656"
    author: "gemini-cli (Google)"
  - title: "Codex: the approved plan handed to a fresh thread"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/src/session/approved_plan.rs#L20-L134"
    author: "Codex (OpenAI)"
    note: "the file must be a regular file, byte-identical to the approved text, before the agent is told to read it."
  - title: "Codex: Plan mode's instructions"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/collaboration-mode-templates/templates/plan.md#L86-L128"
    author: "Codex (OpenAI)"
    note: "2-4 options and a recommended default; an unanswered question becomes an assumption; decision complete; a revision replaces the plan."
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
- **The plan names its checks.** A plan with no verification step gives the reviewer of the diff nothing to hold the
  work to. gemini-cli's plan grows with the task, and every size has one: **Changes** and **Verification** for a
  simple task; **Verification & Testing** among the sections of a standard one; **Verification** and **Migration &
  Rollback** for a complex one. Write the sections in the loop's `LOOP.md`.
- **A rejection carries its reason.** gemini-cli returns "Plan rejected. User feedback: … Revise the plan based on
  the feedback."; a rejection with no feedback makes the agent "Ask the user for specific feedback", not guess.
- **A new requirement goes back to the person.** gemini-cli's prompt for an approved plan: "If you discover new
  requirements or need to change the approach, confirm with the user and update this plan file". The committed plan
  stays the one the diff is checked against.
- **The plan leaves no decision to the implementer.** Codex's Plan mode asks until the plan is "decision complete":
  each open question comes with 2–4 options and a recommended default, and an unanswered one proceeds with the
  default "and record it as an assumption in the final plan", where the person sees it at approval. A revision is
  "a complete replacement" of the plan, not a patch on it, so the approved file is one coherent text.
- **Approve into a clean context.** The planning conversation holds the options the person rejected. Codex offers
  "Yes, clear context and implement": a new thread whose first message is "Read the approved plan at {path} and
  implement it." Before it sends that, it checks the file is a regular file, not a symlink, and byte-identical to the
  text the person approved; otherwise it passes the approved text inline. Start the implementing session from the
  committed plan file, and check it against the approved version first.
- **Plan mode by default.** Set `permissions.defaultMode` to `plan` in `.claude/settings.json` to make plan mode the
  default for the project's terminal sessions.
- **Kept from getting around it.** Claude Code enforces the block on edits; the agent does not choose it. The one
  exception: in an interactive terminal session where bypass permissions are available, Claude is only told to plan,
  and an edit it tries runs without a prompt. Set `permissions.disableBypassPermissionsMode` to `"disable"` in a
  project that relies on this loop.
- **What a machine checks.** The loop's `LOOP.md` has `validation: manual`: the approval is the person's. The
  reviewer's report on the diff against the plan is the automated part, and so is a check before the person reads:
  the plan file exists in `plans/`, is not empty and has the verification section. gemini-cli refuses to ask for
  approval of a missing or empty plan ("Plan file is empty. You must write content to the plan file before
  requesting approval.").
