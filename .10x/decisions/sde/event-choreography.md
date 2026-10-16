# Event choreography — 0.7.0

User approved joint scenes and multi-stage object actions, driven by personality
and actual events. The previously approved public register/event/render test seam
remains in use. Existing skins, scenes, behavior presets and liveliness remain.

ToolActivity now owns an ActionSequence with a host-clock start, stable variant,
actual end time and failure flag. Pure theater rules select preparation, focus,
sustained work and closing beats. Read/search/craft/run/scout each have authored
steps. Fast results use a short, explicitly returned-result sequence; real tool
status returns to thinking immediately. Failures never play a successful result.
Parallel tools restore their own original beat age. New turns clear old ownership.

Duets replace the old time-seeded meeting emotes. Triggered only by successful
spawn, delivered session.send, actual tool failure and normally answered turns.
Spawn uses parentAgentId; messages use the actual sender/recipient, without text.
Error/completion helpers must be idle and free of cues, waits and active tools.
Five personality gestures combine into pairs. There is one duet at a time, no
random duet scheduler and no delayed queue of stale events. Ordinary idle
flourishes remain but yield to active choreography.

The shared duet lifetime is 4.4s. New tools/turns, approvals, question UI, commands,
host status changes, retirement and resize release both participants. Cancellation
replans from their visible positions. Quiet duets stay at the original locations;
reduced-motion CSS preserves position rather than collapsing actors to the origin.
Workshop travel is bounded at 2.2s. SVG alt text and terminal describe each beat.

Manifest, marketplace and source version are 0.7.0. No new API capability,
dependency, model request, or access to message contents was introduced.
Host event contracts checked against official mods declarations/reference and
the installed Claude Code 2.1.292 native test kit. No deployment performed here.

Verification and limits: ../../reviews/event-choreography.md.
