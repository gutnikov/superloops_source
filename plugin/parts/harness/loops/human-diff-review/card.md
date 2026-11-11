---
id: human-diff-review
title: "Diff review by a person"
summary: "The person comments on the PR; the agent fixes the comments and replies in the thread."
sensor: human
ilities: [alignment, maintainability]
places: [delivery/gate, remediation/gate, maintenance/gate]
stages: [ci]
speed: [hours, days]
needs: [ci]
when: [after]
initiator: rule
sync: async
assesses: [code, intent]
related: [agent-code-review, result-demo, correction-becomes-rule, sample-audit]
links:
  - title: "Human review"
    url: "https://www.aihero.dev/ai-coding-dictionary/human-review"
    author: "Matt Pocock"
    note: "AI Hero, AI Coding Dictionary"
  - title: "Human-in-the-loop AI coding"
    url: "https://kilo.ai/human-in-the-loop-ai-coding"
    author: "Kilo"
    note: "vendor material"
  - title: "Small CLs"
    url: "https://google.github.io/eng-practices/review/developer/small-cls.html"
    author: "Google"
    note: "Google's engineering practices: how big a change to send for review."
  - title: "About protected branches"
    url: "https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches"
    author: "GitHub"
  - title: "REST API endpoints for pull request review comments"
    url: "https://docs.github.com/en/rest/pulls/comments"
    author: "GitHub"
---

## Why

Tests check that the code works, and an AI review removes the obvious. Neither says whether this is the right
change, or whether the approach fits the codebase; a person reading the diff can.

## How it works

1. An AI review checks the PR first: [code review by another agent](../agent-code-review/card.md).
2. The person reads the diff and comments on the PR; the agent goes on with other work meanwhile.
3. The agent fixes the comments and replies in the thread.
4. The person approves, or comments again.

## Set up

- **The diff, not the description.** Matt Pocock: "Reading the diff counts; reading the summary doesn't." The
  description is written by the side under review. Leave the person what only they can judge: "whether the change
  is the right change, whether the approach fits the codebase, whether this should exist at all."
- **AI review first.** Kilo: "AI review runs first to clear the obvious issues, then a human reviewer signs off on
  intent and design." The person is called only once the reviewer agents have no open high finding.
- **Small diffs.** Google's review guide: "100 lines is usually a reasonable size for a CL, and 1000 lines is
  usually too large." The loop's `LOOP.md` sets the limit; start at 400 changed lines, generated files and lock
  files not counted, and split a PR over it before asking. A large diff is how review turns into a rubber stamp
  (Kilo: "Volume goes up, scrutiny goes down, and review becomes theater").
- **Called under H2.** Below `autonomy: merge` the merge is beyond the agent's level, so a PR ready to merge is a call
  to the person. The agent asks in the session through the question tool with 2–4 options, the recommended one
  first (`review now`, `split it first`, a free answer), with the PR link, its size and the AI review's result, and
  logs it: `loops.py hitl H2 --loop <loop-id> --checked "<AI review, size>" --question "…" --answer "…"`. At
  `merge` and above the agent merges on its own, so the project lists the paths that still need a person in
  CODEOWNERS and the protected branch requires a code owner's review.
- **Comments and replies.** The agent reads the review comments with `gh api
  repos/{owner}/{repo}/pulls/<n>/comments` and answers each with `POST
  /repos/{owner}/{repo}/pulls/<n>/comments/<comment_id>/replies`, naming the commit that fixes it. GitHub supports
  replies only to a top-level review comment ("Replies to replies are not supported"). The agent leaves resolving a
  thread to the person who opened it. A question back goes to the session, not the thread.
- **Where the answer goes.** A comment that states a rule ("handlers never call the database") becomes a lint, a
  fitness function or a line in CLAUDE.md, and is logged as a correction at the phase that should have caught it:
  `loops.py trace correction <super-loop>/work --item <PR> --note "<the comment>"`. The same correction twice goes to
  [correction-becomes-rule](../correction-becomes-rule/card.md).
- **`run` checks that the PR is ready for a person**, one line per condition, `<PR>: <status>`: `size 1240 lines,
  limit 400`, `ai review missing`, `ai review: 2 high findings open`, `ready`. It exits non-zero unless `ready`.
  Must fire: a diff over the limit; a PR with no AI review; a PR with a high finding open. Must pass: a 90-line
  diff with a clean AI review. The review itself is `manual`: no case can stand in for the person.
- **Wiring and protection.** `run` is a CI job on the PR. On the protected branch, require an approving review,
  "dismiss stale pull request approvals when commits are pushed that affect the diff", and require conversation
  resolution, which "requires all comments on the pull request to be resolved before it can be merged". Give the
  agent its own account for pushing, and turn on the rule that "the most recent reviewable push must be approved by
  someone other than the person who pushed it": then the agent cannot approve its own push.
