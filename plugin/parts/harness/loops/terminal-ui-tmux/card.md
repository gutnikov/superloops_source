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
  - title: "useFlickerDetector.ts"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/cli/src/ui/hooks/useFlickerDetector.ts#L21-L42"
    author: "gemini-cli (Google)"
    note: "a frame taller than the terminal, while the height is constrained, counts as a flicker."
  - title: "flicker.test.ts"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/integration-tests/flicker.test.ts#L20-L41"
    author: "gemini-cli (Google)"
    note: "a prompt typed into the CLI in a pseudo-terminal, then the flicker metric must be absent."
  - title: "test_backend.rs: a VT100 parser as the terminal"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/tui/src/test_backend.rs#L13-L22"
    author: "Codex (OpenAI)"
  - title: "resize_reflow.rs: a tmux smoke test against a mock model server"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/tui/tests/suite/resize_reflow.rs#L15-L56"
    author: "Codex (OpenAI)"
  - title: "resize_reflow.rs: waiting on capture-pane"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/tui/tests/suite/resize_reflow.rs#L655-L667"
    author: "Codex (OpenAI)"
    note: "poll every 100 ms until the text appears; time out with the last capture."
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
- **A terminal emulator in the test process for every change.** tmux is slow and needs a built binary. For the
  checks after each edit, render the UI into an in-process VT100 parser of a fixed size and assert on its screen,
  with escape sequences and scrollback interpreted as a terminal would. Codex's `VT100Backend` wraps a `vt100::Parser`
  "to mock a 'real' terminal", and the TUI has 1,350 snapshot assertions on its screen contents. tmux stays for what
  only the real binary shows: startup, resizes, the shell around it.
- **A scripted model behind the tmux run.** Point the app at a mock model server, so the smoke test needs no key and
  the reply is the same every run ([scripted-model-tests](../scripted-model-tests/card.md)). Codex's resize smoke
  test starts the binary in a 120×40 session against a mock server, splits the window to force a resize, polls
  `capture-pane` every 100 ms for up to 15 seconds, and fails with the last capture.
- **A rendering rule the app counts itself.** What a capture of the final screen cannot show, such as a frame drawn
  taller than the terminal and scrolled away, the app reports as a metric. gemini-cli's UI measures its root element
  on every render and counts `gemini_cli.ui.flicker.count` when it is taller than the terminal; `flicker.test.ts`
  types a prompt into the CLI in an 80×80 pseudo-terminal, waiting for each character's echo, replays the model's
  reply, and fails if the metric exists. `run` reads such counters after the scenario and fails on any that is not
  zero.
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
