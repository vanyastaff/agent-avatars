import { expect, mock, test } from 'claude-code/testing'
import { liveSvg } from './host.ts'

const BAND = {
  plugin: 'agent-avatars',
  component: 'AbovePrompt',
  surface: 'desktop',
  props: { isWorking: false, bodyColumns: 95 },
} as const

test('a customized mod load uses its own scene and look', { options: { skin: 'cat', scene: 'home', look: 'light', sky: 'filled' } }, async ($, on) => {
  mock.clock(on, { now: 100000 })
  const ui = await $.ui.mount(BAND)
  const source = String((await liveSvg(ui))?.props.source)
  expect(source.includes('class="light"')).toBe(true)
  expect(source.includes('sky-home')).toBe(true)
  expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain('character cat, scene home')
  await ui.unmount()
})

test('a fresh default load does not inherit another load\'s configuration', async ($, on) => {
  mock.clock(on, { now: 100000 })
  const ui = await $.ui.mount(BAND)
  const source = String((await liveSvg(ui))?.props.source)
  expect(source.includes('class="auto"')).toBe(true)
  expect(source.includes('linearGradient')).toBe(false)
  expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain('character robot, scene workshop')
  await ui.unmount()
})
