import { duetBeat } from './theater.ts'
import type { Behavior, DuetKind, Liveliness, Personality } from './theater.ts'

export type Episode = { at: number; serial: number; slot: number }
type Spot = { title: string; shape: string; activity: string; ending: string; style: string }
const spot = (title: string, shape: string, activity: string, ending: string, style: string): Spot => ({ title, shape, activity, ending, style })
const LIFE: Record<string, Spot[]> = {
  meadow: [
    spot('picnic blanket','picnic','sharing a picnic','packing the last picnic snack','snack'),
    spot('butterfly patch','flowers','following the butterflies','letting a butterfly fly away','watch'),
    spot('flower circle','flowers','weaving a flower crown','trying on the flower crown','crown'),
    spot('riverside swing','swing','swinging beside the stream','slowing the riverside swing','swing'),
  ],
  home: [
    spot('cushion sofa','sofa','sinking into the sofa','stretching after a sofa nap','lounge'),
    spot('toy chest','toys','playing with the toy chest','putting a favorite toy back','play'),
    spot('pillow fort','fort','peeking out of the pillow fort','waving from the pillow fort','peek'),
    spot('snack corner','picnic','sharing a midnight snack','savoring the last bite','snack'),
  ],
  lava: [
    spot('warm rock','rock','dozing on a warm rock','stretching on the warm rock','nap'),
    spot('crystal hideout','crystals','playing among the crystals','leaving a sparkling pebble behind','play'),
    spot('ember barbecue','grill','roasting snacks over the embers','sharing a roasted snack','grill'),
    spot('hot spring','spring','soaking in the hot spring','stretching beside the hot spring','float'),
  ],
  sakura: [
    spot('blossom picnic','picnic','sipping tea beneath the blossoms','finishing a cup of blossom tea','tea'),
    spot('koi pond','pond','feeding the koi','watching the last koi swim away','feed'),
    spot('petal clearing','petals','dancing with falling petals','catching one last petal','dance'),
    spot('wishing tree','ribbons','tying a wish to the tree','watching the wish ribbon flutter','ribbon'),
  ],
  snow: [
    spot('cocoa fire','fire','warming up with cocoa','finishing the hot cocoa','warm'),
    spot('snowball patch','snowballs','rolling a snowball','tossing a soft snowball','play'),
    spot('snowman','snowman','dressing the snowman','straightening the snowman scarf','ribbon'),
    spot('sled hill','sled','riding a little sled','dragging the sled back uphill','slide'),
  ],
  night: [
    spot('story fire','fire','telling stories by the fire','letting a story trail off','warm'),
    spot('firefly glade','fireflies','chasing fireflies','letting the fireflies drift away','watch'),
    spot('lantern circle','lanterns','dancing among the lanterns','waving a lantern goodbye','dance'),
    spot('stargazing blanket','stars','lying back to watch the stars','pointing out one last star','gaze'),
  ],
  desert: [
    spot('oasis cushions','cushions','lounging at the oasis','stretching in the oasis shade','lounge'),
    spot('sliding dune','dune','sliding down the dune','climbing back up the dune','slide'),
    spot('spice picnic','picnic','sharing dates and spiced tea','finishing a sweet date','snack'),
    spot('shade tent','tent','sheltering in the shade tent','peeking out of the shade','peek'),
  ],
  space: [
    spot('orbital hammock','hammock','swaying in a zero-gravity hammock','stretching in zero gravity','swing'),
    spot('comet lookout','comets','watching the passing comets','waving to a distant comet','gaze'),
    spot('moon-bounce court','moonball','bouncing a moon ball','catching the floating ball','play'),
    spot('snack pod','pod','sharing floating space snacks','catching the final floating snack','snack'),
  ],
  office: [
    spot('coffee nook','coffee','chatting over coffee','finishing a coffee break','tea'),
    spot('paper-plane runway','planes','launching paper planes','catching a returning paper plane','plane'),
    spot('game corner','games','playing a little desk game','celebrating a tiny game victory','play'),
    spot('window cushions','cushions','napping by the window','stretching beside the window','nap'),
  ],
  beach: [
    spot('beach hammock','hammock','swaying in the beach hammock','stretching in the sea breeze','swing'),
    spot('shell cove','shells','looking for beautiful shells','holding a shell to an ear','watch'),
    spot('sandcastle','castle','building a crooked sandcastle','planting a flag on the sandcastle','play'),
    spot('beach barbecue','grill','grilling snacks by the sea','sharing the beach barbecue','grill'),
  ],
  halloween: [
    spot('pumpkin cushions','pumpkins','lounging among the pumpkins','waving from a pumpkin cushion','lounge'),
    spot('ghost hideout','ghost','playing hide-and-seek with a ghost','waving goodbye to a shy ghost','peek'),
    spot('candy picnic','candy','sharing a pile of candy','saving one last candy for a friend','snack'),
    spot('cauldron party','cauldron','dancing around the bubbling cauldron','ending the spooky little dance','dance'),
  ],
  ocean: [
    spot('anemone bed', 'anemone', 'nestling in the anemones', 'stretching above the anemones', 'float'),
    spot('fish school', 'fish', 'swimming with the little fish', 'waving goodbye to the fish', 'swim'),
    spot('bubble arch', 'bubbles', 'playing with rising bubbles', 'letting the last bubble go', 'bubbles'),
    spot('sunken treasure', 'treasure', 'trying on a sunken crown', 'putting the crown back in the chest', 'crown'),
  ],
  city: [
    spot('barrel fire', 'barrel', 'warming hands at the barrel', 'taking a last sip by the fire', 'warm'),
    spot('street grill', 'grill', 'turning skewers on the street grill', 'sharing a freshly grilled snack', 'grill'),
    spot('music corner', 'boombox', 'dancing to the street music', 'finishing a little dance move', 'dance'),
    spot('front stoop', 'stoop', 'hanging out on the front stoop', 'waving to a passing friend', 'lounge'),
  ],
}
const RECIPES: Record<Personality['id'], number[]> = {
  meticulous: [0,1,3,2], curious: [3,1,2,0], dramatic: [2,1,2,3], sleepy: [0,3,0,1], shy: [3,0,1,2],
}
export const hasLife = (scene: string) => !!LIFE[scene]
export const episodeSpan = (liveliness: Liveliness) => ({ quiet: 20000, normal: 12000, lively: 8000 })[liveliness]
export const episodeFor = (p: Personality, serial: number, at: number): Episode => ({ serial, at, slot: RECIPES[p.id][serial % 4]! })
export const episodeKind = (episode: Episode) => ['read','search','craft','run'][episode.slot] as 'read' | 'search' | 'craft' | 'run'
export const lifePlace = (scene: string, episode: Episode, width: number, seed: number) => {
  const p = LIFE[scene]![episode.slot]!
  const x = spotX(scene,episode.slot,width)
  const actorX = Math.max(38, Math.min(width - 38, x + (seed % 2 ? -1 : 1) * (width < 620 ? 23 : 30)))
  return { title: p.title, index: episode.slot, x, actorX, place: p }
}
const spotX = (scene: string, slot: number, width: number) => Math.round(width * (scene === 'ocean' ? [0.15,0.41,0.67,0.87] : scene === 'home' ? [0.18,0.43,0.66,0.87] : [0.17,0.38,0.64,0.86])[slot]!)
export const lifeBeat = (scene: string, episode: Episode, now: number, liveliness: Liveliness, reaction = '') => {
  const p = LIFE[scene]![episode.slot]!
  const age = Math.max(0, now - episode.at)
  const stage = age < 2200 ? 0 : age >= episodeSpan(liveliness) - 1800 ? 3 : 2
  const label = reaction === 'error' || reaction === 'sad' ? `startled for a moment at the ${p.title}`
    : reaction === 'happy' ? `celebrating with the others at the ${p.title}`
    : reaction === 'stop' ? `taking a breather at the ${p.title}` : reaction === 'rest' ? `resting by the ${p.title}` : stage === 0 ? `heading to the ${p.title}` : stage === 3 ? p.ending : p.activity
  return { stage, label, style: p.style, failed: false }
}

