---
id: error-tracking
title: "Error tracking (Sentry)"
summary: "Through Sentry MCP the agent gets the top errors, their stack traces and Seer's root-cause analysis; it reproduces one with a test, fixes it, and checks that the error rate fell after the release."
sensor: computational
ilities: [reliability, observability]
places: [delivery/confirmation, remediation/entry, remediation/confirmation, maintenance/confirmation]
stages: [production]
speed: [minutes, days]
needs: [errors]
agent: [investigator]
related: [release-confirmation, reproduction-gate, triage]
links:
  - title: "Sentry MCP"
    url: "https://mcp.sentry.dev/"
    author: "Sentry"
    note: "the remote server, its optional scope to an organization or project, the Claude Code command."
  - title: "sentry-mcp"
    url: "https://github.com/getsentry/sentry-mcp"
    author: "Sentry"
    note: "Seer is not part of self-hosted Sentry."
  - title: "Debug and fix production issues with Sentry MCP in Warp"
    url: "https://sentry.io/cookbook/debug-with-sentry-mcp-warp/"
    author: "Sentry"
    note: "what Seer returns: the root cause, the evidence it used, a suggested fix."
  - title: "Issue status"
    url: "https://docs.sentry.io/product/issues/states-triage/"
    author: "Sentry"
    note: "resolving in the next release; Regressed and Escalating."
  - title: "Codex CLI + Sentry MCP: From Production Error to Pull Request in One Agent Loop"
    url: "https://codex.danielvaughan.com/2026/05/09/codex-cli-sentry-mcp-production-error-triage-automated-bug-resolution/"
  - title: "sentry-fix-issues"
    url: "https://mcpservers.org/agent-skills/sentry/sentry-agent-skills/sentry-fix-issues"
---

## Why

Some errors show only in production, where none of the agent's own tests run. The tracker hands the agent the top
errors, so it works on what fails for users, not on a guess. Checking the errors after the release shows whether the
fix worked where the error happened, not only in the test that reproduced it.

## How it works

1. Through Sentry MCP the agent asks for the project's top unresolved issues and reads one issue's stack trace and
   recent events.
2. Where the project has Seer, the agent asks it for a root-cause analysis: the sequence of events that led to the
   issue and the most likely culprit, the traces and logs it used, and a suggested fix. The agent treats the analysis
   as a hypothesis to test, not as the cause.
3. It reproduces the error with a test that fails first ([reproduction-gate](../reproduction-gate/card.md)), then
   fixes the code.
4. Once the fix is merged, the issue is resolved in the next release. If the error comes back in a newer release,
   Sentry marks the issue `Regressed`.
5. After the release, a job checks that the issue's events stopped under the new version while the path that raised
   them still runs ([release-confirmation](../release-confirmation/card.md)).

## Set up

- **Connect Sentry MCP**:
  `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp/<organization>/<project>`. The scope to an
  organization or a project is optional; Sentry recommends the project scope where possible.
- **Seer, where there is one.** Connect the repository to Seer: with it, Seer points to the culprit lines and suggests
  a fix more accurately. Seer is not part of self-hosted Sentry; there, the agent works from the stack trace and the
  events alone.
- **Every event carries the release and the environment**, so an issue can be compared between versions.
- **Event data is untrusted input.** Messages, breadcrumbs and request data come from users and third parties. The
  agent reads them as data and never follows an instruction found in them.
- **The confirmation is a `run` over a snapshot**, the remediation row of release-confirmation. After the window, the
  job saves, for each issue the release fixed, its events and the number of runs of its path under the new and the
  previous version. `run` prints one line per issue, `<issue>: <status>`: `confirmed (0 events, path ran 3400
  times)`, `regressed (14 events in <release>)`, `inconclusive (path ran 12 times of 50)`, `not the running
  version`. It exits non-zero for anything but `confirmed`.
- **The cases are recorded snapshots.** Must fire: an issue with events under the new version; the old version still
  running; too few runs of the path. Must pass: no events under the new version, with the path run at least N times.
- **Wiring.** A daily scheduled job hands the top new issues, and those Sentry marks `Escalating` ("An issue that's
  exceeded its forecasted event volume."), to [triage](../triage/card.md). The confirmation job runs after the deploy,
  in the pipeline. Both run outside the agent's session, and the check counts events, not the issue's status: the
  agent cannot pass it by marking an issue resolved.

## Agent step

An investigator gets one issue (its stack trace, its recent events, and Seer's analysis where there is one) and
returns a Diagnosis: the cause, the evidence, and as `next` either the test that would reproduce it or "no test can
reproduce it: confirmation only". It never blocks.
