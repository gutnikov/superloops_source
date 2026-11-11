# Step: checks

Where do the project's checks run today? A loop the agent runs in its own workspace can be edited or skipped by that
agent. Every gate needs one run where the agent cannot write: CI, or at least a git hook outside the agent's reach.
This step decides where that run happens.

Confirm from `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile` and the like, and check that the agent can read
the results with one real call (`gh run list -L 1`, `glab ci list`). A CI the agent cannot read still runs the
gates, but the agent cannot fix what it cannot see.

## `local-only`: only on a developer's machine

Adds `pre-commit-pre-push`: with no CI, a git hook is the only run of `verify` and `secret-scanning` the agent does not
start itself. Keep it to the checks that take seconds; propose a CI job as the next harness task, since a hook can be
skipped with `--no-verify`.

## `github-actions`, `gitlab-ci`, `other-ci`: a CI

Adds `ci-clean-infra`: the agent pushes, autofixes apply, and the agent reads the failing jobs' logs and fixes what is
left locally, starting from the exact command that reproduces each failure. A limited number of CI rounds keeps it
from pushing guesses.

The CI also becomes where `verify`, `secret-scanning` and `dependency-scanning-sbom` run out of the agent's reach:
wire them in as jobs, required on the main branch.

Suggest `platform-matrix` (when the product supports several operating systems or runtimes) and `check-incubation`
(when a flaky test or eval starts blocking good pull requests).

For `other-ci`, confirm how the agent reads a run: an API token, a CLI or an MCP server. If none works, the tools
entry stays out and `ci-clean-infra` waits (H3).
