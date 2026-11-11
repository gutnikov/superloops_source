---
id: bundle-size-budget
title: "Bundle size budget"
summary: "size-limit \"throws an error if the cost exceeds the limit\". With `--why` the agent finds what bloated the bundle and removes it."
sensor: computational
ilities: [performance]
places: [delivery/work, remediation/work, maintenance/work]
stages: [ci]
speed: [seconds]
needs: []
related: [lighthouse-ci, dependency-updates]
links:
  - title: "ai/size-limit"
    url: "https://github.com/ai/size-limit"
  - title: "andresz1/size-limit-action"
    url: "https://github.com/andresz1/size-limit-action"
---

## Why

Each change can add a little weight to the bundle, and no single change looks like the one that went too far. A size
limit in CI turns that slow growth into an error on the PR that added the weight. `--why` then shows the agent what
to remove.

## How it works

One round of the loop runs on a PR:

1. size-limit "calculates the real cost of your JS for end-users and throws an error if the cost exceeds the limit".
2. The error shows on the PR.
3. The agent runs `npm run size -- --why`, which can "tell you _why_ your library is of this size and show the real
   cost of all your internal dependencies", through Statoscope.
4. The agent removes what it added, replaces it with something lighter or loads it lazily, and runs the check again.

## Set up

- **Config.** `.size-limit.jsonc` holds one entry per bundle that users download, each with a `path` and a `limit`
  such as `"9 kB"`. The file plugin measures with Brotli by default. The script is
  `"size": "npm run build && size-limit"`.
- **The limit.** The README's advice: "Determine the current size of your library, add just a little bit (a kilobyte,
  maybe) and use that as the limit". A limit far above the current size lets the slow growth through.
- **A message for the agent.** Each entry's `message` is shown "when a limit is exceeded": write there what to do,
  such as "run `npm run size -- --why`; a new dependency goes through a person".
- **`--why` needs the plugin of the bundler**: `@size-limit/esbuild-why`, `@size-limit/rolldown-why` or
  `@size-limit/webpack-why`. The first two write an HTML report (`esbuild-why.html`, `rolldown-why.html`) into the
  current directory, or into `<DIR>` with `--save-bundle <DIR>`; the webpack one opens its report in the browser. The
  agent reads the report in a browser.
- **When `--why` shows no single cause**, compare with main: `compareWith` takes the path to `stats.json` from
  another build. The entries that grew are the cause, even when none stands out alone.
- **Raising the limit is a person's call** (H5, approving a threshold). Keep the limits in `.size-limit.jsonc`, not in
  `package.json`, so that a PreToolUse hook can deny the agent's writes to that one file. When a task needs the weight,
  the agent says so in the PR with what `--why` showed, and a person raises the limit.
- **The PR comment.** `andresz1/size-limit-action` "compares the real cost of your JavaScript in every pull request",
  comments on the PR with the comparison, and rejects the PR "if the cost exceeds the limit".
- **`run`** is `npm run size`: it prints each entry's size and exits non-zero when one exceeds its limit.
- **Cases** are small packages with a limit. Must fire: a copy that imports a whole utility library for one function.
  Must pass: the same copy importing only that function, under the limit.
- **Wiring.** The agent runs `npm run size` before it pushes. The CI job with the action runs on every PR and is a
  required check, so the agent cannot merge past it.
