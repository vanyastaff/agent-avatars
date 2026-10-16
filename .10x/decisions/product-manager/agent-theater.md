# Agent theater — proposal

Status: first implementation complete. The user approved personalities, object
actions, workshop, behavior presets and liveliness, then clarified that real
hooks should drive the scene rather than mostly walking with `working…`.

The user's inspiration is watching unusual viewer avatars on Twitch. The desired
experience is entertaining observation while coding agents work: recognizable
characters, varied actions, and small stories. The user explicitly prefers
selecting behavior through configuration rather than one fixed tone.

Proposed direction: cozy, chaotic, and adventure presets, independent of skin and
scene. Optional liveliness controls frequency/intensity. Personality changes the
visual performance, never actual agent decisions, tools, or permissions.

Delivered slice: workshop stations, tool-specific props and variants, five stable
personalities, behavior/liveliness configuration, and turn/tool/command/config/
compaction/message/permission reactions. Existing meeting animations remain.
The user subsequently approved multi-character stories and multi-stage actions;
these are delivered locally in 0.7.0. See ../sde/event-choreography.md. Recurring
visual cast, audience interactions, room keepsakes and an expanded pane remain ideas.

Success to validate: recognize characters from behavior with labels hidden;
repeated actions visibly vary; scenes make sense without speech bubbles; ordinary
work remains unobstructed. No fake task progress or inferred test success. Avoid
mandatory AI requests; keep audio opt-in and provide reduced motion.

API grounding: tool/turn/agent/session events provide triggers, Svg/SMIL authored
animation, Buttons/Pane viewer controls, and $.store cosmetic persistence. Detailed
pointer interaction needs a feasibility check: interactive Svg is scriptless;
Client support varies by surface/version.

Source: https://code.claude.com/docs/en/plugins/mods/reference#mods-api-calls
