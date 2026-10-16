# Agent theater implementation

Version 0.6.0. User-approved scope: personalities, object actions, workshop,
cozy/chaotic/adventure and liveliness. Subsequent user direction expanded hook
reactions so the crew does not mostly walk with a generic working label.

Pure hooks/theater.ts owns personality definitions, tool/action mapping, object
artwork, workshop stations and short decorative reactions. register.tsx owns
event state and lifetime. No new host API capabilities or model requests added.

Five personalities cycle independently of skin, remain stable when tools change,
and keep their identity when a turn starts before agent.spawn returns. Work
variants count per action kind across thinking phases, so sequential short reads
alternate too; parallel calls restore their own saved variants. Work
station paths approach once and settle; resize replans from the current location.
Narrow scenes allocate personal work spaces and compact secondary labels.

Turn start/step distinguish planning, thinking and streaming reply. In-flight
tools are tracked independently; completion restores another running tool or
thinking. Fast tools leave a bounded, past-tense object receipt. Errors do not
declare the entire turn failed. The stream return result and cancellation are
forwarded, as are tool results and permission decisions.

Commands, accepted configuration, compaction, incoming messages and real active
approval checks draw distinct cues. Text from messages and model reasoning is
not consumed. Existing meetings, GitHub celebrations, questions and completion
are preserved. Autonomous moments rotate between eligible actors at 30/16/8 s,
one at a time, yielding to waiting, outcomes and event cues.

Native tests cover lifecycle, new phases, props, behavior, scheduler, parallel
tools, cancellation, permissions, denied config, resize and early spawning.
scripts/preview.mjs generates a gallery from the production SVG functions using
Node's built-in TS stripping. Optional PNG export uses bundled Sharp. No build
or package-manager installation is required for the mod or native tests.

See reviews/agent-theater.md for verification and live-render limitations.
