# Step: team

Who works on the project? It decides who reviews the agent's changes, and so which loops stand between the agent and
the main branch. A person alone sees every change anyway; a team reviews in pull requests; an open-source project also
takes work from strangers.

Confirm from the branch protection (required reviews), `CODEOWNERS`, and the contributors in the history.

## `solo`: one person

Adds nothing beyond the core: the person is the reviewer, and `plan-approval` already puts them at the start of each
non-trivial task.

Suggest `sample-audit` once the agent merges without them (the `merge` or `deploy` autonomy): on a schedule, the person
reviews a random sample of what was merged, and marks where it differs from what they expected.

## `team`: a team

Adds `human-diff-review`: a person comments on the pull request, and the agent fixes each comment and replies in the
thread. Review comments are the team's main signal; the loop makes the agent act on them instead of a person
re-explaining.

Suggest:

- `agent-code-review`: reviewer agents with a fresh context before a person looks, so people review fewer trivial
  problems.
- `taste-invariants`: the comments that repeat (naming, file size, log format) become small check scripts.
- `architecture-fitness-functions`: the team's layer rules as a check that names the rule and the fix.

## `open-source`: an open-source project

Adds `human-diff-review` and `triage`. Issues and pull requests arrive from people outside the team, many written with
an agent: triage merges duplicates, routes each item, and asks for what is missing before anyone spends time on it.

Suggest:

- `agent-ci-hardening`: an agent that answers issues in CI reads text a stranger wrote; its job must keep the egress
  firewall and the reviewed permission mode.
- `check-incubation`: outside contributions add tests that flake; a new check runs without blocking until its
  record shows it is stable.
- `taste-invariants`: conventions as checks, since outside contributors never read the style guide.
