import { actionBeat, workStation, workshopSvg, performanceFor } from './theater.ts'
import type { ActionSequence, Personality, Performance, WorkKind, Liveliness, Behavior } from './theater.ts'

type Place = { title: string; shape: string; prop: Performance['prop']; beats: [string, string, string, string] }
const place = (title: string, shape: string, prop: Performance['prop'], beats: Place['beats']): Place => ({ title, shape, prop, beats })
const WORLDS: Record<string, Place[]> = {
  meadow: [
    place('field journal stand', 'journal', 'book', ['opening the field journal', 'studying the field journal', 'annotating the field journal', 'closing the field journal']),
    place('butterfly patch', 'flowers', 'net', ['approaching the flowers', 'watching the butterfly patch', 'following the butterflies', 'lowering the butterfly net']),
    place('seedling bed', 'garden', 'pencil', ['sorting the seeds', 'preparing the soil', 'planting the seedlings', 'putting away the seed packets']),
    place('water wheel', 'wheel', 'crank', ['checking the wooden paddles', 'watching the stream', 'turning the water wheel', 'securing the water wheel']),
  ],
  home: [
    place('reading sofa', 'sofa', 'book', ['choosing a cushion', 'reading on the sofa', 'marking a page on the sofa', 'leaving the book on the side table']),
    place('toy chest', 'chest', 'magnifier', ['lifting the toy chest lid', 'looking through the toy chest', 'sorting the found toys', 'closing the toy chest']),
    place('sewing table', 'sewing', 'pencil', ['threading the sewing machine', 'guiding the fabric', 'stitching the fabric', 'folding the stitched fabric']),
    place('kitchen stove', 'stove', 'tea', ['preparing the hearth', 'watching the kettle', 'tending the kettle', 'setting the kettle down']),
  ],
  lava: [
    place('rune tablet', 'runes', 'scroll', ['dusting the rune tablet', 'studying the carved symbols', 'tracing the runes', 'covering the rune tablet']),
    place('crystal vein', 'crystals', 'magnifier', ['lifting the survey lantern', 'looking into the crystal vein', 'examining the crystals', 'packing the crystal samples']),
    place('forge anvil', 'anvil', 'hammer', ['choosing the forge tools', 'positioning the warm metal', 'shaping the glowing part', 'setting the forged part aside']),
    place('bellows furnace', 'furnace', 'crank', ['priming the furnace', 'watching the furnace vent', 'working the bellows', 'letting the furnace settle']),
  ],
  sakura: [
    place('poetry stand', 'poetry', 'scroll', ['unrolling the poem', 'studying the brush strokes', 'copying a poem', 'rolling up the poem']),
    place('koi pond', 'pond', 'magnifier', ['kneeling beside the pond', 'watching the ripples', 'following the koi', 'leaving the pond still']),
    place('bonsai bench', 'bonsai', 'pencil', ['laying out the bonsai tools', 'examining the branches', 'pruning the bonsai', 'sweeping the bonsai bench']),
    place('tea hearth', 'tea', 'tea', ['preparing the tea hearth', 'watching the tea pot', 'tending the tea hearth', 'setting down the tea pot']),
  ],
  snow: [
    place('expedition board', 'expedition', 'map', ['opening the expedition notes', 'studying the snowy passes', 'annotating the expedition route', 'securing the expedition notes']),
    place('snow drift', 'drift', 'magnifier', ['laying out a snow brush', 'looking for buried tracks', 'brushing away the snow', 'packing the snow brush']),
    place('ice sculpture', 'ice', 'hammer', ['choosing the ice tools', 'tracing the ice outline', 'carving the ice', 'setting the ice tools aside']),
    place('camp stove', 'camp-stove', 'tea', ['checking the stove hatch', 'watching the camp kettle', 'warming the camp stove', 'closing the stove hatch']),
  ],
  night: [
    place('star atlas', 'atlas', 'book', ['opening the star atlas', 'studying the star charts', 'marking the star atlas', 'covering the star atlas']),
    place('observatory telescope', 'telescope', 'telescope', ['adjusting the eyepiece', 'finding a constellation', 'tracking the constellations', 'covering the telescope']),
    place('lantern bench', 'lanterns', 'lantern', ['laying out the lantern parts', 'fitting the lantern glass', 'assembling the lantern', 'setting down the lantern']),
    place('campfire', 'fire', 'tea', ['arranging the firewood', 'watching the small flames', 'tending the campfire', 'banking the campfire']),
  ],
  desert: [
    place('explorer map', 'desert-map', 'map', ['unfolding the explorer map', 'studying the dune route', 'annotating the explorer map', 'weighting the map corners']),
    place('dig site', 'dig', 'magnifier', ['choosing an excavation brush', 'looking through the sand', 'brushing the buried clues', 'covering the dig site']),
    place('mosaic table', 'mosaic', 'hammer', ['sorting the colored tiles', 'arranging the mosaic pattern', 'setting the mosaic tiles', 'clearing the mosaic tools']),
    place('oasis pump', 'pump', 'crank', ['checking the pump handle', 'watching the water channel', 'working the oasis pump', 'lowering the pump handle']),
  ],
  space: [
    place('star chart console', 'star-console', 'map', ['opening the navigation chart', 'studying the orbital paths', 'annotating the star chart', 'parking the chart controls']),
    place('radar dish', 'radar', 'compass', ['aiming the radar dish', 'watching the radar sweep', 'scanning with the radar', 'parking the radar dish']),
    place('repair dock', 'probe', 'wrench', ['laying out the probe parts', 'fitting the probe module', 'repairing the probe', 'stowing the probe tools']),
    place('reactor console', 'reactor', 'crank', ['checking the reactor panel', 'watching the reactor gauges', 'monitoring the reactor', 'parking the reactor controls']),
  ],
  office: [
    place('archive cabinet', 'archive', 'notebook', ['opening the archive drawer', 'reading the archive folder', 'annotating the archive notes', 'returning the archive folder']),
    place('search terminal', 'terminal', 'magnifier', ['waking the search terminal', 'scanning the terminal rows', 'querying the search terminal', 'parking the search terminal']),
    place('drafting desk', 'computer', 'pencil', ['laying out the desk notes', 'arranging the document', 'working at the drafting desk', 'stacking the desk notes']),
    place('office printer', 'printer', 'parcel', ['loading the printer tray', 'watching the paper feed', 'feeding the office printer', 'collecting the returned sheets']),
  ],
  beach: [
    place('tide chart', 'tide', 'map', ['unfolding the tide chart', 'studying the tide marks', 'annotating the tide chart', 'securing the tide chart']),
    place('shell sorting tray', 'shells', 'magnifier', ['lifting the shell tray', 'comparing the shell patterns', 'sorting the shells', 'setting down the shell tray']),
    place('sandcastle', 'castle', 'hammer', ['filling a sand bucket', 'shaping the sand towers', 'building the sandcastle', 'putting away the sand bucket']),
    place('water pump', 'beach-pump', 'crank', ['priming the beach pump', 'watching the shallow channel', 'working the beach pump', 'setting down the pump handle']),
  ],
  city: [
    place('news kiosk', 'kiosk', 'notebook', ['opening the news stack', 'reading the city bulletin', 'annotating the city news', 'folding the city bulletin']),
    place('transit map', 'transit', 'map', ['unfolding the transit guide', 'studying the station signs', 'tracing the transit lines', 'folding the transit guide']),
    place('repair stall', 'gadget', 'wrench', ['opening the repair case', 'examining the loose wires', 'repairing the street gadget', 'packing the repair case']),
    place('signal cabinet', 'signal', 'crank', ['checking the signal panel', 'watching the signal relays', 'tuning the signal cabinet', 'parking the signal controls']),
  ],
  ocean: [
    place('shell archive', 'shell-archive', 'scroll', ['opening the archive shell', 'reading the shell records', 'examining the shell records', 'closing the archive shell']),
    place('coral survey', 'coral', 'magnifier', ['opening the survey slate', 'looking between the coral branches', 'surveying the coral', 'packing the survey slate']),
    place('pearl bench', 'pearls', 'pencil', ['sorting the pearl tray', 'arranging the pearl pattern', 'setting the pearls', 'covering the pearl tray']),
    place('air pump', 'air-pump', 'crank', ['checking the air hose', 'watching the air gauge', 'working the air pump', 'parking the air valve']),
  ],
  halloween: [
    place('spell lectern', 'spell', 'book', ['opening the spell book', 'studying the spell diagrams', 'annotating the spell book', 'closing the spell book']),
    place('clue pumpkin', 'pumpkin', 'magnifier', ['lifting the pumpkin lid', 'peeking inside the pumpkin', 'examining the pumpkin clues', 'replacing the pumpkin lid']),
    place('potion bench', 'potions', 'lantern', ['sorting the potion bottles', 'measuring the ingredients', 'mixing the potion ingredients', 'capping the potion bottles']),
    place('cauldron', 'cauldron', 'crank', ['laying out the stirring spoon', 'watching the cauldron bubbles', 'stirring the cauldron', 'resting the stirring spoon']),
  ],
}
const slotFor = (kind: WorkKind) => kind === 'read' || kind === 'rest' || kind === 'wait' ? 0
  : kind === 'search' || kind === 'scout' ? 1 : kind === 'run' ? 3 : 2
