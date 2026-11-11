---
id: risky-action-gates
title: "Gates on risky actions"
summary: "Before an irreversible action, the agent stops and asks a person to confirm it. In this card, a risky action means an irreversible one."
sensor: human
ilities: [security]
places: [delivery/work, delivery/release, remediation/work, remediation/release, maintenance/work, maintenance/release]
stages: [task, ci]
speed: [seconds, minutes]
needs: []
when: [during]
initiator: rule
sync: blocking
assesses: [action-risk]
related: [isolated-environment, escalation-on-uncertainty, db-migration-lint]
links:
  - title: "Configure permissions"
    url: "https://code.claude.com/docs/en/permissions"
    author: "Anthropic"
    note: "ask rules; deny, then ask, then allow; what a Bash rule does not match; answering No."
  - title: "Choose a permission mode"
    url: "https://code.claude.com/docs/en/permission-modes"
    author: "Anthropic"
    note: "no mode auto-approves an ask rule; dontAsk denies it; protected paths; what auto mode blocks."
  - title: "Managing environments for deployment"
    url: "https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments"
    author: "GitHub"
    note: "required reviewers on a deployment environment."
  - title: "How we built Claude Code auto mode"
    url: "https://www.anthropic.com/engineering/claude-code-auto-mode"
    author: "Anthropic"
    note: "25 March 2026: the share of permission prompts users accept; the classifier's miss rate."
  - title: "Measuring AI agent autonomy in practice"
    url: "https://www.anthropic.com/research/measuring-agent-autonomy"
    author: "Anthropic"
    note: "18 February 2026: the share of agent actions that look irreversible."
  - title: "/sa: update a GitHub security advisory (a prompt template)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.pi/prompts/sa.md"
    author: "pi (earendil-works)"
    note: "the approved draft is re-read from disk before it is applied."
  - title: "agent-loop.ts: runToolCall"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/packages/agent/src/agent-loop.ts#L813-L830"
    author: "pi (earendil-works)"
    note: "tool calls made by tools go through the same hooks."
  - title: "AGENTS.md: Git"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/AGENTS.md#git"
    author: "pi (earendil-works)"
    note: "rules for several sessions in one checkout."
  - title: "policy-engine.ts: shell commands"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/policy/policy-engine.ts#L493-L670"
    author: "gemini-cli (Google)"
    note: "a parse failure falls back to the default; redirection and substitution never upgrade; every subcommand checked."
  - title: "commandSafety.ts: commands that always ask"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/sandbox/utils/commandSafety.ts#L781-L862"
    author: "gemini-cli (Google)"
  - title: "shell-safety-regression.test.ts"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/policy/shell-safety-regression.test.ts#L36-L80"
    author: "gemini-cli (Google)"
    note: "command strings whose decision must not loosen."
  - title: "shell.ts: a sandbox denial becomes a request to widen the sandbox"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/tools/shell.ts#L1092-L1236"
    author: "gemini-cli (Google)"
  - title: "sandboxDenialUtils.ts: what counts as a denial"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/sandbox/utils/sandboxDenialUtils.ts#L64-L120"
    author: "gemini-cli (Google)"
---

## Why

No loop after an irreversible action can undo it: deleted data stays deleted, and a sent email stays sent. A gate
puts a person in front of such an action before it runs. If only irreversible actions need confirmation, the requests
stay rare enough for the person to give each one real attention instead of approving it by habit.

## How it works

Before an irreversible action, the agent stops, and a person confirms or refuses it. Irreversible means what H2 in
`defaults/hitl.yaml` names: anything that touches production, deletes data, sends something outside the project, or
costs money in an external service. The usual gated actions are a deploy, a migration, deleting data, and an
external payment or email. The prompt shows what will run and what it touches: the exact command, the migration with
its [lint](../db-migration-lint/card.md) output, the diff of the release.

A refused action is not tried another way, with a rewritten command or a script. The agent says what it did not do,
and goes on with the rest or asks what to do instead. In Claude Code, "No" on a permission prompt sends the person's
comment to Claude as the reason, and Claude continues working; "No" with no comment stops the turn.

## Set up

- **Gate only the irreversible.** Every reversible action runs in an
  [isolated environment](../isolated-environment/card.md), where it needs no confirmation.
- **The gate is an `ask` rule** in `.claude/settings.json`, one per gated command, such as
  `"ask": ["Bash(git push *)", "Bash(kubectl apply *)", "Bash(npm run migrate *)"]` under `permissions`. Claude Code
  evaluates deny, then ask, then allow, so a matching ask rule prompts even when an allow rule also matches, and no
  permission mode approves it on its own, `bypassPermissions` included.
