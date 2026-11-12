---
id: release-trust-boundary
title: "Release credentials meet only reviewed release code"
summary: "A CI check fails when a job holding publish or deploy credentials runs repository code, trusts what the build output says about itself, or sits outside the release's code owners."
sensor: computational
ilities: [security, deployability]
places: [delivery/release, remediation/release, maintenance/release]
stages: [ci]
speed: [seconds]
needs: [ci]
related: [shipped-artifact-check, agent-ci-hardening, risky-action-gates, patch-backport, preview-environments, secret-scanning, dependency-scanning-sbom]
links:
  - title: "opencode .github/release/README.md: the deploy boundary"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/README.md#L1-L61"
    author: "opencode (anomalyco)"
    note: "build runs repository code with nothing to publish with; deploy runs only the release scripts on a verified artifact; the promotion checklist."
  - title: "opencode deploy.yml: a sparse checkout of the release scripts, a digest per artifact, a step-scoped token"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/deploy.yml#L56-L119"
    author: "opencode (anomalyco)"
  - title: "opencode verify-artifacts.sh: the reported digest and exactly the listed files"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/verify-artifacts.sh#L1-L43"
    author: "opencode (anomalyco)"
  - title: "opencode lib.sh: the artifact's config must be the pinned target"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/lib.sh#L138-L144"
    author: "opencode (anomalyco)"
  - title: "opencode deploy-data.sh: an allow-list of paths, the pinned targets, exactly the named secrets"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/deploy-data.sh#L24-L59"
    author: "opencode (anomalyco)"
  - title: "opencode publish-npm.sh: the package set comes from the script"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/publish-npm.sh#L1-L59"
    author: "opencode (anomalyco)"
  - title: "opencode plan-release.sh: the channel from event and ref, releasers only"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/plan-release.sh#L1-L60"
    author: "opencode (anomalyco)"
  - title: "opencode tag-release.sh: the release commit may only change versions and the changelog"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/tag-release.sh#L1-L41"
    author: "opencode (anomalyco)"
  - title: "opencode update server: publish only from release.yml in the release environment"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/update/src/index.ts#L594-L611"
    author: "opencode (anomalyco)"
  - title: "opencode update server tests: build tokens never publish"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/update/test/index.test.ts#L211-L233"
    author: "opencode (anomalyco)"
  - title: "opencode cloudflare-token.sh: a 15-minute token, verified at once"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/release/cloudflare-token.sh#L95-L108"
    author: "opencode (anomalyco)"
  - title: "opencode release.yml: the triggers, with no pull_request"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/workflows/release.yml#L4-L34"
    author: "opencode (anomalyco)"
  - title: "opencode CODEOWNERS: /.github/ is the release security boundary"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.github/CODEOWNERS#L9-L11"
    author: "opencode (anomalyco)"
  - title: "Codex resolve_python_cli_release.py: a downstream publisher re-checks the upstream run"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/scripts/resolve_python_cli_release.py#L26-L102"
    author: "Codex (OpenAI)"
  - title: "Codex CODEOWNERS: the signing path and CODEOWNERS itself"
    url: "https://github.com/openai/codex/blob/e58bf8f5233b51e7cd1679d947e3028c1ed91b06/.github/CODEOWNERS#L11-L17"
    author: "Codex (OpenAI)"
  - title: "gemini-cli CODEOWNERS: workflows owned, composite actions not"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/CODEOWNERS#L1-L13"
    author: "gemini-cli (Google)"
  - title: "gemini-cli release-patch-3-release.yml: install, tests and publish in one prod job"
    url: "https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/.github/workflows/release-patch-3-release.yml#L44-L94"
    author: "gemini-cli (Google)"
  - title: "About code owners"
    url: "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners"
    author: "GitHub"
---

## Why

A release job holds the project's strongest credentials: the registry token, the cloud deploy token, the signing
identity. Whatever runs in that job can use them, and whatever it reads can point them somewhere. If the job checks out
the repository and runs its build, every merged change runs with those credentials, including changes in paths the
release owners never review, and so does every dependency's install script. If the job trusts the build output, the
output decides where the credential goes: a Worker renamed, a route added, a package added to the publish set, an
`.npmrc` that names another registry. opencode: "Repository code outside `.github/` does not need Dax's review, so the
deploy job must never execute it." No test fails: the release works, for whoever changed it.

## How it works

Split every release by what it holds, and check the split on every pull request:

- **Build** runs the repository's code with no environment, no secrets and no token that can publish. It writes a
  `SHA256SUMS` of its output and reports that file's digest as a job output.