export const hasScenePlaces = (scene: string) => scene === 'workshop' || !!WORLDS[scene]

export const scenePlace = (scene: string, kind: WorkKind, width: number, seed: number) => {
  const index = slotFor(kind)
  if (scene === 'workshop' || !WORLDS[scene]) {
    const station = workStation(kind, width, seed)
    return { title: station.title, index, x: width * [0.13, 0.36, 0.59, 0.82][index]!, actorX: station.x, place: null }
  }
  const p = WORLDS[scene]![index]!
  const x = Math.round(width * [0.14, 0.38, 0.62, 0.86][index]!)
  const actorX = Math.max(40, Math.min(width - 42, x - (p.shape === 'sofa' ? 4 : 20) + ((seed - 1) % 3 - 1) * 4))
  return { title: p.title, index, x, actorX, place: p }
}

export const sceneAction = (scene: string, sequence: ActionSequence | null | undefined, personality: Personality, now: number, behavior: Behavior) => {
  const beat = actionBeat(sequence, personality, now)
  if (!beat || !sequence) return null
  const p = WORLDS[scene]?.[slotFor(sequence.kind)]
  if (!p) return { ...beat, prop: undefined }
  const label = beat.failed ? `setting the troublesome item aside at the ${p.title}`
    : sequence.endedAt !== undefined && beat.stage < 3 ? `reviewing the returned result at the ${p.title}` : p.beats[beat.stage]!
  const prop = behavior === 'cozy' && sequence.variant % 2 === 0 ? p.prop : performanceFor(sequence.kind, behavior, personality, sequence.variant).prop
  return { ...beat, label, prop }
}

