// Pure pixel artwork and performance rules. Host events and lifetimes stay in register.tsx.
const r = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`

export const PERSONALITIES = [
  { id: 'meticulous', title: 'Meticulous', habit: 'lines everything up', pace: 0.85, lean: 1, period: 2.8 },
  { id: 'curious', title: 'Curious', habit: 'looks behind everything', pace: 1.15, lean: 5, period: 1.9 },
  { id: 'dramatic', title: 'Dramatic', habit: 'makes an entrance', pace: 1.3, lean: 7, period: 1.3 },
  { id: 'sleepy', title: 'Sleepy', habit: 'takes a tiny nap', pace: 0.65, lean: 3, period: 4.2 },
  { id: 'shy', title: 'Shy', habit: 'peeks out before joining', pace: 0.8, lean: 2, period: 3.4 },
] as const
export type Personality = typeof PERSONALITIES[number]
export type Behavior = 'cozy' | 'chaotic' | 'adventure'
export type Liveliness = 'quiet' | 'normal' | 'lively'
export type WorkKind = 'plan' | 'think' | 'reply' | 'read' | 'search' | 'craft' | 'run' | 'scout' | 'dispatch' | 'rest' | 'wait'
type Prop = 'book' | 'notebook' | 'upside-book' | 'stack' | 'map' | 'scroll' | 'magnifier' | 'lantern' | 'net' | 'magnet' | 'compass' | 'pencil' | 'wrench' | 'hammer' | 'mallet' | 'crank' | 'tea' | 'rocket' | 'telescope' | 'parcel' | 'pillow'
export type Performance = { prop: Prop; description: string; kind: WorkKind }

// A tool owns its choreography. Time may advance its working beats, but only
// the real tool result can move it into a closing beat.
export type ActionSequence = { kind: WorkKind; variant: number; at: number; endedAt?: number; failed?: boolean }
export const ACTION_END_MS = 2200
export type DuetKind = 'welcome' | 'message' | 'trouble' | 'finished'
export const DUET_MS = 4400
export const duetBeat = (kind: DuetKind, role: 'send' | 'recv', p: Personality, at: number, now: number) => {
  const age = now - at
  if (age >= DUET_MS) return null
  const stage = age < 900 ? 0 : age < 2100 ? 1 : age < 3400 ? 2 : 3
  const title = { welcome: 'welcoming a teammate', message: 'message handoff', trouble: 'a tool needs attention', finished: 'a task has finished' }[kind]
  const gestures: Record<Personality['id'], [string, string]> = {
    meticulous: ['passes a neatly folded note', 'aligns the edges of the note'],
    curious: ['opens a box of clues', 'checks both sides of the note'],
    dramatic: ['unfurls the note with a flourish', 'raises the note like a trophy'],
    sleepy: ['offers the note with a yawn', 'wakes up to catch the note'],
    shy: ['slides the note over gently', 'accepts the note with a small nod'],
  }
  const welcome = role === 'send' ? 'offers the workshop kit' : ({ meticulous: 'sorts the workshop kit', curious: 'looks inside every compartment', dramatic: 'presents the new toolkit proudly', sleepy: 'checks the kit for a cushion', shy: 'opens the kit a little at a time' }[p.id])
  const trouble = role === 'send' ? ({ meticulous: 'lays out the troublesome parts', curious: 'peers into the stalled mechanism', dramatic: 'ducks behind the workbench', sleepy: 'blinks at the stalled mechanism', shy: 'points out the troublesome part' }[p.id])
    : ({ meticulous: 'compares the parts with a drawing', curious: 'inspects the loose part', dramatic: 'holds up a warning flag', sleepy: 'brings a calming cup', shy: 'offers a spare wrench' }[p.id])
  const finished = role === 'send' ? 'sets the finished task on the table' : ({ meticulous: 'stamps the task card', curious: 'examines the finished piece', dramatic: 'gives a theatrical salute', sleepy: 'raises a sleepy toast', shy: 'offers a quiet high five' }[p.id])
  const gesture = kind === 'message' ? gestures[p.id][role === 'send' ? 0 : 1] : kind === 'welcome' ? welcome : kind === 'trouble' ? trouble : finished
  return { stage, title, gesture: stage === 0 ? 'approaches the teammate' : stage === 3 ? 'returns to the work station' : gesture }
}

export const duetSvg = (kind: DuetKind, role: 'send' | 'recv', p: Personality, at: number, now: number, ground: number, toward: number, mode: Behavior, liveliness: Liveliness) => {
  const beat = duetBeat(kind, role, p, at, now)
  if (!beat) return ''
  const active = beat.stage === 1 || beat.stage === 2
  const prop: Prop = kind === 'welcome' ? role === 'send' ? 'parcel' : 'wrench'
    : kind === 'trouble' ? role === 'send' ? 'crank' : p.id === 'sleepy' ? 'tea' : p.id === 'curious' ? 'magnifier' : 'wrench'
    : kind === 'finished' ? role === 'send' ? 'notebook' : p.id === 'sleepy' ? 'tea' : 'pencil'
    : role === 'send' && p.id === 'curious' ? 'parcel'
    : role === 'recv' && beat.stage === 1 && p.id === 'curious' ? 'magnifier' : mode === 'adventure' ? 'map' : 'scroll'
  // The note changes hands at the reaction beat; there is no random choice or
  // message text in the artwork. Personality supplies the receiving gesture.
  const holds = kind !== 'message' || role === 'send' && beat.stage <= 1 || role === 'recv' && beat.stage >= 2 || role === 'recv' && beat.stage === 1 && p.id === 'curious'
  const object = holds ? propSvg({ kind: 'dispatch', prop, description: beat.gesture }, ground, '#c7b98e', now, mode, liveliness) : ''
  const hand = active ? `<path d="M0 ${ground - 18}h${toward * 23}" stroke="#c7b98e" stroke-width="5"/>` : ''
  const mark = active && beat.stage === 2 ? p.id === 'dramatic' ? `<path d="M0 ${ground - 68}l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e2bf71"/>`
    : p.id === 'sleepy' ? `<path d="M-4 ${ground - 59}h8l-8 8h8" fill="none" stroke="#b8c7d0" stroke-width="2"/>`
    : `<path d="M-4 ${ground - 56}l3 3 6-7" fill="none" stroke="#a5bea4" stroke-width="2"/>` : ''
  const extension = active ? toward * 9 : 0
  const lift = !active ? 0 : p.id === 'dramatic' && beat.stage === 2 ? -24 : p.id === 'shy' ? 7 : p.id === 'sleepy' ? 4 : p.id === 'curious' ? -8 : 0
  const tilt = !active ? 0 : p.id === 'dramatic' ? toward * -8 : p.id === 'sleepy' ? toward * 12 : p.id === 'shy' ? toward * -4 : toward * 3
  return `<g><title>Together: ${beat.title}; ${p.title} ${beat.gesture}</title><g class="actor-motion" transform="rotate(${tilt} 0 ${ground})">${hand}<g transform="translate(${extension} ${lift}) scale(${toward} 1)">${object}</g></g>${mark}</g>`
}
const ACTIONS: Partial<Record<WorkKind, [string, string, string, string]>> = {
  read: ['selecting a reference', 'studying the pages', 'noting the reference', 'returning the reference'],
  search: ['unfolding the search map', 'tracing possible clues', 'marking the search area', 'folding the search map'],
  craft: ['laying out the tools', 'fitting a small part', 'refining the piece', 'putting the tools away'],
  run: ['priming the mechanism', 'watching the gauges', 'tending the mechanism', 'winding down the mechanism'],
  scout: ['extending the telescope', 'surveying the horizon', 'sketching the route', 'stowing the scouting gear'],
}
const MANNER: Record<Personality['id'], [string, string]> = {
  meticulous: ['measures the spacing', 'aligns the tools'], curious: ['checks underneath', 'takes one last peek'],
  dramatic: ['strikes a grand pose', 'takes a tiny bow'], sleepy: ['rubs sleepy eyes', 'stifles a yawn'],
  shy: ['peeks around the edge', 'gives a small nod'],
}
const RETURNS: Partial<Record<WorkKind, [string, string]>> = {
  read: ['reviewing the returned reference', 'filing the reading notes'],
  search: ['reviewing the returned clues', 'sorting the search markers'],
  craft: ['reviewing the returned edit', 'setting the edited piece down'],
  run: ['reviewing the returned command', 'checking the stopped mechanism'],
  scout: ['reviewing the returned lookup', 'folding the route sketch'],
}
export const actionBeat = (s: ActionSequence | null | undefined, p: Personality, now: number) => {
  if (!s || !ACTIONS[s.kind]) return null
  const closed = s.endedAt !== undefined
  if (closed && now - s.endedAt! >= ACTION_END_MS) return null
  const fast = closed && !s.failed && s.endedAt! - s.at < 800
  const closingAge = closed ? now - s.endedAt! : 0
  const stage = closed ? fast && closingAge < 600 ? 1 : fast && closingAge < 1300 ? 2 : 3 : now - s.at < 800 ? 0 : now - s.at < 2200 ? 1 : 2
  const label = closed && s.failed ? 'setting the troublesome tool aside'
    : fast && stage < 3 ? RETURNS[s.kind]![stage - 1]! : ACTIONS[s.kind]![stage]!
  return { stage, label, manner: MANNER[p.id][stage === 0 ? 0 : 1], failed: !!s.failed }
}

export const actionSvg = (s: ActionSequence, p: Personality, ground: number, hand: string, now: number, mode: Behavior, liveliness: Liveliness) => {
  const beat = actionBeat(s, p, now)
  if (!beat) return ''
  const performance = performanceFor(s.kind, mode, p, s.variant)
  // Preparation reaches out, focus brings the object to eye level, sustained
  // work leaves room for a notebook, and the result puts the object down.
  const prop = beat.stage === 2 && s.kind === 'read' ? { ...performance, prop: 'notebook' as const }
    : beat.stage === 2 && s.kind === 'scout' ? { ...performance, prop: 'map' as const } : performance
  const offset = beat.stage === 0 ? [-9, -5] : beat.stage === 1 ? [-4, -12] : beat.stage === 3 ? [-8, 1] : [0, 0]
  const amplitude = liveliness === 'quiet' ? 0 : mode === 'chaotic' ? 7 : 3
  let detail = ''
  if (s.kind === 'craft' && beat.stage === 2) detail = r(21, ground - 4, 15, 4, '#aac1b3') + r(25, ground - 7, 5, 3, '#d4bd7f')
  if (s.kind === 'search' && beat.stage >= 1 && beat.stage < 3) detail = `<path d="M32 ${ground - 17}l3 3 5-7" fill="none" stroke="#d4bd7f" stroke-width="2"/>`
  if (s.kind === 'run' && beat.stage >= 1 && beat.stage < 3) detail = `<path d="M30 ${ground - 29}v-8h9v8" fill="none" stroke="#91b3a0" stroke-width="2"/>` + r(33, ground - 35, 3, 4, '#dfbd73')
  if (beat.failed) detail = `<path d="M23 ${ground - 32}l4 4m-4 0 4-4" stroke="#ce806a" stroke-width="2"/>`
  const closeAge = s.endedAt === undefined ? 0 : Math.max(0, now - s.endedAt) / 1000
  const motion = beat.stage === 3 ? liveliness === 'quiet' ? '' : `<animateTransform attributeName="transform" type="translate" values="0 -9;0 5;0 5" keyTimes="0;.6;1" dur="2.2s" begin="-${closeAge.toFixed(2)}s" fill="freeze"/>`
    : amplitude ? `<animateTransform attributeName="transform" type="translate" values="0 0;${amplitude} -2;0 0" dur="${p.period}s" repeatCount="indefinite"/>` : ''
  return `<g><title>Action: ${beat.label}; ${p.title} ${beat.manner}</title><g transform="translate(${offset[0]} ${offset[1]})"><g class="actor-motion">${motion}${propSvg(prop, ground, hand, now, mode, liveliness, beat.stage !== 3)}</g></g>${detail}</g>`
}

export const actionPose = (body: string, s: ActionSequence | null | undefined, p: Personality, ground: number, now: number, liveliness: Liveliness) => {
  const beat = actionBeat(s, p, now)
  if (!beat || liveliness === 'quiet') return body
  const lean = { meticulous: 2, curious: 11, dramatic: -9, sleepy: 15, shy: -6 }[p.id]
  const angle = beat.stage === 0 ? -lean / 2 : beat.stage === 1 ? lean : beat.stage === 3 ? 0 : lean / 3
  return `<g class="actor-motion" transform="rotate(${angle} 0 ${ground})">${body}</g>`
}
export const flourishInterval = (liveliness: Liveliness) => ({ quiet: 30000, normal: 16000, lively: 8000 })[liveliness]
export const FLOURISH_MS = 2200
export const MOTION_CSS = '@media(prefers-reduced-motion:reduce){.actor-motion{transform:none!important}.duet-motion{transform:translate(var(--duet-x),0)!important}}'

export type SceneCue = { kind: 'command' | 'config' | 'compact' | 'incoming' | 'permission' | 'tool-error' | 'tool-result'; at: number; performance?: Performance }
export const CUE_MS = 3200
export const cueLabel = (cue: SceneCue) => ({ command: 'checking the task board', config: 'changing the stage settings', compact: 'packing the notes', incoming: 'a message arrived', permission: 'waiting for approval', 'tool-error': 'the tool reported an error', 'tool-result': 'the last tool returned' })[cue.kind]
export const cueSvg = (cue: SceneCue | null, ground: number, now: number, liveliness: Liveliness) => {
  if (!cue) return ''
  const y = ground - 47
  let art = ''
  if (cue.kind === 'command') art = r(-15, y - 4, 30, 21, '#9c7b50') + r(-12, y - 1, 24, 14, '#dfc99d') + r(-8, y + 3, 16, 2, '#8f8264') + r(-8, y + 8, 10, 2, '#8f8264')
  if (cue.kind === 'config') art = `<path d="M-4 ${y - 8}h8v5l5 3 4-3 4 7-5 3v5l5 3-4 7-4-3-5 3v5h-8v-5l-5-3-4 3-4-7 5-3v-5l-5-3 4-7 4 3 5-3z" fill="#b9ad82"/><circle cy="${y + 7}" r="5" fill="#49666a"/>`
  if (cue.kind === 'compact') art = r(-16, y + 9, 32, 7, '#b47f58') + r(-14, y + 2, 28, 6, '#ddcc9d') + r(-11, y - 5, 22, 6, '#f1dfb4') + r(-2, y - 5, 4, 21, '#8da898')
  if (cue.kind === 'incoming') art = r(-15, y, 30, 20, '#e1c58b') + `<path d="M-15 ${y}l15 10 15-10" fill="none" stroke="#a57d53" stroke-width="2"/>` + r(-3, y + 9, 6, 5, '#b66b59')
  if (cue.kind === 'permission') art = `<circle cx="-8" cy="${y + 4}" r="7" fill="none" stroke="#ddbc72" stroke-width="4"/><path d="M-2 ${y + 7}l16 9m-4-2 3-5" stroke="#ddbc72" stroke-width="4"/>`
  if (cue.kind === 'tool-error') art = r(-13, y - 4, 26, 24, '#b76b59') + r(-2, y, 4, 11, '#f1dfbf') + r(-2, y + 14, 4, 3, '#f1dfbf')
  if (cue.kind === 'tool-result' && cue.performance) art = propSvg(cue.performance, ground - 36, '#c7b98e', now, 'cozy', liveliness)
  const phase = Math.max(0, now - cue.at) / 1000
  const move = liveliness === 'quiet' ? '' : `<animateTransform attributeName="transform" type="translate" values="0 4;0 -2;0 0" dur=".6s" begin="-${phase.toFixed(2)}s" fill="freeze"/>`
  return `<g><title>Event: ${cueLabel(cue)}</title><g class="actor-motion">${move}${art}</g></g>`
}

export const flourishSvg = (p: Personality, ground: number, started: number | null, now: number, mode: Behavior, liveliness: Liveliness) => {
  if (started === null) return ''
  const age = Math.max(0, now - started) / 1000
  const d = FLOURISH_MS / 1000
  const timing = `dur="${d}s" begin="-${age.toFixed(2)}s" fill="freeze"`
  let art = ''
  if (p.id === 'meticulous') {
    art += r(-23, ground - 2, 46, 3, '#d4bd7f')
    for (let i = 0; i < 4; i++) art += `<g class="actor-motion"><animateTransform attributeName="transform" type="translate" values="${i % 2 ? 6 : -5} -${5 + i * 2};0 0;0 0" keyTimes="0;.65;1" ${timing}/>${r(-18 + i * 11, ground - 6, 5, 4, '#aac1b3')}</g>`
  } else if (p.id === 'curious') {
    art += r(29, ground - 14, 24, 14, '#b48a57') + r(37, ground - 14, 4, 14, '#ddc48a')
    art += `<g class="actor-motion"><animateTransform attributeName="transform" type="rotate" values="0 29 ${ground - 14};-38 29 ${ground - 14};0 29 ${ground - 14}" ${timing}/>${r(27, ground - 18, 28, 4, '#cfab70')}</g>`
    art += r(39, ground - 27, 4, 4, '#ecd67d')
  } else if (p.id === 'dramatic') {
    for (const [x, y] of [[-27, ground - 46], [25, ground - 38], [6, ground - 56]]) art += `<path d="M${x} ${y - 5}l2 3 3 2-3 2-2 3-2-3-3-2 3-2z" fill="#e9c57b"/>`
  } else if (p.id === 'sleepy') {
    for (let i = 0; i < 3; i++) art += `<circle cx="${14 + i * 7}" cy="${ground - 35 - i * 7}" r="${3 - i * 0.5}" fill="none" stroke="#b5c5d1" stroke-width="2"/>`
  } else {
    art += `<path d="M-23 ${ground - 3}v-15m0 8q-13-11-8-14 11-1 8 14m0-4q9-12 14-7 0 9-14 7" stroke="#91b387" stroke-width="2" fill="#91b387"/>`
  }
  const mark = mode === 'cozy' ? `<path d="M-3 ${ground - 51}q-6-7-9-1-2 5 9 11 11-6 9-11-3-6-9 1" fill="#c9867c"/>`
    : mode === 'chaotic' ? r(-34, ground - 32, 5, 5, '#d0b478') + r(32, ground - 50, 4, 4, '#a1bfbc')
    : `<path d="M0 ${ground - 58}l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#c6c698"/>`
  const motion = liveliness === 'quiet' ? '' : `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.8;1" ${timing}/>`
  return `<g><title>Personality moment: ${p.habit}</title>${motion}${art}${mark}</g>`
}

