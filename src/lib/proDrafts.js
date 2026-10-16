import { ROLES } from './roles.js'
import { TRAITS, analyzeComp, traitSimilarity } from './draft.js'
import { getProfile, traitWeight } from './profiles.js'

// Compos de référence de la scène pro : des structures de draft récurrentes en compétition,
// pas des drafts de matchs précis. Les champions bougent avec les patchs, la structure reste.
// Les drafts réelles des derniers patchs (src/data/meta.json) viennent illustrer chaque structure.
//
// Par rôle : le pick emblématique en premier, puis des alternatives qui ont leur place dans la même compo.
// `archetype` correspond aux clés de ARCHETYPES dans draft.js.
export const PRO_DRAFTS = [
  {
    key: 'wombo',
    name: 'Wombo combo',
    origin: 'Ultimes combinés en teamfight, un classique des grandes compétitions.',
    archetype: 'engage',
    picks: {
      top: ['Malphite', 'Ornn', 'Gnar'],
      jungle: ['JarvanIV', 'Sejuani', 'Vi'],
      mid: ['Orianna', 'Yasuo', 'Galio'],
      adc: ['MissFortune', 'Xayah', 'Samira'],
      support: ['Rakan', 'Leona', 'Alistar'],
    },
    notes: [
      "Tout repose sur l'enchaînement des ultimes : annoncez l'ordre (engage, puis zone, puis dégâts) avant chaque objectif.",
      'Forcez les fights dans les zones étroites (pit, jungle) où les ultimes touchent plusieurs cibles.',
    ],
  },
  {
    key: 'dive',
    name: 'Plongée early',
    origin: "Style agressif associé à la LPL : on plonge les lanes tôt, puis la backline adverse en teamfight.",
    archetype: 'dive',
    picks: {
      top: ['Renekton', 'Camille', 'Ambessa'],
      jungle: ['XinZhao', 'Vi', 'Nocturne', 'LeeSin'],
      mid: ['Akali', 'Sylas', 'Galio'],
      adc: ['Kalista', 'Lucian', 'Samira'],
      support: ['Nautilus', 'Rakan', 'Alistar', 'Leona'],
    },
    notes: [
      'Dives à 3-4 dès le niveau 6 : le jungler et le support jouent autour de la lane qui a la priorité.',
      "En teamfight, tout le monde plonge sur le même carry. Convertissez chaque kill en objectif : cette compo perd sa valeur après 25 min.",
    ],
  },
  {
    key: 'front-to-back',
    name: 'Front-to-back',
    origin: "Le teamfight « neutre » : ni besoin d'engager ni d'attendre, très présent quand Orianna ou Azir sont dans la méta.",
    archetype: 'frontToBack',
    picks: {
      top: ['KSante', 'Ornn', 'Sion'],
      jungle: ['Sejuani', 'Vi', 'Skarner'],
      mid: ['Orianna', 'Azir', 'Viktor'],
      adc: ['Aphelios', 'Jinx', 'Zeri', 'Smolder'],
      support: ['Braum', 'Rell', 'TahmKench'],
    },
    notes: [
      'La frontline avance, les carries frappent ce qui est devant eux : pas besoin de chercher la backline adverse.',
      "Gardez la formation : le mid et l'ADC ne dépassent jamais leur frontline.",
    ],
  },
  {
    key: 'counter',
    name: 'Réception',
    origin: "Laisser l'adversaire engager pour mieux le punir : la réponse classique aux compos wombo et plongée.",
    archetype: 'counter',
    picks: {
      top: ['Gnar', 'Poppy', 'Ornn'],
      jungle: ['Maokai', 'Gragas', 'Ivern'],
      mid: ['Azir', 'Lissandra', 'Taliyah', 'Anivia'],
      adc: ['Xayah', 'Sivir', 'Ezreal'],
      support: ['Braum', 'Janna', 'Taric', 'Renata'],
    },
    notes: [
      "N'engagez pas : arrivez à l'objectif en premier et obligez l'adversaire à traverser votre zone.",
      "Gardez les sorts de réception (ultis de Braum, Gnar ou Azir) pour le premier qui rentre, puis retournez le fight.",
    ],
  },
  {
    key: 'protect',
    name: 'Protect the hypercarry',
    origin: "Popularisé par la méta Encensoir ardent de 2017 (Kog'Maw + Lulu), repris dès qu'un hypercarry est fort.",
    archetype: 'protect',
    picks: {
      top: ['Ornn', 'Shen', 'Maokai'],
      jungle: ['Sejuani', 'Gragas', 'Ivern'],
      mid: ['Orianna', 'Lissandra', 'Karma'],
      adc: ['KogMaw', 'Twitch', 'Jinx', 'Aphelios'],
      support: ['Lulu', 'Janna', 'Milio', 'Yuumi'],
    },
    notes: [
      "Les quatre autres jouent pour l'ADC : ressources, vision autour de lui, CC gardés pour ceux qui le plongent.",
      "Jouez le temps : chaque item de l'hypercarry rapproche la victoire, ne forcez rien avant 3 items.",
    ],
  },
  {
    key: 'poke',
    name: 'Poke / Siège',
    origin: 'Siège à longue portée, ressorti à chaque patch où Jayce, Varus ou Ezreal dominent.',
    archetype: 'poke',
    picks: {
      top: ['Jayce', 'Gangplank', 'Gnar'],
      jungle: ['Nidalee', 'Ivern', 'Gragas'],
      mid: ['Xerath', 'Ziggs', 'Hwei', 'Zoe'],
      adc: ['Ezreal', 'Varus', 'Caitlyn', 'Jhin'],
      support: ['Karma', 'Lux', 'Zyra', 'Janna'],
    },
    notes: [
      "Arrivez à l'objectif avant l'adversaire et pokez-le pendant qu'il approche : il arrive à 60 % de vie.",
      'Gardez un sort de réception (Janna, Karma, Gnar, Gragas) pour punir chaque tentative d\'engage.',
    ],
  },
  {
    key: 'pick',
    name: 'Pick / Vision',
    origin: 'Contrôle de la vision et attrapes, la marque des équipes très disciplinées sur la carte.',
    archetype: 'pick',
    picks: {
      top: ['Camille', 'Pantheon', 'Gnar'],
      jungle: ['Elise', 'LeeSin', 'Nidalee', 'Nocturne'],
      mid: ['Leblanc', 'Syndra', 'Ahri', 'TwistedFate'],
      adc: ['Varus', 'Ashe', 'Jhin'],
      support: ['Thresh', 'Pyke', 'Blitzcrank', 'Nautilus'],
    },
    notes: [
      'Le support et le jungler nettoient la vision adverse en continu : un adversaire sans ward est une proie.',
      'Après chaque pick, objectif immédiat. Sans pick, ne contestez pas à 5 contre 5.',
    ],
  },
  {
    key: 'split',
    name: '1-3-1',
    origin: 'Split push à deux side lanes, classique avec Twisted Fate ou un top duelliste fort.',
    archetype: 'split',
    picks: {
      top: ['Fiora', 'Camille', 'Jax', 'Gwen'],
      jungle: ['Gragas', 'Maokai', 'Sejuani'],
      mid: ['TwistedFate', 'Ryze', 'Akali'],
      adc: ['Ezreal', 'Sivir', 'Caitlyn'],
      support: ['Janna', 'Braum', 'Karma', 'Renata'],
    },
    notes: [
      'Le top et le mid poussent les side lanes, les 3 autres tiennent le mid sans jamais engager.',
      'Dès que 2 adversaires répondent à un side, les autres prennent un objectif ailleurs.',
    ],
  },
]

