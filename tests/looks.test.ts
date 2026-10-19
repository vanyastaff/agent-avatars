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
  const prompts: string[] = []
  on('agent.spawn', ($: any, e: any) => { prompts.push(e.prompt); return { model: 'haiku', agentId: 'worker' } })
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'You are Claude.', scope: 'shared' }] }))
  on('session.start', () => ({ cwd: '/work' }))
  on('tool.call', () => ({ result: 'ok' }))
  on('tool.check', () => ({ decision: 'ask' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await clock.advance(1000)
  const scene = async () => (await $.command.run({ command: 'avatars', args: '' })).text?.split("The session's agents:")[0] ?? ''
  return { clock, registered, writes, asked, scene, prompts }
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
  const done = await $.tool.call({ tool: TOOL, skin: 'dragon', outfit: 'crown', color: 'purple', action: 'dance' } as any)
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
  const { decision } = await $.tool.check({ tool: TOOL, input: { action: 'wave' } } as any)
  expect(decision).toBe('allow')
})

test('every agent is told about its avatar, and only with looks: ai', async ($, on) => {
  const { prompts } = await setup($, on)
  await $.agent.spawn({ description: 'Map the code', prompt: 'Work', subagentType: 'Explore' })
  expect(prompts).toEqual(['Work'])
  const { sections } = await $.prompt.compose({ model: 'claude-test', promptModel: 'claude-test', surfaces: [], tools: [], outputStyle: null, traits: [] } as any)
  expect(sections.map((s: any) => s.id)).toEqual(['intro'])
})

test('with looks: ai the note reaches the main prompt and each subagent', { options: { looks: 'ai' } }, async ($, on) => {
  const { prompts } = await setup($, on)
  await $.agent.spawn({ description: 'Map the code', prompt: 'Work', subagentType: 'Explore' })
  expect(prompts[0]!.startsWith('Work\n\nYou have a pixel-art avatar')).toBe(true)
  const { sections } = await $.prompt.compose({ model: 'claude-test', promptModel: 'claude-test', surfaces: [], tools: [], outputStyle: null, traits: [] } as any)
  expect(sections.map((s: any) => s.id)).toEqual(['intro', 'agent-avatars:avatar'])
  expect(sections[1].text).toContain('mcp__agent-avatars__avatar')
})

test('a line the agent says shows in a bubble as plain text, then goes', { options: { looks: 'ai' } }, async ($, on) => {
  const { clock } = await setup($, on)
  const ui = await $.ui.mount(BAND)
  const r = await $.tool.call({ tool: TOOL, say: 'found <the> bug!\nreally, a long one indeed' } as any)
  expect(String((r as any).result)).toContain('it says')
  const source = String((await liveSvg(ui))?.props.source)
  expect(source).toContain('found &lt;the&gt; bug! really, a …')
  expect(source).not.toContain('<the>')
  await clock.advance(7000)
  expect(String((await liveSvg(ui))?.props.source)).not.toContain('found &lt;the&gt;')
  await ui.unmount()
})

test('a hug needs someone on the scene and answers with hearts', { options: { looks: 'ai' } }, async ($, on) => {
  const { clock } = await setup($, on)
  const ui = await $.ui.mount(BAND)
  const alone = await $.tool.call({ tool: TOOL, action: 'hug', target: 'Ghost' } as any)
  expect(String((alone as any).result)).toContain('Nobody else')
  await $.agent.spawn({ name: 'scout', description: 'Map the code', prompt: 'Work', subagentType: 'Explore' })
  const miss = await $.tool.call({ tool: TOOL, action: 'hug', target: 'Ghost' } as any)
  expect(String((miss as any).result)).toContain('Agents there now: scout')
  await clock.advance(5000) // past the welcome
  const hearts = (s: string) => (s.match(/fill="#ff6fa5"\/>/g) ?? []).length
  const before = hearts(String((await liveSvg(ui))?.props.source))
  const hug = await $.tool.call({ tool: TOOL, action: 'hug', target: 'Scout' } as any)
  expect(String((hug as any).result)).toContain('hug with scout')
  expect(hearts(String((await liveSvg(ui))?.props.source))).toBe(before + 2 * 3 * 16) // three pink hearts of 16 cells each, on both
  await ui.unmount()
})

test('a party gets the whole crew dancing, once a minute', { options: { looks: 'ai' } }, async ($, on) => {
  const { clock } = await setup($, on)
  await $.agent.spawn({ name: 'scout', description: 'Map the code', prompt: 'Work', subagentType: 'Explore' })
  const ui = await $.ui.mount(BAND)
  const notes = (s: string) => (s.match(/fill="#b45cff"\/>/g) ?? []).length
  const before = notes(String((await liveSvg(ui))?.props.source))
  await $.tool.call({ tool: TOOL, action: 'party' } as any)
  expect(notes(String((await liveSvg(ui))?.props.source)) > before).toBe(true)
  await clock.advance(21000)
  const again = await $.tool.call({ tool: TOOL, action: 'party' } as any)
  expect(String((again as any).result)).toContain('just had a party')
  await ui.unmount()
})
