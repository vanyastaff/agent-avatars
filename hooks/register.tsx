import type { Register } from 'claude-code'

type AgentRow = { id: string; description: string; type: string; status: string }

type Seg = { t0: number; t1: number; from: number; to: number }

type Avatar = {
  id: string
  name: string
  color: string
  skin: string
  isWorking: boolean
  tool: string
  doneAt: number
  spawnAt: number
  leaveAt: number
  // where the robot stands when idle, and the walk it is on while working
  restX: number
  seed: number
  epoch: number
  pathStart: number
  segs: Seg[]
  total: number
}

const COLORS = ['#ff8a1f', '#37c871', '#b45cff', '#2fa8ff', '#ffd23f', '#ff5c7a', '#e6e6e6']
const LINGER_MS = 15000
const EXIT_MS = 1400
const ENTER_MS = 700
const FRAME_MS = 250
const EYE = '#2b2b2b'
const B = '█'

// Scene geometry (SVG user units, drawn 1:1)
let W = 760
const H = 100
const GY = 86
const PAUSE = 1.8
const SPEED = 40

const rng = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A looping walk: stand still at a point (PAUSE s), walk to the next, and so on.
const makePath = (a: Avatar) => {
  const r = rng(a.seed * 7919 + a.epoch * 104729)
  const spots = THEMES[THEME]?.anchors?.() ?? []
  const next = () => (spots.length ? (spots[Math.floor(r() * spots.length)] as number) : 40 + r() * (W - 80))
  const pts = [Math.min(a.restX, W - 40), ...Array.from({ length: 4 }, next)]
  const segs: Seg[] = []
  let t = 0
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length] ?? p
    const walk = Math.max(1.2, Math.abs(q - p) / SPEED)
    segs.push({ t0: t, t1: t + PAUSE, from: p, to: p })
    segs.push({ t0: t + PAUSE, t1: t + PAUSE + walk, from: p, to: q })
    t += PAUSE + walk
  })
  a.segs = segs
  a.total = t
}

const posAt = (a: Avatar, sec: number) => {
  const t = a.total > 0 ? sec % a.total : 0
  for (const s of a.segs) {
    if (t >= s.t0 && t < s.t1) return s.t1 === s.t0 ? s.to : s.from + ((s.to - s.from) * (t - s.t0)) / (s.t1 - s.t0)
  }
  return a.restX
}

const startWork = (a: Avatar, now: number) => {
  a.leaveAt = 0
  if (a.isWorking) return
  a.isWorking = true
  a.epoch += 1
  a.pathStart = now
  makePath(a)
}

const stopWork = (a: Avatar, now: number) => {
  if (!a.isWorking) return
  a.restX = posAt(a, (now - a.pathStart) / 1000)
  a.isWorking = false
  a.tool = ''
  a.doneAt = now
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const activity = (tool: string) => {
  if (!tool) return 'working…'
  if (/^(Read|NotebookRead)$/.test(tool)) return 'reading…'
  if (/^(Grep|Glob|ToolSearch)$/.test(tool)) return 'searching…'
  if (/^(Bash|PowerShell|Monitor)$/.test(tool)) return 'running…'
  if (/^(Edit|Write|NotebookEdit)$/.test(tool)) return 'writing…'
  if (/^(WebFetch|WebSearch)$/.test(tool)) return 'browsing…'
  if (/^(Agent|Task|Workflow)$/.test(tool)) return 'delegating…'
  return tool.slice(0, 14) + '…'
}

// ---- Desktop: one SVG scene, animated by SMIL ------------------------------

const U = 3 // one "pixel" of the robot, in scene units
const MONO = "ui-monospace,Consolas,'Courier New',monospace"

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
  return '#' + ((1 << 24) | (ch((n >> 16) & 255) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).slice(1)
}

// Pixel map -> merged horizontal runs of <rect>; `oy` shifts it down by rows.
const pixels = (rows: string[], colors: Record<string, string>, oy = 0) => {
  let out = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x] as string
      if (c === '.' || !colors[c]) {
        x += 1
        continue
      }
      let n = 1
      while (row[x + n] === c) n += 1
      out += `<rect x="${x * U}" y="${(y + oy) * U}" width="${n * U}" height="${U}" fill="${colors[c]}"/>`
      x += n
    }
  })
  return out
}

// Frame-by-frame movement, like a sprite sheet.
const steps = (values: string, dur: string, extra = '') =>
  `<animateTransform attributeName="transform" type="translate" values="${values}" dur="${dur}" calcMode="discrete" repeatCount="indefinite" ${extra}/>`

type Skin = {
  title: string
  body: string[] // 7 rows
  eyesIdle: string[]
  eyesWork: string[]
  eyeOy: number
  legsStill: string[]
  legsA: string[]
  legsB: string[]
  palette: (color: string) => Record<string, string>
}

// Four-legged shapes shared by the robot, the cat and the dragon.
const LEGS_STILL = ['..DD.DD.DD.DD.', '..DD.DD.DD.DD.', '..DD.DD.DD.DD.']
const LEGS_A = ['..DD......DD..', '..DD......DD..', '..DD......DD..']
const LEGS_B = ['....DD..DD....', '....DD..DD....', '....DD..DD....']

