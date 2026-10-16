# Agent theater

User approved implementation of personalities, object actions, workshop, three
behavior presets, and liveliness. Keep the previously approved register/event
test boundary. Preserve real work status and model opt-in.

Decision: add a pure theater module for personality/action selection, props,
workshop geometry, and authored SVG motion. Integrate it with the existing event
state and SMIL renderer. Workshop routes approach a station and stop; tools and a
bounded round-robin flourish scheduler provide variation. Behavior and liveliness
are cosmetic configuration independent of skin and scene. Workshop becomes the
default scene; explicitly selected existing scenes remain available.

Alternatives: extending the single TSX file further makes artwork and lifecycle
harder to navigate; a Client renderer introduces a second runtime and surface
compatibility changes without being necessary for this scope.

Failure handling: no new tool/model/network calls; temporal state uses host time;
completion/waiting/exit interrupt decorative performances; resize replans from
the current position. One autonomous flourish at a time, with bounded frequency.
Quiet mode reduces motion and frequency. SVG reduced-motion styling suppresses
decorative SMIL motion while preserving labels. Native host tests cover these
contracts; preview actual generated SVG at narrow/wide sizes and light/dark looks.
