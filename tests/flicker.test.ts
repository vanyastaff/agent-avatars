import { expect, mock, test } from 'claude-code/testing'
import { liveSvg } from './host.ts'

const BAND = {
  plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop',
  props: { isWorking: true, bodyColumns: 95 },
} as const

const SCENES = ['workshop', 'meadow', 'home', 'lava', 'sakura', 'snow', 'night', 'desert', 'space', 'office', 'beach', 'city', 'ocean', 'halloween']

// The desktop reloads its frame on every new source; a redraw of an unchanged
// scene must hand it the markup it is already playing.
for (const scene of SCENES) {
  test(`${scene} keeps its markup across redraws of an unchanged scene`, { options: { scene, liveliness: 'lively' } }, async ($, on) => {
    const clock = mock.clock(on, { now: 100000 })
    on('agent.list', () => ({ value: [] }))
    on('config.list', () => ({ value: [] }))
    const ui = await $.ui.mount({ ...BAND, props: { isWorking: false, bodyColumns: 95 } })
    const source = async () => String((await liveSvg(ui))?.props.source)
    const first = await source()
    await clock.advance(300)
    await ui.redraw({ isWorking: false, bodyColumns: 95 })
    expect(await source()).toBe(first)
    await clock.advance(700)
    await ui.redraw({ isWorking: false, bodyColumns: 95 })
    expect(await source()).toBe(first)
    await ui.unmount()
  })
}

test('a walking avatar keeps its markup while it walks', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  await $.turn.start({ turnId: 't', text: 'Work' })
  const ui = await $.ui.mount(BAND)
  const source = async () => String((await liveSvg(ui))?.props.source)
  const first = await source()
  await clock.advance(200)
  await ui.redraw({ isWorking: true, bodyColumns: 95 })
  expect(await source()).toBe(first)
  await ui.unmount()
})

test('loops without a begin of their own are phased from the clock', async ($, on) => {
  mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  const ui = await $.ui.mount({ ...BAND, props: { isWorking: false, bodyColumns: 95 } })
  const source = String((await liveSvg(ui))?.props.source)
  const loops = source.match(/<animate(Transform)?\s[^>]*repeatCount="indefinite"[^>]*>/g) ?? []
  expect(loops.length > 0).toBe(true)
  for (const loop of loops) expect(loop.includes(' begin="-')).toBe(true)
  await ui.unmount()
})

test('a real change still reaches the desktop at once', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', async () => { await clock.sleep(5000); return { result: 'ok' } })
  await $.turn.start({ turnId: 't', text: 'Work' })
  const ui = await $.ui.mount(BAND)
  const source = async () => String((await liveSvg(ui))?.props.source)
  expect((await source()).includes('planning…')).toBe(true)
  void $.tool.call({ tool: 'Read', file_path: '/work/a.rs' })
  await clock.settle()
  expect((await source()).includes('reading…')).toBe(true)
  await clock.advance(6000) // let the call finish
  await ui.unmount()
})

// A life world shows work status in the alt only, so a run of tools does not
// reload the frame once per tool.
test('a run of tools barely reloads a life world', { options: { scene: 'meadow' }, timeoutMs: 30000 }, async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', async () => { await clock.sleep(1500); return { result: 'ok' } })
  await $.turn.start({ turnId: 't', text: 'Work' })
  const ui = await $.ui.mount(BAND)
  const tools = ['Read', 'Grep', 'Edit', 'Bash', 'Read', 'Read', 'Edit']
  let last = String((await liveSvg(ui))?.props.source)
  let swaps = 0
  for (let i = 0; i < 40; i++) {
    if (i % 4 === 0) void $.tool.call({ tool: tools[(i / 4) % tools.length], file_path: '/a.rs', pattern: 'x', command: 'ls' } as never)
    await clock.advance(250)
    const now = String((await liveSvg(ui))?.props.source)
    if (now !== last) swaps++
    last = now
  }
  expect(swaps <= 2).toBe(true)
  await clock.advance(3000) // let the last calls finish
  await ui.unmount()
})

// During a run of workshop tools the frame in view never reloads: each new
// picture loads into the frame out of sight and is shown once it has painted.
for (const pace of [250, 700, 1500]) {
  test(`workshop tools every ${pace}ms never reload the frame in view`, { timeoutMs: 60000 }, async ($, on) => {
    const clock = mock.clock(on, { now: 100000 })
    on('agent.list', () => ({ value: [] }))
    on('config.list', () => ({ value: [] }))
    on('turn.start', ($, e) => ({ turnId: e.turnId }))
    on('tool.call', async () => { await clock.sleep(pace * 0.6); return { result: 'ok' } })
    await $.turn.start({ turnId: 't', text: 'Work' })
    const ui = await $.ui.mount(BAND)
    await clock.advance(1000)
    const tools = ['Read', 'Grep', 'Edit', 'Bash', 'Read', 'Read', 'Edit']
    const look = async () => {
      const svgs = await ui.findAll({ type: 'Svg' })
      const top = await ui.find({ key: 'scene-1' })
      const inView = top?.props.display === 'flex' ? 1 : 0
      return { sources: svgs.map(x => String(x.props.source)), inView }
    }
    let before = await look()
    let shown = 0
    let bare = 0
    for (let t = 0, n = 0; t < 12000; t += 50) {
      if (t % pace === 0) void $.tool.call({ tool: tools[n++ % tools.length], file_path: '/a.rs', pattern: 'x', command: 'ls' } as never)
      await clock.advance(50)
      const after = await look()
      // the frame now in view must show what it already held a moment ago
      if (after.sources[after.inView] !== before.sources[after.inView]) bare++
      if (after.inView !== before.inView) shown++
      before = after
    }
    console.log(`pace ${pace}: ${shown} pictures shown, ${bare} reloads in view`)
    expect(shown > 3).toBe(true)
    expect(bare).toBe(0)
    await clock.advance(pace * 2) // let the last calls finish
    await ui.unmount()
  })
}