// Every sprite is 14 columns wide: 7 body rows over 3 rows of legs, feet on row 10.
const SKINS: Record<string, Skin> = {
  robot: {
    title: 'Robot',
    body: [
      '..LLLLLLLLLL..',
      '..XXXXXXXXXX..',
      '..XXXXXXXXXX..',
      'XXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXX',
      '..XXXXXXXXXX..',
      '..DDDDDDDDDD..',
    ],
    eyesIdle: ['....E....E....', '....E....E....', '....E....E....'],
    eyesWork: ['...E......E...', '....E....E....', '...E......E...'],
    eyeOy: 1,
    legsStill: LEGS_STILL,
    legsA: LEGS_A,
    legsB: LEGS_B,
    palette: c => ({ X: c, L: shade(c, 1.25), D: shade(c, 0.72), E: EYE }),
  },
  cat: {
    title: 'Cat',
    body: [
      '..XL......LX..',
      '..XXX....XXX..',
      '..XXXXXXXXXX..',
      '..XXXXXXXXXX.X',
      '..XXXXPPXXXX.X',
      '..DDDDDDDDDDXX',
      '..DDDDDDDDDD..',
    ],
    eyesIdle: ['....E....E....', '....E....E....'],
    eyesWork: ['...E......E...', '....E....E....', '...E......E...'],
    eyeOy: 2,
    legsStill: LEGS_STILL,
    legsA: LEGS_A,
    legsB: LEGS_B,
    palette: c => ({ X: c, L: shade(c, 1.3), D: shade(c, 0.78), P: '#ff9ab0', E: EYE }),
  },
  dragon: {
    title: 'Dragon',
    body: [
      '.LX........XL.',
      '..XXXXXXXXXX..',
      '..XXXXXXXXXX..',
      '..XXXLLLLXXX..',
      'DDXXXLDDLXXXDD',
      'DDXXXXXXXXXXDD',
      '..DDDDDDDDDD..',
    ],
    eyesIdle: ['....E....E....', '....E....E....'],
    eyesWork: ['...E......E...', '....E....E....'],
    eyeOy: 1,
    legsStill: LEGS_STILL,
    legsA: LEGS_A,
    legsB: LEGS_B,
    palette: c => ({ X: c, L: shade(c, 1.4), D: shade(c, 0.58), E: EYE }),
  },
  anime: {
    title: 'Anime',
    body: [
      '..XXXXXXXXXX..',
      '.XXXXXXXXXXXX.',
      '.XXSSSSSSSSXX.',
      '.XXSSSSSSSSXX.',
      '.XXSSSSSSSSXX.',
      '.XXSPSSSSPSXX.',
      '..XUWWRRWWUX..',
    ],
    eyesIdle: ['....WE..WE....', '....EE..EE....'],
    eyesWork: ['....EE..EE....', '...E..E.E..E..'],
    eyeOy: 3,
    legsStill: ['...UU....UU...', '...SS....SS...', '...SS....SS...'],
    legsA: ['...UU.........', '...SS.........', '...SS.........'],
    legsB: ['.........UU...', '.........SS...', '.........SS...'],
    palette: c => ({ X: c, S: '#ffd9b8', P: '#ff9aa8', U: '#4a63c9', W: '#ffffff', R: '#e03a4e', E: EYE, D: shade(c, 0.7), L: shade(c, 1.2) }),
  },
}
const SKIN_IDS = Object.keys(SKINS)

const robotBody = (skin: Skin, color: string, isWorking: boolean) => {
  const c = skin.palette(color)
  const eyes = isWorking
    ? pixels(skin.eyesWork, c, skin.eyeOy)
    : `<g><animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 0.15;1 1" keyTimes="0;0.9;0.94;1" dur="4s" repeatCount="indefinite"/>${pixels(skin.eyesIdle, c, skin.eyeOy)}</g>`
  const legs = isWorking
    ? `<g>${steps('0 0;0 -3', '0.4s')}${pixels(skin.legsA, c)}</g><g>${steps('0 -3;0 0', '0.4s')}${pixels(skin.legsB, c)}</g>`
    : pixels(skin.legsStill, c)
  const hop = isWorking ? steps('0 0;0 -3', '0.4s') : steps('0 0;0 -3;0 0', '2.4s', 'keyTimes="0;0.5;0.56"')
  const spark = isWorking
    ? `<g transform="translate(${5 * U} ${-3 * U})" fill="#ffd23f"><rect x="${U}" y="0" width="${U}" height="${3 * U}"/><rect x="0" y="${U}" width="${3 * U}" height="${U}"/><animate attributeName="opacity" values="1;0" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></g>`
    : ''
  return `<g shape-rendering="crispEdges"><g>${hop}<g transform="translate(0 ${7 * U})">${legs}</g>${pixels(skin.body, c)}${eyes}${spark}</g></g>`
}

const tagSvg = (a: Avatar) => {
  const name = a.name.length > 18 ? a.name.slice(0, 17) + '…' : a.name
  const w = name.length * 5.6 + 10
  const top = GY - 10 * U - 20
  let s = `<g shape-rendering="crispEdges"><rect x="${-w / 2}" y="${top}" width="${w}" height="12" fill="#000" opacity="0.75"/><rect x="${-w / 2}" y="${top}" width="${w}" height="2" fill="${a.color}"/></g>
<text x="0" y="${top + 10}" text-anchor="middle" font-family="${MONO}" font-weight="bold" font-size="9" fill="#fff">${esc(name)}</text>`
  if (a.isWorking) {
    const label = activity(a.tool)
    const bw = label.length * 5.4 + 10
    const by = top - 15
    s += `<g shape-rendering="crispEdges"><rect x="${-bw / 2}" y="${by}" width="${bw}" height="12" fill="#fff" stroke="#222" stroke-width="1"/><rect x="-2" y="${by + 12}" width="4" height="3" fill="#fff"/></g>
<text x="0" y="${by + 9}" text-anchor="middle" font-family="${MONO}" font-size="9" fill="#222">${esc(label)}</text>`
  } else {
    const zy = GY - 10 * U - 4
    s += `<text x="${8 * U}" y="${zy}" font-family="${MONO}" font-weight="bold" font-size="10" fill="#999">z<animate attributeName="y" values="${zy};${zy - 12}" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="2.4s" repeatCount="indefinite"/></text>
<text x="${9 * U + 8}" y="${zy - 6}" font-family="${MONO}" font-weight="bold" font-size="8" fill="#999">z<animate attributeName="y" values="${zy - 6};${zy - 18}" dur="2.4s" begin="0.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0" dur="2.4s" begin="0.8s" repeatCount="indefinite"/></text>`
  }
  return s
}

