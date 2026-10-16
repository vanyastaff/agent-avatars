# Avatar regression repair

Scope: reproduce the previously identified risks through the public mod hooks,
fix confirmed behavior defects, and retain regression tests. The user confirmed
the register/event/render boundary; real application painting is outside it.

Discovery complete: one TSX hooks module, host-provided APIs, no existing tests.
Implementation complete. Use the native `claude plugin test` runner; no
package manager or third-party test dependencies are needed.

Confirmed and repaired: waiting-to-ended retirement, stale retirement when an
agent waits again, and missing main-agent tool activity. All temporal state now
uses the host clock, so timers and rendered animation ages share one time base.

Verification: native regression suite and strict plugin validation pass on
Claude Code 2.1.292. See reviews/avatar-regressions.md for red/green evidence and
limits. No release, push, or live application painting was performed.

Agent-theater implementation authorized: personalities, object actions, workshop,
cozy/chaotic/adventure behavior and liveliness. Design: adrs/001-agent-theater.md.
Implementation complete as 0.6.0, including the user's additional hook-driven
direction. 38 native tests pass, strict validation and diff whitespace check pass.
Production SVG PNG previews inspected; live browser/Claude playback unverified.
Evidence and limits: reviews/agent-theater.md.

Publication complete on 2026-10-16: implementation commit 63db4e6 pushed to main.
The named marketplace refresh and user-scoped plugin update succeeded; installed
agent-avatars is enabled at 0.6.0. Restart Claude Code to apply the updated code.
See decisions/devops/agent-theater.md for commands and rollback guidance.
