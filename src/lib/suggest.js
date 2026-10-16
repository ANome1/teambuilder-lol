import { ROLES } from './roles.js'
import { MIN_FIT, averageScaling, compMetrics, physicalShareOf, rankStyles } from './draft.js'
import { getProfile } from './profiles.js'
import { metaScore, strongPicks } from './meta.js'

// Champions testés au plus par poste : 7^5 ≈ 17 000 compos, évaluées en une fraction de seconde.
const MAX_CANDIDATES = 7
// Meilleures compos gardées par style pendant la recherche, avant de retenir des propositions variées.
const KEEP = 40

// Champions envisagés à un poste, les plus forts du moment d'abord :
// le champion déjà choisi s'il est gardé, sinon le pool du joueur, sinon (pas de joueur ou pool vide) les picks forts de la méta.
function candidates(role, { pool = [], locked = null }, byId) {
  const [ids, origin] = locked ? [[locked], 'locked'] : pool.length ? [pool, 'pool'] : [strongPicks(role), 'meta']
  return ids
    .filter((id) => byId[id])
    .map((id) => ({ id, role, origin, profile: getProfile(byId[id], role), meta: metaScore(id, role) ?? 0.5 }))
    .sort((a, b) => b.meta - a.meta)
    .slice(0, MAX_CANDIDATES)
}

// Bases d'une compo jouable, de 0 à 1 : dégâts mixtes (30 à 70 % de physique), une frontline,
// de quoi lancer ou recevoir les fights.
function basics(team, metrics) {
  const physical = physicalShareOf(team)
  const mix = Math.min(1, Math.max(0, 1 - (Math.abs(physical - 0.5) - 0.2) / 0.3))
  return (mix + (metrics.F >= 1 ? 1 : 0.3) + (metrics.E + metrics.V + metrics.R >= 1 ? 1 : 0.3)) / 3
}

// La compo atteint son moment fort quand le style en a besoin (1 : pile au bon moment, 0 : à l'opposé).
// Un dive late game ou un protect the carry early ne tiennent pas leur plan.
const tempoFit = (team, style) => Math.max(0, 1 - Math.abs(averageScaling(team) - style.peak))

const byScore = (a, b) => b.score - a.score
const shared = (a, b) => a.team.filter((c, i) => c.id === b.team[i].id).length

// Les meilleures entrées d'une liste, chacune différant des précédentes d'au moins 2 champions.
function varied(list, count) {
  const out = []
  for (const entry of list.sort(byScore)) {
    if (out.every((o) => shared(o, entry) <= 3)) out.push(entry)
    if (out.length === count) break
  }
  return out
}

// Une compo par style, en évitant de reproposer les mêmes champions d'un style à l'autre
// (pénalité de 0.03 par champion déjà proposé) : plus d'idées différentes.
function onePerStyle(kept, count) {
  const out = []
  const lists = Object.values(kept).map((list) => list.sort(byScore))
  while (out.length < count && lists.length) {
    const adjusted = (entry) => entry.score - 0.03 * out.reduce((sum, o) => sum + shared(o, entry), 0)
    const bests = lists.map((list) => list.reduce((best, entry) => (adjusted(entry) > adjusted(best) ? entry : best)))
    const i = bests.reduce((best, entry, j) => (adjusted(entry) > adjusted(bests[best]) ? j : best), 0)
    out.push(bests[i])
    lists.splice(i, 1)
  }
  return out.sort(byScore)
}

// Compos complètes construites avec les pools des joueurs et la méta du moment.
// - slots : { role: { pool: [ids], locked: id | null } } (locked : champion déjà choisi à garder)
// - style : clé d'un style pour ne proposer que ce style ; sinon, une compo par style, les meilleures d'abord.
// Note d'une compo : 40 % adéquation au style, 15 % moment fort cohérent avec le style, 30 % force dans la méta, 15 % bases.
export function suggestComps(slots, byId, { style = null, limit = 3 } = {}) {
  const lists = ROLES.map((r) => candidates(r.key, slots[r.key] ?? {}, byId))
  if (lists.some((list) => !list.length)) return []

  const kept = {}
  const team = []
  const used = new Set()
  const walk = (i) => {
    if (i === lists.length) {
      const metrics = compMetrics(team)
      const styles = rankStyles(metrics)
      const chosen = style ? styles.find((s) => s.key === style) : styles[0]
      if (chosen.value < MIN_FIT) return
      const meta = team.reduce((sum, c) => sum + c.meta, 0) / team.length
      const list = (kept[chosen.key] ??= [])
      const score = 0.4 * chosen.value + 0.15 * tempoFit(team, chosen) + 0.3 * meta + 0.15 * basics(team, metrics)
      list.push({ team: [...team], style: chosen, meta, score })
      if (list.length > 2 * KEEP) list.sort(byScore).length = KEEP
      return
    }
    for (const c of lists[i]) {
      if (used.has(c.id)) continue
      used.add(c.id)
      team[i] = c
      walk(i + 1)
      used.delete(c.id)
    }
  }
  walk(0)

  const best = style ? varied(kept[style] ?? [], limit) : onePerStyle(kept, limit)
  return best.map(({ team, style, meta, score }) => ({
    picks: Object.fromEntries(team.map((c) => [c.role, c.id])),
    origins: Object.fromEntries(team.map((c) => [c.role, c.origin])),
    style,
    meta,
    score,
  }))
}
