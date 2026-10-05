import { ROLES, roleLabel } from './roles.js'
import { getProfile } from './profiles.js'

export const TRAITS = [
  { key: 'F', label: 'Frontline' },
  { key: 'E', label: 'Engage' },
  { key: 'C', label: 'Contrôle' },
  { key: 'D', label: 'DPS teamfight' },
  { key: 'K', label: 'Poke' },
  { key: 'A', label: 'Pick / burst' },
  { key: 'S', label: 'Split push' },
  { key: 'P', label: 'Peel' },
]

const SCALING_VALUE = { e: 1, m: 2, l: 3 }

// "Malphite (Top) et Orianna (Mid)" — 3 noms max pour rester lisible.
const names = (list) => {
  const parts = list.slice(0, 3).map((c) => `${c.name} (${roleLabel(c.role)})`)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}` : parts[0]
}

// Libellés des métriques utilisées par les archétypes (traits + métriques dérivées).
const METRIC_LABELS = {
  ...Object.fromEntries(TRAITS.map((t) => [t.key, t.label])),
  splitters: 'Split pusher en side lane',
  lateCarries: 'Carry late game',
}

// Chaque archétype décrit la compo idéale par des objectifs : { métrique: valeur visée }.
// - core : ce qui définit le style. Sans lui, l'archétype ne tient pas.
// - support : ce qui le rend efficace (bonus jusqu'à +30 %).
// Score = adéquation core × (0.7 + 0.3 × adéquation support), toujours entre 0 et 1,
// donc comparable d'un archétype à l'autre quel que soit le nombre de traits regardés.
const ARCHETYPES = [
  {
    key: 'engage',
    label: 'Engage / Teamfight',
    core: { E: 2 },
    support: { C: 2, F: 2, D: 2 },
    plan: ({ engagers }) => ({
      win: `Forcer des teamfights à 5 autour des objectifs, lancés par ${engagers.length ? names(engagers) : 'votre meilleur engage'}.`,
      mid: [
        'Groupez-vous autour des drakes et du Nashor : posez la vision dans la rivière 1 minute avant le spawn.',
        "Cherchez l'engage quand l'adversaire rentre dans le pit ou passe dans un couloir étroit.",
      ],
      late: [
        "Jouez autour du Nashor et de l'Elder : forcez le fight dès que l'adversaire doit les contester.",
        "Visez le carry adverse avec l'engage : s'il est mal placé, le fight est gagné avant d'avoir commencé.",
      ],
    }),
  },
  {
    key: 'poke',
    label: 'Poke / Siège',
    core: { K: 3 },
    support: { P: 1, C: 1 },
    plan: ({ pokers }) => ({
      win: `Affaiblir l'adversaire à distance avec ${pokers.length ? names(pokers) : 'votre poke'} avant chaque objectif, puis le prendre sans vrai fight.`,
      mid: [
        'Siégez les tours en restant à portée maximale. Contrôlez la vision pour ne jamais être surpris.',
        "Ne lancez pas de fight tant que l'adversaire a toute sa vie : pokez d'abord, engagez quand il est à 50 %.",
      ],
      late: [
        "Assiégez la base adverse. Si l'adversaire engage, reculez et continuez de poker.",
        'Votre pire ennemi est un engage rapide : gardez Flash et vos sorts de fuite pour ça.',
      ],
    }),
  },
  {
    key: 'pick',
    label: 'Pick / Catch',
    core: { A: 2 },
    support: { C: 2, E: 1 },
    plan: ({ pickers }) => ({
      win: `Attraper un adversaire isolé avec ${pickers.length ? names(pickers) : 'vos CC'} pour jouer ensuite à 5 contre 4.`,
      mid: [
        'Posez de la vision deep dans la jungle adverse et chassez ceux qui partent poser des wards ou farmer seuls.',
        'Jouez dans le fog.',
      ],
      late: [
        'Avant chaque objectif, cherchez un pick, pas un 5v5 de face.',
        'Après un pick, prenez immédiatement un objectif.',
      ],
    }),
  },
  {
    key: 'split',
    label: 'Split push',
    // Un seul split pusher ne suffit pas à faire une compo split (1-3-1 ou 1-4 avec un 2e side laner).
    // Les 4 autres doivent pouvoir tenir sans fight : disengage et waveclear/poke.
    core: { splitters: 2 },
    support: { P: 1, K: 1 },
    plan: ({ splitters }) => ({
      win: `Mettre la pression en side lane avec ${splitters.length ? names(splitters) : 'votre meilleur duelliste'} pour forcer l'adversaire à se diviser.`,
      mid: [
        'Le split pusher prend une side lane pendant que les 4 autres jouent en sécurité au milieu ou sur un objectif opposé (1-3-1 ou 1-4).',
        "Le split pusher garde sa TP pour rejoindre un fight ou un objectif.",
      ],
      late: [
        'Les 4 autres ne forcent pas de fight.',
        "Dès que 2 adversaires partent sur le side, prenez un objectif à 4 contre 3.",
      ],
    }),
  },
  {
    key: 'protect',
    label: 'Protect the carry',
    core: { lateCarries: 1, P: 2 },
    support: { F: 1, C: 1 },
    plan: ({ carries, peelers }) => ({
      win: `Garder ${carries.length ? names(carries) : 'votre carry'} en vie : il fait les dégâts, ${peelers.length ? names(peelers) : 'les autres'} le protègent.`,
      mid: [
        'Donnez les ressources au carry (farm, kills, buffs). Le jungler joue autour de sa lane.',
        'Évitez les fights où le carry ne peut pas être présent.',
      ],
      late: [
        'En fight : restez près du carry et gardez vos CC pour ceux qui plongent sur lui.',
        'Le carry se place toujours derrière sa frontline et ne face-check jamais un buisson.',
      ],
    }),
  },
]

