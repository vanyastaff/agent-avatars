import { expect, mock, test } from 'claude-code/testing'
import { heldTools } from './host.ts'

const BAND = { plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop', props: { isWorking: true, bodyColumns: 95 } } as const

test('a fast tool returns immediately but still reaches its environment for a bounded result action', { options: { scene: 'home' } }, async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('tool.call', () => ({ result: 'returned immediately' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount(BAND)
  expect(await $.tool.call({ tool: 'Bash', command: 'build' })).toEqual({ result: 'returned immediately' })
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt).includes('thinking…')).toBe(true)
  await clock.advance(3000)
  const source = String((await ui.find({ type: 'Svg' }))?.props.source)
  expect(source.includes('at the kitchen stove')).toBe(true)
  expect(source.includes('Environment: kitchen stove — settling')).toBe(true)
  await clock.advance(2500)
  expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes('Environment:')).toBe(false)
  await ui.unmount()
})

test('a real command uses the home stove, settles there and stops interacting after its result', { options: { scene: 'home' } }, async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('agent.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  const start = heldTools($, on, clock)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount(BAND)
  const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
  expect((await source()).includes('Place: kitchen stove')).toBe(true)
  expect((await source()).includes('Interaction: tending the kettle')).toBe(false)
  const finish = await start({ tool: 'Bash', command: 'build' })
  await clock.advance(3000)
  expect((await source()).includes('at the kitchen stove')).toBe(true)
  expect((await source()).includes('Interaction: tending the kettle')).toBe(true)
  await clock.advance(15000)
  expect((await source()).includes('at the kitchen stove')).toBe(true)
  await finish()
  expect((await source()).includes('Interaction: setting the kettle down')).toBe(true)
  await clock.advance(2500)
  expect((await source()).includes('Interaction:')).toBe(false)
  await ui.unmount()
})

for (const [scene, places, interactions] of [
  ['meadow', ['field journal stand', 'butterfly patch', 'seedling bed', 'water wheel'], ['annotating the field journal', 'following the butterflies', 'planting the seedlings', 'turning the water wheel']],
  ['lava', ['rune tablet', 'crystal vein', 'forge anvil', 'bellows furnace'], ['tracing the runes', 'examining the crystals', 'shaping the glowing part', 'working the bellows']],
  ['sakura', ['poetry stand', 'koi pond', 'bonsai bench', 'tea hearth'], ['copying a poem', 'following the koi', 'pruning the bonsai', 'tending the tea hearth']],
  ['snow', ['expedition board', 'snow drift', 'ice sculpture', 'camp stove'], ['annotating the expedition route', 'brushing away the snow', 'carving the ice', 'warming the camp stove']],
  ['night', ['star atlas', 'observatory telescope', 'lantern bench', 'campfire'], ['marking the star atlas', 'tracking the constellations', 'assembling the lantern', 'tending the campfire']],
  ['desert', ['explorer map', 'dig site', 'mosaic table', 'oasis pump'], ['annotating the explorer map', 'brushing the buried clues', 'setting the mosaic tiles', 'working the oasis pump']],
  ['space', ['star chart console', 'radar dish', 'repair dock', 'reactor console'], ['annotating the star chart', 'scanning with the radar', 'repairing the probe', 'monitoring the reactor']],
  ['office', ['archive cabinet', 'search terminal', 'drafting desk', 'office printer'], ['annotating the archive notes', 'querying the search terminal', 'working at the drafting desk', 'feeding the office printer']],
  ['beach', ['tide chart', 'shell sorting tray', 'sandcastle', 'water pump'], ['annotating the tide chart', 'sorting the shells', 'building the sandcastle', 'working the beach pump']],
  ['city', ['news kiosk', 'transit map', 'repair stall', 'signal cabinet'], ['annotating the city news', 'tracing the transit lines', 'repairing the street gadget', 'tuning the signal cabinet']],
  ['ocean', ['shell archive', 'coral survey', 'pearl bench', 'air pump'], ['examining the shell records', 'surveying the coral', 'setting the pearls', 'working the air pump']],
  ['halloween', ['spell lectern', 'clue pumpkin', 'potion bench', 'cauldron'], ['annotating the spell book', 'examining the pumpkin clues', 'mixing the potion ingredients', 'stirring the cauldron']],
] as const) {
  test(`${scene} has four reachable objects with actions bound to the matching real tools`, { options: { scene } }, async ($, on) => {
    const clock = mock.clock(on, { now: 100000 })
    const start = heldTools($, on, clock)
    const ui = await $.ui.mount(BAND)
    const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
    for (const title of places) expect((await source()).includes(`Place: ${title}`)).toBe(true)
    for (const [i, tool] of ['Read', 'Grep', 'Edit', 'Bash'].entries()) {
      const finish = await start({ tool, file_path: '/work/a.rs', pattern: 'TODO', command: 'build' })
      await clock.advance(3000)
      await ui.redraw()
      expect((await source()).includes(`at the ${places[i]}`)).toBe(true)
      expect((await source()).includes(`Interaction: ${interactions[i]}`)).toBe(true)
      expect((await source()).includes(`Environment: ${places[i]} — working`)).toBe(true)
      await clock.advance(15000)
      await ui.redraw()
      expect((await source()).includes(`at the ${places[i]}`)).toBe(true)
      expect((await source()).length < 131072).toBe(true)
      if (i === 0) {
        await ui.redraw({ isWorking: true, bodyColumns: 45 })
        await clock.advance(3000)
        await ui.redraw()
        expect((await ui.find({ type: 'Svg' }))?.props.width).toBe(360)
        expect((await source()).includes(`at the ${places[i]}`)).toBe(true)
        expect((await source()).includes(`Interaction: ${interactions[i]}`)).toBe(true)
      }
      await finish()
    }
    expect((await source()).includes('NaN')).toBe(false)
    await ui.unmount()
  })
}

