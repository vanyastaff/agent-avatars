# Avatar regression verification

Environment: Windows, Claude Code 2.1.292. Baseline commit: 4b69582.
Boundary approved by the user: registered events, `/avatars`, returned SVG and
terminal elements, and model API requests. All tools/models are stubbed.

## Red evidence

Each repair followed a failing native `claude plugin test .` run:

1. Waiting -> completed: `/avatars` lost the waiting marker but never assigned a
   completion mood or started retirement. Worker remained after 20 host seconds.
2. After repairing that transition, both waiting and ordinary running workers
   still remained after the mock clock advanced. State used Date.now while render
   used $.clock.now. Unifying the clock made both retirement tests pass.
3. Main Read call: desktop SVG contained `working…` instead of `reading…`.
4. After unifying time, running -> completed -> waiting produced
   `Worker [happy] [waiting] (leaving)` while the worker was still blocked.
   Resetting stale retirement state on waiting fixed this independently.

The then-current 16-test suite was also run against the original hooks source in
an isolated temporary plugin directory: **5 passed, 11 failed, exit 1**. Full
output is in [avatar-baseline.txt](avatar-baseline.txt). The temporary plugin was
removed after the run. The waiting-after-completion test alone passes on the
original source because the separate clock mismatch masks its retirement bug;
its red evidence above was captured after the clock repair.

## Green evidence and coverage

`claude plugin test .`: all tests pass. `claude plugin validate --strict .` passes.
Coverage includes completed/failed/killed retirement, no early disappearance,
long waiting, disappearance from the session list, resuming during exit, main
activity on desktop/VS Code/terminal, mood expiration, escaped action/AI text,
AI opt-in/throttling/failure fallback, independent-load configuration, and the
observer failing without blocking tool execution.

The missing-.catch diagnostics remain informational: the error-path test passes
without adding a handler, as expected for an observing hook under the host's
[failure rules](https://code.claude.com/docs/en/plugins/mods/events#handle-a-hook-that-fails).
Independent native loads did not reproduce configuration contamination. This
does not claim a test of concurrent live application sessions.

## Limits

The native kit exercises host loading and render trees, not Ink/browser painting,
SMIL playback, real audio, network requests, or live provider billing. A newer
local declaration file (2.1.295) was consulted as a shape reference, while actual
test compatibility and validation were checked with the installed 2.1.292 CLI.
No standalone TypeScript compiler or CI run is claimed.
