---
id: agent-code-review
title: "Code review by another agent"
summary: "The coding agent asks reviewer agents with a fresh context to review the committed diff, and fixes confirmed findings for at most five rounds, each re-review checking only the open ones."
sensor: inferential
ilities: [maintainability, correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local]
speed: [minutes]
needs: []
agent: [reviewer]
related: [verification-subagent, security-review-agent, human-diff-review, agent-calibration, simplification-pass, stall-detector, agent-branch-integration, afk-run-handoff]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "Review locally with /code-review"
    url: "https://code.claude.com/docs/en/code-review-local"
    author: "Anthropic"
  - title: "Create custom subagents"
    url: "https://code.claude.com/docs/en/sub-agents"
    author: "Anthropic"
  - title: "Commands"
    url: "https://code.claude.com/docs/en/commands"
    author: "Anthropic"
    note: "/simplify and /code-review."
  - title: "/pr: review PRs (a prompt template)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.pi/prompts/pr.md"
    author: "pi (earendil-works)"
  - title: "Caretaker agent: the PR generator's orchestrator"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/tools/caretaker-agent/cloudrun/pr-generator/workflow/orchestrator.py#L228-L321"
    author: "gemini-cli (Google)"
    note: "coder and evaluator rounds, the 500-line limit, a person after the last attempt."
  - title: "Caretaker agent: the evaluator's prompt"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/tools/caretaker-agent/cloudrun/pr-generator/agent_prompts/code_evaluator_prompt.md#L74-L96"
    author: "gemini-cli (Google)"
    note: "the linter's output is read, not run; lint is judged only on the files in the diff."
  - title: "async-pr-review: the review script"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.gemini/skills/async-pr-review/scripts/async-review.sh#L70-L157"
    author: "gemini-cli (Google)"
    note: "CI's result reused, only the failing test files re-run, the change exercised by hand."
  - title: "Codex /review: the review rubric"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/prompts/templates/review/rubric.md#L10-L95"
    author: "Codex (OpenAI)"
    note: "what counts as a finding, rule attribution to AGENTS.md lines, P0-P3, a confidence per finding, an overall verdict."
  - title: "Codex /review: the reviewer subagent's restrictions"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/core/src/tasks/review.rs#L104-L121"
    author: "Codex (OpenAI)"
  - title: "A scoped AGENTS.md as a review contract"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/exec-server/src/sandbox_integrity/AGENTS.md#L24-L36"
    author: "Codex (OpenAI)"
    note: "accepted limitations listed next to the code; \"not a blanket exemption\"."
  - title: "code-review plugin: the review command"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-review/commands/code-review.md#L15-L58"
    author: "Anthropic"
    note: "a pre-gate, CLAUDE.md rules scoped to their directory, HIGH SIGNAL only, one validator per issue."
  - title: "code-review plugin: what is not a finding, and how comments are posted"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/code-review/commands/code-review.md#L72-L87"
    author: "Anthropic"
  - title: "pr-review-toolkit: reviewers routed by what the diff touches"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/pr-review-toolkit/commands/review-pr.md#L35-L88"
    author: "Anthropic"
  - title: "pr-review-toolkit: the silent-failure hunter"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/pr-review-toolkit/agents/silent-failure-hunter.md#L78-L109"
    author: "Anthropic"
  - title: "pr-review-toolkit: the comment analyzer"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/plugins/pr-review-toolkit/agents/comment-analyzer.md#L23-L29"
    author: "Anthropic"
  - title: "subagent-driven-development: the fix loop"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/subagent-driven-development/references/fix-loop.md#L7-L77"
    author: "superpowers (obra)"
    note: "five rounds, a fresh implementer on a stronger model at round 4, rulings only at the cap."
  - title: "re-review-prompt.md: scoped to the findings and the fix diff"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/subagent-driven-development/re-review-prompt.md#L55-L100"
    author: "superpowers (obra)"
  - title: "Fix-loop redesign: full re-reviews are the churn engine"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-07-15-sdd-fix-loop-redesign-design.md#L13-L44"
    author: "superpowers (obra)"
  - title: "Fix-loop redesign: the never-satisfied reviewer eval"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-07-15-sdd-fix-loop-redesign-design.md#L173-L187"
    author: "superpowers (obra)"
  - title: "subagent-driven-development: what the coordinator writes into a reviewer's prompt"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/subagent-driven-development/SKILL.md#L271-L293"
    author: "superpowers (obra)"
    note: "\"do not flag,\" \"don't treat X as a defect,\" \"at most Minor,\" or \"the plan chose\" — stop: you are pre-judging."
  - title: "Task-scoped review dispatch: why each rule exists"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-06-09-sdd-task-scoped-review-dispatch-design.md#L132-L146"
    author: "superpowers (obra)"
    note: "a coordinator that invented a plan rule; a version floor no reviewer saw; unsupported \"yes\" answers."
  - title: "task-reviewer-prompt.md: evidence, cannot-verify and plan-mandated findings"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/subagent-driven-development/task-reviewer-prompt.md#L105-L157"
    author: "superpowers (obra)"
  - title: "code-review docs: uncommitted work, no convergence, a mid-run review"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/code-review.md#L63-L81"
    author: "skills (Matt Pocock)"
  - title: "code-review: the diff against the merge base, a bad ref or empty diff fails"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review/SKILL.md#L17-L23"
    author: "skills (Matt Pocock)"
  - title: "implement-spec docs: a review mid-build, about four hours"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/implement-spec.md#L46-L48"
    author: "skills (Matt Pocock)"
  - title: "CLAUDE.md: a subagent starts with a fresh context window"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/CLAUDE.md#L27"
    author: "skills (Matt Pocock)"
  - title: "sandcastle review prompt: the reviewer improves the branch"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/review/prompt.md#L8-L49"
    author: "sandcastle (Matt Pocock)"
  - title: "sandcastle review.ts: the verdict from the commits, comments filtered to the diff"
    url: "https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/review/review.ts#L53-L76"
    author: "sandcastle (Matt Pocock)"
  - title: "code-review docs: sub-agents that start the review again"
    url: "https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/docs/engineering/code-review.md#L59-L61"
    author: "skills (Matt Pocock)"
    note: "\"Do not invoke `/code-review` or spawn additional agents: perform this review directly.\""
  - title: "subagent-driven-development: workers spawn no reviewers"
    url: "https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/subagent-driven-development/SKILL.md#L225-L230"
    author: "superpowers (obra)"