test('the office printer animates only for a real nearby command and yields to approval', { options: { scene: 'office' } }, async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  const start = heldTools($, on, clock)
  on('tool.check', () => ({ decision: 'ask', reason: 'Confirm' }))
  const ui = await $.ui.mount(BAND)
  const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
  expect((await source()).includes('paper feed moving')).toBe(false)
  const finish = await start({ tool: 'Bash', command: 'build' })
  expect((await source()).includes('paper feed moving')).toBe(false)
  await clock.advance(3000)
  await ui.redraw()
  expect((await source()).includes('paper feed moving')).toBe(true)
  expect(await $.tool.check({ tool: 'Bash', input: { command: 'build' }, tool_use_id: 'real' })).toEqual({ decision: 'ask', reason: 'Confirm' })
  expect((await source()).includes('paper feed moving')).toBe(false)
  expect((await source()).includes('Interaction:')).toBe(false)
  await finish()
  expect((await source()).includes('paper feed moving')).toBe(false)
  await ui.unmount()
})

test('a failed ocean command shows trouble at the pump and preserves the tool result', { options: { scene: 'ocean' } }, async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  on('tool.call', async () => { await clock.sleep(3000); return { result: 'pump metaphor only', isError: true } })
  const ui = await $.ui.mount(BAND)
  const result = $.tool.call({ tool: 'Bash', command: 'build' })
  await clock.settle()
  await clock.advance(3000)
  expect(await result).toEqual({ result: 'pump metaphor only', isError: true })
  const source = String((await ui.find({ type: 'Svg' }))?.props.source)
  expect(source.includes('Environment: air pump — trouble')).toBe(true)
  expect(source.includes('air bubbles leaving the hose')).toBe(false)
  expect(source.includes('! failed')).toBe(false)
  await ui.unmount()
})

for (const [skin, scene, place] of [['robot','meadow','field journal stand'], ['cat','home','reading sofa'], ['dragon','lava','rune tablet'], ['anime','sakura','poetry stand']] as const) {
  test(`auto still selects the ${scene} environment for ${skin}`, { options: { skin, scene: 'auto' } }, async ($, on) => {
    mock.clock(on, { now: 100000 })
    const ui = await $.ui.mount(BAND)
    expect(String((await ui.find({ type: 'Svg' }))?.props.source).includes(`Place: ${place}`)).toBe(true)
    expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain(`scene ${scene}`)
    await ui.unmount()
  })
}
