import data from '../data/meta.json'
import { traitSimilarity } from './draft.js'
import { getProfile } from './profiles.js'

// Méta du moment, générée par `npm run meta` (scripts/update-meta.js) :
// - soloq : force de chaque champion à chaque poste au patch en cours (OP.GG) ;
// - pro : picks, bans et drafts des compétitions majeures sur les derniers patchs (Leaguepedia).
// Chaque partie peut manquer (null) si sa source n'a jamais répondu.
export const SOLOQ = data.soloq
export const PRO = data.pro

const soloqByRole = Object.fromEntries(
  Object.entries(SOLOQ?.roles ?? {}).map(([role, rows]) => [role, new Map(rows.map((row) => [row.id, row]))]),
)

// { tier, winRate, pickRate, banRate, games } d'un champion à un poste en soloQ, ou null s'il n'y est presque pas joué.
export const soloqStats = (id, role) => soloqByRole[role]?.get(id) ?? null

// Part des games pro où le champion est pické à ce poste, sa présence (pické ou banni, tous postes confondus)
// et la part de ses picks faits à ce poste (pour attribuer ses bans au bon poste).
export function proStats(id, role) {
  const c = PRO?.champions[id]
  if (!c) return null
  const picks = Object.values(c.picks).reduce((sum, n) => sum + n, 0)
  return {
    pickRate: (c.picks[role] ?? 0) / PRO.games,
    presence: (picks + c.bans) / PRO.games,
    roleShare: picks ? (c.picks[role] ?? 0) / picks : 0,
  }
}

export const tierLabel = (tier) => (tier === 0 ? 'OP' : `Tier ${tier}`)

// Force d'un tier OP.GG : OP (0), puis tiers 1 à 5.
const TIER_SCORE = [1, 0.85, 0.7, 0.5, 0.3, 0.15]

// Force en pro à ce poste, de 0 à 1 : pické dans 30 % des games, ou présent (pick + ban) dans 50 %, c'est un pick majeur.
// Les bans comptent : un champion banni dans presque toutes les games est fort, même s'il est rarement pické.
function proScore(id, role) {
  const pro = proStats(id, role)
  return pro ? Math.min(Math.max(pro.pickRate / 0.3, (pro.presence * pro.roleShare) / 0.5), 1) : 0
}

// Force d'un champion à un poste dans la méta, de 0 à 1 : 60 % soloQ (son tier au patch en cours), 40 % pro.
// null sans aucune donnée de méta.
export function metaScore(id, role) {
  const parts = []
  if (SOLOQ) parts.push([0.6, TIER_SCORE[soloqStats(id, role)?.tier] ?? 0])
  if (PRO) parts.push([0.4, proScore(id, role)])
  if (!parts.length) return null
  return parts.reduce((sum, [weight, value]) => sum + weight * value, 0) / parts.reduce((sum, [weight]) => sum + weight, 0)
}

// En dessous : peu joué ou faible en soloQ, et pas pické en pro à ce poste. Au-dessus de STRONG : un pick fort du moment.
export const OFF_META = 0.25
export const STRONG = 0.5

export const isOffMeta = (id, role) => (metaScore(id, role) ?? 1) < OFF_META

const pools = {}

// Champions joués à ce poste en ce moment (soloQ ou pro), du plus fort au moins fort.
export function metaPool(role) {
  pools[role] ??= [
    ...new Set([
      ...(SOLOQ?.roles[role] ?? []).map((c) => c.id),
      ...Object.keys(PRO?.champions ?? {}).filter((id) => PRO.champions[id].picks[role]),
    ]),
  ].sort((a, b) => metaScore(b, role) - metaScore(a, role))
  return pools[role]
}

// Les picks forts du moment à ce poste.
export const strongPicks = (role) => metaPool(role).filter((id) => metaScore(id, role) >= STRONG)

// Remplaçants nettement plus forts en ce moment qui remplissent la même fonction (fiches proches),
// ceux du pool du joueur en premier. `byId` : champions Data Dragon, pour ceux qui n'ont pas de fiche.
export function metaAlternatives(champ, role, { pool = [], taken = [], byId = {} } = {}, limit = 3) {
  const current = metaScore(champ.id, role) ?? 0
  const { traits } = getProfile(champ, role)
  return metaPool(role)
    .filter((id) => id !== champ.id && !taken.includes(id) && metaScore(id, role) >= current + 0.15)
    .filter((id) => traitSimilarity(traits, getProfile(byId[id] ?? { id }, role).traits) >= 0.5)
    .map((id) => ({ id, inPool: pool.includes(id), score: metaScore(id, role) }))
    .sort((a, b) => b.inPool - a.inPool || b.score - a.score)
    .slice(0, limit)
}
