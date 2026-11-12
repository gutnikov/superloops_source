---
id: agent-branch-integration
title: "Parallel agents' branches merged and re-checked"
summary: "Parallel agents' branches merge one at a time, typecheck and tests after each; git picks the branches, and the wrapper fails a merge that moved nothing or left conflicts."
sensor: computational
ilities: [correctness, deployability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [task, ci]
speed: [minutes]
needs: []
agent: [worker]
related: [isolated-environment, afk-run-handoff, progress-file-feature-list, pre-commit-pre-push, ci-clean-infra, human-diff-review]
links:
  - title: "plan-prompt.md: blocked by overlapping files, one fixed branch name per issue"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/src/templates/parallel-planner-with-review/plan-prompt.md#L15-L37"
    author: "sandcastle (Matt Pocock)"
  - title: "run.ts: 4 runs in parallel, and git decides which branches merge"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/run.ts#L13-L34"
    author: "sandcastle (Matt Pocock)"
  - title: "main.mts: a run that threw is logged; only branches ahead of HEAD merge"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/src/templates/parallel-planner-with-review/main.mts#L183-L239"
    author: "sandcastle (Matt Pocock)"
  - title: "merge-prompt.md: typecheck and tests before the next branch"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/src/templates/parallel-planner-with-review/merge-prompt.md#L7-L14"
    author: "sandcastle (Matt Pocock)"
  - title: "update-branch.ts: plain git first, then the wrapper checks the agent's merge"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/update-branch/update-branch.ts#L53-L121"
    author: "sandcastle (Matt Pocock)"
  - title: "update-branch prompt.md: the resolution policy"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/update-branch/prompt.md#L27-L41"
    author: "sandcastle (Matt Pocock)"
  - title: "update-branch extraction.md: the comment for the person"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/update-branch/extraction.md#L13"
    author: "sandcastle (Matt Pocock)"
  - title: "lifecycleHostGit.ts: a failed merge is aborted, the target unchanged"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/src/lifecycleHostGit.ts#L72-L102"
    author: "sandcastle (Matt Pocock)"
  - title: "ci.yml: CI on the merge queue"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.github/workflows/ci.yml#L11-L13"
    author: "sandcastle (Matt Pocock)"
  - title: "ADR 0007: worktree locking"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/docs/adr/0007-worktree-locking.md#L13-L36"
    author: "sandcastle (Matt Pocock)"
    note: "a decision only: at this commit src/WorktreeManager.ts holds no lock."
  - title: "implement-spec: collisions at merge time, and the frontier from what merged"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement-spec.md#L54-L60"
    author: "skills (Matt Pocock)"
  - title: "implement-spec SKILL.md: each implementer merges the integration tip before it reports done"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement-spec/SKILL.md#L29-L34"
    author: "skills (Matt Pocock)"
---

## Why

Agents that run in parallel each work on a branch of their own, and each branch passes its checks alone. Put
together, the branches conflict, or they merge without a conflict and break: one renames a function the other calls.
Matt Pocock: "Worktrees don't remove collisions; they postpone them to merge time." An agent that resolves a
conflict can drop one side's intent, commit nothing or leave the merge half done, and a wrapper that takes its report
at its word ships that or strands a branch. [isolated-environment](../isolated-environment/card.md) keeps the runs
apart, and [pre-commit-pre-push](../pre-commit-pre-push/card.md) and CI check one branch at a time. This loop puts
the branches back together one at a time and checks the result after each.

## How it works

1. **The plan keeps colliding work apart.** A planner reads the open items and marks B as blocked by A when B needs
   code A adds, when "B and A modify overlapping files or modules, making concurrent work likely to produce merge
   conflicts" (sandcastle), or when B waits on a decision A makes. Only unblocked items run; when every item is
   blocked, the one with the fewest dependencies runs alone. An item's branch is `agent/issue-<id>`, with no slug,
   so planning the item again reuses the branch and the commits on it. The plan is JSON checked against a schema,
   and an empty plan ends the loop.
2. **Git says which branches to merge.** After the parallel runs, a branch is merged only when
   `git rev-list --count HEAD..<branch>` is above 0, whichever cycle made its commits. The run's own list of commits
   would strand it, sandcastle: "a branch an earlier cycle advanced but never merged gets no new commits when its
   issue comes round again, so gating on `commits.length` would strand it forever". A run that threw is logged, and
   its branch waits. The next plan reads the same fact: an item is done when its branch is merged, not when the
   tracker says so, since the blocked-by count "only drops when a blocker *closes*" (Pocock).
3. **One branch at a time, checked after each.** The merger agent runs `git merge <branch> --no-edit`, resolves any
   conflict, runs the typecheck and the tests, and fixes them before it takes the next branch. The wrapper runs the
   same checks again before it accepts the merge. A branch still red at the merger's turn limit is reset out
   (`git reset --hard <pre-merge sha>`) and its item blocked with the failing check
   ([afk-run-handoff](../afk-run-handoff/card.md)); the branches after it go on.
4. **When the base moves under an open PR, plain git goes first.** If `git merge-base HEAD origin/<base>` is the
   base's head, nothing happens. A `git merge origin/<base> --no-edit` that succeeds is pushed with no agent. Only a
   conflict calls the agent, with the conflicted tree and sandcastle's rules: "Always resolve. Do not abort the
   merge."; read how each side got there with `git log -p --follow -- <path>`; "Do not invent new behaviour", and
   flag the doubt instead.

After every merge an agent made, the wrapper checks the result, not the agent's account of it:

- HEAD moved; else "Agent produced no commits — branch still at pre-merge HEAD."
- `git diff --name-only --diff-filter=U` is empty; else "Agent left unresolved conflicts in:\n<files>".
- No file the merge changed has a line that starts with `<<<<<<< ` or `>>>>>>> `: a file staged with its markers
  still in it is not in the `U` list.
- The typecheck and the tests pass. sandcastle's prompt for a moved base leaves them to the agent ("`npm run test` if
  you want stronger confidence. You decide."); the wrapper runs them.

## Set up

- **A branch per item, named from its id alone**, and a cap on parallel runs: start at 4, as sandcastle's own loop
  does (`MAX_PARALLEL = 4`, at most 10 cycles), and raise it while the merges stay green.
- **Shared files get an edge.** When two items touch one shared file (a message catalogue, a config registry, a
  type), the plan blocks one on the other, or the shared notes fix the exact names each adds. In one of Pocock's
  reports, parallel tickets added "the same string as `blockedSince` and `blockedOn`": it merges clean and passes, so
  no check after the merge sees it. What does: two branches of one cycle that changed the same file, an edge the plan
  missed. The merges stay, and a person reads that file's diff before the next cycle.
- **One writer per worktree.** A run takes a lock outside the worktree, where the agent cannot delete or commit it,
  created atomically (`O_EXCL`) and holding its PID. A lock held by a live process fails the second run at once
  ("Worktree is in use by process <PID>"); a dead process's lock is removed; nothing waits. sandcastle's ADR 0007
  decides this lock, and at the pinned commit `src/WorktreeManager.ts` has none, so two runs on one named branch both
  get the worktree. Build the lock before the first parallel run, and keep its case below.
- **The merger cannot push or close items.** The wrapper pushes with a lease on the SHA it started from
  ([isolated-environment](../isolated-environment/card.md)) and closes the items whose branches
  `git branch --merged` lists.
- **A failed merge leaves the target as it was.** A merge the wrapper makes and cannot finish is aborted (when
  `MERGE_HEAD` exists), and the error names the kept branch and the retry, sandcastle: "To retry: git merge <branch>
  (resolve any conflicts and commit), then clean up: git branch -D <branch>".
- **`run <target> <branch>…`** merges as above and prints one line per branch: `not ahead`, `merged`, `resolved`, or
  the failure: `ahead of HEAD, not merged`, `no commit after resolution`, `unresolved: <files>`,
  `conflict markers: <file>:<line>`, `red after merge: <check>`; then `overlap: <file>: <branch>, <branch>` for each
  file two branches of the cycle both changed. `run --base <base> <branch>` prints `up to date`, `clean merge`,
  `resolved` or a failure. Both exit non-zero when a branch that was ahead of the target at the start is not merged
  green at the end, or on an overlap.
- **Cases.** Must fire: a branch an earlier cycle advanced and this cycle did not touch, under a wrapper that merges
  from the cycle's commits; two branches that merge without a conflict and fail the typecheck together (one renames
  a function, the other calls the old name); two unblocked branches that each add a key to one message catalogue,
  merged clean and green; a resolution that commits nothing; one that leaves a file unmerged; one
  that stages a file with `<<<<<<<` in it; two runs started on one branch at once, where the second must fail before
  its agent starts (it does not fail at sandcastle's pinned commit). Must pass: two branches on different files,
  merged and green; a base that has not moved; a base merge with no conflict, pushed with no agent.
- **Wiring**: the orchestrator runs `run` after each cycle, before it plans the next; `run --base` is a CI job on a
  label or on a push to the base. The last run is out of the agents' reach: CI on the target branch and on the merge
  queue, where sandcastle's CI runs on `merge_group` so "each queued PR is checked against the PRs ahead of it before
  it lands."

## Notes

- sandcastle's merge prompt asks for the typecheck and the tests "After resolving conflicts". A merge with no conflict
  can break the build as well, so the checks run after every merge.
- An implementer that merges the target's tip into its own branch before it reports done finds its conflicts while
  its context is warm, and turns the merge into a fast-forward. Pocock's implement-spec has every implementer do this,
  and still runs a merger after.

## Agent step

The merger is a worker. It gets the target branch with the merge in progress (or the branches git chose, in order),
the items' titles, and the failing check's output. It resolves conflicts, fixes what is red and commits. It returns a
comment for the person that names each conflict, how it was resolved, and any doubt, written, in sandcastle's words,
"like you're handing the branch back to them and want them to be able to spot any bad call you made in 30 seconds."
It does not push, close items or abort a merge, and it does not block: the wrapper's checks decide, and the person
reads its comment on the PR ([human-diff-review](../human-diff-review/card.md)).
