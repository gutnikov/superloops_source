---
id: my-loop
title: "My loop"
type: my-loop
status: validated
trigger: [commit]
places: [delivery/work]
run: ./run
budget_seconds: 10
validation: cases
agents: []
parts: []
hitl: []
wiring: [".git/hooks/pre-commit runs ./run on the staged files"]
---

# My loop

## Requirement

<The failure the loop catches, the same one the card's ## Why names, and its place.>

## Loop

<What triggers it, what `run` checks, what the agent sees, what it does next.>

## Tools

<Each tool `run` calls, the version it was validated with, and how it is installed. A tool CI does not have is
installed by an executable `setup` in this folder.>

## Signal

<What `run` prints when it fires, with one real line from a must-fire case.>

## Validation

<One line per case: what failure each must-fire case stands for, and what correct work each must-pass case stands
for. Together the must-fire cases cover every failure the card's ## Why names.>
