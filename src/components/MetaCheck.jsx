import { roleLabel } from '../lib/roles'
import { OFF_META, PRO, SOLOQ, STRONG, metaAlternatives, metaScore, proStats, soloqStats, tierLabel } from '../lib/meta'
import { ChampionIcon, useChamps } from './Champion'

// "7 %", ou "0,4 %" sous 10 % pour ne pas afficher 0 % pour un pick rare.
const pct = (v) => `${v < 0.1 ? String(Math.round(v * 1000) / 10).replace('.', ',') : Math.round(v * 100)} %`
// Midi pour que le fuseau horaire ne fasse pas reculer la date d'un jour.
const date = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

// D'où vient la méta affichée : "SoloQ OP.GG, patch 26.20 · Pro : 56 games (patchs 26.20, 26.17) — mise à jour le 16 octobre".
export function MetaSources({ className = '' }) {
  const parts = []
  if (SOLOQ) parts.push(`SoloQ ${SOLOQ.source}, patch ${SOLOQ.patch}`)
  if (PRO) parts.push(`Pro : ${PRO.games} games (patch${PRO.patches.length > 1 ? 's' : ''} ${PRO.patches.join(', ')})`)
  if (!parts.length) return null
  const updated = [SOLOQ?.updatedAt, PRO?.updatedAt].filter(Boolean).sort().at(-1)
  return (
    <p className={`text-xs text-muted ${className}`}>
      {parts.join(' · ')} — mise à jour le {date(updated)}
    </p>
  )
}

function status(score) {
  if (score >= STRONG) return { label: 'Fort en ce moment', className: 'text-ok' }
  if (score < OFF_META) return { label: 'En retrait', className: 'text-warn' }
  return { label: 'Jouable', className: 'text-muted' }
}

// "SoloQ Tier 1, 52 % de victoires — pické dans 25 % des games pro"
function statsLine(solo, pro) {
  const parts = []
  if (SOLOQ) parts.push(solo ? `SoloQ ${tierLabel(solo.tier)}, ${pct(solo.winRate)} de victoires` : 'Peu joué en soloQ à ce poste')
  if (PRO) {
    if (pro?.pickRate > 0) parts.push(`pické dans ${pct(pro.pickRate)} des games pro`)
    else if (pro?.presence > 0) parts.push(`pick ou ban dans ${pct(pro.presence)} des games pro`)
    else parts.push('absent en pro')
  }
  return parts.join(' — ')
}

// Où en est chaque pick dans la méta du moment (soloQ et pro), et par quoi le remplacer s'il y a nettement mieux
// pour la même fonction. `pools` et `onPick` (optionnels) mettent en avant le pool du joueur et rendent les alternatives cliquables.
export default function MetaCheck({ analysis, pools = {}, onPick }) {
  const { byId } = useChamps()
  if (!SOLOQ && !PRO) return <p className="text-sm text-muted">Pas encore de données de méta : lancez `npm run meta`.</p>
  const taken = analysis.champs.map((c) => c.id)

  return (
    <div className="grid gap-3">
      <MetaSources />
      <ul className="grid gap-2">
        {analysis.champs.map((c) => {
          const state = status(metaScore(c.id, c.role))
          const alternatives = metaAlternatives(c, c.role, { pool: pools[c.role], taken, byId })
          return (
            <li key={c.role} className="grid gap-2 rounded bg-surface-2 p-3">
              <div className="flex items-center gap-3">
                <ChampionIcon id={c.id} size={36} />
                <div className="grid min-w-0 flex-1">
                  <span className="text-sm">
                    {c.name} <span className="text-muted">· {roleLabel(c.role)}</span>
                  </span>
                  <span className="text-xs text-muted">{statsLine(soloqStats(c.id, c.role), proStats(c.id, c.role))}</span>
                </div>
                <span className={`shrink-0 text-xs ${state.className}`}>{state.label}</span>
              </div>
              {alternatives.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 sm:pl-12">
                  <span className="text-xs text-muted">Plus fort pour la même fonction :</span>
                  {alternatives.map((s) => (
                    <span key={s.id} className="flex items-center gap-1 text-xs">
                      <ChampionIcon
                        id={s.id}
                        size={28}
                        title={`${byId[s.id]?.name ?? s.id}${s.inPool ? ' — dans le pool du joueur' : ''}`}
                        onClick={onPick ? () => onPick(c.role, s.id) : undefined}
                      />
                      {s.inPool && <span className="text-hextech">pool</span>}
                    </span>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