const SIGNATURE = (ref) => Object.fromEntries(ROLES.map((r) => [r.key, ref.picks[r.key][0]]))

// `byId` : champions Data Dragon, pour estimer la fiche de ceux qui n'en ont pas.
const weightOf = (id, role, key, byId = {}) => traitWeight(getProfile(byId[id] ?? { id }, role), key)

// Total de chaque trait pour une compo { role: id }.
const traitCounts = (picks) =>
  Object.fromEntries(TRAITS.map((t) => [t.key, ROLES.reduce((sum, r) => sum + weightOf(picks[r.key], r.key, t.key), 0)]))

// Proximité (0 à 1) entre une compo analysée et une référence :
//   45 % : mêmes champions au même rôle (emblématique = 1, alternative = 0.75, autre rôle = 0.4)
//   40 % : même répartition de traits
//   15 % : même archétype principal
function similarity(ref, analysis) {
  const { champs } = analysis
  if (!champs.length) return 0

  // Compo incomplète : on ramène les traits sur 5 champions pour comparer à des compos complètes.
  const scale = 5 / champs.length
  const ours = Object.fromEntries(TRAITS.map((t) => [t.key, analysis.traits[t.key] * scale]))

  const champScore =
    champs.reduce((sum, c) => {
      const idx = ref.picks[c.role].indexOf(c.id)
      if (idx === 0) return sum + 1
      if (idx > 0) return sum + 0.75
      return sum + (Object.values(ref.picks).some((pool) => pool.includes(c.id)) ? 0.4 : 0)
    }, 0) / champs.length
  const traitScore = traitSimilarity(ours, traitCounts(SIGNATURE(ref)))
  const archetypeScore = ref.archetype === analysis.archetype?.key ? 1 : 0
  return 0.45 * champScore + 0.4 * traitScore + 0.15 * archetypeScore
}

