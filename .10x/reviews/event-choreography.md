# Event choreography verification

Environment: Windows, Claude Code 2.1.292. Final local source version 0.7.0.
Testing uses the user-approved public register/event/render boundary, stubbing
only host APIs and time. Native tests do not execute real model/tool operations.

Vertical red/green evidence:
- A pending Read had no preparation/focus/sustained/closing beats; implemented
  event-owned sequences and host-clock transitions.
- Delivered messages lacked personality-led handoffs; replaced time-seeded chat
  emotes with authored objects and roles, preserving delivery results.
- Successful spawning had no welcome kit; added the actual-parent duet.
- Tool failure and answered-turn events had no cooperative reaction; added idle
  helpers without claiming repair or inferring build/test success.
- Resize left an ongoing duet at old positions; cancel/replan both participants.
- SVG alt and terminal lacked the current beat; added semantic descriptions.
- Host-list completion left unfinished tool choreography active; clear ownership
  and discard a later result.
- A sub-frame tool had only one closing gesture; added a bounded returned-result
  sequence while retaining the truthful thinking status.

Initial test scaffolding corrections: start the host session before exercising
timer invalidation, assert after the next 250ms housekeeping tick, and provide
the native session.send result shape (isDelivered plus reason on failure).
An initial geometry measurement correctly cancels a pre-mount duet; message
tests mount the scene before delivering the event, as a visible session does.

Final: 54 pass, 0 fail across 6 native test files (16 new tests); strict plugin
validation and git diff --check pass. Impeccable detector returned []. Tests cover
all action kinds, five personalities, busy/undelivered messages, parallel age,
late old results, approval/abort, resize and fast tools. One earlier whole-suite
run encountered unrelated 5s timeouts in existing tests during a slow host run;
subsequent full runs passed without increasing timeouts.

Production SVG contact sheet inspected at wide and narrow sizes, including
different presets, light/transparent and quiet. One correction batch fixed
closing-object placement below the floor and fixture statuses; confirmation
contact sheet inspected. Files: docs/previews/choreography.html/.png, handoff.png.
Preview fixtures render production functions; they do not prove host hook wiring.

Limits: PNG rendering is static. Live Claude Code animation, SMIL playback and
actual application reduced-motion behavior remain unverified. No standalone
TypeScript compiler run, remote publication, or installed-plugin update claimed.
