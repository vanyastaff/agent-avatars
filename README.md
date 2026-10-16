# agent-avatars

A [Claude Code mod](https://code.claude.com/docs/en/plugins/mods/overview) that puts a tiny pixel-art world above the prompt. The main agent and every subagent are little pixel characters (robots, cats, dragons, anime kids):

- **Working:** characters plan at the task board, think, write replies, and use books, magnifiers, pencils, tools and machines. In the workshop they walk to a work station and settle there.
- **Idle or done:** it stands still, blinks and sleeps (`z z`).
- **Enter and exit:** a new subagent pops in with a bounce; a finished one flickers, floats up and vanishes in a puff of pixels after 15 seconds.

![An agent appears, works and leaves](docs/spawn-and-leave.gif)
- **Scenery:** a themed little world on a transparent background (or with a sky, if you like), with drifting pixel clouds.

![Robots working at an office](docs/office.gif)

| Anime, sakura scene | Cats at home |
| --- | --- |
| ![Anime characters](docs/sakura-anime.gif) | ![Cats](docs/home-cats.gif) |
| **Dragons in lava land** | **A mixed party in the neon city** |
| ![Dragons](docs/lava-dragons.gif) | ![City](docs/city.gif) |

The scene is a single SVG animated with SMIL, so JavaScript does not compute each animation frame. A 250 ms housekeeping timer expires temporary effects, and every two seconds the mod checks agent statuses and the theme. The desktop scene is invalidated when its state changes; the terminal redraws four times a second.

## Install

In a terminal Claude Code session:

```
/plugin install agent-avatars --marketplace vanyastaff/agent-avatars
```

Answer `y` to add the marketplace, then pick a scope. The mod is active right away.

## Choose your characters and world

Open `/config` and find the mod's rows. After a change the mod reloads by itself.

| Option | Values | Default |
| --- | --- | --- |
| `skin` (Character) | `robot`, `cat`, `dragon`, `anime`, `mixed` (every agent is a different one) | `robot` |
| `scene` (Scene) | `workshop`, `auto` (follows the character), `meadow`, `home`, `lava`, `sakura`, `snow`, `night`, `desert`, `space`, `office`, `beach`, `city`, `ocean`, `halloween` | `workshop` |
| `behavior` (Behavior) | `cozy`, `chaotic`, `adventure` | `cozy` |
| `liveliness` (Liveliness) | `quiet`, `normal`, `lively` | `normal` |
| `sky` (Background) | `transparent`, `filled` (paints a sky behind the scenery) | `transparent` |
| `look` (Light or dark) | `auto` (follows your Claude Code `theme`, and the system when that says auto), `dark`, `light` | `auto` |

Scenes at a glance: `office` has desks with flickering monitors and your agents walk from desk to desk; `beach` has palms, umbrellas and gulls; `city` is a neon skyline at night; `ocean` has seaweed, coral, treasure chests and rising bubbles; `halloween` has pumpkins, tombstones and bats under a big moon.

The original 13 scenes (the animated parts are in the GIFs above):

![All scenes](docs/scenes.png)

### A workshop full of characters

The new default `workshop` has a library, map board, workbench, engine and tea
corner. A tool call sends the agent to the matching station. The actor stops
walking when it gets there and works with an object. Small stages spread the
actors out and keep secondary speech bubbles in tooltips to avoid crowding.

![The workshop with mixed characters](docs/previews/cozy.png)

Personality is independent of skin: even five identical robots have different
accessories and habits. Meticulous carries a pencil and lines up parts; Curious
wears a satchel and investigates a box; Dramatic wears a scarf and makes a show;
Sleepy has a nightcap and yawns; Shy wears a hood and tends a little plant.
Personality and colour stay with the avatar when its activity changes.

`behavior` changes the performance: **cozy** uses books, notebooks and warm cups;
**chaotic** adds upside-down books, magnets, a butterfly net and an enormous
mallet; **adventure** uses scrolls, maps, compasses and lanterns. All skins and
scenes can use all three behaviors. These are cosmetic roles, never instructions
to the real agent.

`liveliness` controls motion and autonomous personality moments. Quiet, normal
and lively offer a short moment every 30, 16 or 8 seconds respectively, with one
actor performing at a time. Waiting, completion, messages and other event
reactions take priority. Quiet reduces decorative motion; the SVG also respects
`prefers-reduced-motion` for actor/prop transforms. Sounds remain opt-in.

### The scene follows the hooks

| Event | Reaction |
| --- | --- |
| `turn.start` | Planning, with a map or task notes |
| `turn.step` | Thinking; switches to writing a reply when text streams |
| `tool.call` | Reading, searching, crafting, running, browsing or dispatching with matching props |
| Tool returns | Returns to thinking; a brief object receipt makes even fast tools visible |
| Tool reports an error | An error marker, without pretending the whole turn failed |
| `tool.check` asks on an active call | Approval wait with a key; the original permission verdict is preserved |
| `command.run` | Checks a small task board |
| Accepted `config.set` | A stage-settings gear; behavior and liveliness update |
| `session.compact` | Bundles a stack of notes |
| `session.send` / `session.receive` | Meetings between known actors / a received envelope |
| `agent.spawn` / `turn.complete` | Arrival / happy, failed or interrupted turn outcome |

Parallel tools retain their own activity: when the newest call finishes, an
older still-running call is shown again. After all tools return, the avatar
thinks instead of showing a stale `reading…` status. Message contents and model
reasoning are not used for the decorative event reactions.

### Names and speech bubbles

| Option | Values | Default |
| --- | --- | --- |
| `names` (Agent names) | `static` (the task text as is), `short` (trimmed to the point, free), `ai` (a small model coins a name) | `static` |
| `thoughts` (Speech bubbles) | `static` (`reading…`, `running…`), `action` (what the agent just did: `read switch.rs`, `$ cargo test`; free), `ai` (a small model sums up the last actions) | `static` |

`short` turns "Implement T9 Switch and NavigationBar" into "T9 Switch…". `ai` calls a small model (Haiku, a few tokens per reply): one request per new agent for the name, and at most one every 12 seconds per working agent for the bubble. Those requests use your Claude usage, which is why `ai` is opt-in. Everything is `static` by default, and nothing calls a model unless you switch it on. The reply is only ever drawn as plain text.

On a light theme the pale things that would vanish (clouds, stars, snow, gulls) switch to a darker blue-grey, so the transparent scenes stay readable on both.

Each agent keeps its own colour (for the anime characters that is the hair colour), so you can tell them apart in any skin.

## Moods and sounds

Agents react to how things end, without reading tool calls or prompts:

- `✓ done`: the turn ended normally, the character hops happily (`^ ^` eyes).
- `! failed`: the turn ended with an error or a refusal, the character shakes (`x x` eyes).
- `stopped`: the turn was interrupted.
- `? your turn`: Claude is asking you a question (the main character waits while the dialog is open).
- `? waiting`: a subagent is blocked on approval or on something it started.

The main character's mood clears after a few seconds; a subagent keeps it until it leaves the scene.

![Waiting, done, stopped, your turn, failed](docs/moods.gif)

### Agents talking to each other

When an agent sends a message to another agent (SendMessage), the two walk up to each other, take turns "typing" (blinking dots), each shows a feeling (a heart, a `!` or a note), and they walk back to what they were doing. ![Two agents meeting](docs/talk.gif)

Only who writes to whom is read, never the text. The main agent is addressed as `main`, others by the name their Agent call gave them or by agent id.

### Pull requests and CI

If your session receives GitHub events (for example while it watches a pull request), the scene reacts without writing anything: a merged pull request sets off fireworks and confetti and every character cheers; a failed CI run makes them sad. Only the event's kind and outcome are read. Switch it off with `events: off`.

![A merged pull request](docs/pr-merged.gif)

Short 8-bit blips can play when an agent appears, finishes, fails or asks you something. They are off by default (`sound`: `off` / `on`). The engine plays them through `afplay`, so they work on macOS only; on Windows and Linux the option does nothing.

## Troubleshooting

Run `/avatars` to see which agents the scene is drawing next to the agents the session itself reports. If an agent is in the second list but not the first, please open an issue with that output.

## Where it draws

| Surface | What you get |
| --- | --- |
| Desktop app (Code tab) | The animated pixel scene |
| Terminal | A block-character robot per agent, redrawn four times a second |

## How it works

`hooks/register.tsx` observes turn, tool, command, configuration and session
events and draws the `AbovePrompt` band. `hooks/theater.ts` contains pure
personality, object and workshop artwork. Workshop routes approach a station
once; other scenes keep their seeded looping walks. Animation phase is kept
across redraws. Hooks pass original events, streams and results through.

The mod observes session events and draws; it does not read or write project files or start processes itself. The optional `ai` modes ask the host to call Haiku using your Claude usage, and optional sounds ask the host to play bundled audio. Both are off by default. Inspect the registered hooks and host API calls with:

```
claude plugin validate .
```

## Development and tests

Run the regression tests with Claude Code's built-in mod test runner (verified
with Claude Code 2.1.292):

```
claude plugin test .
claude plugin validate --strict .
```

No Node.js packages, sign-in, or model requests are needed. Tests load the real
hooks through `register`, stub host APIs, and advance a controlled host clock.
They check agent retirement and resumption, main-agent activity, SVG text escaping,
AI opt-in and throttling, and tool execution when the observer's host API fails.
Desktop and VS Code SVG output and terminal elements are checked through the
[native test kit](https://code.claude.com/docs/en/plugins/mods/test); application
painting and SMIL playback still need a real session.

For a visual gallery generated from the production SVG functions, run
`node scripts/preview.mjs` with Node 24. It writes `docs/previews/index.html` and
the three behavior SVGs; open the HTML in a browser to inspect SMIL playback.
The bundled Sharp package can optionally generate PNGs with `--png` when
`CODEX_WORKSPACE_NODE_MODULES` points to the bundled Node packages directory.

## License

MIT
