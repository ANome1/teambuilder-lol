// Met à jour src/data/meta.json avec la méta du moment :
// - soloq : tier, winrate, pickrate et banrate de chaque champion à chaque poste au patch en cours (OP.GG) ;
// - pro : picks, bans et drafts des compétitions majeures sur les derniers patchs (Leaguepedia).
//
// Usage : npm run meta               (soloQ + pro)
//         npm run meta -- --no-pro   (soloQ seulement, quelques secondes)
//
// Leaguepedia limite très fort les requêtes anonymes : le script n'en fait qu'une et réessaie en attendant
// de plus en plus longtemps si elle est refusée. Si une source ne répond pas, ses données précédentes sont gardées.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { PROFILES } from '../src/lib/profiles.js'

const OUTPUT = new URL('../src/data/meta.json', import.meta.url)
const DDRAGON = 'https://ddragon.leagueoflegends.com'
const OPGG_MCP = 'https://mcp-api.op.gg/mcp'
const LEAGUEPEDIA = 'https://lol.fandom.com/api.php'
const USER_AGENT = 'teambuilder-lol (https://github.com/ANome1/teambuilder-lol)'
const ROLES = ['top', 'jungle', 'mid', 'adc', 'support']

// Pro : on remonte les patchs du plus récent au plus ancien jusqu'à avoir assez de games.
const MIN_PRO_GAMES = 100
const MAX_PRO_PATCHES = 3
// Compétitions majeures : ligues régionales de premier plan et tournois internationaux (début du nom du tournoi),
// sans les ligues de développement (LCK CL, LCK AS…) ni les tournois de promotion. Filtré par Leaguepedia :
// les ligues mineures jouent tellement que, sinon, elles rempliraient les 500 games de la requête.
const MAJOR = ['Worlds', 'MSI', 'First Stand', 'Esports World Cup', 'EWC', 'LCK', 'LPL', 'LEC', 'LTA', 'LCP', 'LCS', 'CBLOL', 'LJL', 'VCS', 'PCS']
const MINOR = ['% CL %', '% AS %', '%Challengers%', '%Academy%', '%Promotion%']
// Attentes successives (en secondes) quand Leaguepedia refuse une requête.
const RETRY_WAITS = [60, 180, 300]

const today = new Date().toISOString().slice(0, 10)
const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))
const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
const splitNames = (value) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [])
// "LYON (2024 American Team)" → "LYON" : Leaguepedia précise entre parenthèses les équipes homonymes.
const teamName = (name) => name.replace(/\s*\(.*\)$/, '')

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`${url} : HTTP ${res.status}`)
  return res.json()
}

