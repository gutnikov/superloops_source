---
id: fault-injection
title: "Fault injection (Toxiproxy)"
summary: "A test makes a dependency slow, time out or go down through the Toxiproxy HTTP API; when the test fails, the agent fixes retries and error handling."
sensor: computational
ilities: [reliability]
places: [delivery/work, remediation/work, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
links:
  - title: "toxiproxy README"
    url: "https://github.com/Shopify/toxiproxy/blob/main/README.md"
  - title: "Toxiproxy: TCP proxy for chaos testing and CI"
    url: "https://hysenlabs.com/en/projects/shopify-toxiproxy"
  - title: "toxiproxy Go package"
    url: "https://pkg.go.dev/github.com/Shopify/toxiproxy/v2"
---

## Why

In ordinary tests a dependency answers fast and never fails, so no test runs the code for retries, timeouts and
error handling. With Toxiproxy, a test can make the dependency slow, time out or go down on demand, locally and in
CI, and show whether the code copes. The agent then fixes what does not.

## How it works

One of the sources calls Toxiproxy a "TCP proxy for chaos testing and CI". A test calls the Toxiproxy HTTP API
(port 8474) to add latency, a timeout or an outage to a dependency. Toxiproxy does not report pass or fail; your
test does. When the test fails, the agent fixes retries and error handling.

## Set up

- Write your own tests that pass or fail on how the code behaves under the fault. Without them, the loop gives no signal.
- Call `POST /reset` between tests.