// Pop in with a bounce, and leave with a flicker, a float upwards and a puff of pixels.
const withEffects = (a: Avatar, body: string, now: number) => {
  const feet = `translate(0 ${GY})`
  if (a.leaveAt) {
    const t = ((now - a.leaveAt) / 1000).toFixed(2)
    const d = EXIT_MS / 1000
    const flicker = `<animate attributeName="opacity" values="1;0;1;0;1;0;0" keyTimes="0;0.15;0.3;0.45;0.6;0.75;1" dur="${d}s" begin="-${t}s" fill="freeze" calcMode="discrete"/>`
    const rise = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -14" dur="${d}s" begin="-${t}s" fill="freeze"/>`
    const puff = [-24, -8, 8, 24]
      .map((dx, i) => `<rect x="${dx}" y="${GY - 12}" width="${U}" height="${U}" fill="#aaa" opacity="0"><animate attributeName="opacity" values="0;0.9;0" dur="${d}s" begin="-${t}s" fill="freeze"/><animateTransform attributeName="transform" type="translate" values="0 0;${dx * 0.8} ${i % 2 ? -22 : -34}" dur="${d}s" begin="-${t}s" fill="freeze"/></rect>`)
      .join('')
    return `<g>${flicker}<g>${rise}${body}</g>${puff}</g>`
  }
  const age = now - a.spawnAt
  if (a.spawnAt && age < ENTER_MS) {
    const t = (age / 1000).toFixed(2)
    const pop = `<animateTransform attributeName="transform" type="scale" values="0 0;1.25 1.25;0.9 0.9;1 1" keyTimes="0;0.5;0.8;1" dur="${ENTER_MS / 1000}s" begin="-${t}s" fill="freeze"/>`
    return `<g transform="${feet}"><g>${pop}<g transform="translate(0 ${-GY})">${body}</g></g></g>`
  }
  return body
}

const agentSvg = (a: Avatar, now: number) => {
  const inner = `<rect x="${-7 * U}" y="${GY}" width="${14 * U}" height="${U}" fill="#888" opacity="0.4" shape-rendering="crispEdges"/>
<g transform="translate(${-7 * U} ${GY - 10 * U})">${robotBody(SKINS[a.skin] ?? SKINS['robot']!, a.color, a.isWorking)}</g>
${tagSvg(a)}`
  if (!a.isWorking) return `<g transform="translate(${Math.round(a.restX)} 0)">${withEffects(a, inner, now)}</g>`

  const sec = ((now - a.pathStart) / 1000) % a.total
  const values: string[] = []
  const times: string[] = []
  a.segs.forEach((s, i) => {
    if (i === 0) {
      values.push(`${s.from.toFixed(1)} 0`)
      times.push('0')
    }
    values.push(`${s.to.toFixed(1)} 0`)
    times.push((s.t1 / a.total).toFixed(4))
  })
  const walk = `<animateTransform attributeName="transform" type="translate" values="${values.join(';')}" keyTimes="${times.join(';')}" dur="${a.total.toFixed(2)}s" begin="-${sec.toFixed(2)}s" repeatCount="indefinite"/>`
  return `<g>${walk}${withEffects(a, inner, now)}</g>`
}

// Scenery follows the chosen skin (a mixed party gets the plain meadow).
type Theme = {
  sky: [string, string]
  ground: [string, string]
  cloud: string
  decor: (r: () => number, x: number) => string
  extra?: (now: number) => string
  // a fixed arrangement drawn instead of random decor, and the spots agents like to walk to
  layout?: (now: number) => string
  anchors?: () => number[]
  noClouds?: boolean
}

