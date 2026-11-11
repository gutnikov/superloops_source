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
related: [type-check, build, lint-with-fix-instructions, autoformat-hook]
links:
  - title: "Code intelligence plugins"
    url: "https://code.claude.com/docs/en/plugins/code-intelligence"
    note: "the official LSP plugins, how to install them, diagnostics after edits, terminal sessions only"
  - title: "Plugin components: LSP servers"
    url: "https://code.claude.com/docs/en/plugins/components#lsp-servers"
    note: "connecting a language server that has no plugin"
  - title: "Best practices for Claude Code"
    url: "https://code.claude.com/docs/en/best-practices"
  - title: "opencode docs: LSP best practices"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/site/src/docs/v1/content/lsp.mdx#L68-L72"
    author: "opencode (anomalyco)"
    note: "LSP is opt-in: \"it is not always a net positive\"."
---

## Why

A build or a test run is a slow way to find a misspelled name or a wrong type. The language server reports such
errors right after the edit, before any build, while the agent is still working in that file.

## How it works

A code intelligence plugin tells Claude Code which language server to start and for which file extensions. The
server starts the first time the agent edits such a file. After every edit, the agent gets the server's new
diagnostics, and the conversation shows `Found N new diagnostic issues in M files`. The agent fixes them in the
same turn, before it builds or runs the tests.

## Set up

1. **Install the language server binary** on the `PATH` of the shell that starts `claude`; the plugin does not
   include it. The official plugins and their binaries:

   | Language | Plugin | Binary |
   |---|---|---|
   | C/C++ | `clangd-lsp` | `clangd` |
   | C# | `csharp-lsp` | `csharp-ls` |
   | Go | `gopls-lsp` | `gopls` |
   | Java | `jdtls-lsp` | `jdtls` |
   | Kotlin | `kotlin-lsp` | `kotlin-lsp` |
   | Liquid | `liquid-lsp` (Shopify's) | `shopify`, from the Shopify CLI |
   | Lua | `lua-lsp` | `lua-language-server` |
   | PHP | `php-lsp` | `intelephense` |
   | Python | `pyright-lsp` | `pyright-langserver` |
   | Ruby | `ruby-lsp` | `ruby-lsp` |
   | Rust | `rust-analyzer-lsp` | `rust-analyzer` |
   | Swift | `swift-lsp` | `sourcekit-lsp` |
   | TypeScript and JavaScript | `typescript-lsp` | `typescript-language-server` |

2. **Install the plugin**: `/plugin install <plugin>@claude-plugins-official`, such as
   `/plugin install typescript-lsp@claude-plugins-official`.
3. **A language with no official plugin**: write a plugin with an `.lsp.json` at its root that names the server's
   command and the file extensions it handles, and load it with `--plugin-dir` or from a marketplace.
4. **Confirm the server starts**: ask the agent to introduce a type error in a file of that language and fix it.
   The diagnostics line must appear under the edit. If it does not, the **Errors** tab of `/plugin` names the
   missing binary (`Executable not found in $PATH`).

- **Validation is manual.** The diagnostics come from Claude Code itself, not from a `run`, so `LOOP.md` sets
  `validation: manual` and keeps the transcript of step 4 as the evidence. Repeat step 4 when the plugin, the
  binary or the language's version changes.
- **Wiring:** the plugin, installed in the project's scope so that every session of the agent has it.
- **Not a gate.** Diagnostics guide the agent while it edits; nothing stops it from ignoring them. The same errors
  must fail [type checking](../type-check/card.md) and the [build](../build/card.md) at commit or in CI.

## Notes

- In cloud sessions, Claude Code does not start plugin language servers, so the agent gets no diagnostics there.
  A project whose agent runs in the cloud relies on the type-check and build loops alone.
- When not to use this loop. opencode keeps LSP off unless the config turns it on: it "is not always a net positive.
  Language servers can get out of sync, use significant memory, vary by version or project, and slow down agent
  workflows. In many projects it is better to have the agent run lint, typecheck, or other diagnostic CLI tools
  directly". Turn this loop on where the [type-check](../type-check/card.md) takes long enough that a diagnostic per
  edit saves rounds; where it takes seconds, run it and name the command in AGENTS.md.
