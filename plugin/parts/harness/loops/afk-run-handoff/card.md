---
id: afk-run-handoff
title: "An unattended run ends in a hand-off or a reason"
summary: "After an unattended agent run, a wrapper checks git, not the agent: commits ahead, no conflicts, a valid plan, the branch unmoved; any failure blocks the item with the reason and a one-step retry."
sensor: computational
ilities: [reliability, observability]
places: [delivery/work, remediation/work, maintenance/work, harness:delivery/gate]
stages: [ci]
speed: [seconds]
needs: [ci]
related: [agent-branch-integration, stop-hook, stall-detector, escalation-on-uncertainty, agent-ci-hardening, triage, garbage-collection, human-diff-review]
links:
  - title: "agent-implement.yml: the refusals before the agent runs"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/agent-implement.yml#L27-L102"
    author: "sandcastle (Matt Pocock)"
  - title: "agent-implement.yml: the run, the hand-off, agent:blocked with a reason, in-progress always removed"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/agent-implement.yml#L147-L211"
    author: "sandcastle (Matt Pocock)"
    note: "the review hand-off falls back to GITHUB_TOKEN when the PAT is missing (L178-L193)."
  - title: "implement.ts: no commits ahead of main fails the run"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/implement/implement.ts#L29-L32"
    author: "sandcastle (Matt Pocock)"
  - title: "common.ts: every failure writes failure_reason.txt"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/shared/common.ts#L18-L23"
    author: "sandcastle (Matt Pocock)"
  - title: "agent-review.yml: the push lease, and the blocked comment"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/agent-review.yml#L71-L134"
    author: "sandcastle (Matt Pocock)"
  - title: "explore apply.ts: the plan validated before any write"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/explore/apply.ts#L21-L28"
    author: "sandcastle (Matt Pocock)"
  - title: "explore apply.ts: a hand-off label added with GITHUB_TOKEN starts nothing"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/explore/apply.ts#L113-L132"
    author: "sandcastle (Matt Pocock)"
  - title: "Provider error retry: out of scope"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.out-of-scope/provider-error-retry.md#L3-L12"
    author: "sandcastle (Matt Pocock)"
  - title: "ADR 0020: prompt expansion fails fast"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/docs/adr/0020-prompt-expansion-fails-fast.md#L16-L73"
    author: "sandcastle (Matt Pocock)"
  - title: "software-factory: a run never waits for a human"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/software-factory/SKILL.md#L18-L24"
    author: "skills (Matt Pocock)"
    note: "a design glossary, in progress, with no running code."
  - title: "software-factory: start slow, and question every task"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/software-factory/SKILL.md#L54-L98"
    author: "skills (Matt Pocock)"
  - title: "software-factory: rework capped, fixes never chain"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/software-factory/EXAMPLE-TASKS.md#L26-L66"
    author: "skills (Matt Pocock)"
  - title: "software-factory: GITHUB_TOKEN ends chains"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/software-factory/GIT-HOSTS.md#L81"
    author: "skills (Matt Pocock)"
  - title: "to-spec: AFK runners build the whole spec in one run"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/to-spec.md#L41-L42"
    author: "skills (Matt Pocock)"
  - title: "triage: blocked and finished tickets picked up again"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/triage.md#L80-L87"
    author: "skills (Matt Pocock)"
  - title: "implement-spec: a deterministic loop for work that is truly AFK"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement-spec.md#L62-L64"
    author: "skills (Matt Pocock)"
  - title: "Triggering a workflow from a workflow"
    url: "https://docs.github.com/en/actions/using-workflows/triggering-a-workflow#triggering-a-workflow-from-a-workflow"
    author: "GitHub"
---

## Why

An agent that runs with nobody watching can end with nothing to show: no commit, a plan that does not parse,
conflicts left in the tree, a branch someone pushed to meanwhile, a crash or a timeout. If the item stays "in
progress", nobody learns that the run failed, why, or how to try again; if the next run starts anyway, it builds on
nothing. The [stop hook](../stop-hook/card.md) works inside the session and sends the agent back, the
[stall detector](../stall-detector/card.md) stops an agent that loops, and
[escalation](../escalation-on-uncertainty/card.md) depends on the agent choosing to stop. This loop runs after the
agent's process has exited, reads what the run left in git and the tracker, and leaves the item in one of two
states: handed on, or blocked with a reason and a one-step retry.

