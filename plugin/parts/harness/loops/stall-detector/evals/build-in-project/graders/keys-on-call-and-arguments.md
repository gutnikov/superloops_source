---
type: llm
focus: trace
---

PASS if all of these hold: the guard the agent set up identifies a repeated call by the tool name together with its arguments, so the same tool on different files is not a repeat; it fires when the same call or a short cycle of calls repeats about five times, tells the agent on the first stall and stops it on a second; the agent ran it on at least one case that must fire and one that must pass and saw both results; and the hooks are in `.claude/settings.json`, or the agent showed the person the exact hooks to add there and asked for their approval.
FAIL if the guard only counts tool calls or failures without comparing arguments, has no way to stop the agent, was never run on example inputs, or the agent finished without the hooks in place and without giving the person the exact hooks to add.
