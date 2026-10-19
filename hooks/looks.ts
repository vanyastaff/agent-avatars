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
export const EMOTES = ['dance', 'wave', 'cheer', 'love'] as const
export type Emote = typeof EMOTES[number]
export type Look = { skin?: string; color?: string; wear?: string }

export const TOOL = 'avatar'
// One change of look or gesture per agent in this window; the tool is a toy,
// so a busy agent is told to get back to work rather than queued.
export const TOOL_GAP_MS = 20000

const words = (o: object | readonly string[]) => (Array.isArray(o) ? o : Object.keys(o)).join(', ')

export const avatarTool = {
  name: TOOL,
  description: 'Change how you look in the pixel-art avatar scene the user watches above the prompt, or make a gesture there. '
    + 'Purely cosmetic: it changes nothing in the session and nobody reads it as a status. Use it rarely and only for fun, '
    + 'for example to dress for a new kind of task or to celebrate a finished one; never let it delay the work. '
    + `Skins: ${words(SKIN_CHOICES)}. Colors: ${words(COLOR_CHOICES)}. Outfits: ${words(WEAR_CHOICES)}. Emotes: ${words(EMOTES)}. `
    + 'Every field is optional. Your choice of look is remembered for next time.',
  inputSchema: {
    type: 'object',
    properties: {
      skin: { type: 'string', enum: [...SKIN_CHOICES] },
      color: { type: 'string', enum: Object.keys(COLOR_CHOICES) },
      outfit: { type: 'string', enum: Object.keys(WEAR_CHOICES) },
      emote: { type: 'string', enum: [...EMOTES] },
    },
  },
  isDeferred: true,
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
  const emote = field('emote', EMOTES) as Emote | undefined
  if (skin) look.skin = skin
  if (color) look.color = color
  if (wear) look.wear = wear
  return { look, emote, bad }
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