## How it works

1. **A label starts the run, and the wrapper refuses what the run cannot finish.** A person adds
   `agent:implement`. Before the agent starts, the wrapper removes the label and says why when the item has
   sub-items (a spec) or is one ("Label the parent issue instead."), when an open PR by a collaborator already
   closes it ("Close it first, then re-add `agent:implement`."), or when it is closed or marked done. Otherwise the
   label becomes `agent:in-progress`.
2. **The agent runs** on a fresh checkout, within the job's limit of 60 minutes.
3. **The wrapper checks the facts, not the agent's report.** A check that fails writes one line to
   `failure_reason.txt` and fails the job:
   - **commits ahead of main**: `git rev-list --count main..HEAD` is above 0; else "Agent finished but no commits
     were made on the branch.";
   - **no unresolved conflicts**, after a merge: HEAD moved and `git diff --name-only --diff-filter=U` is empty
     ([agent-branch-integration](../agent-branch-integration/card.md));
   - **a valid plan**, when the run's output is a plan: it parses against its schema before anything is written,
     and on any problem nothing is;
   - **the branch was not moved by someone else**: the push carries
     `--force-with-lease=refs/heads/<branch>:<sha the run started from>`, and a rejection is "Branch advanced during
     <task> run.".
4. **Then the hand-off.** All checks pass: the wrapper pushes, opens a draft PR with "Closes #N" and adds the next
   task's label, `agent:review`. Any failure: a step that runs on failure adds `agent:blocked` and comments:

   ```
   `agent:implement` run failed.

   **Reason:** Agent finished but no commits were made on the branch.

   **Workflow run:** https://github.com/<owner>/<repo>/actions/runs/<id>

   Re-add `agent:implement` to retry.
   ```

   A run that died before it wrote a reason gets "(no reason file written; check workflow logs)". A step with
   `if: always()` removes `agent:in-progress`, so no item stays in progress after its run.
5. **The retry is the whole run, and a person starts it.** Nothing inside a run retries itself. Provider errors are
   not retried; sandcastle: "Blindly retrying on any non-zero exit code would mask real errors". A failure to build
   the prompt is not either, since "retry is safe for idempotent infrastructure, unsafe for prompt content": a
   retried prompt may be one "assembled in a degraded environment". Only plumbing that gives the same result twice
   retries in place, as sandcastle's git setup does on exit codes 126 and 137 alone.

### Stop rules for a chain of runs

When one run's end starts the next (implement, review, rework, review), each run is a black box whose only memory
is the tracker and git. Matt Pocock's software-factory design, a glossary with no running code yet, gives the stop
rules; here each one is a line in a file and a check:

- **A run never waits for a human**: "it ends, and the human's later change to the ticket tracker or git host
  triggers a new run". `agent:blocked` is an end state, and the label a person adds again is the next run.
- **Every loop of runs has a cap.** Rework "After a set number of fails ... ends with the PR labelled as waiting for
  a human". The count lives on the PR, as a label, where a stateless run can read it: 3 rework runs by default.
- **A fix run's failure triggers nothing**: "A failure in a fix run's own work triggers nothing, so fixes never
  chain", and a fix to the factory itself always gets a person's review.
- **A new trigger starts throttled**: "one bug report in ten, a clock once a day", with a person's review on every
  PR, opened up "as the brakes earn trust".
- **Every task answers "What stops two runs doing the same work?"** In GitHub Actions: a concurrency group keyed by
  the item, with `cancel-in-progress: false`, so a second run queues instead of racing.

Three failures stop or corrupt a chain with no error, and each is a must-fire case:

