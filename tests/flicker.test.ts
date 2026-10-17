import { expect, mock, test } from 'claude-code/testing'

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
    const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
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
  const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
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
  const source = String((await ui.find({ type: 'Svg' }))?.props.source)
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
  const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
  expect((await source()).includes('planning…')).toBe(true)
  void $.tool.call({ tool: 'Read', file_path: '/work/a.rs' })
  await clock.settle()
  expect((await source()).includes('reading…')).toBe(true)
  await ui.unmount()
})