const rect = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`

const tuft = (x: number, c1: string, c2: string) =>
  rect(x, GY - U, U, 2 * U, c1) + rect(x + U, GY - 2 * U, U, 3 * U, c2) + rect(x + 2 * U, GY - U, U, 2 * U, c1)

const rock = (x: number, c1: string, c2: string) => rect(x, GY - U, 4 * U, 2 * U, c1) + rect(x + U, GY - 2 * U, 2 * U, U, c2)

const flower = (x: number, petal: string) =>
  rect(x + U, GY - 2 * U, U, 3 * U, '#4a8a3c') + rect(x, GY - 3 * U, 3 * U, U, petal) + rect(x + U, GY - 4 * U, U, U, petal) + rect(x + U, GY - 3 * U, U, U, '#fff6c8')

const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)] as T

const disc = (cx: number, cy: number, rad: number, fill: string) => {
  let o = ''
  for (let y = -rad; y <= rad; y++) {
    const hw = Math.floor(Math.sqrt(rad * rad - y * y))
    o += rect(cx - hw * U, cy + y * U, (2 * hw + 1) * U, U, fill)
  }
  return o
}

const stars = (now: number, n: number, seed: number, maxY: number) => {
  const r = rng(seed)
  let s = ''
  for (let i = 0; i < n; i++) {
    const x = Math.round(r() * W)
    const y = Math.round(2 + r() * maxY)
    const dur = 2 + r() * 3
    const ph = ((now / 1000 + r() * 10) % dur).toFixed(1)
    s += `<rect x="${x}" y="${y}" width="2" height="2" fill="#ffffff" opacity="0.8"><animate attributeName="opacity" values="0.9;0.25;0.9" dur="${dur.toFixed(1)}s" begin="-${ph}s" repeatCount="indefinite"/></rect>`
  }
  return s
}

const officeDesks = () => {
  const xs: number[] = []
  for (let x = 60; x < W - 130; x += 130) xs.push(x)
  return xs
}

const THEMES: Record<string, Theme> = {
  meadow: {
    sky: ['#6fb1e6', '#d8f0fb'],
    ground: ['#5a7d4a', '#3a4f33'],
    cloud: '#9fb4c8',
    decor: (r, x) => {
      const k = r()
      if (k < 0.5) return tuft(x, '#5f9d4a', '#4a8a3c')
      if (k < 0.68) return flower(x, pick(r, ['#ff6fa5', '#ffd23f', '#7fd4ff']))
      if (k < 0.84) return rock(x, '#7d7f86', '#9a9ca4')
      return rect(x + U, GY - U, U, 2 * U, '#f1e6d2') + rect(x, GY - 2 * U, 3 * U, U, '#d9463a') + rect(x + U, GY - 2 * U, U, U, '#fff')
    },
  },
  home: {
    sky: ['#e8c9a0', '#f8ecd8'],
    ground: ['#a07850', '#6e5236'],
    cloud: '#c9b8a6',
    decor: (r, x) => {
      const k = r()
      if (k < 0.4) return tuft(x, '#7fb36a', '#5f9d4a')
      if (k < 0.7) {
        // ball of yarn with a loose thread
        const c = pick(r, ['#ff6fa5', '#7fd4ff', '#b45cff', '#ffd23f'])
        return rect(x, GY - 3 * U, 3 * U, 3 * U, c) + rect(x + U, GY - 3 * U, U, U, '#fff') + rect(x + 3 * U, GY - U, 2 * U, U, c)
      }
      if (k < 0.85) {
        // fish skeleton
        return rect(x, GY - U, 5 * U, U, '#e8e8e8') + rect(x + U, GY - 2 * U, U, U, '#e8e8e8') + rect(x + 3 * U, GY - 2 * U, U, U, '#e8e8e8') + rect(x - U, GY - 2 * U, U, 2 * U, '#e8e8e8')
      }
      return rock(x, '#8a7a68', '#a89886')
    },
  },
  lava: {
    sky: ['#2a0f12', '#8a2c12'],
    ground: ['#6b3a2a', '#3a1f1a'],
    cloud: '#6e5f66',
    decor: (r, x) => {
      const k = r()
      if (k < 0.45) return rock(x, '#4a3a3a', '#6a5656')
      if (k < 0.8) {
        // a little flame that flickers
        return (
          rect(x, GY - U, 3 * U, U, '#d9461a') +
          rect(x, GY - 2 * U, 2 * U, U, '#ff8a1f') +
          `<rect x="${x + U}" y="${GY - 3 * U}" width="${U}" height="${U}" fill="#ffd23f"><animate attributeName="opacity" values="1;0;1;1" dur="0.7s" calcMode="discrete" repeatCount="indefinite"/></rect>`
        )
      }
      return rect(x, GY - 2 * U, 3 * U, 2 * U, '#d8d2c4') + rect(x + U, GY - U, U, U, '#2b2b2b') // a skull
    },
    extra: now => {
      const r = rng(77)
      let s = ''
      for (let i = 0; i < 9; i++) {
        const x = Math.round((r() * W) / U) * U
        const dur = 5 + r() * 5
        const ph = ((now / 1000 + r() * 20) % dur).toFixed(1)
        s += `<rect x="${x}" y="${GY - U}" width="${U}" height="${U}" fill="#ff9a2a" opacity="0"><animate attributeName="opacity" values="0;0.9;0" dur="${dur.toFixed(1)}s" begin="-${ph}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${Math.round(r() * 20 - 10)} -${40 + Math.round(r() * 30)}" dur="${dur.toFixed(1)}s" begin="-${ph}s" repeatCount="indefinite"/></rect>`
      }
      return `<g shape-rendering="crispEdges">${s}</g>`
    },
  },
  sakura: {
    sky: ['#f7c6dc', '#fdeaf2'],
    ground: ['#7fae6a', '#4f7a47'],
    cloud: '#f2c6d8',
    decor: (r, x) => {
      const k = r()
      if (k < 0.4) return tuft(x, '#8fc27a', '#6fae5c')
      if (k < 0.75) return flower(x, pick(r, ['#ff9ac1', '#ffffff', '#ffd6e6']))
      return rock(x, '#a8a8b8', '#c8c8d8')
    },
    extra: now => {
      // sakura petals drifting down
      const r = rng(9)
      let s = ''
      for (let i = 0; i < 14; i++) {
        const x = Math.round((r() * W) / U) * U
        const dur = 7 + r() * 6
        const ph = ((now / 1000 + r() * 20) % dur).toFixed(1)
        s += `<rect x="${x}" y="-6" width="${U}" height="${U}" fill="#ffb3d0" opacity="0.85"><animateTransform attributeName="transform" type="translate" values="0 0;${Math.round(r() * 40 + 10)} ${H + 6}" dur="${dur.toFixed(1)}s" begin="-${ph}s" repeatCount="indefinite"/></rect>`
      }
      return `<g shape-rendering="crispEdges">${s}</g>`
    },
  },
  snow: {
    sky: ['#b9d3ea', '#eef6fc'],
    ground: ['#dfe9f2', '#9fb3c6'],
    cloud: '#ffffff',
    decor: (r, x) => {
      const k = r()
      if (k < 0.4) {
        // pine tree
        return rect(x + 2 * U, GY - U, U, U, '#6b4a2a') + rect(x, GY - 2 * U, 5 * U, U, '#2f6b4a') + rect(x + U, GY - 3 * U, 3 * U, U, '#3a7d58') + rect(x + 2 * U, GY - 4 * U, U, U, '#ffffff') + rect(x + U, GY - 3 * U, U, U, '#ffffff')
      }
      if (k < 0.75) return rect(x, GY - U, 4 * U, U, '#ffffff') + rect(x + U, GY - 2 * U, 2 * U, U, '#ffffff')
      return rock(x, '#8d99a8', '#aab6c4')
    },
    extra: now => {
      const r = rng(31)
      let s = ''
      for (let i = 0; i < 26; i++) {
        const x = Math.round(r() * W)
        const dur = 6 + r() * 6
        const ph = ((now / 1000 + r() * 20) % dur).toFixed(1)
        s += `<rect x="${x}" y="-4" width="2" height="2" fill="#ffffff" opacity="0.9"><animateTransform attributeName="transform" type="translate" values="0 0;${Math.round(r() * 30 - 15)} ${H + 6}" dur="${dur.toFixed(1)}s" begin="-${ph}s" repeatCount="indefinite"/></rect>`
      }
      return `<g shape-rendering="crispEdges">${s}</g>`
    },
  },
  night: {
    sky: ['#0b1026', '#2a2f5c'],
    ground: ['#2a3a52', '#1a2438'],
    cloud: '#5b6b8c',
    decor: (r, x) => {
      const k = r()
      if (k < 0.5) return tuft(x, '#2f5a3a', '#244a30')
      if (k < 0.8) {
        // a glowing mushroom
        return rect(x + U, GY - U, U, 2 * U, '#cfe8f0') + `<rect x="${x}" y="${GY - 2 * U}" width="${3 * U}" height="${U}" fill="#5fe0ff"><animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/></rect>`
      }
      return rock(x, '#3a4a64', '#52638a')
    },
    extra: now => {
      let s = stars(now, 34, 5, GY - 40) + disc(W - 70, 22, 5, '#f3efc8') + rect(W - 73, 18, U, U, '#d8d3a4') + rect(W - 64, 25, U, U, '#d8d3a4')
      const r = rng(88)
      for (let i = 0; i < 8; i++) {
        const x = Math.round(30 + r() * (W - 60))
        const y = GY - 8 - Math.round(r() * 30)
        const dur = 3 + r() * 3
        s += `<rect x="${x}" y="${y}" width="2" height="2" fill="#e8ff7a" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="${dur.toFixed(1)}s" begin="-${((now / 1000 + i * 3) % dur).toFixed(1)}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${Math.round(r() * 16 - 8)} ${Math.round(r() * 10 - 5)}" dur="${dur.toFixed(1)}s" begin="-${((now / 1000 + i * 3) % dur).toFixed(1)}s" repeatCount="indefinite"/></rect>`
      }
      return `<g shape-rendering="crispEdges">${s}</g>`
    },
  },
  desert: {
    sky: ['#f5c27a', '#fbe8b8'],
    ground: ['#d9b46a', '#a8823c'],
    cloud: '#fff1d0',
    decor: (r, x) => {
      const k = r()
      if (k < 0.45) {
        // cactus
        const g = '#4a8a3c'
        return rect(x + U, GY - 5 * U, U, 5 * U, g) + rect(x, GY - 4 * U, U, 2 * U, g) + rect(x + 2 * U, GY - 3 * U, U, 2 * U, g)
      }
      if (k < 0.75) return tuft(x, '#a88a4a', '#c4a45a')
      return rock(x, '#b8955a', '#d4b078')
    },
    extra: () => disc(70, 24, 6, '#ffd23f') + disc(70, 24, 4, '#fff0a0'),
  },
  space: {
    sky: ['#05010f', '#1a0b3a'],
    ground: ['#5a5a7a', '#34344a'],
    cloud: '#7a6aa8',
    decor: (r, x) => {
      const k = r()
      if (k < 0.45) return rect(x, GY + U, 4 * U, U, '#26263a') // crater
      if (k < 0.8) return rock(x, '#6e6e88', '#8c8ca8')
      return rect(x + U, GY - 5 * U, U, 5 * U, '#cfcfe0') + rect(x + 2 * U, GY - 5 * U, 3 * U, 2 * U, '#e03a4e') // a flag
    },
    extra: now => {
      const cx = W - 90
      return stars(now, 44, 11, GY - 30) + disc(cx, 28, 7, '#c97b4a') + disc(cx, 28, 4, '#e09a6a') + rect(cx - 10 * U, 28, 21 * U, 2, '#e8c89a')
    },
  },
  office: {
    sky: ['#cfd8e3', '#e8edf3'],
    ground: ['#7a8a9a', '#4a5868'],
    cloud: '#ffffff',
    noClouds: true,
    decor: () => '',
    anchors: () => officeDesks().map(d => d - 7 * U),
    layout: now => {
      let s = ''
      officeDesks().forEach((dx, i) => {
        const flicker = [1.3, 1.9, 2.4, 1.1][i % 4] as number
        // desk, monitor with a flickering screen, keyboard and a mug
        s += rect(dx, GY - 4 * U, 12 * U, U, '#8b6b4a') + rect(dx + U, GY - 3 * U, U, 3 * U, '#6b4f36') + rect(dx + 10 * U, GY - 3 * U, U, 3 * U, '#6b4f36')
        s += rect(dx + 3 * U, GY - 10 * U, 7 * U, 5 * U, '#2b2f3a') + rect(dx + 6 * U, GY - 5 * U, U, U, '#2b2f3a')
        s += `<rect x="${dx + 4 * U}" y="${GY - 9 * U}" width="${5 * U}" height="${3 * U}" fill="#5fe0ff"><animate attributeName="opacity" values="1;0.55;0.9;0.7;1" dur="${flicker}s" repeatCount="indefinite"/></rect>`
        s += rect(dx + 4 * U, GY - 8 * U, 3 * U, 2, '#2b6f86') + rect(dx + 4 * U, GY - 7 * U, 4 * U, 2, '#2b6f86')
        s += rect(dx + 4 * U, GY - 5 * U, 4 * U, 2, '#c9ced6') + rect(dx + 10 * U - 1, GY - 6 * U, U, 2 * U, '#e8e8e8')
      })
      // plants and a water cooler between the desks
      const xs = officeDesks()
      xs.forEach((dx, i) => {
        const gx = dx + 12 * U + 4 * U
        if (gx > W - 20) return
        if (i % 2 === 0) {
          s += rect(gx, GY - 2 * U, 3 * U, 2 * U, '#a8603a') + rect(gx, GY - 5 * U, U, 3 * U, '#3f9a4a') + rect(gx + U, GY - 6 * U, U, 4 * U, '#4fb35a') + rect(gx + 2 * U, GY - 4 * U, U, 2 * U, '#3f9a4a')
        } else {
          s += rect(gx, GY - 5 * U, 3 * U, 3 * U, '#9fd8ff') + rect(gx, GY - 2 * U, 3 * U, 2 * U, '#e8edf3') + rect(gx + U, GY - 3 * U, U, U, '#5fa8d8')
        }
      })
      return s
    },
    extra: now => {
      if (!SKY) return ''
      // windows and a wall clock
      let s = ''
      for (let i = 0; i < 4; i++) {
        const wx = 40 + i * Math.round((W - 120) / 3)
        s += rect(wx, 8, 14 * U, 9 * U, '#7a8a9a') + rect(wx + 2, 10, 14 * U - 4, 9 * U - 4, '#9fd8ff') + rect(wx + 7 * U - 1, 10, 2, 9 * U - 4, '#7a8a9a')
      }
      return `<g shape-rendering="crispEdges">${s}${disc(W - 60, 12, 3, '#ffffff')}${rect(W - 61, 8, 2, 5, '#2b2b2b')}${rect(W - 61, 11, 5, 2, '#2b2b2b')}</g>`
    },
  },
  beach: {
    sky: ['#7fd3ff', '#e6f7ff'],
    ground: ['#f0d9a0', '#d4b87a'],
    cloud: '#ffffff',
    decor: (r, x) => {
      const k = r()
      if (k < 0.25) {
        // palm tree
        return rect(x + U, GY - 6 * U, U, 6 * U, '#8a5a2a') + rect(x - U, GY - 7 * U, 5 * U, U, '#3f9a4a') + rect(x - 2 * U, GY - 6 * U, 2 * U, U, '#2f7a3a') + rect(x + 3 * U, GY - 6 * U, 2 * U, U, '#2f7a3a') + rect(x, GY - 8 * U, 3 * U, U, '#4fb35a')
      }
      if (k < 0.4) {
        // umbrella
        return rect(x + 3 * U, GY - 6 * U, U, 6 * U, '#dddddd') + rect(x, GY - 7 * U, 7 * U, U, '#e03a4e') + rect(x + U, GY - 8 * U, 5 * U, U, '#ffffff') + rect(x + 2 * U, GY - 9 * U, 3 * U, U, '#e03a4e')
      }
      if (k < 0.6) return rect(x, GY - 2 * U, 5 * U, 2 * U, '#e6c98a') + rect(x, GY - 3 * U, U, U, '#e6c98a') + rect(x + 2 * U, GY - 3 * U, U, U, '#e6c98a') + rect(x + 4 * U, GY - 3 * U, U, U, '#e6c98a')
      if (k < 0.8) return rect(x, GY - U, 3 * U, U, '#ff8a3a') + rect(x + U, GY - 2 * U, U, U, '#ff8a3a')
      return rect(x, GY - U, 2 * U, U, '#f4b6c2') + rect(x + U, GY - 2 * U, U, U, '#f4b6c2')
    },
    extra: now => {
      let s = disc(W - 70, 22, 6, '#ffd23f') + disc(W - 70, 22, 4, '#fff0a0')
      for (let i = 0; i < 3; i++) {
        const dur = 30 + i * 12
        const ph = ((now / 1000 + i * 11) % dur).toFixed(1)
        const y = 14 + i * 12
        s += `<g fill="#ffffff"><animateTransform attributeName="transform" type="translate" values="-20 ${y};${W + 20} ${y}" dur="${dur}s" begin="-${ph}s" repeatCount="indefinite"/>${rect(0, 0, U, U, '#fff')}${rect(U, -U, U, U, '#fff')}${rect(2 * U, 0, U, U, '#fff')}${rect(3 * U, -U, U, U, '#fff')}${rect(4 * U, 0, U, U, '#fff')}</g>`
      }
      return `<g shape-rendering="crispEdges">${s}</g>`
    },
  },
  city: {
    sky: ['#120a2a', '#3a1a5c'],
    ground: ['#2a2a40', '#16162a'],
    cloud: '#5a3a7a',
    decor: (r, x) => {
      const k = r()
      if (k < 0.4) return rect(x + U, GY - 7 * U, U, 7 * U, '#555a70') + rect(x, GY - 8 * U, 3 * U, U, '#ffe9a0') + `<rect x="${x - U}" y="${GY - 7 * U}" width="${5 * U}" height="${3 * U}" fill="#ffe9a0" opacity="0.12"/>`
      if (k < 0.65) return rect(x, GY - 3 * U, 3 * U, 3 * U, '#3a4a5a') + rect(x, GY - 3 * U, 3 * U, U, '#52667a')
      return rect(x, GY + U, 4 * U, U, pick(r, ['#5fe0ff', '#ff6fa5', '#b45cff'])).replace('/>', ' opacity="0.55"/>')
    },
    extra: now => {
      const r = rng(5)
      let s = ''
      let x = -4
      while (x < W) {
        const w = 24 + Math.round(r() * 24)
        const h = 22 + Math.round(r() * 38)
        s += rect(x, GY - h, w, h, '#1c1238')
        for (let wy = GY - h + 6; wy < GY - 8; wy += 8) {
          for (let wx = x + 5; wx < x + w - 5; wx += 8) {
            if (r() < 0.4) {
              const col = pick(r, ['#ffd23f', '#5fe0ff', '#ff6fa5'])
              s += r() < 0.15 ? `<rect x="${wx}" y="${wy}" width="3" height="3" fill="${col}"><animate attributeName="opacity" values="1;0.2;1" dur="${(2 + r() * 3).toFixed(1)}s" repeatCount="indefinite"/></rect>` : rect(wx, wy, 3, 3, col)
            }
          }
        }
        x += w + 4
      }
      // a neon sign
      s += `<rect x="${Math.round(W * 0.55)}" y="${GY - 52}" width="30" height="6" fill="#ff3fa0"><animate attributeName="opacity" values="1;1;0.3;1;0.5;1" dur="3s" repeatCount="indefinite"/></rect>`
      return `<g shape-rendering="crispEdges">${s}</g>`
    },
  },
  ocean: {
    sky: ['#0a3a6a', '#1c8fb8'],
    ground: ['#c9b27a', '#8e7a4a'],
    cloud: '#8fe0ff',
    noClouds: true,
    decor: (r, x) => {
      const k = r()
      if (k < 0.4) {
        // seaweed, swaying
        const g = '#2f9a5a'
        return `<g><animateTransform attributeName="transform" type="translate" values="0 0;3 0;0 0;-3 0;0 0" dur="${(2.5 + r() * 2).toFixed(1)}s" repeatCount="indefinite"/>${rect(x, GY - U, U, U, g)}${rect(x + U / 3, GY - 2 * U, U, U, g)}${rect(x, GY - 3 * U, U, U, g)}${rect(x + U / 3, GY - 4 * U, U, U, g)}${rect(x, GY - 5 * U, U, U, g)}</g>`
      }
      if (k < 0.65) return rect(x, GY - 3 * U, 3 * U, 3 * U, '#ff7a5a') + rect(x - U, GY - 2 * U, U, 2 * U, '#ff9a7a') + rect(x + 3 * U, GY - 2 * U, U, 2 * U, '#ff9a7a') + rect(x + U, GY - 4 * U, U, U, '#ff7a5a')
      if (k < 0.85) return rect(x, GY - 3 * U, 5 * U, 3 * U, '#8a5a2a') + rect(x, GY - 4 * U, 5 * U, U, '#a8743a') + rect(x + 2 * U, GY - 3 * U, U, U, '#ffd23f')
      return rect(x, GY - U, 2 * U, U, '#f4b6c2') + rect(x + U, GY - 2 * U, U, U, '#f4b6c2')
    },
    extra: now => {
      const r = rng(21)
      let s = ''
      for (let i = 0; i < 3; i++) {
        const x = 60 + i * Math.round((W - 160) / 2)
        s += `<polygon points="${x},0 ${x + 18},0 ${x + 60},${GY} ${x + 20},${GY}" fill="#ffffff" opacity="0.07"/>`
      }
      for (let i = 0; i < 16; i++) {
        const x = Math.round(r() * W)
        const dur = 5 + r() * 5
        const ph = ((now / 1000 + r() * 20) % dur).toFixed(1)
        s += `<rect x="${x}" y="${GY}" width="3" height="3" fill="#bfeeff" opacity="0.7"><animateTransform attributeName="transform" type="translate" values="0 0;${Math.round(r() * 14 - 7)} -${GY}" dur="${dur.toFixed(1)}s" begin="-${ph}s" repeatCount="indefinite"/></rect>`
      }
      return `<g shape-rendering="crispEdges">${s}</g>`
    },
  },
  halloween: {
    sky: ['#1a0f2a', '#4a2a4a'],
    ground: ['#3a2f3f', '#241c28'],
    cloud: '#6a5a7a',
    decor: (r, x) => {
      const k = r()
      if (k < 0.35) return rect(x, GY - 4 * U, 3 * U, 4 * U, '#8a8a9a') + rect(x + U, GY - 5 * U, U, U, '#8a8a9a') + rect(x + U, GY - 3 * U, U, U, '#5a5a6a')
      if (k < 0.6) {
        // jack-o'-lantern with a glowing face
        return rect(x, GY - 3 * U, 5 * U, 3 * U, '#ff8a1f') + rect(x + 2 * U, GY - 4 * U, U, U, '#4a8a3c') + `<g fill="#ffd23f"><rect x="${x + U}" y="${GY - 2 * U}" width="${U}" height="${U}"/><rect x="${x + 3 * U}" y="${GY - 2 * U}" width="${U}" height="${U}"/><rect x="${x + 2 * U}" y="${GY - U}" width="${U}" height="${U}"/><animate attributeName="opacity" values="1;0.6;1" dur="1.6s" repeatCount="indefinite"/></g>`
      }
      if (k < 0.8) return rect(x + 2 * U, GY - 6 * U, U, 6 * U, '#4a3a2a') + rect(x, GY - 5 * U, 2 * U, U, '#4a3a2a') + rect(x, GY - 6 * U, U, U, '#4a3a2a') + rect(x + 3 * U, GY - 4 * U, 2 * U, U, '#4a3a2a') + rect(x + 4 * U, GY - 5 * U, U, U, '#4a3a2a')
      return rect(x + U, GY - 3 * U, U, 3 * U, '#e8e0c0') + `<rect x="${x + U}" y="${GY - 4 * U}" width="${U}" height="${U}" fill="#ffb84a"><animate attributeName="opacity" values="1;0.5;1;0.8" dur="0.9s" repeatCount="indefinite"/></rect>`
    },
    extra: now => {
      let s = disc(W - 80, 26, 8, '#ffb84a') + disc(W - 80, 26, 6, '#ffd37a') + stars(now, 14, 3, GY - 40)
      for (let i = 0; i < 4; i++) {
        const dur = 14 + i * 5
        const ph = ((now / 1000 + i * 6) % dur).toFixed(1)
        const y = 10 + i * 12
        s += `<g fill="#0d0814"><animateTransform attributeName="transform" type="translate" values="${i % 2 ? W + 20 : -20} ${y};${i % 2 ? -20 : W + 20} ${y}" dur="${dur}s" begin="-${ph}s" repeatCount="indefinite"/>${rect(U, 0, U, U, '#0d0814')}<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -${U}" dur="0.3s" calcMode="discrete" repeatCount="indefinite"/>${rect(-U, 0, 2 * U, U, '#0d0814')}${rect(2 * U, 0, 2 * U, U, '#0d0814')}</g></g>`
      }
      return `<g shape-rendering="crispEdges">${s}</g>`
    },
  },
}

