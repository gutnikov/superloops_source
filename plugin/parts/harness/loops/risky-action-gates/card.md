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
