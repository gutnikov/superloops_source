# Step: provider

Which coding agent will work on the project? The answer changes how the loops are wired, not which loops the project
gets: every loop's check is a command, and only the place that calls it differs. With several agents, wire each loop
for each of them, and keep the commands themselves in one place.

## `claude-code`: Claude Code

- **Guides**: `CLAUDE.md`. If the project also has `AGENTS.md` for another agent, make `CLAUDE.md` import it rather
  than copy it.
- **Hooks** in `.claude/settings.json`: `Stop` runs `verify` (`stop-hook`); `PostToolUse` runs the formatter
  (`autoformat-hook`) and the `stall-detector`; `PreToolUse` and ask rules gate the irreversible commands
  (`risky-action-gates`); `UserPromptSubmit` resets the stall counter.
- **Plan mode** is the place of `plan-approval`.
- **Subagents** in `.claude/agents/` are the verifiers and reviewers of `verification-subagent` and
  `agent-code-review`.

Suggest `skill-trigger-eval` once the project has its own skills: whether each skill's description gets it picked for
the tasks it was written for. Suggest `third-party-extension-scan` once the project installs plugins, skills or MCP
servers written by others: each one added or updated is read against a written policy before it runs in a session.

## `codex`: Codex

- **Guides**: `AGENTS.md`, nested ones per directory where a part has its own rules.
- **Hooks**: Codex runs hooks on the same events (a `Stop` hook that blocks with exit code 2 and a reason); wire
  `verify` there. Where a hook is not available in the version in use, `verify` runs in CI and in a git hook instead.
- **Approvals**: the approval policy and the exec policy rules (`prefix_rule` with `match` and `not_match` examples)
  are the place of `risky-action-gates`; Guardian (`auto_review`) is the built-in form of `approval-reviewer-agent`.
- **`/goal`** keeps a long task running; pair it with `verify` in a hook, since the model's own audit is not a check.

Suggest `third-party-extension-scan` once the project installs skills or MCP servers written by others: each one added
or updated is read against a written policy before it runs.

## `other`: another agent

Gemini CLI, opencode, Cursor and others have their own hooks or none. Put every check in a command the project owns
(`verify`, a pre-commit hook, a CI job) and call it from whatever the agent offers: a hook if it has one, its guide
file (`AGENTS.md`, `GEMINI.md`) as an instruction otherwise, and CI always. A loop wired only into one agent's hooks
protects nothing from the others.