const r = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`
const line = (d: string, color: string, width = 2) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`
const table = (c = '#a27c54') => r(-29, -23, 58, 5, c) + r(-25, -18, 5, 18, '#71523e') + r(20, -18, 5, 18, '#71523e')
const book = () => r(-11, -38, 25, 15, '#e6cea0') + line('M1-37v13m-9-10h6m6 0h7', '#9c805f')
const board = (wood: string, paper: string) => r(-27, -65, 54, 38, wood) + r(-23, -61, 46, 30, paper) + r(-22, -27, 4, 27, wood) + r(18, -27, 4, 27, wood)
const chart = (color: string) => line('M-17-39l10-14 13 8 11-12', color) + r(-18, -41, 4, 4, color) + r(13, -58, 4, 4, color)
const monitor = (screen: string) => r(-23, -59, 46, 31, '#40535e') + r(-19, -55, 38, 23, screen) + r(-3, -28, 6, 5, '#687d81') + r(-14, -24, 28, 3, '#aebfba')
const kettle = (color: string) => `<path d="M-13-26v-13h26v13q-13 9-26 0m26-10h9v9h-9" fill="${color}" stroke="#6d837e" stroke-width="2"/>` + r(-4, -44, 9, 5, '#cfb978')
const flame = () => `<path d="M-12-8l5-12 5 5 5-15 10 22z" fill="#dc8653"/><path d="M-4-8l4-10 4 10z" fill="#f0c97b"/>`
export type PlaceUse = { index: number; label: string; closing: boolean; failed: boolean; period: number }

