# Step: runs

How does the agent run? A person watching a session catches a loop going wrong in minutes; an agent working for hours
alone, or in CI on text strangers wrote, has only the loops. This step adds the loops that keep an unwatched run
honest. `stall-detector` is in the core for every project.

## `interactive`: in a session a person watches

Adds nothing beyond the core.

Suggest `observe-and-interrupt` (the person steers mid-task instead of approving each step: queued messages, a rewind)
and `escalation-on-uncertainty` (the agent stops and asks when it cannot choose between options or finds a
contradiction, instead of guessing).

## `background`: long tasks on its own

Adds `progress-file-feature-list`: a feature list and a progress file carry the state across sessions and context
resets; each session takes one failing feature and marks it passing only after a check. Without it, a long run forgets
what it did, repeats work, or declares the whole task done after one part.

Suggest:

- `isolated-environment`: each task in its own worktree with its own app instance, so parallel runs do not break each
  other.
- `approval-reviewer-agent`: a reviewer model answers routine permission prompts, so an unwatched run does not stop
  at each one.
- `async-questions-with-assumptions`: the agent writes down each non-blocking question with the assumption it made and
  keeps working; the person answers them in one batch.

## `ci-bots`: in CI, on issues and pull requests

Adds `agent-ci-hardening`: a CI check that every job that runs an agent keeps the egress firewall, the reviewed
permission mode and a model that supports it. An agent bot reads text from issues anyone can write; one edit to its
workflow can drop every guard, and nothing else fails.

Suggest `triage` (the bot's main job, done with a read-only judge and a separate write step) and `repo-health-agent`
(a daily agent reads the repository's flow metrics and proposes one process change at a time).
