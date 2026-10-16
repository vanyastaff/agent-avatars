# Avatar regressions

The existing public boundary is `register`: session events enter registered hooks;
SVG, terminal elements, `/avatars`, and model API calls are observable outputs.
The user approved this test boundary. Stub only host APIs and time.

Investigate waiting-to-ended retirement, main-agent tool activity, session/module
isolation, and the validator's missing-catch diagnostics. Fix only reproduced
defects. Preserve default opt-out of model calls and escaped SVG text.

Prefer native host tests over a custom transpilation harness (less faithful) or
live model sessions (slower, nondeterministic, consume quota). No architecture
change or new product feature is planned.

## Implemented

- Session-list terminal statuses now start retirement even when the avatar was
  already stopped waiting. Repeated terminal polls keep the original deadline.
- Entering waiting cancels any previous completion/exit deadline and mood;
  unchanged waiting polls no longer invalidate the scene needlessly.
- Tool calls without agentId update the main avatar. AI naming remains limited
  to subagents; opt-in AI thoughts also work for main.
- Use $.clock.now consistently for state and SVG ages, including spawn, resize,
  completion, meetings, questions, celebrations, and sound throttling. Mixing
  host time with Date.now broke the deterministic host-clock reproducer.
- Added native host tests and documented their command and limitations. Corrected
  README claims about housekeeping and optional model/audio host calls.

## Unconfirmed risks

Independent native mod loads did not leak configuration. No refactor of global
state was justified. Concurrent live application sessions were not tested.
Missing .catch is informational for this observing mod: an API-denial test proves
the host still runs the underlying tool, matching documented skip-on-error rules.

No new dependencies or API changes. No tests contact a model or run a real tool.