---

## Why

An agent that reviews its own change reads it with the reasoning that produced it, and misses what that reasoning
missed. A reviewer in a fresh context gets only the diff and the requirement. It can catch what is a matter of
judgement, such as semantic duplication and over-engineering, though only partly, at a cost, and not the same way
every time.

## How it works

1. The coding agent, or the coordinator that runs a plan's tasks, asks one or more reviewer agents for a review of
   the committed diff. Each reviewer starts with a fresh context.
2. The reviewers return Findings, and the finding verifier checks each high one.
3. Confirmed high findings enter the fix loop. Medium and low ones go to a log that the final review reads; they
   never enter the loop.
4. **The fix loop ends.** A round is one fix and one re-review, five rounds at most:
   - Rounds 1–3 go back to the same implementer, with the open findings verbatim. Rounds 4–5 go to a fresh
     implementer on a stronger model, told, in superpowers' words, "A prior implementer attempted this task [N]
     times; you own it now."
   - The re-review starts only once the fix report names the covering tests, the command and its output.
   - The re-review checks only the open findings, on the fix diff: each is `ADDRESSED` or `NOT ADDRESSED`
     ("'Attempted' is not addressed"), and new breakage in the fix diff joins the open list. Anything outside the
     fix diff goes to the log and adds no round.
   - After round 5 the coordinator rules on each open finding: it parks it with `Ruling: <why the code stands>`, or,
     when later work builds on it, rules on the smallest change that unblocks that work. Every ruling is a log line,
     and the final report lists them all. It does not rule earlier: "Adjudicating earlier to end a loop is
     pre-judging with a different name." A finding that leaves every way forward a guess goes to a person (H1).

The re-review is scoped because a full one never converges. superpowers found review loops the largest variance in
a run's cost and full re-reviews each round "the churn engine"; Matt Pocock's code-review says not to loop "until it
comes back clean, because it never will."

At OpenAI almost all review happens between agents.

