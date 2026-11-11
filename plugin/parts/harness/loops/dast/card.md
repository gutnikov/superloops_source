---
id: dast
title: "DAST"
summary: "OWASP ZAP scans the running preview from the outside: passively on every deploy, with attacks before a release. The agent fixes each alert the scan fails on."
sensor: computational
ilities: [security]
places: [delivery/release, remediation/entry]
stages: [preview, staging]
speed: [minutes, hours]
needs: [ci]
related: [preview-environments, sast, security-review-agent]
links:
  - title: "ZAP Baseline Scan"
    url: "https://www.zaproxy.org/docs/docker/baseline-scan/"
    author: "ZAP"
    note: "the passive scan, its options, its rules file and its exit codes."
  - title: "ZAP Full Scan"
    url: "https://www.zaproxy.org/docs/docker/full-scan/"
    author: "ZAP"
    note: "the active scan, which attacks."
  - title: "ZAP API Scan"
    url: "https://www.zaproxy.org/docs/docker/api-scan/"
    author: "ZAP"
    note: "an active scan of the URLs in an OpenAPI, SOAP or GraphQL definition."
---

## Why

Some vulnerabilities exist only in the running app: a missing security header, a cookie without the Secure flag, an
injection that shows only through the deployed stack with its proxy and its configuration. Reading the code does not
reveal them. A scanner finds them from the outside, the way an attacker would, while the change is still on a preview
and not yet released.

## How it works

The pipeline deploys the change to its preview environment ([preview-environments](../preview-environments/card.md))
and runs OWASP ZAP against its URL. There are three scans:

- The **baseline scan** spiders the app for one minute by default and only watches the traffic; it "doesn't perform
  any actual 'attacks'". It takes a few minutes.
- The **full scan** adds an active scan that "does perform actual 'attacks'", and it "can potentially run for a long
  period of time".
- The **API scan** imports an OpenAPI, SOAP or GraphQL definition (`-f`) and runs an active scan against the URLs it
  finds, tuned to APIs.

Each scan writes its full report as JSON (`-J`). The agent reads the alerts the scan failed on, fixes the cause in the
code or in the server's configuration, and pushes; the preview is deployed and scanned again. The loop ends when the
scan has no FAIL.

## Set up

- **A preview with test data only.** Without a deployed environment the scanner has nothing to scan. Run the active
  scans only against an environment the project owns and that holds no real user data: they send attack payloads.
- **Which scan where.** The baseline scan on every preview deploy: it is passive and takes minutes. The full scan, or
  the API scan for an API, nightly and before a release, against the preview or staging. Cap the spider with `-m`
  and the job with a timeout, so a long scan ends as red rather than never.
- **The rules file is the policy.** `zap-baseline.py -g zap.conf` writes a config with every rule at WARN. The project
  sets each rule to IGNORE, WARN or FAIL in that file, keeps it in the repository and passes it with `-c`. Start with
  FAIL on the rules the project cares about, and move a rule to FAIL once its warnings are fixed. A change to the file
  is approving a threshold the loop trusts, so a person approves it (H5).
- **Wait in the wiring, judge in `run`.** A CI job after the preview deploy runs the scan in Docker, for example
  `docker run -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t <preview url> -c zap.conf
  -J report.json`, and saves the report and the exit code into a directory. ZAP exits 0 on success, 1 on at least one
  FAIL, 2 on warnings with no FAIL, and 3 on any other failure. `run` judges the saved directory, so it is fast and
  deterministic.
- **The output** is one line per alert at FAIL, `<rule id> <rule name>: <url>`, then the number of warnings. The exit
  is non-zero on any FAIL, and on exit code 3 with `scan failed`: a scan that did not run is not a pass.
- **The cases are recorded reports.** Must fire: a report with a FAIL alert, such as rule 10011, Cookie Without Secure
  Flag, on the login response; a scan that ended with exit code 3. Must pass: a report with only IGNORE and WARN
  alerts.
- **Out of the agent's reach.** The scan runs in the pipeline against the deployed preview, not in the agent's
  session. A PreToolUse hook denies the agent's writes to the rules file, so it cannot turn a FAIL into IGNORE; it
  reads the report and fixes the app.

## Notes

- DAST and [SAST](../sast/card.md) see different things: SAST sees a pattern in the code, DAST sees what the deployed
  stack answers, its headers and configuration included.
