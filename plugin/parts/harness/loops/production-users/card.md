---
id: production-users
title: "Users in production"
summary: "A person reads the users' signal from production in aggregate: feedback, support tickets, A/B tests, dogfooding. It shows whether shipped work has value; a single item goes on to user-feedback."
sensor: human
ilities: [alignment, usability]
places: [delivery/entry, delivery/confirmation, remediation/entry, discovery/entry]
stages: [production]
speed: [days, weeks]
needs: []
when: [production]
initiator: human
sync: async
assesses: [intent]
related: [user-feedback, triage, release-confirmation]
links:
  - title: "Human-in-the-loop cycles (in Russian)"
    author: "Alexander Gutnikov"
    note: "unpublished note, 2026-11-08"
  - title: "feedback_view.rs: /feedback, its categories, consent and the issue link"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/tui/src/bottom_pane/feedback_view.rs#L40-L100"
    author: "Codex (OpenAI)"
  - title: "feedback/src/lib.rs: a 4 MiB log ring kept for feedback"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/feedback/src/lib.rs#L238-L262"
    author: "Codex (OpenAI)"
    note: "\"Capture diagnostics independently of `RUST_LOG`\"."
---

## Why

Every earlier loop checks the work against what someone on the team believes users want. This loop checks whether
those beliefs were right. Its signal is the slowest and the noisiest: it comes after days or weeks, in users' own
words, from a few of them at a time. So a person reads it in aggregate, across channels, before any of it becomes
work.

## How it works

1. Users give a signal in production through its channels: feedback, support tickets, A/B tests and dogfooding.
2. [Triage](../triage/card.md) merges the signals about the same thing and routes each to one super-loop.
3. A person reads the signal in aggregate, with the count and the channels behind each item, and answers one of two
   questions:
   - at delivery's confirmation: did a shipped change bring the value it was for?
   - at an entry: which problems are worth work now: a regression for remediation, a new need for delivery, an open
     question for discovery?
4. A single item chosen for work goes on to [user-feedback](../user-feedback/card.md), which turns it into acceptance
   criteria tied to a reproducible scenario, and a test the agent runs.

## Set up

- **The channels** are listed in the loop's `LOOP.md`, each with where it is read: the feedback form, the support
  tool, the experiment platform, the dogfooding channel. Every signal keeps a link to where it came from.
- **A channel in the product carries its evidence.** Feedback typed into the product can bring the session it is
  about, so the item reaches [user-feedback](../user-feedback/card.md) with a scenario to reproduce, not a
  description. Codex's `/feedback` asks for a category (`bad_result`, `good_result`, `bug`, `safety_check`, `other`),
  then asks consent to attach the logs and the session file, saying "Files may contain prompts, commands, and tool
  output". The logs come from a 4 MiB ring kept at the finest level whatever the user's log setting. The user gets the
  session's id and a link to open an issue that cites it, so the person reading the issue can open the exact session.
  Without consent, the signal is the category and the user's own words.
- **The problem, not the solution.** Record what the user tried to do and what got in the way, in their words. A
  requested feature is a hypothesis about that problem.
- **Counted, not anecdotal.** Triage merges signals on the same thing, and the count travels with the item: one loud
  complaint and fifty quiet ones are different priorities.
- **Each shipped change names its question for users before the release**: what users should do more, or complain
  about less. [release-confirmation](../release-confirmation/card.md) shows that the change runs and broke nothing;
  this loop shows whether it was worth it. The window for the read is set in `LOOP.md`; start at 4 weeks, long
  enough for a weekly user to meet the change several times.
- **An A/B test** is decided on a metric and a threshold fixed before it starts and approved by a person under H5:
  a metric picked after the result fits the result.
- **Called under H4** when the agent proposes which items to act on first, a trade-off only the person can weigh,
  and under H1 when what users meant stays unclear after reading the signals. The agent shows a table (the item, the
  count, the channels, the route) and asks through the session's question tool with 2–4 options, the recommended
  one first, and a free answer. It logs the call: `loops.py hitl H4 --loop <loop-id> --checked "<the signals
  read>" --question "…" --answer "…"`.
- **Where the answer goes.** An item chosen for work goes to [user-feedback](../user-feedback/card.md) as a
  requirement file with its origin (`specs.py new-req <KEY> --source <ticket url>`, the
  [`spec`](../../../spec/README.md) part). An item the person declines is closed in the tracker with the reason, so
  the next signal on it merges there instead of being asked again. A shipped change users did not value passed the
  gate and was not confirmed: it is an escape at the oracle that approved it, `loops.py trace escape delivery/oracle
  --item <change> --note "<what users said>"`.
- **Validation is `manual`**: only a person can read what users value. `run` checks that the reads happen: one line
  per shipped change, `<change>: <status>` (`valued`, `not valued`, `question missing`, `due, not read`), and a
  non-zero exit while a change has no question or is past its window unread. Must fire: a change shipped 6 weeks
  ago with no read; a change with no question. Must pass: every change read, or still inside its window.
- **Wiring.** A weekly scheduled job pulls the channels' new signals into triage and lists the changes due for a
  read; the next session asks the person. Replying to a user sends something outside the project, so it is a call
  under H2, never the agent's own step.