- **Release** (sign, publish, deploy) checks out only the release scripts at the same commit, with
  `persist-credentials: false` (opencode: a sparse checkout of `/.github/release/`), installs pinned tools with
  `--ignore-scripts`, and reads the build output as data:
  - **Digests.** Each artifact matches the digest the build reported and holds exactly the files its `SHA256SUMS`
    lists: opencode fails with "Missing digest for <name>", "SHA256SUMS digest mismatch in <name>" and "Unexpected
    files in <name>".
  - **Destinations from the release path.** Names, routes, bindings, the registry and the package set are pinned in
    reviewed files, and the output must match them. opencode compares each resolved config with its pinned target
    byte for byte, "before the token is used", then deploys the pinned copy: "<label> in the artifact is not the pinned
    target (<path>)". Its npm script: "Names, the version and the package set come from this script, never from the
    tarballs"; it refuses an unexpected or missing package, another version, a `publishConfig` beyond `access`, an
    install script, a macOS or Windows binary from the unsigned build, and publishes from a fresh `.npmrc`, "so nothing
    from an artifact can redirect the registry".
  - **Provenance.** Each tarball's attestation names the release workflow as its signer (`gh attestation verify
    --signer-workflow <repo>/.github/workflows/release.yml`).
- **Who may release which channel** follows from the event and the ref alone. In opencode a push to `dev` publishes
  `dev`; only a dispatch with a version reaches `latest`, only by an admin or maintainer ("Stable releases can only be
  started by releasers"), with release notes; and "The release commit may only change versions and the changelog".
- **The receiving side checks too.** A server the project runs accepts a publish from one workflow in one
  environment: opencode's update server requires the OIDC claims of its repository and owner ids, a `workflow_ref` of
  `release.yml@<ref>` and the environment `release`, and maps ref and event to the channels allowed. Its test pins
  "Build jobs run repository code and hold no environment, so their tokens must never publish".
- **Short, step-scoped credentials.** opencode mints a 15-minute token per stage, gives it only to the deploy step and
  verifies it at once, so a token the runner cannot use fails before the first upload.
- **A publisher started by another run re-checks that run.** Codex's Python release, started by the CLI release,
  requires the run's workflow file, a `push` event, the same repository, success of the last release job that ran, the
  tag still at the run's commit ("The release tag no longer matches the successful CLI run"), and a published stable
  release.
- **The release path has its own code owners**: the release workflows, the scripts and composite actions they call,
  the pinned targets, this check, and CODEOWNERS itself. Codex gives its signing action, signing files, release
  workflow and CODEOWNERS to one team: "Keep ownership changes reviewed by the same team." gemini-cli gives
  `.github/workflows/` to its release approvers, while the composite actions that receive its npm tokens and the script
  that holds its workflow lint keep the default owner, so one pull request can change the publish path and the rule
  that guards it.

## Set up

- **One release directory and named release workflows**, with the boundary written where an agent that edits them
  reads it: a README in the directory and a comment on its CODEOWNERS line, as opencode has.
- **A dry run of every change to the release path.** opencode's plan maps a pull request to a dry-run channel, but its
  release workflow has no `pull_request` trigger, so a change to the release scripts first runs as a real release. Run
  the release workflow on pull requests that touch its paths, in a channel that publishes nothing.
- **`run`** reads the workflows, the actions they call and CODEOWNERS, finds each job that holds a credential (an
  `environment:`, a secret, `id-token: write`, a write permission it publishes with), and prints one line per problem,
  `<workflow>:<job>: <problem>`: `release.yml:publish: runs 'npm ci' without --ignore-scripts`, `deploy.yml:deploy:
  checks out the whole repository`, `release.yml:publish: downloads 'cli' without a digest`, `CODEOWNERS:
  .github/actions/publish-release/ has the default owner`. It exits non-zero on any problem.
- **Cases.** Must fire: a job in the release environment that installs, builds or tests the repository and then
  publishes from the same runner, as gemini-cli's patch release job does; a `workflow_run` job that checks out the
  triggering run's head commit and holds a publish secret; an artifact download with no required digest; a deploy that
  reads its target from the artifact; a publish set read from the tarballs; a composite action that a release job
  calls, or this check's script, outside the release owners; a change to the release path with no dry run. Must pass:
  the build job, which holds nothing; a release job that runs only pinned scripts on verified artifacts; the server's
  claims table, with the release environment accepted and an empty one refused.
- **Wiring.** A required job on every pull request and on the main branch. The agent changes product code freely; a
  change under the release path waits for its code owners, as agent jobs do under
  [agent-ci-hardening](../agent-ci-hardening/card.md).

## Notes

- A job that builds and publishes can keep the tokens out of the build steps' environment. That stops a leak through
  the environment, not a build step that rewrites a file a later step runs: split the job.
- Promotion is inside the boundary. opencode's promotion to production is a checklist a person follows ("Diff
  `.github/release/targets/` against `origin/production`"); print that diff in the promotion job, where the approver
  of the environment reads it ([risky-action-gates](../risky-action-gates/card.md)).
- Per-PR builds from untrusted code use the same split: an unprivileged build and a publisher that only reads its
  artifact ([preview-environments](../preview-environments/card.md)). What the release checks in the bytes themselves
  is [shipped-artifact-check](../shipped-artifact-check/card.md).
