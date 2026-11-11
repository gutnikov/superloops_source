# Step: autonomy

How far may the agent go without asking? The answer is the `autonomy` field of `superloops/superloops.md`
(`$H/README.md`, "Preferences"). The more the agent does alone, the more of a person's checks a loop must take over:
whatever no person looks at needs a check that does.

Recommend the level the project's setup supports: `branch` where a protected branch needs a review, `merge` where CI
gates every pull request, `deploy` only where a confirmation judges every release. At every level, anything that
cannot be undone is a call to a person (H2, `risky-action-gates`).

## `ask`: ask before every change

Adds nothing: a person approves every change.

Suggest `task-restatement` (the agent restates the task before it plans) and `choose-from-options` (on questions of
taste, 2–3 options for the person to pick from). Both make the person's many approvals quicker.

## `branch`: work on a branch, open a pull request

Adds nothing: the person who merges reviews the pull request.

Suggest `agent-code-review` (reviewers with a fresh context before the person reads the diff) and `result-demo` (the
agent shows the working feature: a preview link, screenshots, recorded output), so the person judges the behaviour,
not only the code.

## `merge`: merge when the gates are green

Adds `verification-subagent` and `agent-code-review`. No person reads the diff before it merges, so two checks take
over: a subagent with a fresh context tries to prove "done" wrong by running the tests and opening the app, and
reviewer agents read the diff through checklists. Both advise until they are calibrated
(`agent-calibration`); until then a red verdict sends the change back to a person.

Suggest `sample-audit` (the person reviews a sample of what merged without them) and `agent-audit-trail` (the agent
leaves the evidence: commands with their output, screenshots, so a reviewer checks evidence instead of re-running).

## `deploy`: merge and release

Adds `verification-subagent` and `agent-code-review`, as for `merge`. With production and a signal the agent can read,
a rule adds `release-confirmation`: the agent releases on its own, so something must judge each release where it runs.

Suggest `sample-audit`, `canary-feature-flags` (a release that rolls back when the canary is worse) and
`approval-reviewer-agent` (a reviewer model answers routine permission prompts, so the run does not stop at each one,
while irreversible actions still go to a person).
