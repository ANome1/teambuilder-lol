import { ROLES } from './roles.js'
import { TRAITS } from './draft.js'
import { getProfile } from './profiles.js'

// Compos de référence de la scène pro : des structures de draft récurrentes en compétition,
// pas des drafts de matchs précis. Les champions bougent avec les patchs, la structure reste.
//
// Par rôle : le pick emblématique en premier, puis des alternatives qui remplissent la même fonction.
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
    origin: "Style agressif associé à la LPL : on plonge les lanes tôt et on enchaîne les fights.",
    archetype: 'engage',
    picks: {
      top: ['Renekton', 'Camille', 'Gnar'],
      jungle: ['XinZhao', 'Vi', 'LeeSin', 'JarvanIV'],
      mid: ['Galio', 'Sylas', 'Akali'],
      adc: ['Kalista', 'Lucian', 'Draven'],
      support: ['Nautilus', 'Alistar', 'Rakan', 'Leona'],
    },
    notes: [
      'Dives à 3-4 dès le niveau 6 : le jungler et le support jouent autour de la lane qui a la priorité.',
      "Convertissez chaque kill en objectif (Héraut, tours, drakes) : cette compo perd sa valeur après 25 min.",
    ],
  },
  {
    key: 'protect',
    name: "Protect the hypercarry",
    origin: "Popularisé par la méta Encensoir ardent de 2017 (Kog'Maw + Lulu), repris dès qu'un hypercarry est fort.",
    archetype: 'protect',
    picks: {
      top: ['Ornn', 'Shen', 'Maokai'],
      jungle: ['Sejuani', 'Gragas', 'Ivern'],
      mid: ['Orianna', 'Lissandra', 'Karma'],
      adc: ['KogMaw', 'Twitch', 'Jinx', 'Aphelios'],
      support: ['Lulu', 'Janna', 'Braum', 'Milio'],
    },
    notes: [
      "Les quatre autres jouent pour l'ADC : ressources, vision autour de lui, CC gardés pour ceux qui le plongent.",
      "Jouez le temps : chaque item de l'hypercarry rapproche la victoire, ne forcez rien avant 3 items.",
    ],
  },
  {
    key: 'front-to-back',
    name: 'Front-to-back',
    origin: "Teamfight méthodique autour d'un mage de zone, très présent quand Azir ou Orianna sont dans la méta.",
    archetype: 'protect',
    picks: {
      top: ['KSante', 'Ornn', 'Gnar'],
      jungle: ['Sejuani', 'Maokai', 'Vi'],
      mid: ['Azir', 'Orianna', 'Viktor'],
      adc: ['Aphelios', 'Jinx', 'Zeri', 'Smolder'],
      support: ['Braum', 'Rell', 'Nautilus'],
    },
    notes: [
      'La frontline avance, les carries frappent ce qui est devant eux : pas besoin de chercher la backline adverse.',
      'Gardez la formation : le mid et l\'ADC ne dépassent jamais leur frontline.',
    ],
  },
  {
    key: 'poke',
    name: 'Poke / Siège',
    origin: 'Siège à longue portée, ressorti à chaque patch où Jayce, Varus ou Ezreal dominent.',
    archetype: 'poke',
    picks: {
      top: ['Jayce', 'Gangplank', 'Gnar'],
      jungle: ['Nidalee', 'Ivern', 'Lillia'],
      mid: ['Xerath', 'Ziggs', 'Hwei', 'Zoe'],
      adc: ['Ezreal', 'Varus', 'Caitlyn', 'Jhin'],
      support: ['Karma', 'Lux', 'Zyra', 'Janna'],
    },
    notes: [
      "Arrivez à l'objectif avant l'adversaire et pokez-le pendant qu'il approche : il arrive à 60 % de vie.",
      'Gardez un disengage (Janna, Karma, Gnar) pour punir chaque tentative d\'engage.',
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
      mid: ['TwistedFate', 'Ryze', 'Taliyah'],
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

const traitsOf = (id) => getProfile({ id }).traits

const traitCounts = (ids) =>
  Object.fromEntries(TRAITS.map((t) => [t.key, ids.filter((id) => traitsOf(id).has(t.key)).length]))

// Similarité pondérée (Jaccard) entre deux vecteurs de traits.
const traitSimilarity = (a, b) => {
  let min = 0
  let max = 0
  for (const t of TRAITS) {
    min += Math.min(a[t.key], b[t.key])
    max += Math.max(a[t.key], b[t.key])
  }
  return max ? min / max : 0
}

// Proximité (0 à 1) entre la compo analysée et chaque référence, du plus proche au moins proche.
//   45 % : mêmes champions au même rôle (emblématique = 1, alternative = 0.75, autre rôle = 0.4)
//   40 % : même répartition de traits
//   15 % : même archétype principal
export function matchProDrafts(analysis) {
  const { champs } = analysis
  if (!champs.length) return []

  // Compo incomplète : on ramène les traits sur 5 champions pour comparer à des compos complètes.
  const scale = 5 / champs.length
  const ours = Object.fromEntries(TRAITS.map((t) => [t.key, analysis.traits[t.key] * scale]))

  return PRO_DRAFTS.map((ref) => {
    const champScore =
      champs.reduce((sum, c) => {
        const idx = ref.picks[c.role].indexOf(c.id)
        if (idx === 0) return sum + 1
        if (idx > 0) return sum + 0.75
        return sum + (Object.values(ref.picks).some((pool) => pool.includes(c.id)) ? 0.4 : 0)
      }, 0) / champs.length
    const traitScore = traitSimilarity(ours, traitCounts(Object.values(SIGNATURE(ref))))
    const archetypeScore = ref.archetype === analysis.archetype?.key ? 1 : 0
    return { ...ref, similarity: 0.45 * champScore + 0.4 * traitScore + 0.15 * archetypeScore }
  }).sort((a, b) => b.similarity - a.similarity)
}

// Comment adapter notre compo à une référence, rôle par rôle.
// `pools` : { role: [ids] } champions maîtrisés par le joueur placé à ce rôle, proposés en priorité.
// `taken` : champions déjà pris dans la compo (exclus des suggestions).
export function adaptToProDraft(ref, analysis, pools = {}, taken = []) {
  const signature = SIGNATURE(ref)

  return ROLES.map((r) => {
    const current = analysis.champs.find((c) => c.role === r.key)
    const refPool = ref.picks[r.key]
    const expected = traitsOf(signature[r.key])
    const missing = TRAITS.filter((t) => expected.has(t.key) && !current?.profile.traits.has(t.key))

    let status = 'empty'
    if (current) status = refPool.includes(current.id) ? 'match' : missing.length === 0 ? 'close' : 'off'

    const suggestions = []
    if (status === 'off' || status === 'empty') {
      const available = (id) => id !== current?.id && !taken.includes(id)
      const coverage = (id) => [...expected].filter((t) => traitsOf(id).has(t)).length / expected.size
      const playerPool = pools[r.key] ?? []

      // D'abord ce que le joueur sait jouer et qui remplit la même fonction, puis les picks pro.
      playerPool
        .filter((id) => available(id) && coverage(id) >= 0.6)
        .sort((a, b) => coverage(b) - coverage(a))
        .slice(0, 3)
        .forEach((id) => suggestions.push({ id, inPool: true, inRef: refPool.includes(id) }))
      refPool
        .filter((id) => available(id) && !suggestions.some((s) => s.id === id))
        .slice(0, 4 - Math.min(suggestions.length, 2))
        .forEach((id) => suggestions.push({ id, inPool: playerPool.includes(id), inRef: true }))
    }

    return { role: r.key, current, refPool, status, missing, suggestions }
  })
}
