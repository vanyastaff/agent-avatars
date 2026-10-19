import { expect, mock, test } from 'claude-code/testing'
import { liveSvg } from './host.ts'

const TOOL = 'mcp__agent-avatars__avatar'
const BAND = {
  plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop',
  props: { isWorking: false, bodyColumns: 95 },
} as const

const setup = async ($: any, on: any, saved: unknown = undefined) => {
  const clock = mock.clock(on, { now: 100000 })
  const registered: string[] = []
  const writes: unknown[] = []
  const asked: string[] = []
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('tool.register', ($: any, e: any) => { registered.push(e.name); return { value: { tool: TOOL } } })
  on('store.get', () => ({ value: saved }))
  on('store.set', ($: any, e: any) => { writes.push(e); return { value: undefined } })
  on('model.complete', ($: any, e: any) => { asked.push(String(e.prompt)); return { value: { isAnswered: true, text: 'cat, blue - detective!', usage: {} } } })
  on('agent.spawn', () => ({ model: 'haiku', agentId: 'worker' }))
  on('session.start', () => ({ cwd: '/work' }))
  on('tool.call', () => ({ result: 'ok' }))
  on('tool.check', () => ({ decision: 'ask' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await clock.advance(1000)
  const scene = async () => (await $.command.run({ command: 'avatars', args: '' })).text?.split("The session's agents:")[0] ?? ''
  return { clock, registered, writes, asked, scene }
}

test('fixed looks register no tool and ask no model', async ($, on) => {
  const { registered, asked, scene } = await setup($, on)
  await $.agent.spawn({ description: 'Hunt the flaky test', prompt: 'Work', subagentType: 'Explore' })
  expect(registered).toEqual([])
  expect(asked).toEqual([])
  expect(await scene()).not.toContain(' in ')
})

test('a small model dresses a new subagent from known words only', { options: { looks: 'ai' } }, async ($, on) => {
  const { registered, asked, clock, scene } = await setup($, on)
  expect(registered).toEqual(['avatar'])
  await $.agent.spawn({ description: 'Hunt the flaky test', prompt: 'Work', subagentType: 'Explore' })
  await clock.settle()
  expect(asked.length).toBe(1)
  expect(asked[0]).toContain('Hunt the flaky test')
  expect(await scene()).toContain('cat in detective: Hunt the flaky test')
})

test('an agent dresses itself, dances and is remembered', { options: { looks: 'ai' } }, async ($, on) => {
  const { writes, clock, scene } = await setup($, on)
  const ui = await $.ui.mount(BAND)
  const done = await $.tool.call({ tool: TOOL, skin: 'dragon', outfit: 'crown', color: 'purple', emote: 'dance' } as any)
  expect(String((done as any).result)).toContain('Done')
  expect(await scene()).toContain('dragon in crown: main')
  const source = String((await liveSvg(ui))?.props.source)
  expect(source).toContain('#b45cff')
  expect(writes).toEqual([{ key: 'looks', value: { main: { skin: 'dragon', color: 'purple', wear: 'crown' } } }])
  // too soon for another change
  const again = await $.tool.call({ tool: TOOL, skin: 'cat' } as any)
  expect(String((again as any).result)).toContain('in a little while')
  expect(await scene()).toContain('dragon in crown: main')
  await clock.advance(21000)
  await $.tool.call({ tool: TOOL, skin: 'cat' } as any)
  expect(await scene()).toContain('cat in crown: main')
  await ui.unmount()
})

test('unknown choices change nothing', { options: { looks: 'ai' } }, async ($, on) => {
  const { writes, scene } = await setup($, on)
  const r = await $.tool.call({ tool: TOOL, skin: 'unicorn', outfit: '<script>' } as any)
  expect(String((r as any).result)).toContain('Unknown skin, outfit')
  expect(writes).toEqual([])
  expect(await scene()).toContain('robot: main')
})

test('a remembered look returns with the next session', { options: { looks: 'ai' } }, async ($, on) => {
  const { scene } = await setup($, on, { main: { skin: 'anime', wear: 'headphones', color: 'nope' }, junk: 5 })
  expect(await scene()).toContain('anime in headphones: main')
})

test('a subagent type keeps its favourite instead of asking the model', { options: { looks: 'ai' } }, async ($, on) => {
  const { asked, clock, scene } = await setup($, on, { 'type:Explore': { skin: 'dragon', wear: 'wizard' } })
  await $.agent.spawn({ description: 'Map the code', prompt: 'Work', subagentType: 'Explore' })
  await clock.settle()
  expect(asked).toEqual([])
  expect(await scene()).toContain('dragon in wizard: Map the code')
})

test('dressing up needs no approval', { options: { looks: 'ai' } }, async ($, on) => {
  await setup($, on)
  const { decision } = await $.tool.check({ tool: TOOL, input: { emote: 'wave' } } as any)
  expect(decision).toBe('allow')
})