const r = (x: number,y: number,w: number,h: number,c: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
const path = (d: string,c: string,w = 2) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`
const flame = `<path d="M-15-38l5-17 6 8 6-24 13 33z" fill="#dc8e53"/><path d="M-6-38l5-13 6 13z" fill="#ebc37b"/>`
const cup = r(10,-21,13,11,'#d4bc98') + path('M23-19h5v7h-5','#d4bc98',3)
const skewer = path('M3-18l35-8','#cab58c',3) + r(10,-25,7,7,'#b97d55') + r(21,-28,7,7,'#c1a16d') + r(31,-31,6,7,'#b97d55')
const note = path('M20-64v-17h9v5h-6v12m-3-1q-10-5-10 2t10-2', '#d0bf83',3)
const motion = (type: string,values: string,period: number,now: number,quiet: boolean) => quiet ? '' : `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${period}s" begin="-${((now / 1000) % period).toFixed(2)}s" repeatCount="indefinite"/>`

export const lifeActorSvg = (body: string, scene: string, episode: Episode, p: Personality, now: number, ground: number, mode: Behavior, liveliness: Liveliness, arrived: boolean, paused: boolean, reaction: string) => {
  const beat = lifeBeat(scene, episode, now, liveliness, reaction)
  const quiet = liveliness === 'quiet' || paused
  const dance = arrived && beat.style === 'dance' && !paused
  const lean = p.id === 'dramatic' ? 9 : p.id === 'sleepy' ? 5 : p.id === 'shy' ? 2 : 4
  const aquatic = scene === 'ocean' && !paused
  const anim = aquatic ? motion('translate', `0 -4;${beat.style === 'swim' ? 8 : 0} -12;0 -4`, p.period, now, quiet)
    : dance || arrived && beat.style === 'swing' ? motion('rotate',`-${lean} 0 ${ground};${lean} 0 ${ground};-${lean} 0 ${ground}`,mode === 'chaotic' ? .7 : p.period,now,quiet)
    : arrived && beat.style === 'slide' ? motion('translate','-8 -4;8 0;-8 -4',p.period,now,quiet) : ''
  let hands = ''
  if (arrived && !paused) {
    if (beat.style === 'warm') hands = path('M-9-20l17-6m-6 9 14-7','#d4b98e',4) + cup
    if (beat.style === 'grill') hands = skewer
    if (beat.style === 'dance') hands = path('M-14-18l-14-9m42 9 14-15','#c7b58e',4) + note
    if (beat.style === 'lounge') hands = cup + (p.id === 'sleepy' ? path('M-8-51h9l-9 8h9','#b8c5c7') : '')
    if (beat.style === 'swim') hands = path('M-14-22l-16 4m44-4 16-6','#b6d3c3',4)
    if (beat.style === 'bubbles') hands = `<circle cx="18" cy="-34" r="8" fill="none" stroke="#b5dcd2"/><circle cx="28" cy="-52" r="4" fill="none" stroke="#b5dcd2"/>`
    if (beat.style === 'crown') hands = `<path d="M-13-31l-3-13 10 6 6-12 6 12 10-6-3 13z" fill="#d2bc76"/>`
    if (beat.style === 'tea') hands = cup
    if (beat.style === 'snack') hands = path('M8-19l12-2','#d4b98e',4) + r(16,-29,13,10,'#d0a777') + r(18,-28,3,3,'#a27562')
    if (beat.style === 'play') hands = `<g class="actor-motion">${motion('translate',beat.stage === 3 ? '0 0;0 0' : '0 -6;4 0;0 -6',p.period,now,quiet)}<circle cx="20" cy="-25" r="8" fill="${scene==='snow'?'#dce6e0':'#bb9ab2'}"/>${path('M10-18l7-5','#d4b98e',4)}</g>`
    if (beat.style === 'nap') hands = path('M-8-51h9l-9 8h9','#b8c5c7')
    if (beat.style === 'watch' || beat.style === 'gaze') hands = path('M12-21l13-16','#d4b98e',4)
    if (beat.style === 'feed') hands = path('M10-21l20 4','#d4b98e',4) + r(30,-13,3,3,'#d8be80') + r(25,-8,3,3,'#d8be80')
    if (beat.style === 'ribbon') hands = path('M10-23l14-7v22m0-22 8 9-8-3-7 5','#c49fa6',3)
    if (beat.style === 'peek') hands = path('M-13-23l-6-13m32 13 6-13','#d4b98e',4)
    if (beat.style === 'plane') hands = `<g class="actor-motion">${motion('translate','5 -5;25 -18;5 -5',p.period,now,quiet)}<path d="M3-22l27-9-12 17-4-9z" fill="#d6d9ce"/></g>`
  }
  const extra = reaction === 'error' ? path('M0-65v8m0 4v2','#d2a278',3) : reaction === 'happy' ? note : ''
  if (arrived && !paused && beat.stage === 3) {
    hands = beat.style === 'crown' ? '' : beat.style === 'grill' || beat.style === 'snack' ? cup
      : beat.style === 'play' ? `<circle cx="25" cy="-7" r="7" fill="#b6a6b5"/>`
      : path('M14-21l11-15m-2-4 3 4 5-4','#d4b98e',3)
  }
  const pose = arrived && !paused ? beat.style === 'nap' ? `rotate(-8 0 ${ground})`
    : beat.style === 'lounge' ? `rotate(-10 0 ${ground})` : beat.style === 'swing' ? 'translate(0 -12)'
    : scene==='ocean' && beat.style==='swim' ? `rotate(14 0 ${ground-18})` : '' : ''
  return `<g><title>Life: ${paused ? `waiting quietly at the ${LIFE[scene]![episode.slot]!.title}` : beat.label}; ${p.title} ${p.habit}</title><g transform="${pose}"><g class="actor-motion">${anim}${body}</g><g transform="translate(0 ${ground})">${hands}${extra}</g></g></g>`
}

export type LifeUse = { index: number; label: string; closing: boolean; failed: boolean; period: number }
export const lifeObjectsSvg = (scene: string, width: number, ground: number, now: number, uses: LifeUse[], liveliness: Liveliness) => LIFE[scene]!.map((p,index) => {
  const x = spotX(scene,index,width)
  const occupied = uses.filter(u=>u.index===index).length
  let s = ''
  if (p.shape === 'barrel') s = r(-20,-37,40,37,'#687680') + r(-23,-39,46,5,'#9a9c8d') + path('M-19-28h38m-38 16h38','#98a39b',3) + `<g class="actor-motion">${motion('translate','0 0;0 -3;0 0',1.8,now,liveliness==='quiet')}${flame}</g>`
  if (p.shape === 'grill') s = r(-28,-28,56,10,'#6c7b7d') + path('M-24-18l-4 18m52-18 4 18','#a5b3a6',4) + r(-23,-35,46,7,'#b28b63') + path('M-24-35h48m-45 3h42','#d6b890') + r(-11,-39,8,5,'#c19a68') + r(8,-39,8,5,'#b47e59')
  if (p.shape === 'boombox') s = r(-27,-27,54,27,'#8b8097') + r(-19,-34,38,6,'#b9a89f') + `<circle cx="-15" cy="-13" r="9" fill="#3d4357"/><circle cx="15" cy="-13" r="9" fill="#3d4357"/>` + r(-6,-21,12,12,'#c6b993') + `<g class="actor-motion">${motion('translate','0 0;0 -4;0 0',1.1,now,liveliness==='quiet')}${note}</g>`
  if (p.shape === 'stoop') s = r(-32,-8,64,8,'#8b7f8b') + r(-26,-16,52,8,'#a99a9a') + r(-21,-24,42,8,'#bbaba3') + path('M-36-8v-37h67v29','#89958c',3) + r(-15,-52,30,28,'#766b7e') + r(8,-38,4,4,'#d5be83')
  if (p.shape === 'anemone') s = `<ellipse cy="-4" rx="33" ry="7" fill="#8c8eae"/>` + [-25,-13,0,13,25].map((x,i)=>path(`M${x} 0q-12-${20+i%2*12} 0-${26+i%2*12}q12-7 4-14`,'#c49dbb',5)).join('')
  if (p.shape === 'fish') s = `<title>fish swimming around their visitor</title><g class="actor-motion">${motion('translate','-12 -3;10 -10;-12 -3',4.8,now,liveliness==='quiet')}${[-23,0,24].map((x,i)=>`<g transform="translate(${x} ${-35+i%2*16})"><path d="M-10 0q9-12 19 0-10 12-19 0l-8 7v-14z" fill="${i%2?'#baaf78':'#92b9bb'}"/>${r(3,-2,2,2,'#385364')}</g>`).join('')}</g>`
  if (p.shape === 'bubbles') s = path('M-30 0q-10-47 5-53m55 53q10-47-5-53','#ba9ca6',6) + `<g class="actor-motion">${motion('translate','0 0;0 -14;0 0',3.4,now,liveliness==='quiet')}${[-18,0,20].map((x,i)=>`<circle cx="${x}" cy="${-18-i*12}" r="${5+i}" fill="none" stroke="#a9d0cf" stroke-width="2"/>`).join('')}</g>`
  if (p.shape === 'treasure') s = r(-28,-23,56,23,'#a48a69') + r(-30,-31,60,7,'#bfa27b') + r(-20,-21,4,21,'#c6b583') + r(17,-21,4,21,'#c6b583') + path('M-14-32l-3-12 10 5 7-12 7 12 10-5-3 12z','#d3c17f',4)
  if (['picnic','candy'].includes(p.shape)) s = `<path d="M-36-12h66l10 12h-78z" fill="#ac828b"/>` + path('M-24-11l5 11m13-11 3 11m12-11 1 11m-41-5h63','#d0b4a1',3) + r(-18,-24,24,13,'#bb9e76') + path('M-14-24v-8H2v8','#c9b08c',3) + cup + (p.shape==='candy'?path('M-21-35l8 5-8 5m22-10-8 5 8 5','#bba6cc',5):'')
  if (p.shape === 'flowers') s = [-26,-10,9,27].map((x,i)=>path(`M${x} 0v-${15+i%2*10}`,'#899f75',3)+`<circle cx="${x}" cy="${-18-i%2*10}" r="7" fill="${i%2?'#c4a3bd':'#d5bd84'}"/>`).join('') + `<g class="actor-motion">${motion('translate','-15 -4;14 -12;-15 -4',4.6,now,liveliness==='quiet')}<path d="M0-42q-13-14-13-3 0 8 13 3 13 5 13-3 0-11-13 3" fill="#d6bf8c"/></g>`
  if (['swing','hammock'].includes(p.shape)) {
    // wide enough for the two friends who share it, one on each seat
    const o = width < 620 ? 23 : 30
    s = path('M-54 0v-65m108 65v-65','#a7967f',5) + (p.shape==='swing'
      ? path(`M-54-63h108${[-o,o].map(x=>`M${x-12}-63v51m24-51v51M${x-14}-12h28`).join('')}`,'#bdba9b',4)
      : `<path d="M-37-51q37 50 74 0l-8 27q-29 23-58 0z" transform="scale(1.46 1)" fill="${scene==='space'?'#899ab4':'#b7a0a0'}"/>`)
  }
  if (p.shape === 'sofa') s = r(-36,-27,72,24,'#9891a7') + r(-40,-21,9,21,'#79758e') + r(31,-21,9,21,'#79758e') + r(-29,-20,24,13,'#c2afa9') + r(5,-20,24,13,'#a8b8ac')
  if (p.shape === 'toys') s = r(-29,-20,58,20,'#a88d6b') + path('M-31-28h62','#c8b289',6) + r(-22,-36,13,13,'#b48b9b') + `<circle cx="16" cy="-29" r="10" fill="#a8b3c3"/>` + path('M-5-18l8-15 8 15z','#d0be83',4)
  if (['fort','tent'].includes(p.shape)) s = `<path d="M-40 0L0-59 40 0z" fill="${p.shape==='fort'?'#ab9cb4':'#c5ad86'}"/><path d="M-15 0L0-37 15 0z" fill="#5d6877"/>` + r(-29,-7,20,7,'#b9b3a4') + r(15,-11,19,11,'#b5a2a5')
  if (p.shape === 'rock') s = `<path d="M-38 0l10-25 30-9 27 15 9 19z" fill="#9d7f83"/>` + path('M-23-20l15 4 19-8','#c19b90',3)
  if (p.shape === 'crystals') s = [-23,0,24].map((x,i)=>`<path d="M${x-9} 0v-${22+i%2*20}l9-13 9 13V0z" fill="${i%2?'#b09bc2':'#8faebb'}"/>` + path(`M${x} 0v-${35+i%2*20}`,'#cfbed4')).join('')
  if (['spring','pond'].includes(p.shape)) s = `<ellipse cy="-7" rx="37" ry="12" fill="${p.shape==='spring'?'#b3b3bb':'#91b5b5'}" stroke="#b3ad9e" stroke-width="5"/>` + (p.shape==='spring'?path('M-17-28q-9-9 0-19m22 18q-9-9 0-19','#c8c9c0'):path('M-19-9l9 4 9-4m8 4 9-3 8 3','#d8bd91',3))
  if (p.shape === 'petals') s = path('M-37-2q37-10 74 0','#a7ab8e',4) + [-22,-5,12,27].map((x,i)=>`<ellipse cx="${x}" cy="${-10-i*13}" rx="5" ry="3" fill="#d6b1be" transform="rotate(${i*25} ${x} ${-10-i*13})"/>`).join('')
  if (p.shape === 'ribbons') s = path('M0 0v-65m0 18-25-13m25 9 26-17','#9b8b77',5) + [-22,0,22].map((x,i)=>r(x,-57+i%2*8,5,25,['#b9a5c6','#c7b88b','#bc929c'][i]!)).join('')
  if (p.shape === 'fire') s = path('M-25-3l47-9m-44 0 47 9','#ae957c',6) + `<g transform="translate(0 28)" class="actor-motion">${motion('translate','0 28;0 25;0 28',2.2,now,liveliness==='quiet')}${flame}</g>`
  if (p.shape === 'snowballs') s = [-25,-6,17].map((x,i)=>`<circle cx="${x}" cy="${-8-i%2*5}" r="${9+i*2}" fill="#d9e4e0"/>`).join('') + path('M-35 0h70','#b9ceca',3)
  if (p.shape === 'snowman') s = `<circle cy="-17" r="19" fill="#d5dfd9"/><circle cy="-43" r="13" fill="#e1e7db"/>` + r(-16,-59,32,5,'#7c8898') + r(-10,-70,20,12,'#7c8898') + path('M-12-31h25v15','#b88992',6) + r(-6,-47,3,3,'#687b83') + r(4,-47,3,3,'#687b83') + path('M0-41l12 2-12 3','#c39d72',3)
  if (['sled','dune'].includes(p.shape)) s = `<path d="M-38 0q26-40 75-12L38 0z" fill="${p.shape==='sled'?'#c6d9d7':'#c4ad83'}"/>` + path('M-18-16l33 9m-36-3 32 9 9-4','#ad8b79',4)
  if (p.shape === 'fireflies') s = path('M-30 0v-21m17 21v-14m40 14v-26','#7a998b',3) + [-24,-8,11,29].map((x,i)=>`<circle cx="${x}" cy="${-30-i%2*21}" r="3" fill="#d4ce91"/><circle cx="${x}" cy="${-30-i%2*21}" r="7" fill="#d4ce91" opacity=".12"/>`).join('')
  if (p.shape === 'lanterns') s = path('M-37 0v-64m74 64v-64m-74 0q37 17 74 0','#8f9f9d',3) + [-23,0,23].map((x,i)=>r(x-6,-55+i%2*8,12,18,'#c7b38a')+r(x-3,-50+i%2*8,6,8,'#e0cf9e')).join('')
  if (['stars','comets'].includes(p.shape)) s = `<path d="M-36-9h65l8 9h-75z" fill="#8e94ad"/>` + path('M-20-55v12m-6-6h12m29-22v15m-7-7h14','#d7cc9a',3) + (p.shape==='comets'?path('M-2-44l29-17m-21 20 28-17','#9fbcc0',3):'')
  if (['cushions','pumpkins'].includes(p.shape)) s = p.shape==='cushions' ? r(-34,-12,30,12,'#afa2b0') + r(3,-18,32,18,'#a8b7a8') + path('M-30-12l10-10 13 10','#d0b8a0',5) : [-23,3,26].map((x,i)=>`<ellipse cx="${x}" cy="${-11-i%2*5}" rx="15" ry="${12+i%2*5}" fill="${i%2?'#be9b69':'#ae8b6c'}"/>`+r(x-2,-28-i%2*5,4,7,'#8e9e80')+path(`M${x-7}-${11+i%2*5}h4m6 0h4`,'#e2c588',3)).join('')
  if (p.shape === 'moonball') s = `<ellipse cy="-3" rx="35" ry="6" fill="#7f8da6"/><circle cy="-29" r="15" fill="#bdacba"/>` + path('M-13-35q13 15 27 2M-2-43q-8 16 7 28','#d8c9c6',3)
  if (p.shape === 'pod') s = `<path d="M-33 0v-28q33-40 66 0V0z" fill="#849baa"/><path d="M-22 0v-25q22-22 44 0V0" fill="#546d81"/>` + r(-11,-28,10,8,'#cbb494') + r(9,-17,8,8,'#b7a0ae')
  if (p.shape === 'coffee') s = r(-28,-18,56,5,'#a69b8b') + path('M-23-13v13m46-13v13','#939f9a',4) + `<g transform="translate(-20 -19)">${cup}</g>` + r(12,-33,12,15,'#c8b08d') + path('M-1-49q-6-6 0-12','#c4ccc2')
  if (p.shape === 'planes') s = path('M-32 0l62-16','#9aada7',3) + `<path d="M-26-26l39-15-14 25-6-13z" fill="#c9d3ca"/><path d="M10-48l22-9-8 15-4-8z" fill="#b6bdca"/>`
  if (p.shape === 'games') s = `<path d="M-32-12h58l9 12h-70z" fill="#9fae9f"/>` + path('M-19-10l3 10m10-10 3 10m10-10 3 10m-39-5h60','#d0c7a4',2) + r(-20,-20,7,8,'#bfa7b8') + r(8,-24,7,12,'#bcb087')
  if (p.shape === 'shells') s = [-25,-5,20].map((x,i)=>`<path d="M${x-9}-3q-8-${18+i%2*6} 9-${20+i%2*6}q17 0 9 ${20+i%2*6}z" fill="${i%2?'#bda4ad':'#d2bd9e'}"/>` + path(`M${x}-4v-16m-4 17-4-13m12 13 4-13`,'#e1d0b5')).join('')
  if (p.shape === 'castle') s = r(-28,-18,56,18,'#c5b18a') + r(-31,-31,17,31,'#d6c19a') + r(14,-31,17,31,'#d6c19a') + path('M-33-33h21m0 11h27m-3-11h21','#d6c19a',6) + r(-6,-13,12,13,'#978c79') + path('M0-23v-32l14 6-14 5','#a9a2b4',3)
  if (p.shape === 'ghost') s = `<path d="M-25-9v-28q0-27 23-27t23 27v28l-9-8-9 8-9-8-9 8z" fill="#c6c1cf"/>` + r(-13,-41,5,7,'#83879e') + r(3,-41,5,7,'#83879e') + r(25,-7,13,7,'#9e8eab')
  if (p.shape === 'cauldron') s = `<path d="M-29-28h58v15q-3 25-29 13-26 12-29-13z" fill="#819b94"/>` + path('M-31-29h62','#b8b69c',5) + `<circle cx="-12" cy="-42" r="6" fill="#b1c79b"/><circle cx="12" cy="-54" r="4" fill="#c0b1cd"/>` + path('M-17-9l4 4m19-4 4 4','#c5bd91',3)
  return `<g transform="translate(${x} ${ground})"><title>Place: ${p.title}</title>${occupied ? `<title>Neighborhood: ${occupied > 1 ? 'hanging out together' : p.activity}</title>` : ''}${s}</g>`
}).join('')

const SOCIAL: Record<string,[string,string,string]> = {
  city: ['welcoming someone to the neighborhood','sharing a little street gossip','celebrating at the street party'],
  ocean: ['welcoming a new swimming buddy','exchanging a trail of bubbles','swirling together in a bubble party'],
  meadow: ['making room on the picnic blanket','sharing a picnic snack','dancing through the flowers'],
  home: ['offering a favorite cushion','sharing a secret from the pillow fort','having a little living-room party'],
  lava: ['making room on the warm rock','sharing an ember-roasted snack','dancing beside the embers'],
  sakura: ['offering a cup of blossom tea','sharing a wish beneath the blossoms','dancing in a shower of petals'],
  snow: ['offering a cup of cocoa','showing a freshly rolled snowball','cheering beside the snowman'],
  night: ['making room by the story fire','sharing a campfire story','waving the lanterns together'],
  desert: ['offering a cushion in the shade','sharing dates at the oasis','dancing beside the oasis'],
  space: ['welcoming a new orbit buddy','pointing out a passing comet','bouncing together in low gravity'],
  office: ['offering a coffee break','showing a new paper-plane trick','cheering at the game corner'],
  beach: ['making room beside the barbecue','showing a beautiful shell','having a little beach party'],
  halloween: ['offering a pumpkin cushion','sharing a spooky little story','dancing at the cauldron party'],
}
export const lifeDuetLabel = (scene: string,kind: DuetKind) => kind === 'trouble' ? 'checking on a startled friend' : SOCIAL[scene]![kind==='welcome'?0:kind==='message'?1:2]!
export const lifeDuetSvg = (scene: string,kind: DuetKind,p: Personality,ground: number,at: number,now: number,role: 'send'|'recv') => {
  const stage = duetBeat(kind,role,p,at,now)?.stage ?? 3
  const gesture = stage === 0 ? 'joining a friend' : stage === 3 ? 'waving goodbye' : ({meticulous:'offers a careful toast',curious:'points out a tiny discovery',dramatic:'raises both arms in a grand toast',sleepy:'shares a slow, sleepy toast',shy:'offers a small, shy wave'})[p.id]
  const prop = scene==='ocean' ? `<circle cx="20" cy="-36" r="7" fill="none" stroke="#b6d5cb"/>` : kind==='finished'?note:cup
  const arms = p.id==='dramatic' ? path('M-14-19l-17-17m45 17 17-17','#d4b98e',4) : path(`M12-20l${p.id==='shy'?6:13}-${p.id==='sleepy'?3:12}`,'#d4b98e',4)
  return `<g><title>Together: ${lifeDuetLabel(scene,kind)}; ${p.title}; ${gesture}</title><g transform="translate(0 ${ground})">${stage===1||stage===2?arms+prop:''}</g></g>`
}
