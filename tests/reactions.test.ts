import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop',
  props: { isWorking: false, bodyColumns: 95 },
} as const

const BANG = 'fill="#ffd23f"/>'
const TEA = 'having a cup of tea'
const YAWN = 'stroke="#c8c8c8"'
const SPARKLE = 'fill="#fff6c8"'

const setup = async ($: any, on: any, isWorking = false) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('prompt.submit', ($: any, e: any) => ({ text: e.text }))
  on('session.measure', ($: any, e: any) => ({ changed: e.changed }))
  on('session.compact', ($: any, e: any) => ({ messages: e.messages }))
  on('tool.call', async () => { await clock.sleep(30000); return { result: 'ok' } })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await clock.advance(1000) // past the opening pop-in
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking } })
  const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
  return { clock, ui, source }
}

test('the main avatar looks up at a prompt, and only then', async ($, on) => {
  const { clock, ui, source } = await setup($, on)
  expect((await source()).includes(BANG)).toBe(false)
  await $.prompt.submit({ text: 'please look at the tests' })
  expect((await source()).includes(BANG)).toBe(true)
  expect((await source()).includes('please look')).toBe(false)
  await clock.advance(2000)
  expect((await source()).includes(BANG)).toBe(false)
  await ui.unmount()
})

for (const text of ['спасибо!', 'Thanks, great work']) {
  test(`"${text}" makes the main avatar glow with hearts`, async ($, on) => {
    const { ui, source } = await setup($, on)
      const hearts = (s: string) => (s.match(/fill="#ff6fa5"\/>/g) ?? []).length
    const before = hearts(await source())
    await $.prompt.submit({ text })
    expect(hearts(await source()) > before).toBe(true)
    await ui.unmount()
  })
}

test('a long command brings out a cup of tea, which goes when it ends', { timeoutMs: 15000 }, async ($, on) => {
  const { clock, ui, source } = await setup($, on, true)
  const run = $.tool.call({ tool: 'Bash', command: 'cargo test' })
  await clock.advance(5000)
  expect((await source()).includes(TEA)).toBe(false)
  await clock.advance(16000)
  expect((await source()).includes(TEA)).toBe(true)
  await clock.advance(10000)
  await run
  await clock.advance(500)
  expect((await source()).includes(TEA)).toBe(false)
  await ui.unmount()
})

test('a filling context makes the crew yawn and a compaction freshens it', async ($, on) => {
  const { clock, ui, source } = await setup($, on)
  await $.session.measure({ context: { window: 200000, tokens: 80000, percent: 40 }, rateLimits: [], changed: ['context'] })
  expect((await source()).includes(YAWN)).toBe(false)
  await $.session.measure({ context: { window: 200000, tokens: 140000, percent: 70 }, rateLimits: [], changed: ['context'] })
  expect((await source()).includes(YAWN)).toBe(true)
  await $.session.compact({ trigger: 'manual', messages: [{ role: 'user', text: 'Task', toolUses: [] }] } as never)
  expect((await source()).includes(YAWN)).toBe(false)
  expect((await source()).includes(SPARKLE)).toBe(true)
  await clock.advance(3000)
  expect((await source()).includes(SPARKLE)).toBe(false)
  await ui.unmount()
})

test('quiet keeps the yawns and hearts out', { options: { liveliness: 'quiet' } }, async ($, on) => {
  const { ui, source } = await setup($, on)
  await $.session.measure({ context: { window: 200000, tokens: 190000, percent: 95 }, rateLimits: [], changed: ['context'] })
  await $.prompt.submit({ text: 'thanks' })
  expect((await source()).includes(YAWN)).toBe(false)
  expect((await source()).includes('fill="#000" opacity="0.12"')).toBe(false)
  await ui.unmount()
})

test('a nearly full context dims only a filled sky', { options: { sky: 'filled' } }, async ($, on) => {
  const { ui, source } = await setup($, on)
  await $.session.measure({ context: { window: 200000, tokens: 190000, percent: 95 }, rateLimits: [], changed: ['context'] })
  expect((await source()).includes('fill="#000" opacity="0.12"')).toBe(true)
  await ui.unmount()
})

test('a nearly full context leaves a transparent scene undimmed', async ($, on) => {
  const { ui, source } = await setup($, on)
  await $.session.measure({ context: { window: 200000, tokens: 190000, percent: 95 }, rateLimits: [], changed: ['context'] })
  expect((await source()).includes('fill="#000" opacity="0.12"')).toBe(false)
  await ui.unmount()
})
