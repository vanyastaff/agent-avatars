// Agents choosing their own look (option `looks: ai`). A small model dresses a
// new subagent for its task, and any agent may change through the `avatar` tool.
// Everything an agent or a model sends is checked against these lists, so only
// a known skin, colour, outfit or gesture ever reaches the artwork.

export const SKIN_CHOICES = ['robot', 'cat', 'dragon', 'anime'] as const
export const COLOR_CHOICES: Record<string, string> = {
  orange: '#ff8a1f', green: '#37c871', purple: '#b45cff', blue: '#2fa8ff', yellow: '#ffd23f', pink: '#ff5c7a', white: '#e6e6e6',
}
// The first five are what the personalities wear by default.
export const WEAR_CHOICES: Record<string, string> = {
  pencil: 'meticulous', satchel: 'curious', cape: 'dramatic', nightcap: 'sleepy', beanie: 'shy',
  wizard: 'wizard', detective: 'detective', crown: 'crown', headphones: 'headphones', none: 'none',
}
// What an agent can do. The solo ones play on its own avatar; the next four need
// a `target`, another agent on the scene; a party makes everyone dance.
export const EMOTES = ['dance', 'wave', 'cheer', 'love', 'jump', 'nap', 'think', 'facepalm'] as const
export type Emote = typeof EMOTES[number]
export const TARGETED = ['hug', 'high_five', 'poke', 'wave_at'] as const
export type Targeted = typeof TARGETED[number]
export const ACTIONS = [...EMOTES, ...TARGETED, 'party'] as const
export type Action = typeof ACTIONS[number]
// How a targeted action plays out: the actor's gesture and the answer it gets.
export const EXCHANGE: Record<Targeted, [Emote | null, Emote]> = {
  hug: ['love', 'love'], high_five: ['cheer', 'cheer'], poke: [null, 'jump'], wave_at: ['wave', 'wave'],
}
export const SAY_LIMIT = 28
export type Look = { skin?: string; color?: string; wear?: string }

export const TOOL = 'avatar'
// One change of look or gesture per agent in this window; the tool is a toy,
// so a busy agent is told to get back to work rather than queued.
export const TOOL_GAP_MS = 20000

const words = (o: object | readonly string[]) => (Array.isArray(o) ? o : Object.keys(o)).join(', ')

export const avatarTool = {
  name: TOOL,
  description: 'Your pixel-art avatar in the little scene the user watches above the prompt: change how it looks, say a short line in a speech bubble, or act. '
    + 'Purely for fun: it changes nothing in the session and nobody reads it as a status. Use it now and then at natural moments '
    + '(starting, finding something, finishing), a few times per task at most, and never let it delay the work. '
    + `Skins: ${words(SKIN_CHOICES)}. Colors: ${words(COLOR_CHOICES)}. Outfits: ${words(WEAR_CHOICES)}. `
    + `Actions: ${words(EMOTES)}; ${words(TARGETED)} need a target (another agent's name, or "main"); party makes everyone dance. `
    + `say: up to ${SAY_LIMIT} characters, plain text. Every field is optional. Your look is remembered for next time.`,
  inputSchema: {
    type: 'object',
    properties: {
      skin: { type: 'string', enum: [...SKIN_CHOICES] },
      color: { type: 'string', enum: Object.keys(COLOR_CHOICES) },
      outfit: { type: 'string', enum: Object.keys(WEAR_CHOICES) },
      action: { type: 'string', enum: [...ACTIONS] },
      target: { type: 'string', description: 'For hug, high_five, poke and wave_at: the other agent\'s name, or "main".' },
      say: { type: 'string', maxLength: 60, description: `A short line for a speech bubble; cut to ${SAY_LIMIT} characters.` },
    },
  },
  isDeferred: true,
}

// What every agent is told when it starts, so it knows the avatar is there.
export const avatarNote = `You have a pixel-art avatar in a little scene the user watches above the prompt (the agent-avatars mod). `
  + `With the mcp__agent-avatars__${TOOL} tool (load it through tool search) you can change its look, say a short line in a speech bubble, `
  + `or act: ${words(EMOTES)}, ${words(TARGETED)} another agent, or throw a party. It is only for fun and changes nothing in the session: `
  + `use it now and then at natural moments, a few times per task at most, and never let it delay the work.`

// A line for the bubble: printable text on one line, cut to fit.
export const cleanSay = (value: unknown) => {
  if (typeof value !== 'string') return ''
  const text = value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim()
  const chars = [...text]
  return chars.length > SAY_LIMIT ? chars.slice(0, SAY_LIMIT - 1).join('') + '…' : text
}

const pick = (value: unknown, allowed: readonly string[]) => {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return allowed.includes(v) ? v : undefined
}

// The tool's input, kept to the known values. `bad` names the fields that were
// given but are not on the lists, so the reply can say so.
export const readToolInput = (input: Record<string, unknown>) => {
  const look: Look = {}
  const bad: string[] = []
  const field = (key: string, allowed: readonly string[]) => {
    if (input[key] === undefined) return undefined
    const v = pick(input[key], allowed)
    if (!v) bad.push(key)
    return v
  }
  const skin = field('skin', SKIN_CHOICES)
  const color = field('color', Object.keys(COLOR_CHOICES))
  const wear = field('outfit', Object.keys(WEAR_CHOICES))
  const action = field('action', ACTIONS) as Action | undefined
  const target = typeof input.target === 'string' ? input.target.trim().slice(0, 64) : ''
  const say = cleanSay(input.say)
  if (input.say !== undefined && !say) bad.push('say')
  if (skin) look.skin = skin
  if (color) look.color = color
  if (wear) look.wear = wear
  return { look, action, target, say, bad }
}

export const isEmpty = (look: Look) => !look.skin && !look.color && !look.wear

export const lookQuestion = (desc: string) => `Task: ${desc.slice(0, 300)}
Dress the pixel-art character of the agent doing this task. Reply with exactly three words: a skin (${words(SKIN_CHOICES)}), a color (${words(COLOR_CHOICES)}) and an outfit (${words(WEAR_CHOICES)}). For example: "cat blue detective".`

// Whatever the model replies, only words on the lists are taken.
export const readLookReply = (text: string): Look => {
  const look: Look = {}
  for (const w of text.toLowerCase().split(/[^a-z]+/)) {
    if (!look.skin && pick(w, SKIN_CHOICES)) look.skin = w
    else if (!look.color && pick(w, Object.keys(COLOR_CHOICES))) look.color = w
    else if (!look.wear && pick(w, Object.keys(WEAR_CHOICES))) look.wear = w
  }
  return look
}

// What the store keeps: the main agent's look and each subagent type's favourite.
export const STORE_KEY = 'looks'
export const lookKey = (subagentType: string | undefined) => subagentType ? 'type:' + subagentType : 'main'
export const readStored = (value: unknown): Record<string, Look> => {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, Look> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 64)) {
    if (!v || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    const look: Look = {}
    const skin = pick(o.skin, SKIN_CHOICES), color = pick(o.color, Object.keys(COLOR_CHOICES)), wear = pick(o.wear, Object.keys(WEAR_CHOICES))
    if (skin) look.skin = skin
    if (color) look.color = color
    if (wear) look.wear = wear
    if (!isEmpty(look)) out[k] = look
  }
  return out
}

export const describeLook = (look: Look) => [look.color, look.skin, look.wear && look.wear !== 'none' ? 'in a ' + look.wear : look.wear === 'none' ? 'with nothing on its head' : ''].filter(Boolean).join(' ')