const art = (shape: string, use: PlaceUse | undefined, now: number, liveliness: Liveliness) => {
  const working = use && !use.closing && !use.failed
  let s = ''
  if (shape === 'sofa') s = r(-30, -24, 60, 21, '#9b9aaf') + r(-34, -17, 8, 17, '#77788d') + r(26, -17, 8, 17, '#77788d') + r(-24, -15, 48, 5, '#b9b3c0') + r(-23, -3, 4, 3, '#715b47') + r(19, -3, 4, 3, '#715b47') + r(36, -18, 16, 4, '#ab8056') + r(41, -14, 4, 14, '#715b47') + `<g transform="translate(36 10)">${book()}</g>`
  if (shape === 'chest') s = r(-25, -22, 50, 22, '#b18359') + r(-27, use ? -35 : -27, 54, 6, '#cfab77') + r(-3, -19, 6, 7, '#ddc584') + r(-15, -29, 12, 9, '#b87c89') + r(6, -25, 9, 6, '#8caaa0')
  if (shape === 'sewing') s = table() + r(-11, -43, 26, 7, '#7d9793') + r(-11, -39, 7, 16, '#7d9793') + r(10, -36, 5, 10, '#7d9793') + r(-4, -25, 24, 3, '#d1a6a0') + r(-2, -49, 8, 7, '#d3b57b') + line('M2-43h15v17', '#d7c9a2')
  if (shape === 'stove') s = r(-25, -32, 50, 32, '#897a72') + r(-19, -23, 25, 18, '#342f34') + r(-15, -18, 17, 9, working ? '#e6ae5f' : '#70574c') + r(-28, -36, 56, 4, '#b0a697') + `<path d="M-10-37v-11h20v11q-10 7-20 0m20-9h8v7h-8" fill="#b5c7bd" stroke="#6c8681" stroke-width="2"/>` + r(-3, -52, 7, 4, '#d3bd82')
  if (['journal', 'poetry', 'atlas', 'tide', 'spell'].includes(shape)) {
    s = table(shape === 'spell' ? '#726078' : shape === 'tide' ? '#a8ada0' : '#a6815a') + book()
    if (shape === 'journal') s += r(22, -44, 3, 21, '#8aa779') + `<path d="M23-37q-16-14-13-8 0 6 13 8m0-4q12-12 12-5 0 5-12 5" fill="#8aa779"/>`
    if (shape === 'poetry') s += r(-19, -48, 4, 25, '#bf9c71') + r(-23, -53, 12, 5, '#ddc89f') + line('M18-38l6 8-7 6', '#9f6e7f')
    if (shape === 'atlas') s += `<circle cx="0" cy="-54" r="12" fill="#4c5d78"/>` + line('M-8-55l8-6 7 11-13 3', '#d4c891')
    if (shape === 'tide') s += board('#9a805c', '#d2d9be') + line('M-19-42q5-10 10 0t10 0t10 0t10 0', '#6e9eac')
    if (shape === 'spell') s += r(-20, -54, 4, 17, '#d2c49c') + r(19, -54, 4, 17, '#d2c49c') + r(-20, -60, 4, 6, '#e4aa5a') + r(19, -60, 4, 6, '#e4aa5a') + line('M-3-36l4-5 4 5-4 5z', '#987da6')
  }
  if (['expedition', 'desert-map', 'transit'].includes(shape)) {
    s = board(shape === 'transit' ? '#687b88' : '#a18b69', shape === 'expedition' ? '#d4e1da' : '#e2d1a3') + chart(shape === 'transit' ? '#ab6b8d' : '#8c9b89')
    if (shape === 'expedition') s += `<path d="M-20-34l10-15 9 15zM0-34l9-19 12 19z" fill="#a1bcc5"/>` + r(-12, -48, 5, 3, '#eef1df')
    if (shape === 'desert-map') s += line('M-20-33q10-9 20 0t20 0', '#c4a16c') + r(17, -60, 4, 5, '#bc835e')
    if (shape === 'transit') for (const [x,y] of [[-13,-51],[-2,-44],[9,-52],[17,-57]]) s += `<circle cx="${x}" cy="${y}" r="3" fill="#e7d9af" stroke="#6b858f"/>`
  }
  if (shape === 'flowers') {
    s = r(-29, -4, 58, 4, '#79935d')
    for (const [x,h,c] of [[-21,23,'#d594a5'],[-5,32,'#e0be74'],[13,22,'#9eacd0'],[25,30,'#d594a5']] as const) s += line(`M${x} 0v-${h}`, '#7c9d68', 3) + r(x-5, -h-5, 10, 8, c) + r(x-1,-h-3,3,3,'#ecd79d')
    s += `<path d="M-2-49q-11-10-10-1 2 6 10 3 8 3 10-3 1-9-10 1" fill="#e8c28d"/>`
  }
  if (shape === 'garden') {
    s = r(-30,-16,60,16,'#9f7750') + r(-26,-20,52,6,'#65533e')
    for (const x of [-17,0,17]) s += line(`M${x}-18v-14`, '#7b9b62',3) + `<path d="M${x}-25q-13-10-11-3 3 6 11 3m0-4q12-13 11-4-3 6-11 4" fill="#92b57a"/>`
    s += r(24,-32,12,16,'#d6bf8c') + r(27,-29,5,6,'#90a576')
  }
  if (shape === 'wheel') s = r(-34,-5,68,5,'#719b9c') + r(-28,-9,56,3,'#9ab9ae') + r(-6,-26,12,26,'#92704e') + `<circle cy="-30" r="24" fill="#b49a6c" stroke="#725d45" stroke-width="5"/><circle cy="-30" r="17" fill="#587b79"/>` + line('M-23-30h46M0-53v46M-16-46l32 32m-32 0 32-32','#bda574',4) + r(-4,-34,8,8,'#725d45')
  if (shape === 'runes') s = `<path d="M-23 0l-4-49 9-12h35l10 11-4 50z" fill="#867b81"/>` + line('M-14-46l8 7-8 8m9-21v27m11-22 10 9-10 9m-13 9h23','#dec087',3)
  if (shape === 'crystals') s = `<path d="M-30 0l9-30 15 30M-12 0l-1-49 12-13 11 16-5 46M6 0l13-39 13 15-9 24z" fill="#a78bb6" stroke="#685d81" stroke-width="2"/>` + line('M-2-53v38m22-43-6 39', '#dac8d8')
  if (shape === 'anvil') s = r(-19,-17,38,17,'#69534b') + r(-10,-26,20,10,'#83928e') + `<path d="M-29-39h58l-8 9H7v8h-18v-8h-11z" fill="#a1b1a9"/>` + r(-8,-44,17,5,working?'#efbc77':'#a98d70')
  if (shape === 'furnace') s = r(-25,-54,42,54,'#74574d') + r(-19,-40,30,33,'#342f34') + (working?flame():'') + r(-29,-59,50,6,'#a3836c') + r(3,-75,10,16,'#897b72') + `<path d="M17-19l19-9v18l-19 2z" fill="#b49370"/>` + line('M21-19l12-5m-12 9 12-5', '#72584b')
  if (shape === 'pond') s = `<ellipse cy="-8" rx="34" ry="13" fill="#9ba78e"/><ellipse cy="-10" rx="28" ry="9" fill="#85b8b0"/><path d="M-9-12q8-7 17 0-8 7-17 0m17 0 7-5v10z" fill="#d78b70"/>` + r(-30,-14,6,6,'#b7bca2') + r(27,-13,6,7,'#b7bca2')
  if (shape === 'bonsai') s = table() + r(-17,-32,34,9,'#7a9891') + line('M0-32l-5-16 7-9m-7 9-11-6','#8e7053',5) + r(-23,-65,25,12,'#819f72') + r(-3,-68,25,13,'#9bb783') + r(-11,-56,29,9,'#6c916b')
  if (shape === 'tea') s = r(-26,-8,52,8,'#8f7761') + r(-20,-18,40,10,'#6d6255') + kettle('#adbca1') + r(23,-10,10,8,'#d5c498')
  if (shape === 'drift') s = `<path d="M-34 0q-4-17 12-19-1-14 14-18 16-5 22 13 20-3 20 24z" fill="#d9e5df"/>` + line('M-25-5l10-6m9-3 9-7m8-4 8-3','#a5bfc7',3) + r(-15,-9,7,4,'#b0c2be')
  if (shape === 'ice') s = r(-27,-6,54,6,'#9ec9d1') + `<path d="M-19-6l-5-35 10-23h27l12 21-6 37z" fill="#a5d1d6" stroke="#d4e5df" stroke-width="2"/>` + line('M-14-51l25 10-9 29m-18-11 31-9','#e4eee2')
  if (shape === 'camp-stove') s = r(-21,-8,42,8,'#96a9a8') + r(-17,-36,34,29,'#748b8e') + r(-11,-29,22,17,working?'#d5ad70':'#3d555c') + r(-24,-41,48,5,'#b5c7bf') + `<g transform="translate(0 -17)">${kettle('#a6b8ae')}</g>` + r(13,-67,7,26,'#a6b8ae')
  if (shape === 'telescope') s = line('M0-28l-23 28m23-28 23 28M0-28v27','#a18a68',4) + `<g transform="rotate(-26 0 -41)">${r(-25,-48,51,15,'#b3a076')}${r(20,-52,10,23,'#8da9a7')}${r(-30,-45,8,9,'#7c9496')}</g>`
  if (shape === 'lanterns') {
    s = table('#8e7e68')
    for (const [x,h] of [[-16,21],[8,29]]) s += r(x,-23-h,15,h,'#91a79b') + r(x+3,-20-h,9,h-6,working?'#e6c57b':'#b7b89c') + line(`M${x+3}-${24+h}v-6h9v6`,'#b4b396')
  }
  if (shape === 'fire') s = r(-24,-5,48,5,'#796752') + line('M-19-6l35-8m-31 0 32 8','#a38b63',5) + (working?flame():r(-7,-13,14,5,'#9d7758')) + line('M-30 0v-54h60V0','#8f947f',3) + `<path d="M-10-34h20v12q-10 8-20 0z" fill="#a1b5aa"/>`
  if (shape === 'dig') s = `<path d="M-33 0l7-13 46-3 14 16z" fill="#b39463"/>` + r(-21,-9,42,9,'#91764e') + `<path d="M-11-9v-16h19v16m-19-11q10-7 19 0" fill="#cdb384"/>` + line('M25-9l-4-28 7-3','#a8a28a',4)
  if (shape === 'mosaic') {
    s = table('#b3996f')
    for (let i=0;i<12;i++) s += r(-21+(i%4)*11,-46+Math.floor(i/4)*7,9,6,['#9cae95','#bc8c76','#dfc78f','#90aab0'][i%4]!)
  }
  if (shape === 'pump' || shape === 'beach-pump') s = r(-23,-6,46,6,'#aaa184') + r(-7,-47,16,42,shape==='pump'?'#7d9f8d':'#899fab') + line('M-1-48h25l6 9m-37 9h-18v12','#c4b995',5) + r(-27,-13,17,10,'#b7c5ad') + (shape==='beach-pump'?r(16,-16,14,16,'#d5b984'):'')
  if (shape === 'star-console') s = table('#7e879d') + monitor('#466b83') + line('M-12-48l9 7 7-9 9 10m-16 6 14-3','#c5c7a3') + r(-17,-54,3,3,'#ddd09d')
  if (shape === 'radar') s = r(-23,-5,46,5,'#7e8f98') + r(-4,-34,8,30,'#a3b8b7') + `<path d="M-27-57q26 38 53 0z" fill="#b0c8c4" stroke="#718d94" stroke-width="2"/>` + line('M0-39l-9-29m0 0 6-6','#d6c9a1',3)
  if (shape === 'probe') s = table('#7b9298') + r(-13,-46,26,23,'#b5c7bd') + r(-34,-42,19,15,'#6d8ca6') + r(15,-42,19,15,'#6d8ca6') + line('M-25-41v12m-7-6h16m18 0h30M0-46v-12','#b6bfa9') + `<circle cy="-58" r="3" fill="#d1bd83"/>` + r(-4,-40,8,8,'#759f9b')
  if (shape === 'reactor') s = r(-24,-8,48,8,'#8b9ba2') + r(-21,-65,42,7,'#b6c5b6') + r(-17,-58,34,49,'#537782') + r(-10,-52,20,35,working?'#a4d0b4':'#759b9a') + line('M-10-42h20m-20 12h20','#d8d2a8',3) + r(23,-34,9,24,'#b4a879')
  if (shape === 'archive') {
    s = r(-24,-63,48,63,'#829393')
    for(let i=0;i<3;i++) s += r(-20,-58+i*18,40,14,'#b0b5a5') + r(-5,-54+i*18,10,4,'#687b7c')
    if(use) s += r(-25,-23,50,12,'#d9ceaa') + r(-13,-32,26,17,'#e8d9b2')
  }
  if (shape === 'terminal' || shape === 'computer') s = table(shape==='computer'?'#b18b64':'#8f9383') + monitor(shape==='terminal'?'#91b7a8':'#aec3c2') + line(shape==='terminal'?'M-14-47h24m-24 7h15':'M-14-49h11m-11 6h26m-26 6h19','#527677') + r(-14,-22,29,3,'#c5c5ad') + (shape==='computer'?r(23,-34,9,11,'#e0c79c'):'')
  if (shape === 'printer') s = r(-26,-30,52,27,'#b4beb6') + r(-22,-47,44,18,'#8a9d9a') + r(-17,-41,34,8,'#344b53') + r(-17,-20,34,11,'#566f75') + r(-13,-17,26,17,'#ebdfbc') + r(15,-28,6,4,'#d7bc78')
  if (shape === 'shells') {
    s = table('#bda47b') + r(-26,-29,52,6,'#d2bc91')
    for(const [x,c] of [[-17,'#dca797'],[0,'#d4c8ab'],[17,'#b4bfca']] as const) s += `<path d="M${x-7}-30q-3-15 7-15t7 15z" fill="${c}"/>` + line(`M${x}-42v10m-4-8 2 8m6-8-2 8`,'#a28f7e')
  }
  if (shape === 'castle') s = r(-32,-8,64,8,'#c6a16e') + r(-25,-33,50,25,'#e0c38e') + r(-29,-48,16,40,'#d8b77e') + r(13,-48,16,40,'#d8b77e') + r(-29,-54,6,6,'#d8b77e') + r(-19,-54,6,6,'#d8b77e') + r(13,-54,6,6,'#d8b77e') + r(23,-54,6,6,'#d8b77e') + r(-6,-23,12,15,'#9d7d52') + line('M20-54v-17h13l-13 8','#d08d80',2)
  if (shape === 'kiosk') s = r(-28,-48,56,48,'#6b7f8a') + r(-32,-54,64,7,'#ac7b90') + r(-22,-42,44,30,'#c9c6aa') + line('M-15-35h14m-14 5h31m-31 6h31m-31 6h22','#7f8d85') + r(-20,-8,40,4,'#9da692')
  if (shape === 'gadget') s = table('#8d8791') + r(-19,-43,38,20,'#7c9d9f') + r(-13,-38,12,9,'#a5c7b0') + `<circle cx="10" cy="-34" r="6" fill="#d1bd84"/>` + line('M-2-43v-12h16m-30 24-12-10','#d0a28f',3)
  if (shape === 'signal') s = r(-23,-65,46,65,'#6b8291') + r(-18,-59,36,48,'#354e5b') + line('M-11-51h22m-22 13h22m-22 13h22','#a1b3af',3) + r(-11,-47,6,5,'#d3be83') + r(6,-34,6,5,'#8ebbc0') + r(-8,-21,6,5,'#c595a6')
  if (shape === 'shell-archive') s = `<path d="M-30-8q-9-36 0-42 10-11 20 0 12-17 22 0 13-8 18 4 7 12-1 38z" fill="#c6a4b0" stroke="#e2c9bf" stroke-width="3"/>` + line('M-19-43l13 32M0-48v37m18-30-12 30','#967f9a') + r(-23,-11,46,11,'#8b989e') + r(-13,-29,26,16,'#dbd1b3')
  if (shape === 'coral') s = line('M0 0v-51m0 18-19-12v-12M0-18l21-14v-19m-40 6-10-6m50 19 10-6','#c98e99',8) + r(-7,-58,14,10,'#e4b0a4') + r(-25,-62,12,8,'#dfad9e') + r(16,-55,12,8,'#dfad9e')
  if (shape === 'pearls') {
    s = table('#819c9d') + r(-25,-31,50,8,'#d4b99d')
    for(const [x,y] of [[-16,-35],[-5,-35],[6,-35],[17,-35],[-10,-45],[2,-46]]) s += `<circle cx="${x}" cy="${y}" r="5" fill="#e4dbbf" stroke="#b5b6ac"/>`
  }
  if (shape === 'air-pump') s = r(-24,-9,48,9,'#8ba49e') + r(-18,-52,27,44,'#648c91') + `<circle cx="-4" cy="-39" r="9" fill="#d4d3ad"/>` + line('M-4-39l5-4M9-18h19v-21h8','#c5bda0',4) + r(14,-62,7,26,'#a9beb2') + r(7,-65,22,4,'#d1bf8d')
  if (shape === 'pumpkin') s = `<path d="M-28-9q-11-40 8-39 11-9 20 0 12-11 24 0 18 1 6 39z" fill="#ce8b50"/>` + r(-3,-57,7,10,'#8c9e6c') + `<path d="M-17-32l8-9 4 9m12 0 5-9 8 9M-13-20l7 3 6-5 6 5 9-3" fill="#ebce83"/>`
  if (shape === 'potions') {
    s = table('#91768c')
    for(const [x,c,h] of [[-18,'#9bbf9e',24],[0,'#b2a1c8',33],[18,'#d2b789',20]] as const) s += `<path d="M${x-3}-${23+h}h6v8l6 5v${h-13}h-18v-${h-13}l6-5z" fill="${c}"/>` + r(x-4,-26-h,8,3,'#b4a48b')
  }
  if (shape === 'cauldron') s = r(-25,-5,50,5,'#8f6d55') + (working?flame():'') + `<path d="M-26-32h52v13q-4 16-26 15-23 1-26-15z" fill="#56666e"/>` + `<ellipse cy="-32" rx="25" ry="7" fill="#a3b47e"/>` + line('M8-33l11-25','#bca476',4) + line('M-26-25h-7v12h10m49-12h7v12h-10','#7f8f94',3)
  if (!s) throw new Error(`Missing artwork for ${shape}`)
  return s + feedback(shape, use, now, liveliness)
}

