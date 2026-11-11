# Step: tools

Which tools can the agent use from its own session? A loop that needs a tool the agent cannot call is a loop the
project cannot run. That the company has Sentry is not enough: the agent needs a CLI, an MCP server or an API token
it can use now. Call each tool once before writing it into `tools` (`$H/profile.md` §2, Q3); a tool that does not
answer stays out, and the loops that need it wait (H3).

Most tools add no loop by themselves: they make the loops of other answers possible. The rules in `wizard.json`
combine them: production and an error tracker bring `error-tracking`; production, the `deploy` autonomy and any
production signal bring `release-confirmation`.

## `github-cli`, `gitlab-cli`: GitHub or GitLab

Add no loop. They give the agent the CI's runs and logs (`ci`) and the issues (`tracker`), which `ci-clean-infra`,
`human-diff-review` and `triage` read. Check with `gh auth status` or `glab auth status`.

## `sentry`: an error tracker

Adds no loop by itself. With `production`, a rule adds `error-tracking`: after a release the agent reads the top new
errors, reproduces one with a failing test, fixes it, and checks that the error rate fell.

## `posthog`: product analytics

Adds no loop. Suggest `production-users`: a person reads the users' signal in aggregate (funnels, feature use, feedback)
and decides whether shipped work has value. It is a person's loop; the agent prepares the numbers.

## `grafana`: Grafana or Prometheus

Adds no loop. Suggest `metrics-promql` (the agent compares counters and latency with what it expects after a change)
and `slo-degradation` (an agent watches the objectives and looks for the cause when one degrades).

## `logs`: a log store

Adds no loop by itself; it is the signal `release-confirmation` and `health-checks-smoke` read. Suggest
`structured-logs`, so the agent can query by request id and field instead of grepping text.

## `otel`: OpenTelemetry traces

Adds no loop. Suggest `traces-opentelemetry` (the agent finds the slow or failed span) and `perf-budgets-telemetry`
(a budget such as "startup under 800 ms" checked against the service's own traces).

## `browser`: a browser the agent drives

Adds no loop: `e2e-browser` comes from the `web` kind and installs Playwright as a dependency when it is missing.
Suggest `browser-console-devtools` (console errors and failed requests) and `visual-screenshot-check` (a screenshot
against the design).

## `simulator`: a mobile simulator

Adds no loop: it is what `agentic-manual-testing` drives for the `mobile` kind. Without it, that loop becomes a script
a person runs.

## `deploy`: a deploy the agent can start

Adds no loop. It is what the `deploy` autonomy needs to release on its own. Suggest `canary-feature-flags` (a release
that rolls back by itself) and `backup-restore-rollback` (the restore and the rollback rehearsed on a schedule).
Every deploy stays under `risky-action-gates` below the `deploy` autonomy.

## `tracker`: an issue tracker

Adds no loop. Suggest `triage`: incoming issues, alerts and bot pull requests merged with what is already open and
routed to one super-loop.