export const ARCHETYPE_LABELS = Object.fromEntries(ARCHETYPES.map((a) => [a.key, a.label]))

const TEMPO = {
  early: {
    label: 'Early game',
    text: [
      'Votre compo est plus forte que la moyenne en début de partie : jouez agressif (invade, dives, ganks répétés).',
      'Prenez les premiers drakes et le Héraut. Chaque minute qui passe joue contre vous : visez une fin de game avant 25-30 min.',
    ],
  },
  mid: {
    label: 'Mid game',
    text: [
      'Early équilibré : jouez vos matchups et prenez les objectifs quand vous avez la priorité en lane.',
      'Votre pic de puissance arrive à 2 items (vers 15-20 min) : c\'est là qu\'il faut forcer.',
    ],
  },
  late: {
    label: 'Late game',
    text: [
      "Votre compo scale : évitez les fights inutiles et farmez. Mieux vaut céder un objectif early que perdre un fight.",
      'À 3 items, c\'est vous qui êtes plus forts : à partir de là, forcez les fights.',
    ],
  },
}

const MIN_FIT = 0.35

// À score égal, le style le plus spécifique l'emporte : presque toute compo a un peu d'engage.
const SPECIFICITY = ['protect', 'split', 'poke', 'pick', 'engage']

// Adéquation (0 à 1) d'une compo à des objectifs : moyenne des min(valeur / objectif, 1).
const fit = (metrics, goals) => {
  const entries = Object.entries(goals)
  return entries.reduce((sum, [k, target]) => sum + Math.min(metrics[k] / target, 1), 0) / entries.length
}

// Ce qui manque pour remplir les objectifs, du core au support.
const gapsOf = (metrics, goals, core) =>
  Object.entries(goals)
    .filter(([k, target]) => metrics[k] < target)
    .map(([k, target]) => ({ key: k, label: METRIC_LABELS[k], have: metrics[k], need: target, core }))

function scoreArchetype(archetype, metrics) {
  const core = fit(metrics, archetype.core)
  const support = fit(metrics, archetype.support)
  return {
    ...archetype,
    value: core * (0.7 + 0.3 * support),
    gaps: [...gapsOf(metrics, archetype.core, true), ...gapsOf(metrics, archetype.support, false)],
  }
}