export const kindForTool = (tool: string): WorkKind => {
  if (/^(Read|NotebookRead)$/.test(tool)) return 'read'
  if (/^(Grep|Glob|ToolSearch)$/.test(tool)) return 'search'
  if (/^(Edit|Write|NotebookEdit)$/.test(tool)) return 'craft'
  if (/^(Bash|PowerShell|Monitor)$/.test(tool)) return 'run'
  if (/^(WebFetch|WebSearch)$/.test(tool)) return 'scout'
  if (/^(Agent|Task|Workflow|SendMessage)$/.test(tool)) return 'dispatch'
  return 'plan'
}

const PROPS: Record<Prop, string> = {
  book: 'reading a book', notebook: 'taking notes', 'upside-book': 'reading upside down', stack: 'juggling a stack of books',
  map: 'studying a map', scroll: 'unrolling a scroll', magnifier: 'searching with a magnifier', lantern: 'looking with a lantern',
  net: 'searching with a butterfly net', magnet: 'fishing for clues with a magnet', compass: 'checking a compass',
  pencil: 'working with a pencil', wrench: 'adjusting a mechanism', hammer: 'shaping a tiny part', mallet: 'using an enormous mallet',
  crank: 'turning a crank', tea: 'holding a warm cup', rocket: 'watching a tiny rocket', telescope: 'looking through a telescope',
  parcel: 'carrying a parcel', pillow: 'hugging a cushion',
}