- **The hand-off token.** Events caused by a workflow's `GITHUB_TOKEN` start no new workflow runs, "so a run
  pushing with it silently stops the next run". sandcastle's implement job adds `agent:review` with a PAT and falls
  back to `GITHUB_TOKEN` when the PAT is missing: the label appears, and no review runs. Hand off with an App identity
  or a PAT; with neither, block the item ("hand-off token missing") instead of adding a label that starts nothing.
- **A parent spec picked up.** A spec labelled ready makes AFK runners "try to build the whole spec in one run
  instead of picking up the ticket slices", and an item specified but waiting on another is picked up and gets
  stuck. The preflight refuses an item with sub-items or an open blocker.
- **A finished item queued again.** With no terminal "implemented, awaiting verification" state, "an AFK runner can
  queue finished tickets again". The preflight refuses an item that is closed, marked done or already closed by an
  open PR.

## Set up

- **The labels**: the trigger, `agent:in-progress`, `agent:blocked`, the next task's trigger and a fail count. A
  person adds a trigger, every retry and the merge; a run adds only the next task's trigger.
- **The wrapper**, in the same job after the agent's step: the preflight, the checks, and a `fail(<reason>)` that
  writes the reason file and exits 1. The agent's step gets no token that can edit labels or push; the wrapper's
  steps do ([agent-ci-hardening](../agent-ci-hardening/card.md)).
- **Each task's workflow**: `timeout-minutes: 60`, a concurrency group keyed by the item, a `failure()` step that
  blocks with the reason and the run's URL, and an `always()` step that removes `agent:in-progress`.
- **The chain file**, `superloops/chain.yaml`: per task, the five answers (its trigger; what it reads and writes;
  what it triggers next; where a person re-enters; its concurrency key), a cap for every task that can start itself
  again, and a throttle for every trigger that is not a person.
- **`run <task>`** reads a case: the item (its labels, sub-items, blockers, open PRs, state) and the run's end (the
  exit, the reason file, the start SHA, HEAD, the plan, the push's result). It prints one line per check,
  `<check>: ok` or `<check>: <reason>`, then `handoff: <label>` or `blocked: <reason>`, and exits 1 on `blocked`.
- **`run --chain`** reads the chain file and the agent workflows and prints one line per problem,
  `<workflow>:<job>: <problem>`: a missing answer; a cycle with no cap; a fix task whose failure starts a run; an
  automated trigger with no throttle; a job with no timeout, no concurrency group on the item, no `failure()` step
  with the reason, or an in-progress removal without `always()`; a trigger label or a push made with `GITHUB_TOKEN`,
  as a fallback too; a retry around the agent's call. It exits non-zero on any.
- **Cases.** Must fire: the agent exits 0 with no commit ahead of main; a merge that leaves HEAD unmoved, or a file
  in `--diff-filter=U`; a plan that fails its schema, with nothing written; a push the lease rejects; a job killed at
  its timeout, which still ends blocked with the fallback reason and without `agent:in-progress`; an item with
  sub-items; an item an open collaborator PR already closes; a closed item labelled again; a hand-off that falls
  back to `GITHUB_TOKEN`; a fix task whose failure starts another fix; a rework loop with no cap. Must pass: a run
  with one commit ahead, a clean tree and an accepted push, handed on to `agent:review`; an item whose only open PR
  is an outside contributor's.
- **Wiring**: the wrapper's steps run after the agent in the same job, where the agent cannot skip them. `run --chain`
  is a required CI check on every change to the agent workflows or the chain file, whose code owners review it.

## Notes

- Matt Pocock's advice for work that is truly unattended: "a deterministic loop (Sandcastle, a shell script, a CI
  job) is faster, cheaper, and more reliable, because no agent makes the orchestration decisions". Every decision in
  this loop is the wrapper's.
- Where an orchestrator retries with no person, it retries only the whole run, only after a timeout, and counts the
  retry against the cap. sandcastle gives a timeout its `elapsedMs` and a failed command its `exitCode` "so a
  downstream orchestrator can programmatically branch — timeout → retry the whole run; non-zero exit → don't".
- A run that hangs is a failure with a reason too: the [stall detector](../stall-detector/card.md)'s silence timer
  ends it and writes "Agent idle for 600 seconds".