let THEME = 'meadow'
let SKY = false
const AUTO_SCENE: Record<string, string> = { robot: 'meadow', cat: 'home', dragon: 'lava', anime: 'sakura' }

// Scenery on the ground line, the same every draw (seeded), plus drifting clouds.
const scenery = (now: number) => {
  const t = THEMES[THEME] ?? (THEMES['meadow'] as Theme)
  const r = rng(4242)
  let s = `<g shape-rendering="crispEdges"><rect x="0" y="${GY + U}" width="${W}" height="${U}" fill="${t.ground[0]}" opacity="0.55"/><rect x="0" y="${GY + 2 * U}" width="${W}" height="${U}" fill="${t.ground[1]}" opacity="0.4"/>`
  if (t.layout) {
    s += t.layout(now)
  } else {
    const n = Math.round(W / 26)
    for (let i = 0; i < n; i++) {
      const x = Math.round((10 + r() * (W - 20)) / U) * U
      s += t.decor(r, x)
    }
  }
  s += '</g>'
  // clouds drift left to right; the negative begin keeps their place across redraws
  for (let i = 0; i < (t.noClouds ? 0 : 3); i++) {
    const dur = 80 + i * 30
    const y = 2 + i * 9
    const phase = ((now / 1000 + i * 37) % dur).toFixed(1)
    s += `<g shape-rendering="crispEdges" fill="${t.cloud}" opacity="0.45"><g><animateTransform attributeName="transform" type="translate" values="-60 ${y};${W + 20} ${y}" dur="${dur}s" begin="-${phase}s" repeatCount="indefinite"/><rect x="6" y="6" width="36" height="6"/><rect x="0" y="12" width="48" height="6"/><rect x="12" y="0" width="18" height="6"/></g></g>`
  }
  return s + (t.extra ? t.extra(now) : '')
}