export function analyzeComp(picks, byId) {
  const champs = ROLES.flatMap((r) => {
    const champ = byId[picks?.[r.key]?.champion]
    return champ ? [{ ...champ, role: r.key, profile: getProfile(champ) }] : []
  })

  const traits = Object.fromEntries(TRAITS.map((t) => [t.key, champs.filter((c) => c.profile.traits.has(t.key)).length]))
  const withTrait = (key) => champs.filter((c) => c.profile.traits.has(key))

  // Répartition des dégâts (un champion mixte compte pour moitié de chaque côté).
  const physical = champs.reduce((sum, c) => sum + (c.profile.damage === 'P' ? 1 : c.profile.damage === 'X' ? 0.5 : 0), 0)
  const physicalShare = champs.length ? physical / champs.length : 0.5

  const scaling = champs.length
    ? champs.reduce((sum, c) => sum + SCALING_VALUE[c.profile.scaling], 0) / champs.length
    : 2
  const tempo = scaling < 1.8 ? 'early' : scaling > 2.3 ? 'late' : 'mid'

  const groups = {
    engagers: withTrait('E'),
    pokers: withTrait('K'),
    pickers: withTrait('A'),
    splitters: withTrait('S').filter((c) => c.role === 'top' || c.role === 'mid' || c.role === 'jungle'),
    peelers: withTrait('P'),
    carries: withTrait('D').filter((c) => c.role !== 'support'),
  }

  const metrics = {
    ...traits,
    splitters: groups.splitters.length,
    lateCarries: groups.carries.filter((c) => c.profile.scaling === 'l').length,
  }
  const ranked = ARCHETYPES.map((a) => scoreArchetype(a, metrics)).sort(
    (a, b) => b.value - a.value || SPECIFICITY.indexOf(a.key) - SPECIFICITY.indexOf(b.key),
  )
  const [main, secondary] = ranked

  const warnings = []
  const strengths = []

  if (champs.length < 5) warnings.push(`Compo incomplète (${champs.length}/5) : l'analyse sera plus fiable avec les 5 champions.`)
  if (champs.length >= 3) {
    if (physicalShare >= 0.8)
      warnings.push("Dégâts presque tous physiques : l'adversaire n'a qu'à acheter de l'armure (Bottes plaquées, Cœur gelé, Randuin).")
    else if (physicalShare <= 0.2)
      warnings.push("Dégâts presque tous magiques : l'adversaire n'a qu'à acheter de la résistance magique (Mercure, Force de la nature).")
    else strengths.push('Dégâts bien répartis entre physiques et magiques : difficile de vous contrer avec des items.')

    if (traits.F === 0) warnings.push("Pas de frontline : personne pour encaisser, vos carries vont prendre tous les dégâts en fight.")
    else if (traits.F >= 2) strengths.push('Bonne frontline : vous pouvez tenir des fights longs.')

    if (traits.E === 0) warnings.push("Pas d'engage fiable : vous aurez du mal à forcer les fights. Misez sur la poke, les picks ou le contre-engage.")
    else if (traits.E >= 2) strengths.push(`Plusieurs sources d'engage (${names(groups.engagers)}) : vous choisissez quand le fight démarre.`)

    if (traits.C + traits.P * 0.5 <= 1) warnings.push('Peu de contrôle (CC) : difficile de verrouiller une cible ou de vous défendre contre les plongeurs.')
    else if (traits.C >= 3) strengths.push('Beaucoup de CC : une cible attrapée est une cible morte.')

    if (traits.D === 0 && traits.A <= 1) warnings.push('Peu de dégâts soutenus : les fights longs et les tanks adverses vont poser problème.')

    if (groups.carries.some((c) => c.profile.scaling === 'l') && traits.P === 0 && traits.F <= 1)
      warnings.push('Votre carry late game est sans protection : il sera la cible prioritaire des assassins et plongeurs.')

    if (tempo === 'late') warnings.push("Compo très late game : attendez-vous à un early difficile, ne paniquez pas si vous êtes un peu en retard.")
    if (tempo === 'early') strengths.push('Forte en early : vous pouvez prendre le contrôle de la carte dès les premières minutes.')
  }

  // Aucun archétype ne colle (ex : 1-2 champions sans trait marquant) : pas de plan plutôt qu'un plan arbitraire.
  const archetype = main.value >= MIN_FIT ? main : null

  return {
    champs,
    traits,
    physicalShare,
    tempo: { key: tempo, ...TEMPO[tempo] },
    archetypes: ranked,
    archetype,
    secondary: archetype && secondary.value >= MIN_FIT && secondary.value >= main.value * 0.75 ? secondary : null,
    plan: archetype?.plan(groups) ?? null,
    warnings,
    strengths,
    estimated: champs.filter((c) => c.profile.estimated),
  }
}
