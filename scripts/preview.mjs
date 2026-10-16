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
const fixture = `
export function preview(width, behavior, look, filled, mixed = false) {
  W = width; H = 156; GY = 142; THEME = 'workshop'; SKY = filled;
  BEHAVIOR = behavior; LIVELINESS = 'normal'; LOOK = look;
  const now = 120000;
  const cast = ['read', 'search', 'craft', 'run', 'plan'].map((kind, i) => {
    const a = { id: i ? 'worker-' + i : 'main', name: ['Pip', 'Mochi', 'Ember', 'Nox', 'Fern'][i],
      skin: mixed ? SKIN_IDS[i % SKIN_IDS.length] : 'robot', personality: PERSONALITIES[i],
      color: COLORS[i], isWorking: i < 4, waiting: false, permissionTokens: new Set(), cue: null,
      workKind: kind, phase: 'tool', actionSequence: 0, tool: ['Read','Grep','Edit','Bash',''][i],
      action: '', thought: '', mood: '', talk: null, spawnAt: 0, leaveAt: 0,
      restX: i < 4 ? workStation(kind, W, i + 1).x : workStation('rest', W, i + 1).x, seed: i + 1,
      epoch: 1, pathStart: now - 12000, segs: [], total: 0, flourishAt: i === 4 ? now - 400 : null };
    makePath(a);
    return a;
  });
  return sceneSvg(cast, now);
}
`
const { preview } = await import(`data:text/javascript;base64,${Buffer.from(prefix + fixture).toString('base64')}`)
const out = resolve(root, 'docs/previews')
await mkdir(out, { recursive: true })
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
  for (const behavior of ['cozy', 'chaotic', 'adventure']) {
    await sharp(Buffer.from(preview(751, behavior, 'dark', true, true))).resize(1502, 312).png().toFile(resolve(out, `${behavior}.png`))
  }
  await sharp(Buffer.from(preview(360, 'cozy', 'light', false))).flatten({ background: '#f0eee5' }).resize(720, 312).png().toFile(resolve(out, 'narrow.png'))
}
if (process.argv.includes('--serve')) {
  createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html)
  }).listen(8941, '127.0.0.1', () => console.log('http://127.0.0.1:8941'))
}