// Data Dragon : patch en cours et correspondance nom affiché → id ("Kai'Sa" → Kaisa, "Wukong" → MonkeyKing).
async function fetchChampions() {
  const [version] = await getJson(`${DDRAGON}/api/versions.json`)
  const { data } = await getJson(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`)
  const ids = new Map()
  for (const c of Object.values(data)) {
    ids.set(normalize(c.id), c.id)
    ids.set(normalize(c.name), c.id)
  }
  // Depuis 2025, la version Data Dragon 16.20 correspond au patch 26.20 (même calcul que patchOf dans src/lib/champions.js).
  const [major, minor] = version.split('.').map(Number)
  return { patch: `${major >= 15 ? major + 10 : major}.${minor}`, idOf: (name) => ids.get(normalize(name)) }
}

// OP.GG répond dans un format compact : des lignes « class Top: champion,is_rip,… » donnent l'ordre des champs,
// puis viennent les valeurs. « class Positions: top,mid,jungle,adc,support » donne l'ordre des listes de postes,
// chacune remplie d'entrées Top("Malphite",false,116676,…) (même classe pour tous les postes).
function parseOpgg(text) {
  const fields = Object.fromEntries([...text.matchAll(/^class (\w+): (.+)$/gm)].map(([, cls, list]) => [cls, list.split(',')]))
  const lists = [...text.slice(text.indexOf('Positions(')).matchAll(/\[([^[\]]*)\]/g)].map(([, body]) => body)
  const entries = (list) =>
    [...list.matchAll(/(\w+)\(([^()]*)\)/g)].map(([, cls, args]) => {
      const values = JSON.parse(`[${args.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null')}]`)
      return Object.fromEntries(fields[cls].map((f, i) => [f, values[i]]))
    })
  return Object.fromEntries((fields.Positions ?? []).map((position, i) => [position, entries(lists[i] ?? '')]))
}

// Méta soloQ du patch en cours, via le serveur MCP public d'OP.GG (pas de clé nécessaire).
async function fetchSoloq({ patch, idOf }, unknown) {
  const fields = 'champion,is_rip,play,win_rate,pick_rate,ban_rate,tier,rank'
  const res = await fetch(OPGG_MCP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'User-Agent': USER_AGENT },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'lol_list_lane_meta_champions',
        arguments: { lang: 'en_US', position: 'all', desired_output_fields: ROLES.map((r) => `data.positions.${r}[].{${fields}}`) },
      },
    }),
  })
  if (!res.ok) throw new Error(`OP.GG : HTTP ${res.status}`)
  // Réponse JSON-RPC, en JSON direct ou en flux SSE ("data: {…}").
  const body = await res.text()
  const json = JSON.parse(
    body.trimStart().startsWith('{') ? body : body.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5)).join(''),
  )
  const text = json.result?.content?.[0]?.text
  if (json.error || json.result?.isError || !text) throw new Error(`OP.GG : ${json.error?.message ?? text ?? 'réponse vide'}`)

  const byRole = parseOpgg(text)
  const roles = Object.fromEntries(
    ROLES.map((role) => [
      role,
      (byRole[role] ?? [])
        .filter((c) => !c.is_rip)
        .sort((a, b) => a.rank - b.rank)
        .flatMap((c) => {
          const id = idOf(c.champion)
          if (!id) unknown.add(c.champion)
          return id ? [{ id, tier: c.tier, winRate: c.win_rate, pickRate: c.pick_rate, banRate: c.ban_rate, games: c.play }] : []
        }),
    ]),
  )
  if (ROLES.some((role) => !roles[role].length)) throw new Error('OP.GG : réponse incomplète (un poste sans champion)')
  return { source: 'OP.GG', patch, updatedAt: today, roles }
}

// Requête Cargo sur Leaguepedia, réessayée si elle est refusée (limite de débit) ou si le serveur est surchargé.
async function cargo(params) {
  const url = `${LEAGUEPEDIA}?${new URLSearchParams({ action: 'cargoquery', format: 'json', ...params })}`
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    const json = res.ok ? await res.json().catch(() => null) : null
    if (json?.cargoquery) return json.cargoquery.map((row) => row.title)
    const reason = json?.error?.code ?? `HTTP ${res.status}`
    if (attempt === RETRY_WAITS.length) throw new Error(`Leaguepedia : ${reason}`)
    console.log(`  Leaguepedia refuse la requête (${reason}), nouvel essai dans ${RETRY_WAITS[attempt]} s…`)
    await sleep(RETRY_WAITS[attempt])
  }
}

