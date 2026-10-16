import { expect, mock, test } from 'claude-code/testing'
import { heldTools } from './host.ts'

const BAND = { plugin: 'agent-avatars', component: 'AbovePrompt', surface: 'desktop', props: { isWorking: true, bodyColumns: 95 } } as const

// Life activities are independent of the host's tool selection.
for (const [scene, first, next, place] of [
  ['meadow','sharing a picnic','following the butterflies','picnic blanket'],
  ['home','sinking into the sofa','playing with the toy chest','cushion sofa'],
  ['lava','dozing on a warm rock','playing among the crystals','warm rock'],
  ['sakura','sipping tea beneath the blossoms','feeding the koi','blossom picnic'],
  ['snow','warming up with cocoa','rolling a snowball','cocoa fire'],
  ['night','telling stories by the fire','chasing fireflies','story fire'],
  ['desert','lounging at the oasis','sliding down the dune','oasis cushions'],
  ['space','swaying in a zero-gravity hammock','watching the passing comets','orbital hammock'],
  ['office','chatting over coffee','launching paper planes','coffee nook'],
  ['beach','swaying in the beach hammock','looking for beautiful shells','beach hammock'],
  ['city','warming hands at the barrel','turning skewers on the street grill','barrel fire'],
  ['ocean','nestling in the anemones','swimming with the little fish','anemone bed'],
  ['halloween','lounging among the pumpkins','playing hide-and-seek with a ghost','pumpkin cushions'],
] as const) {
  test(`${scene} has its own life across tools and a narrow resize`, { options: { scene } }, async ($, on) => {
    const clock = mock.clock(on, { now: 100000 })
    on('agent.list', () => ({ value: [] }))
    on('config.list', () => ({ value: [] }))
    on('command.register', () => ({ value: undefined }))
    on('session.start', () => ({ cwd: '/work' }))
    const start = heldTools($, on, clock)
    await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount(BAND)
    const source = async () => String((await ui.find({ type: 'Svg' }))?.props.source)
    expect(await source()).toContain(`Place: ${place}`)
    const finish = await start({ tool: 'Bash', command: 'build' })
    await clock.advance(3000)
    expect(await source()).toContain(`Life: ${first}`)
    expect(await source()).toContain('running…')
    await ui.redraw({ isWorking: true, bodyColumns: 45 })
    await clock.advance(3000)
    expect((await ui.find({ type: 'Svg' }))?.props.width).toBe(360)
    expect(await source()).toContain(`Life: ${first}`)
    await clock.advance(9000)
    expect(await source()).toContain(`Life: ${next}`)
    expect((await source()).includes('NaN')).toBe(false)
    expect((await source()).length < 131072).toBe(true)
    await finish()
    await ui.unmount()
  })
}

for (const [skin, scene, place] of [['robot','meadow','picnic blanket'], ['cat','home','cushion sofa'], ['dragon','lava','warm rock'], ['anime','sakura','blossom picnic']] as const) {
  test(`auto still selects ${scene} life for ${skin}`, { options: { skin, scene: 'auto' } }, async ($, on) => {
    mock.clock(on, { now: 100000 })
    const ui = await $.ui.mount(BAND)
    expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain(`Place: ${place}`)
    expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain(`scene ${scene}`)
    await ui.unmount()
  })
}