const REPERTOIRE: Record<Behavior, Record<WorkKind, Prop[]>> = {
  cozy: { plan: ['map', 'scroll'], think: ['notebook', 'tea'], reply: ['pencil', 'notebook'], read: ['book', 'notebook'], search: ['magnifier', 'lantern'], craft: ['pencil', 'wrench', 'hammer'], run: ['crank', 'tea'], scout: ['telescope', 'map'], dispatch: ['parcel', 'scroll'], rest: ['tea', 'pillow'], wait: ['tea', 'notebook'] },
  chaotic: { plan: ['stack', 'compass'], think: ['compass', 'upside-book'], reply: ['pencil', 'scroll'], read: ['upside-book', 'stack'], search: ['net', 'magnet'], craft: ['mallet', 'wrench'], run: ['rocket', 'crank'], scout: ['telescope', 'net'], dispatch: ['stack', 'parcel'], rest: ['stack', 'pillow'], wait: ['compass', 'tea'] },
  adventure: { plan: ['map', 'compass'], think: ['compass', 'lantern'], reply: ['scroll', 'pencil'], read: ['scroll', 'map'], search: ['compass', 'lantern'], craft: ['hammer', 'wrench'], run: ['crank', 'lantern'], scout: ['telescope', 'compass'], dispatch: ['map', 'parcel'], rest: ['map', 'tea'], wait: ['lantern', 'map'] },
}

