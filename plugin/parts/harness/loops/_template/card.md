---
id: my-loop                    # the folder's name: lowercase words joined by hyphens
title: "My loop"               # the name, up to 60 characters
summary: "What the agent does and what signal it gets back, in one line."
# image: image.svg             # optional: an illustration in this folder
sensor: computational          # who gives the signal
ilities: [correctness]         # 1 to 3, the main one first
places: [delivery/work]        # <super-loop>/<phase>
stages: [ci]                   # where it runs
speed: [minutes]               # one value, or a range [from, to]
needs: []                      # what the agent must reach beyond the repository
# agent: [reviewer]            # when an agent is a step; then add ## Agent step
# related: [red-green-tdd]     # loops that pair with this one
links:
  - title: "The article the card is based on"
    url: https://example.com/article
    author: Its author
---

## Why

What goes wrong without this loop, and what the loop catches that nothing earlier does.

## How it works

What the agent does, the signal it gets back (an exit code, `file:line:message`, JSON, a screenshot, a verdict), and
what it does with the signal.

## Set up

What has to exist in a project for the loop to work: the tool, the command, the hook or the job that runs it, and
how the agent is kept from getting around it.
