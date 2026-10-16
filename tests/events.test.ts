import { expect, mock, test } from 'claude-code/testing'
import { heldTools } from './host.ts'

const BAND = { plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop', props: { isWorking: true, bodyColumns: 95 } } as const

test('commands, accepted settings, compaction and messages have different visible reactions', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('command.run', () => ({ text: 'command result' }))
  on('config.set', ($, e) => ({ value: e.value }))
  on('session.compact', ($, e) => ({ messages: e.messages }))
  on('session.receive', ($, e) => ({ text: e.text }))
  const ui = await $.ui.mount(BAND)
  const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
  expect(await $.command.run({ command: 'help', args: '' })).toEqual({ text: 'command result' })
  expect((await source()).includes('Event: checking the task board')).toBe(true)
  await $.config.set({ key: 'agent-avatars.behavior', value: 'adventure', previous: 'cozy', provider: { plugin: 'agent-avatars', tier: 'user' }, origin: { kind: 'composer' } })
  expect((await source()).includes('Event: changing the stage settings')).toBe(true)
  await $.session.compact({ trigger: 'manual', messages: [{ role: 'user', text: 'Task', toolUses: [] }] })
  expect((await source()).includes('Event: packing the notes')).toBe(true)
  await $.session.receive({ origin: { kind: 'peer-send-message' }, text: 'private text must not be drawn' })
  expect((await source()).includes('Event: a message arrived')).toBe(true)
  expect((await source()).includes('private text')).toBe(false)
  await ui.unmount()
})

test('a real approval wait is visible and never changes the permission verdict', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  const start = heldTools($, on, clock)
  on('tool.check', () => ({ decision: 'ask', reason: 'User approval required' }))
  const finish = await start({ tool: 'Bash', command: 'example' })
  const decision = await $.tool.check({ tool: 'Bash', input: { command: 'example' }, tool_use_id: 'real-call' })
  expect(decision).toEqual({ decision: 'ask', reason: 'User approval required' })
  const ui = await $.ui.mount(BAND)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('? approval')).toBe(true)
  await finish()
  const source = String((await ui.find({ type: 'Svg' }))?.props.source)
  expect(source.includes('? approval')).toBe(false)
  expect(source.includes('thinking…')).toBe(true)
  await ui.unmount()
})

test('finishing the latest parallel tool restores the remaining activity', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  const start = heldTools($, on, clock)
  const finishRead = await start({ tool: 'Read', file_path: '/work/a.rs' })
  const finishRun = await start({ tool: 'Bash', command: 'build' })
  const ui = await $.ui.mount(BAND)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('running…')).toBe(true)
  await finishRun()
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('reading…')).toBe(true)
  await finishRead()
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('thinking…')).toBe(true)
  await ui.unmount()
})

test('a tool error is shown without changing its result or declaring the turn failed', async ($, on) => {
  mock.clock(on, { now: 100000 })
  on('tool.call', () => ({ result: 'failed command', isError: true }))
  expect(await $.tool.call({ tool: 'Bash', command: 'example' })).toEqual({ result: 'failed command', isError: true })
  const ui = await $.ui.mount(BAND)
  const source = String((await ui.find({ type: 'Svg' }))?.props.source)
  expect(source.includes('Event: the tool reported an error')).toBe(true)
  expect(source.includes('! failed')).toBe(false)
  await ui.unmount()
})

test('a rejected configuration change does not change the performance', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  const start = heldTools($, on, clock)
  on('config.set', () => ({ deny: 'Unavailable' }))
  expect(await $.config.set({ key: 'agent-avatars.behavior', value: 'chaotic', previous: 'cozy', provider: { plugin: 'agent-avatars', tier: 'user' }, origin: { kind: 'composer' } })).toEqual({ deny: 'Unavailable' })
  const finish = await start({ tool: 'Read', file_path: '/work/a.rs' })
  const ui = await $.ui.mount(BAND)
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt).includes('reading a book')).toBe(true)
  await finish()
  await ui.unmount()
})

test('a subagent already observed during spawning keeps its turn state and identity', async ($, on) => {
  mock.clock(on, { now: 100000 })
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('agent.spawn', async () => {
    await $.turn.start({ turnId: 'child-turn', agentId: 'child', text: 'Work' })
    return { model: 'haiku', agentId: 'child' }
  })
  await $.agent.spawn({ name: 'Ada', description: 'Research', prompt: 'Work' })
  const ui = await $.ui.mount(BAND)
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt).includes('Ada (Curious)')).toBe(true)
  await ui.unmount()
})

test('an interrupted model stream closes the downstream iterator', async ($, on) => {
  mock.clock(on, { now: 100000 })
  let closed = false
  on('turn.step', async function* ($, e) {
    try {
      yield { kind: 'text', index: 0, text: 'Partial' }
      return { turnId: e.turnId, index: e.index, answer: 'Partial', toolUses: [], stopReason: 'end_turn', usage: null }
    } finally { closed = true }
  })
  const stream = $.turn.step({ turnId: 't', index: 0, model: 'test', messageCount: 1 })
  await stream.next()
  await stream.return(undefined)
  expect(closed).toBe(true)
})

test('fast tools leave a temporary receipt while the actor is already thinking', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'Read', file_path: '/work/a.rs' })
  const ui = await $.ui.mount(BAND)
  const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
  expect((await source()).includes('Event: the last tool returned')).toBe(true)
  expect((await source()).includes('thinking…')).toBe(true)
  await clock.advance(3500)
  expect((await source()).includes('Event: the last tool returned')).toBe(false)
  await ui.unmount()
})
