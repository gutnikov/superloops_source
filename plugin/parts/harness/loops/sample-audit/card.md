---
id: sample-audit
title: "Sample audit"
summary: "On a schedule, the person reviews a random sample of what the agent did or merged without them, and marks where it differs from what they expected."
sensor: human
ilities: [correctness, alignment]
places: [remediation/entry, harness:delivery/confirmation, harness:remediation/entry]
stages: [scheduled]
speed: [minutes]
needs: []
when: [after]
initiator: schedule
sync: async
assesses: [result]
related: [steering-loop, agent-calibration, llm-judge-calibration]
links:
  - title: "Rule of three (statistics)"
    url: "https://en.wikipedia.org/wiki/Rule_of_three_(statistics)"
    author: "Wikipedia"
    note: "no event in n items: 0 to 3/n is a 95% confidence interval for its rate."
  - title: "Human-in-the-loop cycles (in Russian)"
    author: "Alexander Gutnikov"
    note: "unpublished note, 2026-11-08"
---

## Why

What the agent did or merged without a person is checked only by the automated loops, and an error that all of
them miss stays unseen. A random sample brings the person back to that work without making them read all of it,
and shows the systematic errors that a pick of the most suspicious items would hide. The share of mismatches tells
whether the agent can be given more autonomy.

## How it works

1. On a schedule, a random sample is drawn from what the agent did or merged without the person.
2. The person reviews each item in the sample and marks where it differs from what they expected.
3. Each mismatch becomes a case: a must-fire case of the loop that should have caught it, or an eval case of the
   agent whose verdict let it through.

The share of mismatches over the last audits decides whether the agent gets more autonomy in the work that the
sample covers, keeps what it has, or gives some back.

## Set up

- **What is sampled** is written in the loop's `LOOP.md`: the pull requests the agent merged on its own, the items
  a calibrated judge routed or graded, the verdicts of agents that are `gate`. One audit covers one kind of work,
  so its share of mismatches speaks for that kind.
- **A seeded random draw**, never "the most suspicious" items: a pick by suspicion finds what the loops already
  flag. A scheduled job draws the sample and records the seed, so the draw can be repeated and the agent being
  audited cannot choose its best work.
- **Start with 10 items a week**, or all of them when there are fewer: about 30–60 minutes of the person's time.
- **What the share decides.** Zero mismatches in the last 30 items (three weekly audits) puts the true rate below
  10% with 95% confidence, by the rule of three: 3/n for n = 30. Then propose one more step of autonomy for that
  work, as a release like any other, one step at a time ([the harness level](../../super-loops/harness-level.md)).
  One mismatch restarts the count. Two or more in one audit of 10 (20% or more): propose stepping autonomy back
  for that work and audit 20 items until an audit is clean. Changing the autonomy level is a change of
  `superloops.md`, so it is a call under H7.
- **Called under H5**: the person's marks become cases the loops will trust. The agent asks once per audit through
  the session's question tool with 2–4 options, the recommended one first (`audit now`, `next week`, a free answer),
  and the person marks each item in the audit file: `match`, or `mismatch: <what differs>`. The call is logged:
  `loops.py hitl H5 --loop <loop-id> --checked "<the draw>" --question "…" --answer "…"`.
- **What happens with each mismatch.** It is an escape, logged at the phase that should have caught it:
  `loops.py trace escape <place> --item <item> --note "<what differs>"`. The
  [steering-loop](../steering-loop/card.md) makes it a must-fire case of the loop at that phase. When an agent's
  verdict let it through, it is also an outcome, `loops.py outcome <agent> --loop <loop> --outcome missed`, and an
  eval case with the person's mark as `expected.json`; [agent-calibration](../agent-calibration/card.md) scores the
  agent again.
- **`run` judges the audit file**: one line per item, `<item>: <status>` (`match`, `mismatch, case <path>`,
  `mismatch without a case`, `unmarked`), then the share, `mismatches 2/10 (20%)`. It exits non-zero while an
  item is unmarked, a mismatch names no existing case, or the items are not the seeded draw. Must fire: an audit with
  a mismatch that names no case; one with an unmarked item; one with an item swapped for another. Must pass: a marked
  audit whose every mismatch names an existing case.
- **Validation is `manual`** for the marks themselves: only the person knows what they expected. The draw and the
  conversion of every mismatch into a case are what `run` checks.
- **Wiring.** A weekly scheduled job, in CI or cron, draws the sample and writes `superloops/audits/<date>.yaml`;
  the next session asks the person. The job runs outside the session of the agent being audited.

## Notes

- A judge of taste is calibrated on a person's grades once ([llm-judge-calibration](../llm-judge-calibration/card.md));
  the sample audit is how its grades are checked again later.
