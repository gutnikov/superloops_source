---
id: terminal-ui-tmux
title: "Terminal UI through tmux"
summary: "The agent runs a terminal app in a tmux session of fixed size, sends keys and reads the screen with capture-pane; a smoke test passes only after a real interaction, not at startup."
sensor: computational
ilities: [correctness, usability]
places: [delivery/work, remediation/work, maintenance/work, delivery/release]
stages: [local, ci]
speed: [seconds, minutes]
needs: []
related: [e2e-browser, agentic-manual-testing, health-checks-smoke]
links:
  - title: "Testing pi Interactive Mode with tmux (a skill)"
    url: "https://github.com/earendil-works/pi/blob/4839e41d6463d759a92ee55f4ca7c8ae57e52c9c/.pi/skills/interactive-testing.md"
    author: "pi (earendil-works)"
---

## Why

The unit tests of a terminal app check functions, not what the user sees: a redraw that leaves stale lines, a key
that does nothing, a prompt that never gets an answer. The agent cannot look at a terminal the way it looks at a
page through a browser, so these bugs reach users. tmux gives the agent a terminal it can type into and read back as
text.

## How it works

1. The agent starts a detached tmux session of a fixed size, such as 80×24, and runs the app in it.
2. It sends keys with `tmux send-keys`: text, Enter, Escape, control keys such as `C-o`.
3. It reads the screen with `tmux capture-pane -p` and compares it with what it expects.
4. It kills the session when it is done.

Pi's rule for release smoke tests: start the session in a neutral directory, run the release binary by its absolute
path, test each build separately (Node and Bun), submit a prompt and wait for the model's reply. Startup alone is not
a passing smoke test.

## Set up

- tmux on the machine, and one command that starts the app from the checkout (pi's `./pi-test.sh`).
- The commands in a skill or in AGENTS.md, so the agent does not invent them.
- A fixed size, so the same state gives the same screen.
- Waits on the screen's content, not only fixed sleeps. Pi's skill captures after `sleep 3`, which a slow machine
  can outrun; polling `capture-pane` until the expected text appears does not depend on the machine. Poll every 0.2
  seconds for up to 10 seconds per step; a step that times out is red.
- **`run`** starts the app in tmux, plays a scenario file (the keys to send and the text expected on the screen after
  each step), and prints the first step whose text did not appear, with the captured screen. It exits non-zero on
  such a step, and kills the session either way.
- **Cases.** Must fire: a scenario that expects a reply the app never prints, such as a prompt sent to a build with a
  broken provider setting; a scenario run against a binary that exits at startup. Must pass: the scenario on the main
  branch.
- **Wiring:** the agent runs it after a change to the interface; the release job runs the smoke scenario against
  each release binary before it publishes.

## Notes

- It is [e2e-browser](../e2e-browser/card.md) for apps that run in a terminal. Every defect it finds becomes a
  permanent test, as in [agentic-manual-testing](../agentic-manual-testing/card.md).
