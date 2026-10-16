# Agent theater verification

Environment: Windows, Claude Code 2.1.292; version under test: 0.6.0.

Public register/event/render boundary, previously approved by the user. Native
test kit stubs host tools/models/settings; no real tools, approvals, transcript
compactions, messages or model requests are executed by the tests.

Red -> green slices: missing workshop stations; missing distinct personalities;
missing props/action variants; ignored behavior presets; endless workshop paths;
absent liveliness schedule; missing planning/thinking/reply phases; duplicate
avatar/personality when a subagent starts its turn before spawn returns. A final
sequential-call test reproduced variant counters resetting on thinking; persistent
per-action counters fixed the repetition, and pending calls retain their variants.

Earlier activity tests were strengthened to hold the host tool pending while
asserting its activity. The old assertion after an already-completed tool would
have required a stale reading status, contrary to the user's refined request.

Results: 38 native tests pass; strict plugin validation passes; git diff --check
passes. Impeccable's mechanical detector returned an empty findings array.
Coverage includes the original lifecycle fixes plus presets, stationary work,
props, stream results/cancellation, parallel calls, fast tool receipts, event
reactions, approval pass-through, errors, denied config, scheduler exclusivity,
early-spawn identity and narrow resize. Native tests render desktop/VS Code SVG
and terminal output; a real application's site availability is not inferred from
the test kit accepting a synthetic surface.

Visual QA used production SVG functions and bundled Sharp for offline PNGs.
Wide cozy/chaotic and narrow light/transparent scenes were inspected. One batch
fixed an absolute hood coordinate and crowded narrow labels/actor placement;
the confirmation images are in docs/previews. Gallery has all three presets.

Limits: IAB could not reach the local preview server; file:// navigation was
explicitly rejected by browser URL policy. No bypass was attempted. Offline PNG
rendering is static and does not validate SMIL playback, browser reduced-motion
behavior, live hot reload or the actual Claude Desktop band height. No installed
marketplace copy was updated, no release/PR was published, no live session or
standalone TypeScript compiler run is claimed.
