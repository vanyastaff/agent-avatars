import { expect, mock, test } from 'claude-code/testing'

for (const [ended, mood] of [['completed', 'happy'], ['failed', 'sad'], ['killed', 'stop']] as const) {
  test(`a waiting agent marked ${ended} by the session list leaves the scene`, async ($, on) => {
    const clock = mock.clock(on, { now: 100000 })
    let status = 'waiting'
    on('agent.list', () => ({ value: [{ id: 'worker', description: 'Worker', type: 'general-purpose', status }] }))
    on('config.list', () => ({ value: [] }))
    on('command.register', () => ({ value: undefined }))
    on('session.start', () => ({ cwd: '/work' }))

    await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
    expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain('Worker [waiting]')
    status = ended
    await clock.advance(2000)
    expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain(`Worker [${mood}]`)
    await clock.advance(15000)
    expect((await $.command.run({ command: 'avatars', args: '' })).text?.split("The session's agents:")[0]).toContain('Worker')
    await clock.advance(3000)
    const scene = (await $.command.run({ command: 'avatars', args: '' })).text?.split("The session's agents:")[0]
    expect(scene).not.toContain('Worker')
  })
}

test('a running agent also retires on the host clock after completion', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  let status = 'running'
  on('agent.list', () => ({ value: [{ id: 'worker', description: 'Worker', type: 'general-purpose', status }] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))

  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  status = 'completed'
  await clock.advance(2000)
  await clock.advance(18000)
  const scene = (await $.command.run({ command: 'avatars', args: '' })).text?.split("The session's agents:")[0]
  expect(scene).not.toContain('Worker')
})

test('an agent that starts waiting after completion is not retired while blocked', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  let status = 'running'
  on('agent.list', () => ({ value: [{ id: 'worker', description: 'Worker', type: 'general-purpose', status }] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))

  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  status = 'completed'
  await clock.advance(2000)
  status = 'waiting'
  await clock.advance(16000)
  const scene = (await $.command.run({ command: 'avatars', args: '' })).text?.split("The session's agents:")[0]
  expect(scene).toMatch(/Worker.*\[waiting\]/)
  expect(scene).not.toContain('(leaving)')
})

test('a waiting agent that disappears from the session list also retires', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  let present = true
  on('agent.list', () => ({ value: present ? [{ id: 'worker', description: 'Worker', type: 'general-purpose', status: 'waiting' }] : [] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))

  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  present = false
  await clock.advance(2000)
  expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain('Worker [happy]')
  await clock.advance(18000)
  expect((await $.command.run({ command: 'avatars', args: '' })).text).not.toContain('Worker')
})

test('resuming a retiring agent cancels its exit and old retirement deadline', async ($, on) => {
  const clock = mock.clock(on, { now: 100000 })
  let status = 'running'
  on('agent.list', () => ({ value: [{ id: 'worker', description: 'Worker', type: 'general-purpose', status }] }))
  on('config.list', () => ({ value: [] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('tool.call', () => ({ result: 'ok' }))

  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  status = 'completed'
  await clock.advance(17250)
  expect((await $.command.run({ command: 'avatars', args: '' })).text).toContain('(leaving)')
  status = 'running'
  await $.tool.call({ tool: 'Read', agentId: 'worker', file_path: '/work/resumed.rs' })
  await clock.advance(20000)
  const scene = (await $.command.run({ command: 'avatars', args: '' })).text?.split("The session's agents:")[0]
  expect(scene).toMatch(/worker\s+working\s+robot: Worker/)
  expect(scene).not.toContain('(leaving)')
})