export const performanceFor = (kind: WorkKind, mode: Behavior, personality: Personality, sequence: number): Performance => {
  const choices = REPERTOIRE[mode][kind]
  const prop = choices[(sequence + PERSONALITIES.indexOf(personality)) % choices.length]!
  return { prop, description: PROPS[prop], kind }
}

export const propSvg = (p: Performance, ground: number, hand: string, now: number, mode: Behavior, liveliness: Liveliness, animated = true) => {
  let art = ''
  const book = r(0, 1, 22, 16, '#916755') + r(2, 0, 8, 14, '#f3dfb0') + r(12, 0, 8, 14, '#e6cb98') + r(10, 1, 2, 15, '#ba9569') + r(4, 4, 4, 1, '#a28b64') + r(14, 4, 4, 1, '#a28b64')
  if (p.prop === 'book' || p.prop === 'upside-book') art = `<g transform="rotate(${p.prop === 'upside-book' ? 180 : -6} 11 8)">${book}</g>`
  if (p.prop === 'stack') art = r(-3, 12, 26, 6, '#bc735d') + r(0, 5, 25, 6, '#71978c') + `<g transform="rotate(-14 10 0)">${r(-4, -3, 26, 6, '#cfb679')}${r(-1, -2, 20, 3, '#f3dfb0')}</g>`
  if (p.prop === 'notebook') art = r(0, 0, 17, 19, '#8b9d8b') + r(3, 1, 13, 16, '#eee0bc') + r(5, 5, 8, 1, '#839ba0') + r(5, 9, 8, 1, '#839ba0') + `<path d="M10 16l9-13" stroke="#d69c51" stroke-width="3"/>`
  if (p.prop === 'map') art = `<path d="M-2 0l9 3 9-3 9 3v18l-9-3-9 3-9-3z" fill="#e8cd92"/><path d="M3 14l6-6 7 4 5-6" fill="none" stroke="#9b7855" stroke-width="2" stroke-dasharray="2 2"/>` + r(18, 4, 4, 4, '#ba6654')
  if (p.prop === 'scroll') art = r(0, 0, 23, 19, '#ead6a5') + r(-3, -1, 5, 21, '#bc985f') + r(21, -1, 5, 21, '#bc985f') + r(6, 5, 11, 1, '#9f8d6b') + r(6, 9, 8, 1, '#9f8d6b')
  if (p.prop === 'magnifier') art = `<circle cx="12" cy="4" r="9" fill="#b6d9d4" fill-opacity=".5" stroke="#d7b775" stroke-width="3"/><path d="M5 12l-7 10" stroke="#7a5844" stroke-width="5"/>` + r(12, -1, 4, 3, '#e6efda')
  if (p.prop === 'lantern') art = r(4, 2, 14, 17, '#7b8e83') + r(7, 5, 8, 11, '#f1ca76') + r(2, 0, 18, 3, '#c6b37e') + `<path d="M6 0v-6h10v6" fill="none" stroke="#bba674" stroke-width="2"/>`
  if (p.prop === 'net') art = `<path d="M1 21l10-24" stroke="#aa8054" stroke-width="3"/><ellipse cx="15" cy="-3" rx="10" ry="13" fill="#b8d3c0" fill-opacity=".2" stroke="#a3b6a0" stroke-width="2"/><path d="M8-10l14 14M6-4l16 13M12-14l10 16" stroke="#a3b6a0" stroke-width="1"/>`
  if (p.prop === 'magnet') art = `<path d="M3 2v10q7 11 14 0V2" fill="none" stroke="#b96c60" stroke-width="6"/>` + r(0, -1, 6, 5, '#b5c7c0') + r(14, -1, 6, 5, '#b5c7c0') + r(9, 20, 4, 3, '#c7b485')
  if (p.prop === 'compass') art = `<circle cx="10" cy="9" r="11" fill="#d3b775"/><circle cx="10" cy="9" r="8" fill="#e7dfc0"/><path d="M10 1l4 8-4 8-4-8z" fill="#b16659"/>`
  if (p.prop === 'pencil') art = `<path d="M0 20L20-4" stroke="#e3b85f" stroke-width="4"/>` + r(19, -5, 4, 4, '#bd7564') + r(-2, 18, 3, 3, '#3e5054') + r(4, 19, 18, 2, '#e7d9b5')
  if (p.prop === 'wrench') art = `<path d="M2 21L16 2M11-4v8l5 4 6-5v-7" fill="none" stroke="#a5b7b1" stroke-width="5"/>`
  if (p.prop === 'hammer' || p.prop === 'mallet') art = r(6, 0, 4, 22, '#aa7950') + r(p.prop === 'mallet' ? -10 : -3, -5, p.prop === 'mallet' ? 36 : 22, 10, '#95a7a2') + r(p.prop === 'mallet' ? -10 : -3, -5, 4, 10, '#c0cdc0')
  if (p.prop === 'crank') art = `<circle cx="11" cy="9" r="10" fill="#607d7b" stroke="#b5c1a8" stroke-width="3"/><g class="actor-motion">${animated && liveliness !== 'quiet' ? `<animateTransform attributeName="transform" type="rotate" from="0 11 9" to="360 11 9" dur="3s" begin="-${((now / 1000) % 3).toFixed(2)}s" repeatCount="indefinite"/>` : ''}${r(9, -1, 4, 12, '#d2b77a')}${r(8, -3, 6, 5, '#b66e59')}</g>`
  if (p.prop === 'tea') art = r(0, 6, 17, 13, '#d3b998') + r(2, 7, 13, 3, '#785941') + `<path d="M17 8h5v8h-5" fill="none" stroke="#d3b998" stroke-width="3"/><path d="M5 2q-4-4 0-8m7 8q-4-4 0-8" fill="none" stroke="#c7c9ba" stroke-width="2"/>`
  if (p.prop === 'rocket') art = `<path d="M5 15V2l5-9 5 9v13l-5-3z" fill="#c6d4c5"/><path d="M5 7l-5 10h5m10-10 5 10h-5" fill="#b56556"/>` + r(8, 0, 4, 5, '#648f9a') + r(8, 15, 4, 7, '#e8b963')
  if (p.prop === 'telescope') art = `<g transform="rotate(-22 3 15)">${r(-1, 2, 25, 11, '#ba9b62')}${r(21, -1, 7, 17, '#89a6a3')}${r(-4, 4, 5, 7, '#6e8c8d')}</g>` + r(8, 14, 3, 9, '#725943')
  if (p.prop === 'parcel') art = r(-2, 0, 25, 20, '#bc945f') + r(8, 0, 4, 20, '#e4ce99') + r(-2, 6, 25, 3, '#e4ce99') + r(15, 12, 5, 4, '#ece0b5')
  if (p.prop === 'pillow') art = `<path d="M-3 0l7 2 15-2 6 4-2 13-6 3-17-2-4-4z" fill="#929db5"/>` + r(6, 7, 6, 3, '#c5c5cf')
  const power = { quiet: 0.15, normal: 1, lively: 1.35 }[liveliness]
  const angle = (p.kind === 'craft' ? 15 : p.kind === 'search' ? 7 : 3) * power * (mode === 'chaotic' ? 1.6 : 1)
  const dur = p.kind === 'craft' ? 0.9 : p.kind === 'search' ? 2.2 : 3.6
  const phase = ((now / 1000) % dur).toFixed(2)
  return `<g transform="translate(15 ${ground - 23})"><title>${p.description}</title><g class="actor-motion">${animated && liveliness !== 'quiet' ? `<animateTransform attributeName="transform" type="rotate" values="-${angle} 0 20;${angle} 0 20;-${angle} 0 20" dur="${dur}s" begin="-${phase}s" repeatCount="indefinite"/>` : ''}${art}${r(-4, 12, 7, 5, hand)}</g></g>`
}