## Set up

- **Reviewers as subagents.** One file per lens in `.claude/agents/`, such as `.claude/agents/review-correctness.md`,
  with `tools: Read, Grep, Glob`. The `tools` field is an allowlist, so Claude Code keeps the reviewer from editing
  anything or starting agents. A reviewer started another way, such as a general-purpose agent a skill dispatches,
  keeps the Agent tool and can start the review again (Matt Pocock: "One report reached more than 50 agents"); the
  spawn cap of [stall-detector](../stall-detector/card.md) denies it. The coordinator passes the reviewer the diff
  and the requirement, and it returns Findings ([agent formats](../../agent-formats.md)). Where a harness forks the
  parent conversation by default, as Codex does, the dispatch says to start with a fresh context window.
- **Or `/code-review`.** The bundled skill reviews the branch's changes for correctness bugs in a forked subagent
  with its own context window, and reports its findings in the conversation; `--fix` applies them. It follows
  `CLAUDE.md`, which is where the project's review rules go. Use it for the correctness lens, and the subagents above
  for the lenses it does not cover.
- **`/simplify` is not this loop.** It runs four agents on reuse, simplification, efficiency and abstraction and
  applies their fixes, without looking for bugs. Run it as a cleanup step before the review if the project wants
  one, and write that choice in the loop's `LOOP.md`.
- **Commit, then review.** Reviewers read `git diff <base>...HEAD`, against the merge base, which excludes staged
  and uncommitted work: Matt Pocock's code-review saw nothing when the implementer had not committed. A base that
  does not resolve, or an empty diff, fails before any reviewer starts.
- **Review against what is built.** During a multi-ticket build each review checks its own ticket; the review
  against the whole spec runs once, after every ticket has landed. Run mid-build, Matt Pocock's review read each
  unbuilt ticket as a failure, the agent built it, a new review started, and one five-ticket feature's "review and
  fix loop took roughly four hours".
- **What the coordinator writes into a reviewer's prompt.** The diff, the requirement, and the binding constraints
  copied verbatim from the spec: a superpowers run shipped a `go 1.26.1` module floor against a "Go 1.21+" design
  because "no reviewer ever saw the constraint". Never "do not flag", "don't treat X as a defect", "at most Minor"
  or "the plan chose": an eval caught a superpowers coordinator inventing "the plan forbids a shared helper" to keep
  the reviewer from flagging a planted duplication. No open-ended orders such as "check all uses", and no re-run of
  tests the implementer ran.
- **The loop runs the checks; the reviewer reads their output.** Run the linter on the changed files before the
  review and give the reviewer its output with the diff, so every round rests on one record of the checks.
  gemini-cli's caretaker agent writes `eslint --max-warnings 0` on the changed files into `linter_output.txt`; its
  evaluator ("Do NOT run the linter yourself") writes `verdict.json`, `APPROVED` or `NEEDS_REVISION`, with feedback
  for the coder, and a missing or unreadable verdict counts as `NEEDS_REVISION`.
- **A size limit as well as a round limit.** An approved diff of more than 500 changed lines goes to a person (H4)
  instead of becoming a PR: a reviewer's pass over that much code is not to be trusted alone. The caretaker agent
  stops at 500 lines and after 5 rounds, and an issue it has tried to fix in 2 runs goes to a person.
- **What counts as a finding**, in each reviewer's instructions. Codex's `/review` flags a bug only if "The bug was
  introduced in the commit (pre-existing bugs should not be flagged)", a claim of breakage elsewhere must "identify
  the other parts of the code that are provably affected", and a rule-based finding cites the AGENTS.md lines. Each
  finding has a priority P0 to P3, a confidence, and a location of at most 10 lines in the diff: P0 and P1 map to
  `high`, P2 to `medium`, P3 to `low`.
- **A gate before the review, and a validator after it.** Anthropic's code-review plugin first has a cheap agent stop
  the review when the PR is closed, a draft, trivial, automated or already reviewed. Reviewers flag only "HIGH
  SIGNAL" issues: code that will not compile or parse, a result wrong "regardless of inputs", a CLAUDE.md violation
  "where you can quote the exact rule being broken", where a rule applies only under its directory; nothing
  pre-existing or that a linter catches. Each issue then goes to its own validating subagent, and an issue it does
  not validate is dropped: the finding verifier of this card, run per issue.
