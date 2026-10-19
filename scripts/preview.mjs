// Render the production SVG functions without starting a model session.
// Node 24's built-in TypeScript stripping is sufficient; no packages are needed.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { createServer } from 'node:http'

const root = resolve(import.meta.dirname, '..')
const source = await readFile(resolve(root, 'hooks/register.tsx'), 'utf8')
const boundary = source.indexOf('export const register:')
if (boundary < 0) throw new Error('Cannot find the hooks/renderer boundary')
const prefix = stripTypeScriptTypes(source.slice(0, boundary), { mode: 'strip' })
  .replaceAll("'./theater.ts'", JSON.stringify(pathToFileURL(resolve(root, 'hooks/theater.ts')).href))
  .replaceAll("'./worlds.ts'", JSON.stringify(pathToFileURL(resolve(root, 'hooks/worlds.ts')).href))
  .replaceAll("'./life.ts'", JSON.stringify(pathToFileURL(resolve(root, 'hooks/life.ts')).href))
  .replaceAll("'./looks.ts'", JSON.stringify(pathToFileURL(resolve(root, 'hooks/looks.ts')).href))
const fixture = `
export function preview(width, behavior, look, filled, mixed = false, beatAge = null, duetKind = null, duetAge = 1500, quiet = false, world = 'workshop', moods = false, reactions = false) {
  W = width; H = 156; GY = 142; THEME = world; SKY = filled;
  BEHAVIOR = behavior; LIVELINESS = quiet ? 'quiet' : 'normal'; LOOK = look;
  const now = 120000;
  const cast = ['read', 'search', 'craft', 'run', 'plan'].map((kind, i) => {
    const episode = episodeFor(PERSONALITIES[i], i === 1 ? 1 : 0, now - 4000);
    const a = { id: i ? 'worker-' + i : 'main', name: ['Pip', 'Mochi', 'Ember', 'Nox', 'Fern'][i],
      skin: mixed ? SKIN_IDS[i % SKIN_IDS.length] : 'robot', personality: PERSONALITIES[i],
      color: COLORS[i], isWorking: hasLife(world) || i < 4, waiting: false, permissionTokens: new Set(), cue: null,
      workKind: kind, stationKind: hasLife(world) ? episodeKind(episode) : kind, episode, phase: 'tool', actionSequence: 0, tool: ['Read','Grep','Edit','Bash',''][i],
      choreography: beatAge === null ? null : { kind, variant: 0, at: now - (beatAge < 0 ? 6000 : beatAge), ...(beatAge < 0 ? { endedAt: now + beatAge } : {}) },
      action: '', thought: '', mood: '', talk: null, spawnAt: 0, leaveAt: 0,
      restX: hasLife(world) || i < 4 ? scenePlace(world, kind, W, i + 1, episode).actorX : width - 40, seed: i + 1,
      pathStart: now - 12000, segs: [], total: 0, flourishAt: i === 4 ? now - 400 : null };
    makePath(a);
    return a;
  });
  if (duetKind) {
    for (let i = 0; i < 2; i++) {
      const a = cast[i];
      a.tool = ''; a.phase = 'thinking'; a.workKind = 'think';
      if (duetKind === 'finished' || duetKind === 'trouble' && i === 1) a.isWorking = false;
      if (duetKind === 'finished' && i === 0) a.mood = 'happy';
      a.talk = { at: now - duetAge, x0: width * (i ? .68 : .32), stand: width / 2 + (i ? 32 : -32), toward: i ? -1 : 1, role: i ? 'recv' : 'send', peer: cast[1 - i].id, kind: duetKind };
      a.flourishAt = null;
    }
  }
  TIRED = reactions ? 2 : 0;
  if (reactions) {
    Object.assign(cast[0], { noticedAt: now - 300 });
    Object.assign(cast[1], { longRun: true });
    Object.assign(cast[2], { thanksAt: now - 500, isWorking: false });
    Object.assign(cast[4], { isWorking: false });
  }
  if (moods) {
    Object.assign(cast[0], { isWorking: false, mood: 'happy' });
    Object.assign(cast[1], { isWorking: false, mood: 'sad' });
    Object.assign(cast[2], { isWorking: false, waiting: true });
    Object.assign(cast[3], { phase: 'thinking', tool: '' });
  }
  return sceneSvg(duetKind ? cast.slice(0, 2) : cast, now);
}
export function crowd(width) {
  W = width; H = 156; GY = 142; THEME = 'workshop'; SKY = false; BEHAVIOR = 'cozy'; LIVELINESS = 'normal'; LOOK = 'dark'; TIRED = 0;
  const now = 120000;
  const kinds = ['craft', 'craft', 'craft', 'run', 'run', 'think'];
  const cast = [];
  CAST = () => cast;
  kinds.forEach((kind, i) => {
    const p = PERSONALITIES[i % PERSONALITIES.length];
    const a = { id: i ? 'w' + i : 'main', name: 'Implement T' + (19 + i) + ' anchors', skin: 'robot', personality: p, color: COLORS[i % COLORS.length],
      isWorking: true, waiting: false, permissionTokens: new Set(), cue: null, workKind: kind, stationKind: kind, episode: episodeFor(p, 0, now - 4000),
      phase: kind === 'think' ? 'thinking' : 'tool', actionSequence: 0, tool: kind === 'craft' ? 'Edit' : kind === 'run' ? 'Bash' : '', choreography: null,
      action: '', thought: '', mood: '', talk: null, spawnAt: 0, leaveAt: 0, restX: 60 + i * 110, seed: i + 1, lane: 0, laneAt: '',
      noticedAt: 0, thanksAt: 0, longRun: false, pathStart: now - 12000, segs: [], total: 0, flourishAt: null, activeTools: new Map() };
    cast.push(a);
    makePath(a);
  });
  return sceneSvg(cast, now);
}
`
const { preview, crowd } = await import(`data:text/javascript;base64,${Buffer.from(prefix + fixture).toString('base64')}`)
const out = resolve(root, 'docs/previews')
await mkdir(out, { recursive: true })
const worldNames = ['workshop','meadow','home','lava','sakura','snow','night','desert','space','office','beach','city','ocean','halloween']
const worldPanels = worldNames.map(world => [world, preview(751, 'cozy', 'dark', true, true, 4000, null, 1500, false, world), preview(360, 'adventure', 'light', false, true, 4000, null, 1500, true, world)])
await writeFile(resolve(out, 'worlds.html'), `<!doctype html><meta charset="utf-8"><title>Agent environments</title><style>body{margin:24px;background:#22272d;color:#d9dbc9;font:14px system-ui}section{max-width:1150px;margin:24px auto}h2{font-size:16px}article{display:flex;gap:12px;align-items:start}svg{max-width:100%;height:auto}.narrow{background:#f0eee5}@media(max-width:800px){article{display:block}}</style>${worldPanels.map(([name, wide, narrow]) => `<section><h2>${name}</h2><article>${wide}<div class="narrow">${narrow}</div></article></section>`).join('')}`)
const storyPanels = [
  ['Getting the tools', preview(751, 'cozy', 'dark', true, true, 300)],
  ['Focusing on the object', preview(751, 'cozy', 'dark', true, true, 1500)],
  ['Sustained work', preview(751, 'chaotic', 'dark', true, true, 3500)],
  ['After the tool returns', preview(751, 'adventure', 'dark', true, true, -1500)],
  ['Welcome kit', preview(751, 'cozy', 'dark', true, true, null, 'welcome')],
  ['Message handoff', preview(751, 'adventure', 'dark', true, true, null, 'message')],
  ['Tool trouble', preview(751, 'chaotic', 'dark', true, true, null, 'trouble', 2600)],
  ['A finished task', preview(751, 'cozy', 'dark', true, true, null, 'finished', 2600)],
  ['Moods: done, failed, waiting, thinking', preview(751, 'cozy', 'dark', true, false, null, null, 1500, false, 'night', true)],
  ['Session reactions: prompt, tea, thanks, tired', preview(751, 'cozy', 'dark', true, false, null, null, 1500, false, 'workshop', false, true)],
  ['Session reactions in the meadow', preview(751, 'cozy', 'dark', true, true, null, null, 1500, false, 'meadow', false, true)],
  ['Six at work: three editing, two running, one thinking', crowd(751)],
  ['Moods in the meadow', preview(751, 'cozy', 'dark', true, true, null, null, 1500, false, 'meadow', true)],
  ['Narrow, light, quiet handoff', preview(360, 'cozy', 'light', false, true, null, 'message', 2600, true)],
]
const storyHtml = `<!doctype html><meta charset="utf-8"><title>Agent choreography</title><style>body{margin:24px;background:#22272d;color:#d9dbc9;font:14px system-ui}section{max-width:751px;margin:24px auto}h2{font-size:16px}svg{max-width:100%;height:auto}section:last-child{background:#f0eee5;color:#4b554f;padding:16px}</style>${storyPanels.map(([title, svg]) => `<section><h2>${title}</h2>${svg}</section>`).join('')}`
await writeFile(resolve(out, 'choreography.html'), storyHtml)
const panels = []
for (const behavior of ['cozy', 'chaotic', 'adventure']) {
  const svg = preview(751, behavior, 'dark', true, true)
  await writeFile(resolve(out, `${behavior}.svg`), svg)
  panels.push(`<section><h2>${behavior}</h2>${svg}</section>`)
}
panels.push(`<section class="light"><h2>Light · transparent · 360 px</h2>${preview(360, 'cozy', 'light', false)}</section>`)
panels.push(`<section><h2>Dark · transparent · 751 px</h2>${preview(751, 'adventure', 'dark', false)}</section>`)
const html = `<!doctype html><meta charset="utf-8"><title>Agent workshop — production SVG preview</title><style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#171b20;color:#d9dbc9;font:14px system-ui}main{max-width:840px;margin:auto}h1{font-size:22px;margin:0 0 8px}p{color:#aab5b1;margin:0 0 22px}section{background:#22272d;padding:16px;margin:0 0 18px;border-radius:8px}h2{font-size:12px;letter-spacing:.08em;margin:0 0 12px;text-transform:uppercase;color:inherit}svg{max-width:100%;height:auto;display:block}.light{background:#f0eee5;color:#4b554f}
</style><main><h1>Agent workshop</h1><p>Production scene renderer · three behavior presets · five personalities</p>${panels.join('')}</main>`
await writeFile(resolve(out, 'index.html'), html)
console.log(`Preview: ${resolve(out, 'index.html')}`)
if (process.argv.includes('--png')) {
  const { createRequire } = await import('node:module')
  const runtime = process.env.CODEX_WORKSPACE_NODE_MODULES
  if (!runtime) throw new Error('Set CODEX_WORKSPACE_NODE_MODULES to the bundled Node packages directory')
  const sharp = createRequire(resolve(runtime, '../package.json'))('sharp')
  for (let group = 0; group < 2; group++) {
    const groupPanels = worldPanels.slice(group * 7, group * 7 + 7)
    const images = await Promise.all(groupPanels.flatMap(([, wide, narrow], i) => [
      (async () => ({ input: await sharp(Buffer.from(wide)).png().toBuffer(), left: 0, top: i * 172 }))(),
      (async () => ({ input: await sharp(Buffer.from(narrow)).flatten({ background: '#f0eee5' }).png().toBuffer(), left: 763, top: i * 172 }))(),
    ]))
    await sharp({ create: { width: 1123, height: groupPanels.length * 172, channels: 4, background: '#22272d' } }).composite(images).png().toFile(resolve(out, `worlds-${group + 1}.png`))
  }
  const panels = await Promise.all(storyPanels.map(async ([, svg], i) => ({ input: await sharp(Buffer.from(svg)).flatten({ background: i === storyPanels.length - 1 ? '#f0eee5' : '#22272d' }).png().toBuffer(), left: 0, top: i * 172 })))
  await sharp({ create: { width: 751, height: storyPanels.length * 172, channels: 4, background: '#22272d' } }).composite(panels).png().toFile(resolve(out, 'choreography.png'))
  await sharp(Buffer.from(storyPanels[5][1])).png().toFile(resolve(out, 'handoff.png'))
  for (const behavior of ['cozy', 'chaotic', 'adventure']) {
    await sharp(Buffer.from(preview(751, behavior, 'dark', true, true))).resize(1502, 312).png().toFile(resolve(out, `${behavior}.png`))
  }
  await sharp(Buffer.from(preview(360, 'cozy', 'light', false))).flatten({ background: '#f0eee5' }).resize(720, 312).png().toFile(resolve(out, 'narrow.png'))
}
if (process.argv.includes('--serve')) {
  createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(req.url === '/choreography' ? storyHtml : req.url === '/worlds' ? worldPanels.map(([name, wide]) => `<h2>${name}</h2>${wide}`).join('') : html)
  }).listen(8941, '127.0.0.1', () => console.log('http://127.0.0.1:8941'))
}