- **A rule matches the command, not the intent**: `Bash(git push *)` does not match `git -C . push`. So the last gate
  stands where the action happens. Production credentials stay out of the agent's environment, and a deploy runs from
  a CI environment with required reviewers: on GitHub, the job waits until one of the reviewers, up to six people or
  teams, approves it.
- **Judge every part of a compound command.** A rule on the whole string misses `make build && rm -rf data`.
  gemini-cli's policy engine parses the command and checks each subcommand: one denied part denies the whole, and
  one part that needs a person makes the whole need one. A redirection or a `$(…)` turns an allowed command into one
  that asks: it "never upgrades". `rm -f` or `-rf`, `sudo` before such a command, `find -exec` or `-delete`, `git`
  with a config override and a working directory outside the workspace always ask. A command that does not parse
  asks, and is denied when nobody is there to answer. Where the project classifies commands itself, in a
  PreToolUse hook, give it these rules and a regression suite of command strings, such as `echo hi && ls` with only
  `echo` allowed, which must ask.
- **A sandbox's refusal is a request to a person, not a puzzle.** In gemini-cli, a sandboxed command that fails with
  a permission or network denial (`operation not permitted`, `could not resolve host`, …) becomes a request to widen
  the sandbox: the paths it needed, widened to their nearest existing folder, and the network. On approval the same
  command runs again with that access; on refusal the agent gets the denial with the output. The same denial, keyed
  on the first 200 characters of its error, is not asked twice.
- **Tools that call tools go through the same gate.** A code-mode script, a subagent or a batch tool can call other
  tools. In pi, those nested calls run through the same pipeline as the model's own calls, with schema validation and
  the permission hooks (`runToolCall`). A gate that sees only the calls the model makes directly can be walked around.
- **The approval names a file, and that file is what runs.** For an action built from a payload, such as an advisory,
  a release note or a batch of API calls, the agent writes the payload to a file, the person approves the file, and
  the agent re-reads it from disk just before it acts, never from its memory of the conversation. A side effect beyond
  the approved action runs only if the file says so: pi's `/sa` requests a CVE only when the draft's frontmatter has
  `request_cve: true`.
- **Another session's work is data too.** Where several sessions share one checkout, `git reset --hard`,
  `git checkout .`, `git clean -fd`, `git stash` and `git add -A` destroy the others' uncommitted work; pi's AGENTS.md
  forbids them and stages explicit paths only. Give each session its own
  [isolated environment](../isolated-environment/card.md), or gate those commands like any deletion.
- **Who confirms** is written in `superloops/superloops.md`: the person running the session for an action in it, the
  environment's reviewers for a release. At every autonomy level, anything that cannot be undone is a call to a person.
- **Nobody there.** In a run nobody watches, the gate refuses: with `--permission-mode dontAsk`, Claude Code denies a
  call that matches an ask rule instead of prompting. The agent reports the action as waiting for a person. Auto mode
  alone is no gate (see Notes).
- **The reason is H2**, and the call is logged with what was checked:
  `loops.py hitl H2 --loop risky-action-gates --checked "dry run, lint" --question "Migrate prod?" --answer "yes"`.
  An action the person approves every time is not risky enough for a gate: take it off the list, with their approval.
- **`run` checks that the gates stand.** It reads `.claude/settings.json` and the loop's list of gated commands, and
  prints one line per command, `<command>: gated`, `not gated` or `allowed` (an allow rule matches it and no ask rule
  does). The exit is non-zero for anything but `gated`.
- **Cases.** Must fire: the settings with the ask rule for migrations removed; the settings with `Bash(kubectl *)`
  under `allow` and no ask rule for `kubectl apply`. Must pass: the project's own settings.
- **Out of the agent's reach.** `run` runs in CI. The agent's own writes to `.claude/` are protected-path writes:
  Claude Code prompts for them in Manual mode and denies them in `dontAsk`.

## Notes

- Confirmation fatigue is the risk. Anthropic, on Claude Code's permission prompts: "in practice users accept 93% of
  them anyway" (How we built Claude Code auto mode, 2026).
- Anthropic, "Measuring AI agent autonomy in practice": on its public API, "only 0.8% of actions appear to be
  irreversible (such as sending an email to a customer)". A gate on those alone stays rare.
- Auto mode's classifier blocks production deploys and migrations by default, but it is a model's judgement.
  Anthropic reports a 17% false-negative rate on real overeager actions, and says auto mode "is not a drop-in
  replacement for careful human review on high-stakes infrastructure."
