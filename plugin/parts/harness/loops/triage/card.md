---
id: triage
title: "Triage: every signal goes to one super-loop, with its oracle"
summary: "Triage merges each incoming error, alert, bot's PR, user's message or ticket with any open item on the same thing, and routes it to one super-loop; the route decides the oracle."
sensor: inferential
ilities: [alignment]
places: [delivery/entry, remediation/entry, maintenance/entry, discovery/entry]
stages: [continuous]
speed: [minutes]
needs: []
agent: [judge]
related: [behaviour-invariance, reproduction-gate, acceptance-loop, discovery-decision]
links:
  - title: "ITIL"
    note: "incident, problem and change management, where the route of a ticket decides the process it goes through."
---

## Why

The same complaint can be a bug, an idea or a wish for something faster, and each needs a different oracle. A wrong
route means the wrong check at the gate: a change of behaviour sent to maintenance reaches users without a person
approving it. Merging duplicates first keeps one problem from being worked on twice.

## How it works

A signal arrives: an error from the tracker, an alert, a pull request from a dependency bot, a message from a user, a
ticket. Triage handles it before any work starts on it:

1. It merges the signal with any open item on the same thing.
2. It routes the signal to one super-loop, using the table below. Rules route the signals they can, and a judge routes
   the rest (see Agent step). An ambiguous signal goes to a person.

| The signal says | Super-loop | The oracle to build |
|---|---|---|
| It is not known yet whether to do it, or how | discovery | The question and its evidence ([discovery-decision](../discovery-decision/card.md)) |
| The product does not do what it was specified to do, or what it did before | remediation | A reproduction that fails ([reproduction-gate](../reproduction-gate/card.md)) |
| The product should do something new or different | delivery | A spec a person approves ([acceptance-loop](../acceptance-loop/card.md)) |
| The behaviour stays; a dependency, the structure, the speed or the size changes | maintenance | The behaviour as it is ([behaviour-invariance](../behaviour-invariance/card.md)) |

## Set up

- **One record per signal**: where it came from, what it says, the super-loop chosen, the reason, and the open item it
  was merged into, if any.
- **Duplicates first.** The same error fingerprint, the same dependency, the same requirement: the signal joins the
  open item instead of opening a new one.
- **An ambiguous signal goes to a person** under H1, with the options and a recommended route, and the call is logged
  with `loops.py hitl H1 --loop triage …`. A complaint about a slow page can be remediation (a regression) or
  maintenance (it was always slow): the history decides, and where it does not, a person does.
- **Routes are checked later.** Two signs show that an item was routed wrong:
  - the gate of a maintenance item sends it back with a changed expected value;
  - the reproduction for a remediation item turns out to be a new requirement.

  Each is logged at the entry that routed it, with
  `loops.py trace correction <super-loop>/entry --item <id> --note …`, and becomes a must-fire case here and an eval
  case of the judge.
- **`run`** routes a batch of signals against the open items and prints one line per signal:
  `<signal>: <super-loop>: <reason>`, `<signal>: duplicate of <item>` or `<signal>: ask a person`. The exit is
  non-zero when a signal is a duplicate, or when it came with a route of its own (a bot's PR labelled maintenance, a
  ticket typed as a bug) that triage changes.
- **Cases.** Must fire: a change of behaviour offered as maintenance; a duplicate of an open item. Must pass: a
  dependency bump with no change of behaviour, routed to maintenance.
- **Wiring**: triage runs where signals arrive, as a webhook or a scheduled job over the error tracker, the alerts and
  the issue tracker, outside any working agent's session. The agent that works an item cannot route it again; it
  sends it back to triage with the reason.

## Notes

- The costly mistake is a change of behaviour routed to maintenance. The gate of maintenance,
  [behaviour-invariance](../behaviour-invariance/card.md), is the second line of defence.
- The super-loops and their oracles: [super-loops](../../super-loops/README.md).

## Agent step

A judge routes the signals that rules cannot. It gets the signal and the open items, and returns a Verdict with the
super-loop, the reason, and the duplicate if there is one. It is calibrated on signals a person routed (H5), and it
routes on its own only once it is `gate` ([agent-calibration](../agent-calibration/card.md)); until then it proposes,
and a person decides.