const sky = () => {
  if (!SKY) return ''
  const t = THEMES[THEME] ?? (THEMES['meadow'] as Theme)
  return `<defs><linearGradient id="sky-${THEME}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[0]}"/><stop offset="1" stop-color="${t.sky[1]}"/></linearGradient></defs><rect width="${W}" height="${H}" rx="8" fill="url(#sky-${THEME})"/>`
}

const sceneSvg = (all: Avatar[], now: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${sky()}
${scenery(now)}
${all.map(a => agentSvg(a, now)).join('')}
</svg>`

// ---- Terminal: block-character robots --------------------------------------

const WIDTH = 12
const pad = (s: string) => {
  const cut = s.length > WIDTH ? s.slice(0, WIDTH - 1) + '…' : s
  const left = Math.floor((WIDTH - cut.length) / 2)
  return ' '.repeat(left) + cut + ' '.repeat(WIDTH - cut.length - left)
}

const sprite = (isWorking: boolean, frame: number) => ({
  hop: isWorking && frame % 2 === 0,
  top: ' ' + B.repeat(8) + ' ',
  eyeL: isWorking ? ' > ' : ' | ',
  eyeR: isWorking ? ' < ' : ' | ',
  legs: isWorking && frame % 2 ? '  ' + B + B + '  ' + B + B + '  ' : ' ' + B + B + '    ' + B + B + ' ',
})

export const register: Register = (on, options) => {
  const choice = String(options['skin'] ?? 'robot')
  const scene = String(options['scene'] ?? 'auto')
  THEME = THEMES[scene] ? scene : (AUTO_SCENE[choice] ?? 'meadow')
  SKY = options['sky'] === 'filled'
  const agents = new Map<string, Avatar>()
  let colorIx = 1
  let spawned = 0
  let isTerminal = false

  const make = (id: string, name: string, color: string): Avatar => {
    spawned += 1
    const skin = choice === 'mixed' ? (SKIN_IDS[(spawned - 1) % SKIN_IDS.length] as string) : SKINS[choice] ? choice : 'robot'
    return {
      id,
      name,
      color,
      skin,
      isWorking: false,
      tool: '',
      doneAt: 0,
      spawnAt: 0,
      leaveAt: 0,
      restX: 50 + ((spawned * 0.618034) % 1) * (W - 100),
      seed: spawned,
      epoch: 0,
      pathStart: 0,
      segs: [],
      total: 0,
    }
  }

  const mainAv = make('main', 'main', COLORS[0] ?? '#ff8a1f')

  // Agents the mod did not see start (spawned before it loaded, or before a reload
  // wiped its memory) are picked up from the session's own list.
  const adopt = (id: string, name: string, working: boolean) => {
    const a = make(id, name, COLORS[colorIx++ % COLORS.length] ?? '#37c871')
    a.spawnAt = Date.now()
    if (working) startWork(a, Date.now())
    agents.set(id, a)
    return a
  }

  // Bring the avatars in line with the session's agent list; true when anything changed.
  const applyList = (list: AgentRow[]) => {
    const now = Date.now()
    let changed = false
    for (const info of list) {
      const isOn = info.status === 'running' || info.status === 'pending' || info.status === 'waiting'
      const a = agents.get(info.id)
      if (!a) {
        if (isOn) {
          adopt(info.id, info.description || info.type, true)
          changed = true
        }
      } else if (a.isWorking && !isOn) {
        stopWork(a, now)
        changed = true
      } else if (!a.isWorking && isOn) {
        startWork(a, now)
        changed = true
      }
    }
    return changed
  }

  on('session.start', async ($, e, next) => {
    void $.agent.list().then(applyList).then(c => c && $.ui.invalidate('ui.render'), () => undefined)
    let ticks = 0
    $.clock.every(FRAME_MS, () => {
      const now = Date.now()
      let changed = false
      ticks += 1
      if (ticks % 8 === 0) void $.agent.list().then(applyList).then(c => c && $.ui.invalidate('ui.render'), () => undefined)
      for (const [id, a] of agents) {
        if (!a.isWorking && a.doneAt && !a.leaveAt && now - a.doneAt > LINGER_MS) {
          a.leaveAt = now
          changed = true
        }
        if (a.leaveAt && now - a.leaveAt > EXIT_MS) {
          agents.delete(id)
          changed = true
        }
      }
      // The terminal animates by redrawing; the desktop's SVG animates itself.
      if (isTerminal || changed) $.ui.invalidate('ui.render')
    })
    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const res = await next(e)
    if ('agentId' in res && res.agentId) {
      const a = make(res.agentId, e.name ?? e.description ?? `spawned${spawned}`, COLORS[colorIx++ % COLORS.length] ?? '#37c871')
      startWork(a, Date.now())
      a.spawnAt = Date.now()
      agents.set(a.id, a)
      $.ui.invalidate('ui.render')
    }
    return res
  })

  on('tool.call', async ($, e, next) => {
    let a = e.agentId ? agents.get(e.agentId) : undefined
    if (!a && e.agentId) {
      let name = 'agent'
      try {
        name = (await $.agent.list()).find(i => i.id === e.agentId)?.description || name
      } catch {
        // the list is only for the name
      }
      a = adopt(e.agentId, name, true)
    }
    if (a) {
      a.tool = e.tool
      startWork(a, Date.now())
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const a = e.agentId ? agents.get(e.agentId) : undefined
    if (a) {
      stopWork(a, Date.now())
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = [...agents.values()]
    if (e.props.hasSurvey) return next(e)

    isTerminal = e.surface === 'terminal'
    // ~7.9 px per cell, measured from the desktop's band (752 px at ~95 cells)
    const w = Math.max(360, Math.min(1800, Math.round((e.props.bodyColumns ?? 95) * 7.9)))
    if (Math.abs(w - W) > 6) {
      W = w
      for (const a of [mainAv, ...agents.values()]) {
        a.restX = Math.min(a.restX, W - 40)
        if (a.isWorking) {
          a.epoch += 1
          a.pathStart = Date.now()
          makePath(a)
        }
      }
    }
    const now = await $.clock.now()
    if (e.props.isWorking) startWork(mainAv, now)
    else stopWork(mainAv, now)
    const all: Avatar[] = [mainAv, ...list]

    if (e.surface === 'desktop' || e.surface === 'vscode') {
      const { Svg } = $.ui.resolve(e) as any
      return (
        <Svg
          source={sceneSvg(all, now)}
          alt={`Agents: ${all.map(a => `${a.name} ${a.isWorking ? 'working' : 'idle'}`).join(', ')}`}
          width={W}
          height={H}
          isInteractive
        />
      )
    }

    const frame = Math.floor(now / FRAME_MS)
    const { Box, Text } = $.ui.resolve(e) as any
    return (
      <Box flexDirection="row">
        {all.map(a => {
          const sp = sprite(a.isWorking, frame)
          const gap = <Text>{pad('')}</Text>
          return (
            <Box key={a.id} flexDirection="column">
              {sp.hop ? gap : null}
              <Text color={a.color}>{pad(sp.top)}</Text>
              <Box>
                <Text color={a.color}>{' ' + B}</Text>
                <Text color={EYE} backgroundColor={a.color}>{sp.eyeL}</Text>
                <Text color={a.color}>{B + B}</Text>
                <Text color={EYE} backgroundColor={a.color}>{sp.eyeR}</Text>
                <Text color={a.color}>{B + '  '}</Text>
              </Box>
              <Text color={a.color}>{pad(sp.top)}</Text>
              <Text color={a.color}>{pad(sp.legs)}</Text>
              {sp.hop ? null : gap}
              <Text bold>{pad(a.name)}</Text>
              <Text dimColor>{pad(a.isWorking ? activity(a.tool) : 'idle')}</Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}
