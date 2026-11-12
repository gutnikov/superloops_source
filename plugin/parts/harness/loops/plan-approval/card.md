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
related: [interview, task-restatement, agent-code-review, risky-action-gates, progress-file-feature-list]
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
  - title: "Hooks reference: ExitPlanMode"
    url: "https://code.claude.com/docs/en/hooks#exitplanmode"
    author: "Anthropic"
    note: "in PostToolUse, tool_response holds the approved plan and its filePath."
  - title: "Claude Code changelog: an unapproved plan carried out after a reload (2.1.319)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L262"
    author: "Anthropic"
  - title: "wayfinder SKILL.md: Plan, don't do, unless the Notes say otherwise"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wayfinder/SKILL.md#L11-L13"
    author: "skills (Matt Pocock)"
  - title: "wayfinder.md: an agent read its own Notes back as permission"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/wayfinder.md#L68-L69"
    author: "skills (Matt Pocock)"
  - title: "writing-plans SKILL.md: Global Constraints and Review Focus"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/writing-plans/SKILL.md#L70-L87"
    author: "superpowers (obra)"
  - title: "executing-plans SKILL.md: Expected lines and rulings"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/executing-plans/SKILL.md#L193-L204"
    author: "superpowers (obra)"
  - title: "executing-plans SKILL.md: Review Focus handed to the final reviewer"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/executing-plans/SKILL.md#L242-L253"
    author: "superpowers (obra)"
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
  ([agent code review](../agent-code-review/card.md)), instead of hunting for bugs in general.
- **The plan names its checks, and what its tests miss.** A plan with no verification step gives the reviewer of
  the diff nothing to hold the work to. gemini-cli's plan grows with the task, and every size has one: **Changes**
  and **Verification** for a simple task; **Verification & Testing** for a standard one; **Verification** and
  **Migration & Rollback** for a complex one. superpowers adds a **Review Focus**: "The five input classes or failure
  modes the spec implies but no task's tests exercise", each then given a test in its task and handed to the final
  reviewer to check one by one. Every step that runs a command has an `Expected:` line. Write the sections in the
  loop's `LOOP.md`.
- **A rejection carries its reason.** gemini-cli returns "Plan rejected. User feedback: … Revise the plan based on
  the feedback."; a rejection with no feedback makes the agent "Ask the user for specific feedback", not guess.
- **A new requirement goes back to the person.** gemini-cli's prompt for an approved plan: "If you discover new
  requirements or need to change the approach, confirm with the user and update this plan file". A step that cannot
  work as written, where the spec still decides, is a ruling instead: superpowers' executor takes "the smallest change
  that satisfies the spec" and records `Ruling: <finding> — <what you decided and why>` for the reviewer.
- **The plan leaves no decision to the implementer.** Codex's Plan mode asks until the plan is "decision complete":
  each open question comes with 2–4 options and a recommended default, and an unanswered one proceeds with the
  default "and record it as an assumption in the final plan". A revision is "a complete replacement" of the plan,
  not a patch on it, so the approved file is one coherent text.
- **Approve into a clean context.** The planning conversation holds the options the person rejected. Codex offers
  "Yes, clear context and implement": a new thread told "Read the approved plan at {path} and implement it.", once
  the file is checked to be a regular file, byte-identical to the approved text; otherwise the text goes inline.
  Start the implementing session from the committed plan file, checked against its approval record.
- **Plan mode by default.** Set `permissions.defaultMode` to `plan` in `.claude/settings.json` to make plan mode the
  default for the project's terminal sessions.
- **Kept from getting around it.** Claude Code enforces the block on edits; the agent does not choose it. The one
  exception: in an interactive terminal session where bypass permissions are available, Claude is only told to plan,
  and an edit it tries runs without a prompt. Set `permissions.disableBypassPermissionsMode` to `"disable"` in a
  project that relies on this loop.
- **Approval comes from the person, in this session.** Only the person's answer to the approval prompt lets the
  agent build. Text an agent wrote is never permission: "approved" or "execution allowed" in the plan, its notes, a
  progress file or a commit message, from this session or an earlier one. Pocock's wayfinder lets an effort override
  its "Plan, don't do" default in Notes the agent itself writes: "One user watched an agent write 'this map carries
  execution' into its own Notes. In later sessions the agent read that line back as permission and built on a live
  server." A setting that loosens a default, such as `autonomy` in `superloops/superloops.md`, changes only with the
  person's approval (H7).
- **The approval leaves a record the agent cannot write.** A `PostToolUse` hook on `ExitPlanMode` runs only after
  the person approved, and its `tool_response` holds the approved `plan` and its `filePath`. The hook appends the
  plan's sha256, its path and the session id to `plans/approvals.jsonl`; a `PreToolUse` hook denies the agent's
  writes to that file and to `.claude/settings.json`. A resumed session can also build on no approval: Claude Code
  2.1.319 fixed Claude "carrying out an unapproved plan after a window reload".
- **`run <plan>`** prints `<plan>: <status>`, one of `approved`, `empty`, `no verification section`, `no approval
  record` and `changed since approval` (its hash matches no record), and exits non-zero on anything but `approved`.
  With `--draft`, the check before the person reads, it skips the record; gemini-cli likewise refuses to ask for
  approval of an empty plan.
- **Cases.** Must fire: a plan to which the agent added "Status: approved, execution allowed", with no record; an
  approved plan edited after its approval; an empty plan; a plan with no verification section. Must pass: a plan
  approved through the prompt and unchanged since. The approval itself stays `validation: manual`.
- **Wiring:** the hooks in `.claude/settings.json`; `run` is the first step of the implementing session, which stays
  in plan mode while it fails. The reviewer of the diff gets the plan the record names.