- **The `run`** fails first on a base that does not resolve, an empty diff, or a dispatch prompt that holds one of
  the phrases above. It then runs the reviewers on the diff and prints their Findings, one JSON line each, and the
  log of rounds and rulings. It exits non-zero for a high finding the verifier confirmed, but only for a calibrated
  reviewer; until then it prints the findings and exits 0.
- **Cases** are the reviewers' evals: one must-fire diff per lens, such as an off-by-one in a page loop for
  correctness, a query built by string concatenation for security, a test that asserts nothing for tests; and a
  must-pass diff, a pure rename with the tests green. The loop's own: a never-satisfied reviewer, seeded to raise a
  new finding every round, must stop the loop after round 5 with a ruling per open finding; a dispatch prompt with
  "the plan chose" must fail; uncommitted work with an empty diff must fail.
- **Wiring.** The coding agent runs the loop after its tests pass and before it opens the PR. A CI job runs the same
  reviewers on the PR, outside the coding agent's session, so a skipped review still happens; the agent cannot edit
  the reviewers' definitions, which a PreToolUse hook protects.

## Notes

- Böckeler: "LLMs can partially address problems that require semantic judgment", such as "semantically duplicate
  code, redundant tests, brute-force fixes, over-engineered solutions", "but expensively and probabilistically."
- Pi's PR review (`/pr`) reads beyond the diff: the linked issues, the untouched code paths the behaviour depends
  on, and the user docs that may need to change. It reads files with `git show <ref>:<path>` instead of checking out
  the branch, so a review leaves the working tree as it was.
- gemini-cli's `async-pr-review` skill reuses CI's result: green or pending CI means no local test run, and red CI
  means only the test files named in the failed job's log are run again. One agent exercises the changed code by
  hand, with "Do NOT modify any source code" ([agentic-manual-testing](../agentic-manual-testing/card.md)).
- **Accepted limitations, written where the code is.** A reviewer re-raises a known, accepted gap in every round.
  Codex keeps a "scope and review contract" in a scoped AGENTS.md next to such code: the invariants, the "accepted
  limitations of this phase", and what stays a finding: "this is not a blanket exemption". Reviewers read the scoped
  AGENTS.md of every file in the diff.
- Anthropic's pr-review-toolkit picks reviewers by what the diff touches: a general reviewer always; changed tests
  bring a test analyzer, new comments a comment analyzer, changed error handling a silent-failure hunter (empty
  catches, catch-and-continue, retries that give up without telling anyone), new types a type analyzer. Its plan
  ends with "Re-run review after fixes"; here the re-run is scoped to the open findings.
- **A reviewer that edits is a second implementer, not a review.** sandcastle's CI reviewer is told "Your job is not
  just to comment. Actively improve the branch", commits, and never blocks: its verdict is `improved` when it
  committed and `clean` when it did not, and a person does the real review. Take it as a warning: nobody but that
  person reviews the reviewer's commits. Its wrapper's filter is worth copying: an inline comment whose `path:line`
  is not in a diff hunk is dropped.
- The security lens has its own loop, [security-review-agent](../security-review-agent/card.md). A subagent that
  tries to prove a claim of done wrong by running things is
  [verification-subagent](../verification-subagent/card.md).

## Agent step

Use one reviewer per lens: correctness, security, tests, performance, and the project's conventions. Each reviewer:

- works in a fresh context
- gets the diff and the requirement, not the coding agent's reasoning
- only reads, and starts no other agent
- returns Findings, with `file:line` evidence for every finding and for every check it would otherwise answer with
  a bare "yes"

A requirement that lives in unchanged code is reported as "cannot verify from diff", not searched for; the
coordinator resolves each one, and a confirmed gap enters the fix loop. A defect the plan mandates is still a
finding, "labeled plan-mandated", and a rationale in the implementer's report, such as "left it per YAGNI", never
lowers its severity.

A finding verifier checks each high finding. The coding agent acts on a high finding only after that check.

A reviewer blocks only once calibrated ([agent-calibration](../agent-calibration/card.md)). Until then, its findings
are advice.
