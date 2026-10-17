import { expect, mock, test } from 'claude-code/testing'
import { liveSvg } from './host.ts'

const BAND = {
  plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop',
  props: { isWorking: true, bodyColumns: 95 },
} as const

// Where an actor will stand: its group's translate, or the end of its walk.
const standing = (source: string, name: string) => {
  const at = source.indexOf(`<title>${name} — `)
  if (at < 0) throw new Error(`${name} is not on the scene`)
  const groups = [...source.slice(0, at).matchAll(/<g(?: class="duet-motion")? transform="translate\((-?[\d.]+) 0\)"[^>]*>(<animateTransform attributeName="transform" type="translate" values="([^"]+)")?/g)]
  const last = groups[groups.length - 1]!
  return last[3] ? Number(last[3].split(';').pop()!.split(' ')[0]) : Number(last[1])
}

const setup = async ($: any, on: any, sleep = 6000) => {
  const clock = mock.clock(on, { now: 100000 })
  let ix = 0
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('turn.start', ($: any, e: any) => ({ turnId: e.turnId }))
  on('agent.spawn', () => ({ model: 'haiku', agentId: `worker-${++ix}` }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('tool.call', async ($: any, e: any) => { await clock.sleep(e.tool === 'Bash' ? 4000 : sleep); return { result: 'ok' } })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount(BAND)
  const source = async () => String((await liveSvg(ui))?.props.source)
  return { clock, ui, source }
}

test('five actors editing at once each take their own place at the workbench', { timeoutMs: 20000 }, async ($, on) => {
  const { clock, ui, source } = await setup($, on)
  const names = ['Ada', 'Bo', 'Cy', 'Dee', 'Eve']
  for (const name of names) await $.agent.spawn({ name, description: name, prompt: 'Work' })
  await clock.advance(1000)
  for (let i = 1; i <= names.length; i++) void $.tool.call({ tool: 'Edit', file_path: '/a.rs', agentId: `worker-${i}` } as never)
  await clock.advance(3000)
  const scene = await source()
  const spots = names.map(name => standing(scene, name))
  const sorted = [...spots].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) expect(sorted[i]! - sorted[i - 1]! >= 51).toBe(true)
  await clock.advance(6000)
  await ui.unmount()
})

test('thinking after a tool happens at the station, without a walk back', { timeoutMs: 20000 }, async ($, on) => {
  const { clock, ui, source } = await setup($, on, 500)
  await $.turn.start({ turnId: 't', text: 'Work' })
  await clock.advance(3000)
  const read = $.tool.call({ tool: 'Read', file_path: '/a.rs' })
  await clock.advance(3000)
  await read
  const atLibrary = standing(await source(), 'main')
  await clock.advance(5000)
  expect(standing(await source(), 'main')).toBe(atLibrary)
  expect(String((await liveSvg(ui))?.props.alt)).toContain('thinking…')
  await ui.unmount()
})

test('a quick tool of another kind right after arriving is done in place', { timeoutMs: 20000 }, async ($, on) => {
  const { clock, ui, source } = await setup($, on, 400)
  await $.turn.start({ turnId: 't', text: 'Work' })
  await clock.advance(3000)
  const read = $.tool.call({ tool: 'Read', file_path: '/a.rs' })
  await clock.advance(2500)
  await read
  const here = standing(await source(), 'main')
  const grep = $.tool.call({ tool: 'Grep', pattern: 'x' })
  await clock.advance(400)
  await grep
  expect(standing(await source(), 'main')).toBe(here)
  // a tool that keeps going past the stay still sends it to its own station
  const run = $.tool.call({ tool: 'Bash', command: 'ls' })
  await clock.advance(3000)
  expect(standing(await source(), 'main') !== here).toBe(true)
  await clock.advance(1000)
  await run
  await ui.unmount()
})
