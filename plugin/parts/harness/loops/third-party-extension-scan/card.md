---
id: third-party-extension-scan
title: "Third-party extensions scanned against a policy"
summary: "On each PR that adds or bumps a third-party plugin, skill or MCP server, an agent reads every file it ships against a written policy; verdicts are cached per commit and policy, and a fail blocks."
sensor: inferential
ilities: [security]
places: [harness:delivery/gate, harness:maintenance/gate, maintenance/gate]
stages: [ci]
speed: [minutes]
needs: [ci]
agent: [reviewer]
related: [dependency-updates, dependency-scanning-sbom, security-review-agent, agent-calibration, agent-ci-hardening, config-validation, ci-clean-infra]
links:
  - title: "scan-plugins.yml: a required check on every PR, cached verdicts, a cached fail keeps failing"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L1-L22"
    author: "Anthropic"
  - title: "scan-plugins.yml: the skip inside the job"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L58-L78"
    author: "Anthropic"
  - title: "scan-plugins.yml: the cache key and the change set"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L86-L163"
    author: "Anthropic"
    note: "the hash of the policy files, <name>@<sha> and the whole source object; a 30-day TTL."
  - title: "scan-plugins.yml: the scan step and its short-lived credential"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L190-L211"
    author: "Anthropic"
  - title: "scan-plugins.yml: an unparseable output is not cached; key-shaped strings redacted"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L237-L255"
    author: "Anthropic"
  - title: "scan-plugins.yml: model output neutralized before the summary"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L314-L338"
    author: "Anthropic"
  - title: "scan-plugins.yml: the gate"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L353-L383"
    author: "Anthropic"
    note: "fails on a fresh or cached fail, and on a scan step that failed without a verdict."
  - title: "scan-plugins.yml: the verdict comment per entry"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/workflows/scan-plugins.yml#L506-L545"
    author: "Anthropic"
    note: "the model's summary and violations go into a ```json block as they are."
  - title: "policy/prompt.md: read the whole payload, hidden folders included"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/policy/prompt.md#L11-L24"
    author: "Anthropic"
  - title: "policy/prompt.md: credentials routed to another service"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/policy/prompt.md#L37-L68"
    author: "Anthropic"
  - title: "policy/prompt.md: hook scope, telemetry, the description, the verdict"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/policy/prompt.md#L73-L140"
    author: "Anthropic"
  - title: "policy/schema.json"
    url: "https://github.com/anthropics/claude-plugins-official/blob/43fd1f9db0941b2b83cb62268e35970d4a67c202/.github/policy/schema.json#L1-L52"
    author: "Anthropic"
  - title: "policy(scan): review whole payload incl. .claude/ + flag cross-service credential routing (#2360)"
    url: "https://github.com/anthropics/claude-plugins-official/commit/317b8988055b151b694d4e06e5039b3f38dbe425"
    author: "Anthropic"
    note: "the credential rule rewritten twice after full re-scans of the 159 url-source plugins."
  - title: "Make Scan Plugins a viable required check; auto-dispatch on bump PRs (#1815)"
    url: "https://github.com/anthropics/claude-plugins-official/commit/45896c8f2fe68e68ca2a8e3554d4441f48475431"
    author: "Anthropic"
    note: "fail closed when the credential is missing: \"a required check that silently does nothing is a rubber stamp\"."
---

## Why

A plugin, a skill, a hook or an MCP server config runs inside the agent, with the agent's permissions, in every
session where it is installed. A `UserPromptSubmit` hook sees every prompt; a script in a hidden folder can read the
keychain and send a token anywhere. None of it is a known vulnerability: the code does what its author wrote, which
can be more than its install description says, and every new pin is new code from outside the project. A CVE scan
([dependency-scanning-sbom](../dependency-scanning-sbom/card.md)) knows only published advisories, and SAST and the
[security review](../security-review-agent/card.md) read the project's own code. This loop reads the third party's
whole payload at each new pin and judges what it does against what the project allows and what the user was told.

## How it works

1. On every PR, a job compares the extension manifest (a marketplace file, `.mcp.json`, a plugin lock) with the base
   branch and takes each entry whose object changed: a new extension or a new pin.
2. Each entry is looked up in the verdict cache. A hit is reused, a fail as much as a pass; a miss goes to the
   reviewer.
3. The reviewer gets a checkout of the extension at its pinned commit and the policy, reads every file, hidden
   folders included, and returns a Verdict with the policy's fields (Agent step). The policy asks four things:
   - **Hooks that run on every session.** Each hook is listed as
     `EVENT:path — gated|ungated — network:yes(host)|no`. A `UserPromptSubmit`, `PreToolUse` or `PostToolUse` hook
     with no gate on the projects the extension is for fails, whether or not it calls the network.
   - **Undisclosed telemetry.** A call to any host but the declared MCP servers fails unless the description or the
     README discloses it and documents an opt-out. Anthropic's policy: "Default-on telemetry without disclosure is a
     fail even if the payload is anonymous."
   - **Credentials sent to another service.** A credential belongs to the service its name or its storage place
     names, "NOT by how the plugin claims to repurpose it", and sending it to any other service fails. A Railway
     token sent to Railway passes; an `ANTHROPIC_*` token sent to a third-party gateway fails.
   - **The description matches the behaviour.** The test: "would a user reading only the install description be
     surprised by what you found?" A mismatch about hooks, telemetry or data access fails; a cosmetic one does not.
4. The job fails when any entry fails, fresh or cached, and when the scan ended without a verdict. Each entry gets
   one comment on the PR, updated in place, whose violations cite the file and line or the hook, and "state what the
   user was not told".