export const personalitySvg = (p: Personality, body: string, ground: number, now: number, behavior: Behavior, liveliness: Liveliness) => {
  const y = ground - 30
  let accessory = ''
  if (p.id === 'meticulous') accessory = r(17, y + 4, 3, 17, '#ecc877') + r(17, y + 2, 3, 3, '#b56257') + r(17, y + 20, 3, 2, '#3f4145')
  if (p.id === 'curious') accessory = `<path d="M-14 ${y + 7}l19 19" stroke="#6f503c" stroke-width="3"/>` + r(-24, y + 17, 10, 12, '#b18b56') + r(-23, y + 18, 8, 3, '#ddbc79')
  if (p.id === 'dramatic') accessory = r(-19, y + 16, 38, 4, '#ce695d') + `<path d="M17 ${y + 16}l18 4-5 5-13-5z" fill="#ce695d"/>`
  if (p.id === 'sleepy') accessory = `<path d="M-15 ${y + 1}l8-12 17 9 4 7z" fill="#7c91b2"/>` + r(-15, y - 1, 30, 4, '#bec6ca') + r(9, y - 5, 6, 6, '#e3d3a7')
  if (p.id === 'shy') accessory = `<path d="M-20 ${y + 3}l6-9h28l6 9v13h-4V${y + 3}h-32v13h-4z" fill="#78977c"/>` + r(-20, y + 17, 40, 4, '#78977c')
  const intensity = { quiet: 0.2, normal: 1, lively: 1.4 }[liveliness] * { cozy: 0.6, chaotic: 1.5, adventure: 0.9 }[behavior]
  const lean = (p.lean * intensity).toFixed(1)
  const phase = ((now / 1000) % p.period).toFixed(2)
  return `<g><title>${p.title}: ${p.habit}</title><g class="actor-motion"><animateTransform attributeName="transform" type="rotate" values="0 0 ${ground};${lean} 0 ${ground};0 0 ${ground};-${lean} 0 ${ground};0 0 ${ground}" dur="${p.period}s" begin="-${phase}s" repeatCount="indefinite"/>${body}${accessory}</g></g>`
}

