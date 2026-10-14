import type { Register } from 'claude-code'

type Seg = { t0: number; t1: number; from: number; to: number }

type Avatar = {
  id: string
  name: string
  color: string
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
  const pts = [Math.min(a.restX, W - 40), ...Array.from({ length: 4 }, () => 40 + r() * (W - 80))]
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

// 14 x 7 pixel body (ears on rows 3-4) over 3 rows of legs; feet land on row 10.
const BODY = [
  '..LLLLLLLLLL..',
  '..XXXXXXXXXX..',
  '..XXXXXXXXXX..',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  '..XXXXXXXXXX..',
  '..DDDDDDDDDD..',
]
const EYES_IDLE = ['....E....E....', '....E....E....', '....E....E....']
const EYES_WORK = ['...E......E...', '....E....E....', '...E......E...']
const LEGS_STILL = ['..DD.DD.DD.DD.', '..DD.DD.DD.DD.', '..DD.DD.DD.DD.']
const LEGS_A = ['..DD......DD..', '..DD......DD..', '..DD......DD..']
const LEGS_B = ['....DD..DD....', '....DD..DD....', '....DD..DD....']

const robotBody = (color: string, isWorking: boolean) => {
  const c = { X: color, L: shade(color, 1.25), D: shade(color, 0.72), E: EYE }
  const eyes = isWorking
    ? pixels(EYES_WORK, c, 1)
    : `<g><animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 0.15;1 1" keyTimes="0;0.9;0.94;1" dur="4s" repeatCount="indefinite"/>${pixels(EYES_IDLE, c, 1)}</g>`
  const legs = isWorking
    ? `<g>${steps('0 0;0 -3', '0.4s')}${pixels(LEGS_A, c)}</g><g>${steps('0 -3;0 0', '0.4s')}${pixels(LEGS_B, c)}</g>`
    : pixels(LEGS_STILL, c)
  const hop = isWorking ? steps('0 0;0 -3', '0.4s') : steps('0 0;0 -3;0 0', '2.4s', 'keyTimes="0;0.5;0.56"')
  const spark = isWorking
    ? `<g transform="translate(${5 * U} ${-3 * U})" fill="#ffd23f"><rect x="${U}" y="0" width="${U}" height="${3 * U}"/><rect x="0" y="${U}" width="${3 * U}" height="${U}"/><animate attributeName="opacity" values="1;0" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></g>`
    : ''
  return `<g shape-rendering="crispEdges"><g>${hop}<g transform="translate(0 ${7 * U})">${legs}</g>${pixels(BODY, c)}${eyes}${spark}</g></g>`
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
<g transform="translate(${-7 * U} ${GY - 10 * U})">${robotBody(a.color, a.isWorking)}</g>
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

// Scenery on the ground line, the same every draw (seeded), plus drifting clouds.
const scenery = (now: number) => {
  const r = rng(4242)
  let s = `<g shape-rendering="crispEdges"><rect x="0" y="${GY + U}" width="${W}" height="${U}" fill="#5a7d4a" opacity="0.55"/><rect x="0" y="${GY + 2 * U}" width="${W}" height="${U}" fill="#3a4f33" opacity="0.4"/>`
  const n = Math.round(W / 26)
  for (let i = 0; i < n; i++) {
    const x = Math.round((10 + r() * (W - 20)) / U) * U
    const kind = r()
    if (kind < 0.5) {
      s += `<rect x="${x}" y="${GY - U}" width="${U}" height="${2 * U}" fill="#5f9d4a"/><rect x="${x + U}" y="${GY - 2 * U}" width="${U}" height="${3 * U}" fill="#4a8a3c"/><rect x="${x + 2 * U}" y="${GY - U}" width="${U}" height="${2 * U}" fill="#5f9d4a"/>`
    } else if (kind < 0.68) {
      const petal = ['#ff6fa5', '#ffd23f', '#7fd4ff'][Math.floor(r() * 3)] as string
      s += `<rect x="${x + U}" y="${GY - 2 * U}" width="${U}" height="${3 * U}" fill="#4a8a3c"/><rect x="${x}" y="${GY - 3 * U}" width="${3 * U}" height="${U}" fill="${petal}"/><rect x="${x + U}" y="${GY - 4 * U}" width="${U}" height="${U}" fill="${petal}"/><rect x="${x + U}" y="${GY - 3 * U}" width="${U}" height="${U}" fill="#fff6c8"/>`
    } else if (kind < 0.84) {
      s += `<rect x="${x}" y="${GY - U}" width="${4 * U}" height="${2 * U}" fill="#7d7f86"/><rect x="${x + U}" y="${GY - 2 * U}" width="${2 * U}" height="${U}" fill="#9a9ca4"/>`
    } else {
      s += `<rect x="${x + U}" y="${GY - U}" width="${U}" height="${2 * U}" fill="#f1e6d2"/><rect x="${x}" y="${GY - 2 * U}" width="${3 * U}" height="${U}" fill="#d9463a"/><rect x="${x + U}" y="${GY - 2 * U}" width="${U}" height="${U}" fill="#fff"/>`
    }
  }
  s += '</g>'
  // clouds drift left to right; the negative begin keeps their place across redraws
  for (let i = 0; i < 3; i++) {
    const dur = 80 + i * 30
    const y = 2 + i * 9
    const phase = ((now / 1000 + i * 37) % dur).toFixed(1)
    s += `<g shape-rendering="crispEdges" fill="#9fb4c8" opacity="0.45"><g><animateTransform attributeName="transform" type="translate" values="-60 ${y};${W + 20} ${y}" dur="${dur}s" begin="-${phase}s" repeatCount="indefinite"/><rect x="6" y="6" width="36" height="6"/><rect x="0" y="12" width="48" height="6"/><rect x="12" y="0" width="18" height="6"/></g></g>`
  }
  return s
}

const sceneSvg = (all: Avatar[], now: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
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

export const register: Register = on => {
  const agents = new Map<string, Avatar>()
  let colorIx = 1
  let spawned = 0
  let isTerminal = false

  const make = (id: string, name: string, color: string): Avatar => {
    spawned += 1
    const r = rng(spawned * 31)
    return {
      id,
      name,
      color,
      isWorking: false,
      tool: '',
      doneAt: 0,
      spawnAt: 0,
      leaveAt: 0,
      restX: 50 + r() * (W - 100),
      seed: spawned,
      epoch: 0,
      pathStart: 0,
      segs: [],
      total: 0,
    }
  }

  const mainAv = make('main', 'main', COLORS[0] ?? '#ff8a1f')

  on('session.start', async ($, e, next) => {
    $.clock.every(FRAME_MS, () => {
      const now = Date.now()
      let changed = false
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
    const a = e.agentId ? agents.get(e.agentId) : undefined
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