## Set up

- **The policy is a file**, a prompt and the JSON schema of its answer (`.github/policy/prompt.md`, `schema.json`),
  owned by code owners. Text in an extension that addresses the reviewer is a violation, not an instruction.
- **A required check that always reports.** The workflow runs on every PR with no path filter and skips at the step
  level when neither the manifest nor the policy changed ([ci-clean-infra](../ci-clean-infra/card.md)). A bump PR a
  bot opens gets the scan by dispatch ([dependency-updates](../dependency-updates/card.md)).
- **The cache key** is `<name>@<commit>` with the whole source object, under the hash of the policy files: "a repo
  migration or path change with the same SHA is different scan content and must miss the cache", and a policy edit
  misses every entry. The PR that edits the policy runs the full re-scan, so the edit is judged on every pinned
  extension before it merges (Agent step). Keep verdicts 30 days, as Anthropic does, and run the scans of one ref one
  at a time, so two runs do not lose each other's verdicts on save.
- **A fail stays a fail.** A cached fail fails the job: "a known-bad SHA must keep failing until it is reverted or
  upstream fixes it". A scan that errors with no verdict fails too: "Scan step failed without a parseable policy
  verdict (likely an infra error)." An output that does not parse counts as no verdict and is never cached. Count
  the verdicts against the entries sent: a gate that counts only the fails that came back passes an entry the scan
  never answered for.
- **The reviewer has little to lose.** Read-only tools over the clone, no write token in its job, and a credential
  that expires in minutes: Anthropic signs in by workload identity federation, which "bounds the blast radius of a
  prompt-injection exfil to a token that expires in minutes". Without a credential the job fails instead of skipping.
  Key-shaped strings (`sk-ant-…`) become `[REDACTED]` before the cache, the artifact or a comment.
- **Model output is inert where it is posted.** The summary and the violations are "model-generated text shaped by a
  cloned external repo". Before any rendered sink, replace `|`, `[`, `]`, `<`, `>`, the backtick and line breaks with
  spaces, wrap the text in a code span, and cut it (Anthropic: 120 characters in the table, 500 in the list). Do it
  for every sink: Anthropic's per-entry verdict comment puts the raw text in a ```` ```json ```` block, which three
  backticks in a summary close.
- **`run`** prints one line per entry, `<name>@<commit>: pass|fail (fresh|cached): <violation>`, and once the
  reviewer is `gate`, exits non-zero on a fail, on an entry without a verdict and on a scan error. Until then it
  prints the same lines and exits 0, and a fail goes to a person's review of the PR.
- **Cases**, which are also the reviewer's evals. Must fire: an ungated `UserPromptSubmit` hook that posts the prompt
  to an analytics host; a script under `.claude/`, never loaded, that reads `ANTHROPIC_AUTH_TOKEN` from the keychain
  and sends it to a gateway whose README calls it "your gateway key"; a usage ping at `SessionStart` that the
  description does not mention; a cached fail at the same commit; the same commit under a moved repository, which
  must be scanned again; a scan step that exits non-zero with no output; one that exits 0 with verdicts for only
  some of the entries; a violation text with a link, an image tag, a `|` and three backticks, which must stay inert
  in every sink. Must pass: a plugin that sends the Railway CLI token to Railway's API; a hook gated on
  `vercel.json`; telemetry the description discloses, with an opt-out; a PR that touches neither the manifest nor
  the policy, which reports and skips.
- **Wiring:** a required check on the main branch. The workflow and the policy have code owners, and a PreToolUse
  hook denies the working agent's writes to them; the cache lives in CI, out of the agent's reach.

## Notes

- Hidden folders count. Anthropic's policy: a plugin "installed from a git source clones the ENTIRE repo to the
  user's disk", and code in `.claude/` is not loaded, but "it ships, it is reachable, and an agent can be led to run
  it". "'not a loaded surface' is NOT a reason to skip a file."
- The cache is what makes a scan per pin affordable: without it, Anthropic's nightly bumps would "re-burn ~90s of
  Claude time per entry per night".
- What happens to a failing pin is [dependency-updates](../dependency-updates/card.md)'s: it is dropped from the
  bump, never patched. Whether an MCP server's URL is alive is [config-validation](../config-validation/card.md)'s.

## Agent step

A reviewer gets the extension's files at the pinned commit, its install description and the policy, with Read, Grep
and Glob only and no network. It returns a Verdict whose `reasons` each cite a file and line or a hook, with the
policy's fields: the list of hooks, `has_broad_scope_hooks`, `has_undisclosed_telemetry`,
`sends_credentials_cross_service` and `description_matches_behavior`. The script, not the model, derives `fail` from
those fields, so an answer that raises a flag and still says `pass` fails.

It blocks only once `gate` ([agent-calibration](../agent-calibration/card.md)). Its eval set is the cases above and
the project's catalogue: every pinned extension, with a verdict a person confirmed (H5). The policy is the
reviewer's definition, so a policy edit re-scores the evals and re-scans the whole catalogue, and a person reviews
every verdict that flipped before the edit merges. Anthropic's credential rule shows why. "A full faithful scan of
all 159 -official url-source plugins surfaced false positives": the rule flagged plugins that send a service's own
token to that service. Once narrowed, the next full re-validation "showed the prior wording let a plugin pass by
*claiming* an ANTHROPIC_*-named token was 'its gateway key'". Both showed only on the whole catalogue; each becomes
an eval case. A fail a person overrides is recorded with `loops.py outcome` and becomes a case too.