export const workshopStations = (width: number) => [0.13, 0.36, 0.59, 0.82].map(f => Math.round(width * f))

export const workStation = (kind: WorkKind, width: number, seed: number) => {
  const xs = workshopStations(width)
  const [x, title] = kind === 'read' ? [xs[0]! + 26, 'library']
    : kind === 'search' || kind === 'scout' ? [xs[1]! - 12, 'map board']
    : kind === 'run' ? [xs[3]! - 29, 'engine']
    : kind === 'rest' || kind === 'wait' ? [width >= 620 ? width - 60 : xs[0]! + 30, 'tea corner']
    : [xs[2]! - 18, kind === 'craft' ? 'workbench' : 'planning table']
  // Small stages keep actors in distinct personal work spaces; their held
  // objects identify the station activity without piling up at one cabinet.
  const slots = Math.max(2, Math.min(8, Math.floor((width - 30) / 62)))
  const position = width < 620 ? 40 + ((seed - 1) % slots) * (width - 82) / (slots - 1) : Number(x) + ((seed - 1) % 3 - 1) * 11
  return { x: Math.max(40, Math.min(width - 42, position)), title: String(title) }
}

export const workshopSvg = (width: number, ground: number, now: number) => {
  const [library, board, bench, engine] = workshopStations(width) as [number, number, number, number]
  const y = ground
  let out = ''
  // A peg rail and warm task lights give the room a shared horizon.
  out += r(22, y - 106, width - 44, 3, '#9a7351')
  for (const x of [library, board, bench, engine]) {
    out += r(x, y - 106, 2, 11, '#7b614c') + r(x - 10, y - 95, 22, 3, '#dba44e')
    out += `<path d="M${x - 9} ${y - 92}l-17 63h54l-17-63z" fill="#e9b35d" opacity=".055"/>`
  }
  out += `<g><title>Library</title>`
  out += r(library - 29, y - 77, 58, 77, '#624b3d') + r(library - 25, y - 73, 50, 68, '#332e30')
  const colors = ['#79a78b', '#c86c57', '#d9b76b', '#6f97ae', '#aa89ad']
  for (let row = 0; row < 3; row++) {
    for (let book = 0; book < 6; book++) {
      const h = 13 + (book * 7 + row * 3) % 7
      const x = library - 22 + book * 8
      const by = y - 53 + row * 22
      out += r(x, by - h, 6, h, colors[(row + book) % colors.length]!) + r(x + 1, by - h + 3, 4, 1, '#efd9ad')
    }
    out += r(library - 26, y - 52 + row * 22, 52, 3, '#aa8056')
  }
  out += '</g><g><title>Map board</title>'
  out += r(board - 33, y - 72, 66, 48, '#715640') + r(board - 29, y - 68, 58, 40, '#d6c093')
  out += `<path d="M${board - 22} ${y - 38}l13-17 15 9 15-15" fill="none" stroke="#987f5a" stroke-width="2" stroke-dasharray="3 3"/>`
  out += r(board - 17, y - 59, 5, 5, '#b15d4d') + r(board + 18, y - 63, 4, 4, '#688c7a')
  out += r(board - 26, y - 24, 4, 24, '#856246') + r(board + 22, y - 24, 4, 24, '#856246')
  out += r(board - 19, y - 14, 31, 14, '#657e7d') + r(board - 13, y - 18, 19, 4, '#a6b4a0')
  out += '</g><g><title>Workbench</title>'
  out += r(bench - 38, y - 27, 76, 6, '#b78a5c') + r(bench - 34, y - 21, 6, 21, '#79563d') + r(bench + 28, y - 21, 6, 21, '#79563d')
  out += r(bench - 27, y - 13, 53, 4, '#8d6849') + r(bench - 20, y - 43, 25, 16, '#536c72')
  out += r(bench - 24, y - 45, 33, 4, '#90a5a0') + r(bench - 10, y - 39, 7, 7, '#c4b778')
  out += r(bench + 19, y - 43, 4, 16, '#946343') + r(bench + 13, y - 47, 16, 6, '#9aa9a6')
  out += '</g><g><title>Engine</title>'
  out += r(engine - 22, y - 63, 44, 63, '#486466') + r(engine - 17, y - 57, 34, 30, '#263d43')
  out += r(engine - 13, y - 53, 26, 22, '#8fbdab')
  out += r(engine - 9, y - 45, 17, 3, '#3c726e') + r(engine - 9, y - 39, 10, 2, '#3c726e')
  out += r(engine - 13, y - 20, 8, 8, '#d5ae60') + r(engine + 5, y - 20, 8, 8, '#a66b58')
  out += r(engine + 12, y - 83, 8, 20, '#80938a') + r(engine + 9, y - 85, 14, 4, '#bdc0a6')
  const age = ((now / 1000) % 5).toFixed(2)
  out += `<g opacity=".35"><animateTransform attributeName="transform" type="translate" values="0 0;4 -16" dur="5s" begin="-${age}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.35;0" dur="5s" begin="-${age}s" repeatCount="indefinite"/>${r(engine + 12, y - 91, 7, 4, '#b1b4a3')}</g></g>`
  if (width >= 620) {
    const x = width - 50
    out += `<g><title>Tea corner</title>${r(x - 16, y - 17, 32, 15, '#a56b52')}${r(x - 20, y - 11, 40, 9, '#bf8866')}${r(x - 16, y - 2, 4, 3, '#634a3b')}${r(x + 12, y - 2, 4, 3, '#634a3b')}</g>`
  }
  return `<g shape-rendering="crispEdges">${out}</g>`
}
