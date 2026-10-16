# Current handoff

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
