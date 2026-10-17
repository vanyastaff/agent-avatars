import type { On } from 'claude-code'
import type { MockClock, TestBody } from 'claude-code/testing'

// Observe a real in-flight tool rather than mistaking its last action for
// current activity. Only the host's tool implementation is held.
export const heldTools = ($: Parameters<TestBody>[0], on: On, clock: MockClock) => {
  const waiting: Array<() => void> = []
  on('tool.call', () => new Promise(resolve => waiting.push(() => resolve({ result: 'ok' }))))
  return async (input: Parameters<typeof $.tool.call>[0]) => {
    const result = $.tool.call(input)
    await clock.settle()
    const release = waiting.shift()
    if (!release) throw new Error('The tool did not reach its host implementation')
    return async () => { release(); return await result }
  }
}

// The desktop scene is double-buffered over two frames; the one with the latest
// picture is the one whose alt describes the agents.
export const liveSvg = async (ui: { findAll: (q: { type: string }) => Promise<Array<{ props: Record<string, unknown> }>> }) =>
  (await ui.findAll({ type: 'Svg' })).find(e => String(e.props.alt).startsWith('Agents: '))
