---
id: dast
title: "DAST"
summary: "A scanner attacks the preview environment. The agent fixes the vulnerabilities that the scanner finds."
sensor: computational
ilities: [security]
places: [delivery/release, remediation/entry]
stages: [staging]
speed: [minutes]
needs: []
links: []
---

## Why

Some vulnerabilities show only when the app is running and answers requests; reading the code does not reveal them. A scanner finds them from the outside, the way an attacker would. The agent gets them before the change is released.

## How it works

The scanner runs against the app in the preview environment, not against the code. It reports the vulnerabilities it finds, and the agent fixes them. The research this card is based on does not say how the report reaches the agent or what ends the loop. Set up lists these gaps.

## Set up

Run an OWASP ZAP baseline scan against the project's preview environment. A project without a preview environment gives the scanner nothing to attack.

The research does not give:

- a command or configuration for the scan
- a way to pass the scanner's report to the agent
- the condition that ends the loop

## Notes

The research cites no outside source for this loop and notes that it did not check ZAP separately.