// Les références, de la plus proche à la moins proche de la compo analysée.
export function matchProDrafts(analysis) {
  if (!analysis.champs.length) return []
  return PRO_DRAFTS.map((ref) => ({ ...ref, similarity: similarity(ref, analysis) })).sort((a, b) => b.similarity - a.similarity)
}

// Drafts pro réelles ({ picks: [top, jungle, mid, adc, support], … }) analysées comme nos compos.
export function classifyProDrafts(drafts, byId) {
  return drafts.map((d) => ({
    ...d,
    analysis: analyzeComp(Object.fromEntries(ROLES.map((r, i) => [r.key, { champion: d.picks[i] }])), byId),
  }))
}

// Drafts réelles qui jouent le style d'une référence, les plus proches d'elle en premier.
export function proExamples(ref, classified, limit = 3) {
  return classified
    .filter((d) => d.analysis.archetype?.key === ref.archetype)
    .map((d) => ({ ...d, similarity: similarity(ref, d.analysis) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

// Comment adapter notre compo à une référence, rôle par rôle.
// - pools : { role: [ids] } champions maîtrisés par le joueur placé à ce rôle, proposés en priorité.
// - taken : champions déjà pris dans la compo (exclus des suggestions).
// - meta : { role: [ids] } champions forts du moment à ce rôle (soloQ et pro), du plus fort au moins fort.
// - byId : champions Data Dragon, pour estimer ceux qui n'ont pas de fiche.
export function adaptToProDraft(ref, analysis, { pools = {}, taken = [], meta = {}, byId = {} } = {}) {
  const signature = SIGNATURE(ref)

  return ROLES.map((r) => {
    const current = analysis.champs.find((c) => c.role === r.key)
    const refPool = ref.picks[r.key]
    // Fonction attendue à ce rôle : les points forts du pick emblématique.
    const expected = TRAITS.filter((t) => weightOf(signature[r.key], r.key, t.key) >= 1)
    const missing = current ? expected.filter((t) => traitWeight(current.profile, t.key) === 0) : expected

    let status = 'empty'
    if (current) status = refPool.includes(current.id) ? 'match' : missing.length === 0 ? 'close' : 'off'

    const suggestions = []
    if (status === 'off' || status === 'empty') {
      const coverage = (id) => expected.reduce((sum, t) => sum + weightOf(id, r.key, t.key, byId), 0) / expected.length
      const playerPool = pools[r.key] ?? []
      const metaPool = meta[r.key] ?? []
      const available = (id) => id !== current?.id && !taken.includes(id) && !suggestions.some((s) => s.id === id)
      const add = (ids, max) =>
        ids
          .filter(available)
          .slice(0, max)
          .forEach((id) => suggestions.push({ id, inPool: playerPool.includes(id), inRef: refPool.includes(id), inMeta: metaPool.includes(id) }))

      // D'abord ce que le joueur sait jouer et qui remplit la même fonction, puis ce qui est fort en ce moment, puis les picks pro.
      add(playerPool.filter((id) => coverage(id) >= 0.6).sort((a, b) => coverage(b) - coverage(a)), 3)
      add(metaPool.filter((id) => coverage(id) >= 0.6), 2)
      add(refPool, Math.max(2, 5 - suggestions.length))
    }

    return { role: r.key, current, refPool, status, missing, suggestions }
  })
}
