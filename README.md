# agent-avatars

A [Claude Code mod](https://code.claude.com/docs/en/plugins/mods/overview) that puts a tiny pixel-art world above the prompt. The main agent and every subagent are little robots:

- **Working:** the robot walks around the scene, hops, and shows what it is doing in a speech bubble (`reading…`, `searching…`, `running…`, `writing…`, `browsing…`, `delegating…`).
- **Idle or done:** it stands still, blinks and sleeps (`z z`).
- **Enter and exit:** a new subagent pops in with a bounce; a finished one flickers, floats up and vanishes in a puff of pixels after 15 seconds.
- **Scenery:** grass, flowers, rocks, mushrooms and drifting pixel clouds on a transparent background.

The scene is a single SVG animated with SMIL, so it costs almost nothing: no JavaScript runs per frame and nothing is redrawn while the agents stay in the same state.

## Install

In a terminal Claude Code session:

```
/plugin install agent-avatars --marketplace vanyastaff/agent-avatars
```

Answer `y` to add the marketplace, then pick a scope. The mod is active right away.

## Where it draws

| Surface | What you get |
| --- | --- |
| Desktop app (Code tab) | The animated pixel scene |
| Terminal | A block-character robot per agent, redrawn four times a second |

## How it works

`hooks/register.tsx` hooks `agent.spawn`, `tool.call`, `turn.complete` and `ui.render` (the `AbovePrompt` band). Each agent walks a looping route generated from a seeded random generator, and the animation phase is kept across redraws, so robots do not jump when something else changes.

The mod only reads session events and draws; it does not touch files, run processes or call the network. You can check that yourself:

```
claude plugin validate .
```

## License

MIT
