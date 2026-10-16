# Scene environments — 0.8.0

User approved usable places and actions in every scene, preserving personalities
and real-event reactions. Keep the approved public register/event/render test seam.

Delivered all 14 scenes: workshop plus 13 themed environments. Pure worlds.ts
defines four places per theme, action labels, matching props, geometry, pixel
objects and event-gated responses. Workshop retains its established furniture
and also gets object feedback. Existing skies/ambient details remain; city
buildings render behind the usable foreground. Home reading uses a seated pose.

Every route approaches one object and stops. Removed looping routes, routeLoop,
epoch/PAUSE routing state and office-only desk/anchor/layout code. stationKind
separates a visual destination from truthful workKind: closing gestures remain
at the used object while tool status already reports thinking. A settledAt visual
timestamp allows sub-frame results to reach their object and finish a bounded
2.2s postlude there; actual endedAt and the returned host result are unchanged.
New real work replaces the old sequence, preserving existing parallel/turn guards.

Object feedback requires a nearby working avatar with a current sequence and no
wait, permission or duet. Errors suppress working machinery and show trouble.
Quiet disables added SMIL motion; reduced-motion classes remain in use. Behavior
presets retain their prop repertoire; cozy also uses the theme's own object props.
All worlds use the existing workshop band height of 156 to fit scenery and labels.

No new hooks, permissions, dependencies, process/network/model calls or reading
of message/command contents. User-selected scene/skin mappings remain compatible.
Manifest, marketplace and source agree on 0.8.0. Local implementation only.

Evidence: ../../reviews/scene-environments.md. Preview fixtures use production
render functions. Actual application rendering and animation remain unverified.
