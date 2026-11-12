#!/usr/bin/env python3
"""Stall detector: a Claude Code hook that stops an agent repeating itself, and its replay for validation.

Hook mode, wired in .claude/settings.json (settings.json in this folder):
    stall.py              PostToolUse, matcher "*": count the call; on the first stall, the message on stderr and
                          exit 2; on the second in the same task, stop the agent
    stall.py --spawn      PreToolUse, matcher "Agent|Task": deny a spawn from a leaf agent, or past the cap
    stall.py --reset      UserPromptSubmit: a new task, so the keys and the counts are cleared

Replay mode, the loop's run:
    stall.py replay CASE  feed CASE/hooks.jsonl, one hook input per line, through the same logic; print each stall
                          and each denied spawn; exit 1 at the first

Config: CASE/config.json in replay, $STALL_CONFIG in hook mode: {"orchestrators": [...], "spawn_cap": 10}.
"""
import hashlib
import json
import os
import pathlib
import sys
import tempfile

WINDOW = 25      # keys kept per agent
REPEATS = 5      # a call, or a cycle of calls, repeated this many times is a stall
MAX_CYCLE = 5    # the longest cycle looked for
SPAWN_TOOLS = {"Agent", "Task"}
NUDGE = ("Please take a step back and confirm you're making forward progress. If not, take a step back, analyze "
         "your previous actions and rethink how you're approaching the problem. Avoid repeating the same tool calls "
         "or responses without new results.")  # gemini-cli's text
LEAF = "You are a leaf agent: do this work yourself and start no agents."


def new_state():
    return {"keys": {}, "calls": {}, "stalls": 0, "spawns": 0, "denials": 0}


def call_key(event):
    raw = event.get("tool_name", "") + json.dumps(event.get("tool_input", {}), sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def call_name(event):
    args = event.get("tool_input") or {}
    for field in ("file_path", "command", "pattern", "path", "url", "description", "prompt"):
        if isinstance(args.get(field), str):
            return "%s %s" % (event.get("tool_name", "?"), args[field][:60])
    return event.get("tool_name", "?")


def on_call(state, event):
    """Count one tool call; return (k, calls) when the last calls of this agent are a stall."""
    scope = event.get("agent_id") or "main"
    keys = state["keys"].setdefault(scope, [])
    calls = state["calls"].setdefault(scope, [])
    keys.append(call_key(event))
    calls.append(call_name(event))
    del keys[:-WINDOW], calls[:-WINDOW]
    for k in range(1, MAX_CYCLE + 1):
        tail = keys[-k * REPEATS:]
        if len(tail) == k * REPEATS and tail == tail[-k:] * REPEATS:
            cycle = calls[-k:]
            keys.clear()
            calls.clear()
            state["stalls"] += 1
            return k, cycle
    return None


def on_spawn(state, event, config):
    """Return the reason a spawn is denied, or None."""
    caller = event.get("agent_type") or "main"
    if event.get("agent_id") and caller not in config.get("orchestrators", []):
        reason = "leaf agent"
    else:
        state["spawns"] += 1
        cap = int(config.get("spawn_cap", 10))
        reason = "cap %d" % cap if state["spawns"] > cap else None
    if reason:
        state["denials"] += 1
    return reason


def replay(case):
    case = pathlib.Path(case)
    config_file = case / "config.json"
    config = json.loads(config_file.read_text()) if config_file.exists() else {}
    state, n = new_state(), 0
    for line in (case / "hooks.jsonl").read_text().splitlines():
        if not line.strip():
            continue
        event, n = json.loads(line), n + 1
        name = event.get("hook_event_name")
        if name == "UserPromptSubmit":
            state = new_state()
        elif name == "PreToolUse" and event.get("tool_name") in SPAWN_TOOLS:
            reason = on_spawn(state, event, config)
            if reason:
                print("spawn denied: %s: %d in this task: %s" % (event.get("agent_type") or "main",
                                                                  state["spawns"], reason))
                return 1
        elif name == "PostToolUse":
            stall = on_call(state, event)
            if stall:
                k, cycle = stall
                print("stall %d: cycle of %d: %s" % (state["stalls"], k, " → ".join(cycle)))
                return 1
    print("no stall: %d hook inputs, %d spawns" % (n, state["spawns"]))
    return 0


def hook(mode):
    event = json.load(sys.stdin)
    store = pathlib.Path(tempfile.gettempdir()) / ("stall-%s.json" % event.get("session_id", "none"))
    if mode == "--reset":
        store.unlink(missing_ok=True)
        return 0
    state = json.loads(store.read_text()) if store.exists() else new_state()
    config_path = os.environ.get("STALL_CONFIG")
    config = json.loads(pathlib.Path(config_path).read_text()) if config_path else {}
    code = 0
    if mode == "--spawn":
        reason = on_spawn(state, event, config)
        if reason and state["denials"] == 1:
            sys.stderr.write("%s (%s)\n" % (LEAF if reason == "leaf agent" else "Spawn cap reached: finish this "
                                            "work with the agents already started.", reason))
            code = 2
        elif reason:
            print(json.dumps({"continue": False, "stopReason": "spawn cap: %s, denied twice in this task" % reason}))
    else:
        stall = on_call(state, event)
        if stall and state["stalls"] == 1:
            sys.stderr.write("Stall: the same calls %d times: %s. %s\n" % (REPEATS, " → ".join(stall[1]), NUDGE))
            code = 2
        elif stall:
            print(json.dumps({"continue": False,
                              "stopReason": "stall: %s, twice in this task" % " → ".join(stall[1])}))
    store.write_text(json.dumps(state))
    return code


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "replay":
        sys.exit(replay(sys.argv[2]))
    sys.exit(hook(sys.argv[1] if len(sys.argv) > 1 else ""))
