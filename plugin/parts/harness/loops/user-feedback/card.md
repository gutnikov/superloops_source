---
id: user-feedback
title: "User feedback"
summary: "One piece of user feedback becomes acceptance criteria tied to a reproducible scenario, approved by a person; the agent works to them, and they become its spec and test."
sensor: human
ilities: [alignment, usability]
places: [delivery/oracle, remediation/oracle]
stages: [task]
speed: [hours, days]
needs: []
when: [before]
initiator: agent
sync: blocking
assesses: [intent]
related: [production-users, acceptance-loop, reproduction-gate, human-acceptance-criteria]
links:
  - title: "Harness engineering: leveraging Codex in an agent-first world"
    url: "https://openai.com/index/harness-engineering/"
    author: "OpenAI"
  - title: "Harness engineering for coding agent users"
    url: "https://martinfowler.com/articles/harness-engineering.html"
    author: "Böckeler"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
    note: "with gh installed and signed in, Claude reads issues and review comments"
  - title: "Extend Claude with skills"
    url: "https://code.claude.com/docs/en/skills"
    note: "the /fix-issue example skill"
---

## Why

Users find what the existing spec missed. But feedback as users write it is nothing an agent can test against: it
names a problem in the user's words, often with a solution attached. No sensor can check correctness until a person
has said what the software should do, so one item of feedback becomes criteria a test can check before any work.

## How it works

1. The agent reads the item, for a GitHub issue with `gh issue view <number>`, and drafts acceptance criteria: the
   problem as the user met it, a reproducible scenario (a named state, the steps, what the user sees), and what the
   user should see instead.
2. A person approves or corrects the criteria.
3. The criteria become the oracle: in delivery, examples of the spec that the [acceptance loop](../acceptance-loop/card.md)
   turns into red acceptance tests; in remediation, the reproduction of the
   [reproduction gate](../reproduction-gate/card.md).
4. The agent works until those tests pass.

Where the feedback comes from, and whether shipped work helped users, is [production-users](../production-users/card.md):
this loop takes one item from there and makes it testable.

## Set up

- **Take the problem, not the solution.** The criteria say what the user could not do, not the fix the user
  proposed.
- **Every criterion has a scenario** that runs: one the agent cannot reproduce goes back to the person with what it
  tried.
- **The call to the person**: approving the criteria is H5, a reference the loops will trust; an item with two
  readings is H1, asked with the readings as options. Both are logged with `loops.py hitl`.
- **Where the answer goes**: with the [`spec`](../../../spec/README.md) part, a requirement file under
  `superloops/specs/` that names the item; otherwise the criteria in the issue itself, which the tests cite by id.
- **A skill for the entry**, such as the `/fix-issue` example of the Claude Code docs, which reads an issue and works
  from it: put the drafting of criteria and the wait for approval before any code in it.
- **Validation** is `manual`: the person's approval is the signal. A script checks that every approved item has a
  test tagged with its id, and that the test failed before the work (the acceptance loop's or the reproduction
  gate's `run`).