// Drafts pro des compétitions majeures sur les derniers patchs. Une seule requête : les 500 dernières games.
async function fetchPro({ idOf }, unknown) {
  const since = new Date(Date.now() - 120 * 86400e3).toISOString().slice(0, 10)
  const rows = await cargo({
    tables: 'ScoreboardGames',
    fields: 'Tournament,DateTime_UTC,Patch,Team1,Team2,Winner,Team1Picks,Team2Picks,Team1Bans,Team2Bans',
    where: [
      `DateTime_UTC >= "${since}"`,
      `(${MAJOR.map((prefix) => `Tournament LIKE "${prefix}%"`).join(' OR ')})`,
      ...MINOR.map((pattern) => `Tournament NOT LIKE "${pattern}"`),
    ].join(' AND '),
    order_by: 'DateTime_UTC DESC',
    limit: 500,
  })
  const major = rows.filter((g) => g.Patch)

  // Patchs dans l'ordre de leur dernière game, du plus récent au plus ancien, jusqu'à avoir assez de games.
  const games = []
  const patches = []
  for (const [patch, list] of Map.groupBy(major, (g) => g.Patch)) {
    if (games.length >= MIN_PRO_GAMES || patches.length === MAX_PRO_PATCHES) break
    patches.push(patch)
    games.push(...list)
  }
  if (!games.length) throw new Error('Leaguepedia : aucune game de compétition majeure trouvée')

  const champions = {}
  const stat = (id) => (champions[id] ??= { picks: {}, bans: 0 })
  const drafts = []
  for (const g of games) {
    const sides = [
      { team: teamName(g.Team1), opponent: teamName(g.Team2), picks: g.Team1Picks, bans: g.Team1Bans, win: g.Winner === '1' },
      { team: teamName(g.Team2), opponent: teamName(g.Team1), picks: g.Team2Picks, bans: g.Team2Bans, win: g.Winner === '2' },
    ]
    for (const side of sides) {
      // Un ban perdu est noté "None" : il ne correspond à aucun champion et n'est pas compté.
      for (const name of splitNames(side.bans)) {
        const id = idOf(name)
        if (id) stat(id).bans++
      }
      // Les picks sont listés dans l'ordre des rôles : top, jungle, mid, ADC, support.
      const picks = splitNames(side.picks).map((name) => idOf(name) ?? (unknown.add(name), null))
      if (picks.length !== ROLES.length || picks.includes(null)) continue
      picks.forEach((id, i) => {
        const byRole = stat(id).picks
        byRole[ROLES[i]] = (byRole[ROLES[i]] ?? 0) + 1
      })
      drafts.push({
        date: g['DateTime UTC'].slice(0, 10),
        tournament: g.Tournament,
        patch: g.Patch,
        team: side.team,
        opponent: side.opponent,
        win: side.win,
        picks,
      })
    }
  }
  return {
    source: 'Leaguepedia',
    updatedAt: today,
    patches,
    games: games.length,
    tournaments: [...new Set(games.map((g) => g.Tournament))],
    champions,
    drafts,
  }
}

// Fichier lisible et diffs Git courts : chaque champion ou draft tient sur une ligne.
function pretty(value, indent = '') {
  const flat = JSON.stringify(value)
  if (value === null || typeof value !== 'object' || flat.length <= 200) return flat
  const inner = `${indent}  `
  const lines = Array.isArray(value)
    ? value.map((v) => inner + pretty(v, inner))
    : Object.entries(value).map(([k, v]) => `${inner}${JSON.stringify(k)}: ${pretty(v, inner)}`)
  const [open, close] = Array.isArray(value) ? '[]' : '{}'
  return `${open}\n${lines.join(',\n')}\n${indent}${close}`
}

const withPro = !process.argv.includes('--no-pro')
const previous = JSON.parse(await readFile(OUTPUT, 'utf8').catch(() => '{}'))
const champions = await fetchChampions()
const unknown = new Set()
const failures = []
const keepPrevious = (error) => {
  failures.push(error.message)
  return null
}

console.log(`Patch en cours : ${champions.patch}`)
console.log('Méta soloQ (OP.GG)…')
const soloq = await fetchSoloq(champions, unknown).catch(keepPrevious)
let pro = null
if (withPro) {
  console.log('Drafts pro (Leaguepedia)…')
  pro = await fetchPro(champions, unknown).catch(keepPrevious)
}

const meta = { soloq: soloq ?? previous.soloq ?? null, pro: pro ?? previous.pro ?? null }
await mkdir(new URL('.', OUTPUT), { recursive: true })
await writeFile(OUTPUT, `${pretty(meta)}\n`)

if (soloq) {
  const counts = Object.entries(soloq.roles).map(([role, list]) => `${role} ${list.length}`)
  console.log(`✓ SoloQ : patch ${soloq.patch}, champions par poste : ${counts.join(', ')}`)
}
if (pro) console.log(`✓ Pro : ${pro.games} games (patchs ${pro.patches.join(', ')}) — ${pro.tournaments.join(', ')}`)
for (const message of failures) console.log(`⚠ ${message} — données précédentes conservées.`)
if (unknown.size) console.log(`⚠ Noms de champions non reconnus : ${[...unknown].join(', ')}`)

const played = new Set([
  ...Object.values(meta.soloq?.roles ?? {}).flatMap((list) => list.map((c) => c.id)),
  ...(meta.pro?.drafts ?? []).flatMap((d) => d.picks),
])
const withoutProfile = [...played].filter((id) => !PROFILES[id])
if (withoutProfile.length) console.log(`⚠ Joués en ce moment mais sans fiche dans src/lib/profiles.js : ${withoutProfile.join(', ')}`)

// Échec seulement si aucune source demandée n'a répondu.
if (failures.length === (withPro ? 2 : 1)) process.exit(1)
