# Current handoff

Scene environments complete locally as 0.8.0. All 14 worlds have usable objects,
stationary work and personality-preserving actions. Actual events drive object
feedback; fast-result postludes wait visually for arrival without delaying tools.
74 native tests and strict validation pass. Wide/narrow production contact sheets
inspected. See decisions/sde/scene-environments.md and reviews/scene-environments.md.
Live application playback remains unverified; no 0.8.0 publication/install update.

# Handoff history

## 0.7.0 choreography

Event choreography complete locally as 0.7.0. See decisions/sde/event-choreography.md
and reviews/event-choreography.md. 54 native tests pass, strict validation passes,
production SVG contact sheets inspected. Duets use actual spawn/delivery/error/
completion events; tools own their stage lifetimes and preserve parallel-call
age. Live application playback remains unverified. No 0.7.0 publication or
installed-copy update performed.

## 0.6.0 publication

0.6.0 published to origin/main in commit 63db4e6. Named marketplace refreshed;
`claude plugin update agent-avatars@agent-avatars --scope user --json` upgraded
the user installation from 0.5.0 to 0.6.0. Installed version and enabled status
verified. CLI requires restart to apply. Deployment and rollback details:
decisions/devops/agent-theater.md. Live animation remains unverified.

## Before publication

Agent-theater first slice complete as version 0.6.0. See
decisions/sde/agent-theater.md and reviews/agent-theater.md. Thirty-eight native
tests pass with strict validation; production SVG preview PNGs were inspected.
Live SMIL/application testing remains unverified because the browser could not
reach localhost and its file URL policy rejected local-file navigation.

Defaults: scene workshop, behavior cozy, liveliness normal. User may select
chaotic/adventure and quiet/lively independently in /config. Marketplace manifest
and source version agree; installed copies have not been updated automatically.

Existing completed work: avatar-regressions. Seventeen native tests and strict
plugin validation passed; evidence is in reviews/avatar-regressions.md.
