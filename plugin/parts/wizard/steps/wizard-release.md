# Step: release

Where does a change go after it is merged? A super-loop is done only where the change is used: passing CI means
"ready to release", not "works". This step decides the stages the loops can reach and where `done_at` lands.

`done_at` follows: production when the agent can read production (an error tracker, logs, metrics or traces in
`wizard-tools.md`), else staging if there is one, else CI, else local. Where the agent cannot read the last stage, a
person confirms there.

## `none`: nowhere yet

Adds nothing. The super-loops end at CI or at the local tests.

## `preview`: a preview per pull request

Adds no loop: a preview is where other loops run.

Suggest `preview-environments` (the agent runs e2e and reads logs against its own deployed copy), `dast` (OWASP ZAP
against the preview), `lighthouse-ci` (performance and accessibility scores per pull request).

## `staging`: staging

Adds `health-checks-smoke`: after a deploy, the agent polls the health and readiness endpoints and runs a short smoke
suite; a red result comes with the startup logs. A deploy that never came up is the first failure of any stand.

Suggest `exploratory-testing` (a person tries the product and files what they find) and `load-testing` (when the
scale matters).

## `production`: production

Adds `health-checks-smoke`, as for staging, right after each production deploy.

Suggest:

- `release-confirmation`: after a deploy, a job judges a window of production signals: the change is running, its
  signal appeared, nothing got worse. It joins the plan by a rule when the agent deploys on its own (`deploy`
  autonomy) and can read production.
- `canary-feature-flags`: a release that rolls back on its own when the canary is worse.
- `structured-logs`: logs the agent can query by request and field.
- `slo-degradation`: an agent watches latency, errors and availability against their objectives.

## `app-store`: an app store

Adds no loop. The internal track (TestFlight, Firebase App Distribution) is staging; the store release is production.

Suggest `platform-matrix` (OS versions and devices), `exploratory-testing` (a person on a real device before the
store release), `shipped-artifact-check` (the signed build users install, checked before it is submitted) and
`patch-backport` (a fix carried to the version already in the store, with its own tests).

## `package-registry`: a package registry

Adds `api-breaking-changes`: a published package's users break on the next version they install, far from the change.
The public API is compared with the last release before every release.

Adds `shipped-artifact-check`: the tests run against the workspace, and users install the packed package. A file left
out of the package, a bundler that drops a module, a binary built for the wrong architecture pass every test. The
release installs what it built into an empty project, runs it, and moves the `latest` tag only then.

Suggest `changelog-audit` (every commit since the last tag in the changelog), `platform-matrix` (runtime versions
the package claims to support), `release-trust-boundary` (the job that holds the publish token runs only the release
scripts and checks each artifact against the digest its build reported) and `patch-backport` (a fix carried to a
release line that is still supported).
