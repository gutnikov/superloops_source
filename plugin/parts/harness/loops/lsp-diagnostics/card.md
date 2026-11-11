---
id: lsp-diagnostics
title: "LSP diagnostics after every edit"
summary: "Right after every edit the agent gets the language server's diagnostics, before any build."
sensor: computational
ilities: [correctness]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, local]
speed: [sub-second]
needs: []
links:
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
---

## Why

A build or a test run is a slow way to find a misspelled name or a wrong type. The language server reports such
errors right after the edit, before any build, while the agent is still working in that file.

## How it works

Right after every edit the agent gets the language server's diagnostics, before any build. They come through a code
intelligence plugin in Claude Code, which Set up installs.

## Set up

- Install a code intelligence plugin in Claude Code. The source describes what the plugin does in the words of the Claude Code docs: "automatic error detection after edits".
- The source does not name the plugin. It also does not say which languages the plugin covers, what the plugin needs on the machine, or what to do if your project's language has no such plugin.