const feedback = (shape: string, use: PlaceUse | undefined, now: number, liveliness: Liveliness) => {
  let s = ''
  if (use && !use.closing && !use.failed) {
    let marker = '', type = 'translate', values = '0 0;0 -3;0 0', effect = ''
    if (['stove','camp-stove','tea','fire','furnace'].includes(shape)) {
      marker = line('M-3-56q-5-5 0-10m10 10q-5-5 0-10', '#c7d1c3'); values = '0 3;2 -5;0 3'; effect = 'warm vapor rising'
    } else if (['wheel'].includes(shape)) {
      marker = line('M0-52v44M-22-30h44m-37-15 30 30m-30 0 30-30','#d4bd87',3); type = 'rotate'; values = '0 0 -30;180 0 -30;360 0 -30'; effect = 'water wheel paddles turning'
    } else if (['pump','beach-pump','air-pump'].includes(shape)) {
      marker = line(shape==='air-pump'?'M11-64h20M30-44v10':'M-2-49h25M-24-17v9', '#d3c696',4) + (shape==='air-pump'?`<circle cx="34" cy="-48" r="3" fill="none" stroke="#b6d5c9"/>`:r(-26,-14,4,11,'#87b4b7')); values = '0 0;0 5;0 0'; effect = shape==='air-pump'?'air bubbles leaving the hose':'pump handle moving water'
    } else if (shape === 'printer') {
      marker = r(-12,-18,24,18,'#f0e3bf') + line('M-8-13h14m-14 4h11','#8b9f9c'); values = '0 -7;0 5;0 -7'; effect = 'paper feed moving'
    } else if (['terminal','computer','star-console','signal','reactor'].includes(shape)) {
      marker = shape==='reactor'?line('M-6-49v25m11-25v25','#d3e1be',3):r(-14,-40,3,6,'#e2d4a2'); values = '0 0;5 0;0 0'; effect = shape==='reactor'?'reactor gauge fluctuating':'panel cursor advancing'
    } else if (shape === 'radar' || shape === 'telescope') {
      marker = line(shape==='radar'?'M0-40l-17-19':'M19-53l10-4', '#d4d2a4',3); type = 'rotate'; values = '-12 0 -40;12 0 -40;-12 0 -40'; effect = 'sighting sweep'
    } else if (shape === 'pond') {
      marker = `<ellipse cy="-11" rx="21" ry="6" fill="none" stroke="#c4d7c0"/>`; values = '-3 0;3 0;-3 0'; effect = 'koi ripples spreading'
    } else if (shape === 'cauldron') {
      marker = line('M6-33l10-23','#cfb783',3) + `<circle cx="-12" cy="-39" r="4" fill="none" stroke="#b8ca9a"/>`; type='rotate'; values='-12 0 -32;12 0 -32;-12 0 -32'; effect='spoon stirring the cauldron'
    } else if (shape === 'sewing') {
      marker = line('M14-35v10m-3 0h10','#ead9af'); values='0 -2;0 3;0 -2'; effect='sewing needle moving'
    } else if (['anvil','ice','probe','gadget'].includes(shape)) {
      marker = line('M-4-42l-4-5m14 4 4-6m-9 0v-6',shape==='ice'?'#e0ede4':'#e3bd81'); values='0 2;0 -3;0 2'; effect='small crafting strokes'
    } else if (['bonsai','garden','coral'].includes(shape)) {
      marker = `<path d="M7-35q13-18 16-9-1 8-16 9" fill="${shape==='coral'?'#e3b2a9':'#b6c892'}"/>`; type='rotate'; values='-7 7 -35;7 7 -35;-7 7 -35'; effect='tending the branches'
    } else if (shape === 'flowers') {
      marker = `<path d="M0-51q-10-12-10-2 3 8 10 2 9 6 10-2 0-10-10 2" fill="#ecd8a1"/>`; values='-8 0;8 -4;-8 0'; effect='butterfly following the flowers'
    } else if (['mosaic','shells','pearls','chest','dig','drift','crystals','pumpkin','castle','potions','lanterns'].includes(shape)) {
      marker = shape==='potions'?r(-3,-45,6,15,'#c8bc91'):shape==='lanterns'?r(12,-44,7,13,'#e3cf90') :r(-3,-32,7,5,['drift','ice'].includes(shape)?'#e5eadd':'#d9c798'); values='-7 -7;6 0;-7 -7'; effect=shape==='castle'?'sand bucket placing sand':shape==='potions'?'measuring the potion':shape==='drift'||shape==='dig'?'brush uncovering the surface':'sorting small pieces'
    } else {
      marker = line('M-7-35h11m-11 4h8','#aa8c67') + r(-4,-42,9,3,'#f0e0b9'); values='-5 0;4 0;-5 0'; effect='reference pages turning'
    }
    const motion = liveliness === 'quiet' ? '' : `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${use.period}s" begin="-${((now / 1000) % use.period).toFixed(2)}s" repeatCount="indefinite"/>`
    s += `<g><title>${effect}</title><g class="actor-motion">${motion}${marker}</g></g>`
  }
  if (use?.failed) s += line('M18-48l6 6m-6 0 6-6', '#d38974', 3)
  return s
}

export const sceneObjectsSvg = (scene: string, width: number, ground: number, now: number, uses: PlaceUse[], liveliness: Liveliness) => {
  if (scene === 'workshop') return workshopSvg(width, ground, now) + uses.map(use => {
    const station = scenePlace(scene, ['read','search','craft','run'][use.index] as WorkKind, width, 1)
    return `<g transform="translate(${station.x} ${ground})"><title>Environment: ${station.title} — ${use.failed ? 'trouble' : use.closing ? 'settling' : 'working'}</title>${feedback(['journal','transit','anvil','reactor'][use.index]!, use, now, liveliness)}</g>`
  }).join('')
  return (WORLDS[scene] ?? []).map((p, index) => {
    const station = scenePlace(scene, ['read', 'search', 'craft', 'run'][index] as WorkKind, width, 1)
    const use = uses.find(u => u.index === index)
    return `<g transform="translate(${station.x} ${ground})"><title>Place: ${p.title}</title>${use ? `<title>Environment: ${p.title} — ${use.failed ? 'trouble' : use.closing ? 'settling' : 'working'}</title>` : ''}${art(p.shape, use, now, liveliness)}</g>`
  }).join('')
}
