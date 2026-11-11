---
id: autoformat-hook
title: "Auto-formatting hook"
summary: "After every file write a hook formats the code, so the agent does not spend iterations fixing formatting by hand."
sensor: computational
ilities: [maintainability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, local]
speed: [sub-second]
needs: []
related: [pre-commit-pre-push, lsp-diagnostics, ci-clean-infra]
links:
  - title: "Boris Cherny on X"
    url: "https://x.com/bcherny/status/2007179861115511237"
  - title: "claude-code-best-practice"
    url: "https://github.com/shanraisshan/claude-code-best-practice"
  - title: "Automate actions with hooks: auto-format code after edits"
    url: "https://code.claude.com/docs/en/hooks-guide#auto-format-code-after-edits"
    author: "Anthropic"
  - title: "Codex: Validating your work (the default instructions)"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/codex-rs/protocol/src/prompts/base_instructions/default.md#L149-L157"
    author: "Codex (OpenAI)"
    note: "formatting tried up to 3 times, then named in the final message; unrelated bugs left alone."
  - title: "opencode formatter.ts: the formatter's output ignored, a failure only logged"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/formatter.ts#L65-L91"
    author: "opencode (anomalyco)"
  - title: "opencode edit.ts: the diff returned to the agent is taken after formatting"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/core/src/tool/plugin/edit.ts#L347-L353"
    author: "opencode (anomalyco)"
  - title: "Claude Code changelog: continueOnBlock for PostToolUse (2.1.139)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L6608"
    author: "Anthropic"
  - title: "Claude Code changelog: a format-on-save hook made the next edit fail (fixed in 2.1.90)"
    url: "https://github.com/anthropics/claude-code/blob/e379c8eca0af5b02a49bf8e784aeefdd1308de6f/CHANGELOG.md#L7554"
    author: "Anthropic"
---

## Why

Without the hook, the agent spends iterations on formatting, and a formatting error it misses fails CI later. A hook
that formats the code after every write settles formatting before any other check runs.

## How it works

The agent edits or writes a file, and a PostToolUse hook runs the formatter on that file. Boris Cherny uses such a
hook: Claude's code is mostly well formatted already, and the hook handles the last 10% of formatting, so CI does not
fail on it. When the formatter cannot parse the file, the hook reports the error to the agent, which fixes the syntax.

## Set up

- **The hook.** Claude Code's documented example, in `.claude/settings.json`:

  ```json
  {
    "hooks": {
      "PostToolUse": [
        {
          "matcher": "Edit|Write",
          "hooks": [
            { "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write" }
          ]
        }
      ]
    }
  }
  ```

  The hook gets the event's JSON on stdin and formats only the file the tool wrote, never the whole tree.
- **The same formatter as CI.** The hook runs the formatter CI checks with, at the version pinned in the lockfile and
  with the same config, so a file the hook formatted passes CI's check. CI runs `prettier --check`, which exits 1 when
  a file is not formatted.
- **A failure reaches the agent.** Put the command in a script that exits 2 with the formatter's error on stderr
  when the formatter fails: for a PostToolUse hook, Claude Code shows that stderr to Claude (the tool has already
  run). Any other non-zero exit is only a non-blocking error notice.
- **Keep the turn going on a block.** With `continueOnBlock: true` on a PostToolUse hook (Claude Code 2.1.139),
  the hook's rejection reason goes back to Claude and the turn continues, instead of ending on the hook's error.
  Set it on a formatter hook, so a file the formatter refuses is fixed in the same turn.
- **Format in the hook, not in the editor.** A format-on-save in the person's editor, or a hook that rewrites the file
  between two edits, changes the file under the agent: before Claude Code 2.1.90 the next `Edit` failed with "File
  content has changed". While an agent edits, the hook is the only formatter; turn off format-on-save for the files
  it touches.
- **Files that Bash rewrites.** The `Edit|Write` matcher does not see a file changed by a shell command. Where that
  matters (a code generator, `sed`), add a `FileChanged` hook, which Claude Code fires however the file changes.
- **The `run`** is the formatter's check mode over the directory, such as `npx prettier --check <dir>`: it lists the
  files that are not formatted and exits 1.
- **Cases.** Must fire for `run`: a JavaScript file with single-quoted strings, which Prettier's defaults rewrite to
  double quotes. For the hook script, a recorded PostToolUse input on stdin: a badly formatted file comes out
  formatted with exit 0; a file with a syntax error gives exit 2 and the parser's message. Must pass: a formatted file
  is left byte for byte as it was.
- **Out of the agent's reach.** The agent could remove the hook from `.claude/settings.json`. A PreToolUse hook denies
  its writes to that file, and the same check runs at commit ([pre-commit-pre-push](../pre-commit-pre-push/card.md))
  and in CI, where an unformatted file fails whatever happened in the session.

## Notes

- **A limit on the agent's own formatting attempts.** When the hook's formatter keeps failing on a file, the agent
  should not spend the session on it. Codex's default instructions: "If there are issues you can iterate up to 3 times
  to get formatting right, but if you still can't manage it's better to save the user time and present them a
  correct solution where you call out the formatting in your final message." Put the same line in CLAUDE.md; the
  check at commit and in CI still fails the file.
- **Show the agent the file as formatted.** opencode's edit tool returns its diff against the file after the
  formatter ran, so the agent's next `oldString` matches what is on disk. It is also the counterexample to "A
  failure reaches the agent": its formatter runs with stdout and stderr ignored, and a non-zero exit is only logged,
  so the agent never learns that a file was left unformatted. Keep the exit 2 with the formatter's error.
- The hook formats; it does not check types or lint. Those are their own loops, such as
  [lsp-diagnostics](../lsp-diagnostics/card.md) after each edit.
