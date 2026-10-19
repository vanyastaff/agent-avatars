import { expect, mock, test } from 'claude-code/testing'
import { liveSvg } from './host.ts'

const BAND = { plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop', props: { isWorking: false, bodyColumns: 95 } } as const

// The begin of every blink in the scene, in document order.
const blinks = (svg: string) => [...svg.matchAll(/type="scale" values="1 1;1 1;1 0\.15;1 1"[^>]* begin="(-[\d.]+)s"/g)].map(m => m[1])

test('a crew of identical robots does not blink in unison', async ($, on) => {
  mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: ['a', 'b', 'c'].map(id => ({ id, description: `Worker ${id}`, type: 'general-purpose', status: 'running' })) }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount(BAND)
  const phases = blinks(String((await liveSvg(ui))?.props.source))
  expect(phases.length >= 4).toBe(true)
  expect(new Set(phases).size).toBe(phases.length)
  await ui.unmount()
})

test('a walking robot leans into its stride and a resting one breathes', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', async () => { await clock.sleep(5000); return { result: 'ok' } })
  const ui = await $.ui.mount(BAND)
  const resting = String((await liveSvg(ui))?.props.source)
  expect(resting.includes('skewX(')).toBe(false)
  expect(/values="0 0;0 1\.2;0 0"/.test(resting)).toBe(true)
  await $.turn.start({ turnId: 't', text: 'Work' })
  void $.tool.call({ tool: 'Read', file_path: '/work/a.rs' })
  await clock.settle()
  await ui.redraw({ isWorking: true, bodyColumns: 95 })
  const walking = String((await liveSvg(ui))?.props.source)
  expect(/skewX\(-?7\)/.test(walking)).toBe(true)
  await clock.advance(6000)
  await ui.unmount()
})

test('quiet liveliness keeps the body still', { options: { liveliness: 'quiet' } }, async ($, on) => {
  mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  const ui = await $.ui.mount(BAND)
  const svg = String((await liveSvg(ui))?.props.source)
  expect(/values="0 0;0 1\.2;0 0"/.test(svg)).toBe(false)
  expect(svg.includes('1.08 0.9')).toBe(false)
  await ui.unmount()
})
