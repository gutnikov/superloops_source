---
tags: [build]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Coding agents working in this repository sometimes get stuck: they make the same edit and run `npm test` again and again, or keep re-reading the same file, and burn the whole task on it. Sometimes a subagent also starts more agents that start more agents. Set up a guard in this project that notices this and stops it, for Claude Code. Make sure the guard actually works before you finish.
