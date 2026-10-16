import { ROLES, roleLabel } from './roles.js'
import { getProfile, traitWeight } from './profiles.js'

export const TRAITS = [
  { key: 'F', label: 'Frontline' },
  { key: 'E', label: 'Engage' },
  { key: 'V', label: 'Plongée' },
  { key: 'R', label: 'Réception' },
  { key: 'C', label: 'Contrôle' },
  { key: 'D', label: 'Dégâts soutenus' },
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
  enchanters: 'Enchanteur (soins, boucliers)',
}

// Les archétypes se rangent en deux familles :
// - teamfight : il y a plusieurs façons de gagner un 5v5 (engager le groupe, plonger sur les carries,
//   frapper ce qui est devant, recevoir l'engage, protéger un hypercarry) ;
// - other : les plans qui évitent le 5v5 de face (poke, pick, split).
export const FAMILIES = [
  { key: 'teamfight', label: 'Teamfight à 5' },
  { key: 'other', label: 'Autres plans de jeu' },
]

// Chaque archétype décrit la compo idéale par des objectifs : { métrique: valeur visée }.
// - core : ce qui définit le style. Sans lui, l'archétype ne tient pas.
// - support : ce qui le rend efficace (bonus jusqu'à +30 %).
// - peak : moment fort visé par le style (1 = early, 2 = mid game, 3 = late game), pour proposer des compos cohérentes.
// - rivals : traits des styles opposés. Aller au fight (engage, plongée) et recevoir s'excluent : une compo
//   qui a nettement plus de réception que d'engage joue la réception, même si elle a de quoi engager.
// Score = adéquation core × (0.7 + 0.3 × adéquation support) × équilibre face aux rivaux, toujours entre 0 et 1,
// donc comparable d'un archétype à l'autre quel que soit le nombre de traits regardés.
const ARCHETYPES = [
  {
    key: 'engage',
    family: 'teamfight',
    peak: 2,
    label: 'Engage / Wombo',
    core: { E: 3 },
    support: { C: 3, F: 2, D: 2 },
    rivals: ['R'],
    plan: ({ engagers }) => ({
      win: `Forcer des teamfights à 5 autour des objectifs, lancés par ${engagers.length ? names(engagers) : 'votre meilleur engage'}.`,
      mid: [
        'Groupez-vous autour des drakes et du Nashor : posez la vision dans la rivière 1 minute avant le spawn.',
        "Cherchez l'engage quand l'adversaire rentre dans le pit ou passe dans un couloir étroit : vos ultimes touchent tout le groupe.",
      ],
      late: [
        "Jouez autour du Nashor et de l'Elder : forcez le fight dès que l'adversaire doit les contester.",
        "Annoncez l'ordre des ultimes avant chaque objectif : engage, puis zone, puis dégâts.",
      ],
    }),
  },
  {
    key: 'dive',
    family: 'teamfight',
    peak: 1.5,
    label: 'Dive',
    core: { V: 3 },
    support: { C: 2, E: 1 },
    rivals: ['R'],
    plan: ({ divers }) => ({
      win: `Plonger sur les carries adverses avec ${divers.length ? names(divers) : 'vos plongeurs'} : sans eux, l'adversaire n'a plus de dégâts.`,
      mid: [
        'Jouez autour de la lane qui a la priorité : dives à 3 ou 4 sous la tour dès que les niveaux et les cooldowns sont là.',
        'Plongez tous ensemble sur la même cible : un plongeur seul dans la backline adverse est un plongeur mort.',
      ],
      late: [
        "Avant le fight, repérez leurs carries et ce qui les protège : gardez vos CC pour verrouiller la cible quand vous arrivez dessus.",
        'Votre fenêtre se referme avec le temps : convertissez chaque kill en objectif plutôt que de farmer.',
      ],
    }),
  },
  {
    key: 'frontToBack',
    family: 'teamfight',
    peak: 2.3,
    label: 'Front-to-back',
    core: { F: 2, D: 2 },
    support: { C: 2, P: 1 },
    rivals: ['V'],
    plan: ({ frontliners, carries }) => ({
      win: `Gagner les teamfights de face : ${frontliners.length ? names(frontliners) : 'la frontline'} devant pour encaisser, ${carries.length ? names(carries) : 'les carries'} derrière pour faire les dégâts.`,
      mid: [
        'Jouez groupés autour des objectifs, en formation : la frontline devant, les carries derrière à portée maximale.',
        'Pas besoin de chercher la backline adverse : frappez ce qui est devant vous.',
      ],
      late: [
        'Les fights longs sont à votre avantage : restez à 5 et évitez les escarmouches à 2 ou 3.',
        "Les carries ne dépassent jamais leur frontline : sans elle, la compo s'effondre.",
      ],
    }),
  },
  {
    key: 'counter',
    family: 'teamfight',
    peak: 2.2,
    label: 'Réception / Contre-engage',
    core: { R: 2 },
    support: { F: 1, D: 2, C: 2 },
    rivals: ['E', 'V'],
    plan: ({ receivers }) => ({
      win: `Laisser l'adversaire engager, puis retourner le fight avec ${receivers.length ? names(receivers) : 'vos sorts de réception'}.`,
      mid: [
        "Arrivez aux objectifs avant l'adversaire et placez-vous : c'est à lui de traverser votre zone pour engager.",
        'Gardez vos sorts de réception pour le premier qui rentre : un engage raté, et le fight se joue à 5 contre 4.',
      ],
      late: [
        "Ne lancez pas le fight les premiers autour du Nashor et de l'Elder : faites venir l'adversaire à vous.",
        "S'il refuse d'engager, prenez les objectifs : c'est à lui de venir les contester.",
      ],
    }),
  },
  {
    key: 'protect',
    family: 'teamfight',
    peak: 2.6,
    label: 'Protect the carry',
    // Un support tank qui peel (Braum) fait du front-to-back ; protect the carry, c'est un enchanteur sur un hypercarry.
    core: { lateCarries: 1, enchanters: 1 },
    support: { F: 1, C: 1 },
    plan: ({ hypercarries, carries, peelers }) => ({
      win: `Garder ${hypercarries.length ? names(hypercarries) : carries.length ? names(carries) : 'votre carry'} en vie : il fait les dégâts, ${peelers.length ? names(peelers) : 'les autres'} le protègent.`,
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
  {
    key: 'poke',
    family: 'other',
    peak: 2,
    label: 'Poke / Siège',
    core: { K: 3 },
    support: { R: 1, C: 1 },
    plan: ({ pokers }) => ({
      win: `Affaiblir l'adversaire à distance avec ${pokers.length ? names(pokers) : 'votre poke'} avant chaque objectif, puis le prendre sans vrai fight.`,
      mid: [
        'Siégez les tours en restant à portée maximale. Contrôlez la vision pour ne jamais être surpris.',
        "Ne lancez pas de fight tant que l'adversaire a toute sa vie : pokez d'abord, engagez quand il est à 50 %.",
      ],
      late: [
        "Assiégez la base adverse. Si l'adversaire engage, reculez et continuez de poker.",
        'Votre pire ennemi est un engage rapide : gardez Flash et vos sorts de réception pour ça.',
      ],
    }),
  },
  {
    key: 'pick',
    family: 'other',
    peak: 1.9,
    label: 'Pick / Catch',
    // 2 assassins ne font pas une compo pick (la plupart des drafts pro en ont 2) : il en faut au moins 3.
    core: { A: 3 },
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
    family: 'other',
    peak: 2.4,
    label: 'Split push',
    // Un seul split pusher ne suffit pas à faire une compo split (1-3-1 ou 1-4 avec un 2e side laner).
    // Les 4 autres doivent pouvoir tenir sans fight : réception et waveclear/poke.
    core: { splitters: 2 },
    support: { R: 1, K: 1 },
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

export const MIN_FIT = 0.35

// À score égal, le style le plus spécifique l'emporte : presque toute compo a un peu d'engage et de frontline,
// le front-to-back est le style par défaut. Les plongeurs étant souvent aussi des assassins, 3 plongeurs font un dive avant un pick.
const SPECIFICITY = ['protect', 'split', 'poke', 'dive', 'pick', 'counter', 'engage', 'frontToBack']

// Similarité pondérée (Jaccard, 0 à 1) entre deux vecteurs de traits { F: 2, E: 1.5, … }.
export const traitSimilarity = (a, b) => {
  let min = 0
  let max = 0
  for (const t of TRAITS) {
    min += Math.min(a[t.key] ?? 0, b[t.key] ?? 0)
    max += Math.max(a[t.key] ?? 0, b[t.key] ?? 0)
  }
  return max ? min / max : 0
}

// Adéquation (0 à 1) d'une compo à des objectifs : moyenne des min(valeur / objectif, 1).
const fit = (metrics, goals) => {
  const entries = Object.entries(goals)
  return entries.reduce((sum, [k, target]) => sum + Math.min(metrics[k] / target, 1), 0) / entries.length
}

// 1 tant que la compo a au moins autant du trait que de ses rivaux, puis baisse quand les rivaux dominent
// (ex : 1 engage pour 3 sorts de réception → 0.5).
const balance = (own, rival) => (own + rival ? Math.min(1, (2 * own) / (own + rival)) : 1)

// Ce qui manque pour remplir les objectifs, du core au support.
const gapsOf = (metrics, goals, core) =>
  Object.entries(goals)
    .filter(([k, target]) => metrics[k] < target)
    .map(([k, target]) => ({ key: k, label: METRIC_LABELS[k], have: metrics[k], need: target, core }))

const weight = (c, key) => traitWeight(c.profile, key)
const total = (list, key) => list.reduce((sum, c) => sum + weight(c, key), 0)
const isSideLaner = (c) => c.role === 'top' || c.role === 'mid' || c.role === 'jungle'
// Protect the carry se joue autour de l'ADC : un mid late game (Ryze, Cassiopeia) ne demande pas un enchanteur dédié.
const isHypercarry = (c) => c.role === 'adc' && c.profile.scaling === 'l'
const PHYSICAL = { P: 1, X: 0.5, M: 0 }

// Moment fort moyen d'une compo : 1 = early, 2 = mid game, 3 = late game.
export const averageScaling = (champs) =>
  champs.length ? champs.reduce((sum, c) => sum + SCALING_VALUE[c.profile.scaling], 0) / champs.length : 2

// Part des dégâts physiques d'une compo (un champion mixte compte pour moitié de chaque côté).
export const physicalShareOf = (champs) =>
  champs.length ? champs.reduce((sum, c) => sum + PHYSICAL[c.profile.damage], 0) / champs.length : 0.5

// Total de chaque trait d'une compo ([{ role, profile }]) et métriques dérivées utilisées par les styles.
export function compMetrics(champs) {
  return {
    ...Object.fromEntries(TRAITS.map((t) => [t.key, total(champs, t.key)])),
    splitters: total(champs.filter(isSideLaner), 'S'),
    lateCarries: total(champs.filter(isHypercarry), 'D'),
    // Enchanteurs : la protection est leur point fort et ils ne sont pas eux-mêmes une frontline (Lulu, Janna…).
    enchanters: champs.filter((c) => weight(c, 'P') >= 1 && weight(c, 'F') < 1).length,
  }
}

// Les styles, du plus adapté au moins adapté à des métriques de compo.
// Assez rapide pour tester des milliers de compos (suggestions de compos).
export function rankStyles(metrics) {
  return ARCHETYPES.map((archetype) => {
    const core = fit(metrics, archetype.core)
    const support = fit(metrics, archetype.support)
    const [main] = Object.keys(archetype.core)
    const rival = (archetype.rivals ?? []).reduce((sum, k) => sum + metrics[k], 0)
    return { ...archetype, value: core * (0.7 + 0.3 * support) * (archetype.rivals ? balance(metrics[main], rival) : 1) }
  }).sort((a, b) => b.value - a.value || SPECIFICITY.indexOf(a.key) - SPECIFICITY.indexOf(b.key))
}

export function analyzeComp(picks, byId) {
  const champs = ROLES.flatMap((r) => {
    const champ = byId[picks?.[r.key]?.champion]
    return champ ? [{ ...champ, role: r.key, profile: getProfile(champ, r.key) }] : []
  })

  const metrics = compMetrics(champs)
  const traits = Object.fromEntries(TRAITS.map((t) => [t.key, metrics[t.key]]))
  // Champions qui apportent un trait, ceux dont c'est un point fort en premier.
  const withTrait = (key) => champs.filter((c) => weight(c, key) > 0).sort((a, b) => weight(b, key) - weight(a, key))
  const physicalShare = physicalShareOf(champs)

  const scaling = averageScaling(champs)
  const tempo = scaling < 1.8 ? 'early' : scaling > 2.3 ? 'late' : 'mid'

  const carries = withTrait('D').filter((c) => c.role !== 'support')
  const groups = {
    engagers: withTrait('E'),
    divers: withTrait('V'),
    receivers: withTrait('R'),
    frontliners: withTrait('F'),
    pokers: withTrait('K'),
    pickers: withTrait('A'),
    splitters: withTrait('S').filter(isSideLaner),
    peelers: withTrait('P'),
    carries,
    hypercarries: carries.filter(isHypercarry),
  }

  const ranked = rankStyles(metrics).map((a) => ({
    ...a,
    gaps: [...gapsOf(metrics, a.core, true), ...gapsOf(metrics, a.support, false)],
  }))
  const [main] = ranked
  // Le front-to-back est le style par défaut : en tendance, il n'apprendrait rien.
  const secondary = ranked.slice(1).find((a) => a.key !== 'frontToBack')

  const warnings = []
  const strengths = []

  if (champs.length < 5) warnings.push(`Compo incomplète (${champs.length}/5) : l'analyse sera plus fiable avec les 5 champions.`)
  if (champs.length >= 3) {
    if (physicalShare >= 0.8)
      warnings.push("Dégâts presque tous physiques : l'adversaire n'a qu'à acheter de l'armure (Bottes plaquées, Cœur gelé, Randuin).")
    else if (physicalShare <= 0.2)
      warnings.push("Dégâts presque tous magiques : l'adversaire n'a qu'à acheter de la résistance magique (Mercure, Force de la nature).")
    else strengths.push('Dégâts bien répartis entre physiques et magiques : difficile de vous contrer avec des items.')

    if (traits.F < 1) warnings.push("Pas de vraie frontline : personne pour encaisser, vos carries vont prendre tous les dégâts en fight.")
    else if (traits.F >= 2) strengths.push('Bonne frontline : vous pouvez tenir des fights longs.')

    if (traits.E >= 2) strengths.push(`Plusieurs sources d'engage (${names(groups.engagers)}) : vous choisissez quand le fight démarre.`)
    if (traits.V >= 2) strengths.push(`Plusieurs plongeurs (${names(groups.divers)}) : la backline adverse n'est jamais à l'abri.`)
    if (traits.R >= 2) strengths.push(`Bonne réception (${names(groups.receivers)}) : chaque engage adverse raté vous donne le fight.`)
    if (traits.E + traits.V < 1 && traits.R < 1)
      warnings.push("Ni engage ni réception : vous ne choisissez pas quand les fights démarrent et vous les subissez. Misez sur la poke ou les picks.")
    else if (traits.E + traits.V < 1)
      warnings.push("Pas d'engage fiable : vous aurez du mal à forcer les fights. Jouez la réception : laissez l'adversaire venir.")

    if (traits.C + traits.P * 0.5 <= 1) warnings.push('Peu de contrôle (CC) : difficile de verrouiller une cible ou de vous défendre contre les plongeurs.')
    else if (traits.C >= 3.5) strengths.push('Beaucoup de CC : une cible attrapée est une cible morte.')

    if (traits.D < 1 && traits.A <= 1) warnings.push('Peu de dégâts soutenus : les fights longs et les tanks adverses vont poser problème.')

    if (metrics.lateCarries >= 1 && traits.P < 1 && traits.F <= 1)
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
    secondary: archetype && secondary?.value >= MIN_FIT && secondary.value >= main.value * 0.75 ? secondary : null,
    plan: archetype?.plan(groups) ?? null,
    warnings,
    strengths,
    estimated: champs.filter((c) => c.profile.estimated),
  }
}
