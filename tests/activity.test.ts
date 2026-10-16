import { expect, mock, test } from 'claude-code/testing'
import { heldTools } from './host.ts'

const BAND = {
  plugin: 'agent-avatars',
  component: 'AbovePrompt',
  surface: 'desktop',
  props: { isWorking: true, bodyColumns: 95 },
} as const

test('the main agent shows the tool it is running', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  const start = heldTools($, on, clock)
  const finish = await start({ tool: 'Read', file_path: '/work/README.md' })
  const ui = await $.ui.mount(BAND)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('reading…')).toBe(true)
  await finish()
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('thinking…')).toBe(true)
  await ui.unmount()
})

test('main-agent action bubbles show escaped input on desktop and VS Code', { options: { thoughts: 'action' } }, async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  const start = heldTools($, on, clock)
  const finish = await start({ tool: 'Read', file_path: '/work/<secret>.rs' })
  for (const surface of ['desktop', 'vscode'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const source = String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(source.includes('read &lt;secret&gt;.rs')).toBe(true)
    expect(source.includes('<secret>')).toBe(false)
    await ui.unmount()
  }
  await finish()
})

test('main-agent tool activity appears in the terminal too', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  const start = heldTools($, on, clock)
  const finish = await start({ tool: 'Grep', pattern: 'TODO' })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /searching…/ })).toBeDefined()
  await finish()
  await ui.unmount()
})

test('default options never request model-generated labels', async ($, on) => {
  mock.clock(on, { now: 100000 })
  let requests = 0
  on('model.complete', () => {
    requests += 1
    return { value: { isAnswered: false } }
  })
  on('agent.spawn', () => ({ model: 'haiku', agentId: 'worker' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.agent.spawn({ description: 'Worker', prompt: 'Read the code' })
  await $.tool.call({ tool: 'Read', file_path: '/work/main.rs' })
  await $.tool.call({ tool: 'Read', agentId: 'worker', file_path: '/work/worker.rs' })
  const ui = await $.ui.mount(BAND)
  expect(requests).toBe(0)
  await ui.unmount()
})

test('AI thoughts for the main agent are escaped and limited to one per twelve seconds', { options: { thoughts: 'ai' } }, async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  let requests = 0
  on('model.complete', () => {
    requests += 1
    return { value: { isAnswered: true, text: '<label>&', usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }
  })
  const start = heldTools($, on, clock)
  const finish = await start({ tool: 'Read', file_path: '/work/main.rs' })
  const ui = await $.ui.mount(BAND)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('&lt;label&gt;&amp;')).toBe(true)
  await finish()
  await clock.advance(12000)
  const finishSearch = await start({ tool: 'Grep', pattern: 'TODO' })
  expect(requests).toBe(1)
  await finishSearch()
  await clock.advance(1)
  const finishNext = await start({ tool: 'Read', file_path: '/work/next.rs' })
  expect(requests).toBe(2)
  await finishNext()
  await ui.unmount()
})

test('a host API failure in the observer does not block the underlying tool', async ($, on) => {
  on('clock.now', () => ({ deny: 'Clock unavailable' }))
  on('tool.call', () => ({ result: 'tool still ran' }))
  expect(await $.tool.call({ tool: 'Read', file_path: '/work/README.md' })).toEqual({ result: 'tool still ran' })
})

test('an unavailable AI model falls back to the action without blocking tools', { options: { thoughts: 'ai', names: 'ai' } }, async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  let requests = 0
  on('model.complete', () => {
    requests += 1
    return { deny: 'Model unavailable' }
  })
  const start = heldTools($, on, clock)
  const finish = await start({ tool: 'Read', file_path: '/work/main.rs' })
  const ui = await $.ui.mount(BAND)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('read main.rs')).toBe(true)
  // Naming applies to new subagents; the main avatar keeps its stable name.
  expect(requests).toBe(1)
  expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain('robot: main')
  expect(await finish()).toEqual({ result: 'ok' })
  await ui.unmount()
})

test('the main agent clears its completion mood after five seconds on the host clock', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('turn.complete', () => ({ text: '' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.turn.complete({ turnId: 'turn', answer: 'Done', durationMs: 100, isAborted: false, reason: 'answer' })
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: false } })
  await clock.advance(5000)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('✓ done')).toBe(true)
  await clock.advance(250)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('✓ done')).toBe(false)
  await ui.unmount()
})
