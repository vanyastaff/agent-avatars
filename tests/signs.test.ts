import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop',
  props: { isWorking: true, bodyColumns: 95 },
} as const

const HEART_PINK = 'fill="#ff6fa5"/>'
const RAIN = 'fill="#6fb0ff"'
const QUESTION_BLUE = 'fill="#2b6fd8"/>'

test('a finished turn shows rising hearts, a failed one a rain cloud', async ($, on) => {
  mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  const ui = await $.ui.mount(BAND)
  const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
  await $.turn.start({ turnId: 't', text: 'Work' })
  await $.turn.complete({ turnId: 't', answer: 'Done', durationMs: 1, isAborted: false, reason: 'answer' })
  await ui.redraw({ isWorking: false, bodyColumns: 95 })
  expect((await source()).includes(HEART_PINK)).toBe(true)
  expect((await source()).includes(RAIN)).toBe(false)
  await $.turn.start({ turnId: 'u', text: 'Work' })
  await $.turn.complete({ turnId: 'u', answer: '', durationMs: 1, isAborted: false, reason: 'error' } as never)
  await ui.redraw({ isWorking: false, bodyColumns: 95 })
  expect((await source()).includes(RAIN)).toBe(true)
  expect((await source()).includes(HEART_PINK)).toBe(false)
  await ui.unmount()
})

test('a waiting agent shows a question mark', async ($, on) => {
  mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [{ id: 'w1', description: 'Helper', type: 'general', status: 'waiting' }] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...BAND, props: { isWorking: false, bodyColumns: 95 } })
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes(QUESTION_BLUE)).toBe(true)
  await ui.unmount()
})

for (const [scene, mark] of [['night', 'fill="#ffffff" opacity="0.2"'], ['meadow', 'fill="#3a2f2a"'], ['workshop', 'fill="#ffe9b0"']] as const) {
  test(`${scene} has passers-by, which quiet leaves out`, { options: { scene } }, async ($, on) => {
    mock.clock(on, { now: 100000 })
    on('agent.list', () => ({ value: [] }))
    on('config.list', () => ({ value: [] }))
    const ui = await $.ui.mount({ ...BAND, props: { isWorking: false, bodyColumns: 95 } })
    expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes(mark)).toBe(true)
    await ui.unmount()
  })
  test(`${scene} quiet has no passers-by`, { options: { scene, liveliness: 'quiet' } }, async ($, on) => {
    mock.clock(on, { now: 100000 })
    on('agent.list', () => ({ value: [] }))
    on('config.list', () => ({ value: [] }))
    const ui = await $.ui.mount({ ...BAND, props: { isWorking: false, bodyColumns: 95 } })
    expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes(mark)).toBe(false)
    await ui.unmount()
  })
}
