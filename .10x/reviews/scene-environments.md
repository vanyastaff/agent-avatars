# Scene environments verification

Environment: Windows, Claude Code 2.1.292. Final local source version 0.8.0.

Vertical red/green slices used the user-approved register/event/render seam:
- Home command initially had no stove or interaction; added the first complete
  reachable-object, sustained work and closing-result path. Native test passed.
- The remaining 12 non-workshop/non-home scenes each failed their place/action
  scenario before definitions/artwork were added. They now pass four real tool
  kinds each, at wide size and after a 360px resize, remaining at the object even
  after another 15 seconds.
- A fast command expired while approaching its object. Reproduced publicly;
  separate visual settledAt fixes the postlude without delaying the actual result.

Additional tests verify a printer is static before arrival and during approval,
the original permission result survives, a failed ocean command shows trouble
without machinery motion or a false turn failure, and auto still maps each skin
to its original world. Existing 54 lifecycle/choreography/event tests still pass.

Final native result: 74 pass, 0 fail across 7 files (20 new tests). Strict plugin
validation and git diff --check pass. Impeccable detector returned []. Native
tests do not execute real commands, model operations or permission dialogs.

Generated wide and narrow/light/transparent/quiet contact sheets for all 14
worlds from production SVG functions, and inspected both sheets. One batched
correction placed the actor on the sofa and the camp kettle above its stove;
confirmation sheets inspected. Existing workshop/choreography previews were
regenerated too. Art gallery: docs/previews/worlds.html and worlds-1.png/-2.png.

Limits: previews are static PNGs. Actual Claude band height, live SMIL playback,
and application reduced-motion behavior remain unverified. No standalone tsc,
remote publication or installed-plugin update is claimed for 0.8.0.
