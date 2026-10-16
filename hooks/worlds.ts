import { actionBeat, workStation, workshopSvg, PERSONALITIES } from './theater.ts'
import type { ActionSequence, Personality, WorkKind, Liveliness, Behavior } from './theater.ts'
import { hasLife, lifePlace, lifeObjectsSvg, episodeFor } from './life.ts'
import type { Episode, LifeUse } from './life.ts'

export const hasScenePlaces = (scene: string) => scene === 'workshop' || hasLife(scene)
const slotFor = (kind: WorkKind) => kind === 'read' || kind === 'rest' || kind === 'wait' ? 0
  : kind === 'search' || kind === 'scout' ? 1 : kind === 'run' ? 3 : 2

export const scenePlace = (scene: string, kind: WorkKind, width: number, seed: number, episode?: Episode) => {
  if (hasLife(scene)) return lifePlace(scene, episode ?? episodeFor(PERSONALITIES[(seed - 1) % 5]!,0,0), width, seed)
  const index = slotFor(kind)
  const station = workStation(kind, width, seed)
  return { title: station.title, index, x: width * [0.13,0.36,0.59,0.82][index]!, actorX: station.x, place: null }
}

// Only the workshop interprets real tool categories as occupations.
export const sceneAction = (_scene: string, sequence: ActionSequence | null | undefined, personality: Personality, now: number, _behavior: Behavior) => {
  const beat = actionBeat(sequence,personality,now)
  return beat ? { ...beat, prop: undefined } : null
}

export type PlaceUse = LifeUse
export const sceneObjectsSvg = (scene: string, width: number, ground: number, now: number, uses: PlaceUse[], liveliness: Liveliness) => {
  if (hasLife(scene)) return lifeObjectsSvg(scene,width,ground,now,uses,liveliness)
  return workshopSvg(width,ground,now) + uses.map(use => {
    const station = scenePlace(scene,['read','search','craft','run'][use.index] as WorkKind,width,1)
    const effect = use.index===2 ? 'small crafting strokes' : use.index===3 ? 'reactor gauge fluctuating' : 'reference pages turning'
    const marker = use.failed ? '<path d="M18-48l6 6m-6 0 6-6" fill="none" stroke="#d38974" stroke-width="3"/>'
      : use.closing ? '' : use.index===2 ? '<path d="M-4-42l-4-5m14 4 4-6m-9 0v-6" fill="none" stroke="#e3bd81" stroke-width="2"/>'
      : use.index===3 ? '<path d="M-6-49v25m11-25v25" fill="none" stroke="#d3e1be" stroke-width="3"/>'
      : '<path d="M-7-35h11m-11 4h8" fill="none" stroke="#aa8c67" stroke-width="2"/><rect x="-4" y="-42" width="9" height="3" fill="#f0e0b9"/>'
    const motion = liveliness === 'quiet' || use.failed || use.closing ? '' : `<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="${use.period}s" begin="-${((now/1000)%use.period).toFixed(2)}s" repeatCount="indefinite"/>`
    return `<g transform="translate(${station.x} ${ground})"><title>Environment: ${station.title} — ${use.failed ? 'trouble' : use.closing ? 'settling' : 'working'}</title>${!use.failed && !use.closing ? `<title>${effect}</title>` : ''}<g class="actor-motion">${motion}${marker}</g></g>`
  }).join('')
}
