import { roleLabel } from '../lib/roles'
import { OFF_META, PRO, SOLOQ, STRONG, metaAlternatives, metaScore, proStats, soloqStats, tierLabel } from '../lib/meta'
import { ChampionIcon, useChamps } from './Champion'

// "7 %", ou "0,4 %" sous 10 % pour ne pas afficher 0 % pour un pick rare.
const pct = (v) => `${v < 0.1 ? String(Math.round(v * 1000) / 10).replace('.', ',') : Math.round(v * 100)} %`
// Midi pour que le fuseau horaire ne fasse pas reculer la date d'un jour.
const date = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

// D'où vient la méta affichée : "SoloQ OP.GG · patch 26.20 — Pro : 142 games (patchs 26.17 et 26.20)".
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

// Où en est chaque pick dans la méta du moment (soloQ et pro), et par quoi le remplacer s'il y a nettement mieux
// pour la même fonction. `pools` et `onPick` (optionnels) mettent en avant le pool du joueur et rendent les alternatives cliquables.
export default function MetaCheck({ analysis, pools = {}, onPick }) {
  const { byId } = useChamps()
  if (!SOLOQ && !PRO) return null
  const taken = analysis.champs.map((c) => c.id)

  return (
    <div className="grid gap-3 rounded border border-line p-4 text-sm">
      <div className="grid gap-0.5">
        <h4 className="font-semibold text-gold-light">Méta du moment</h4>
        <MetaSources />
      </div>

      <ul className="grid gap-2">
        {analysis.champs.map((c) => {
          const solo = soloqStats(c.id, c.role)
          const pro = proStats(c.id, c.role)
          const state = status(metaScore(c.id, c.role))
          const alternatives = metaAlternatives(c, c.role, { pool: pools[c.role], taken, byId })
          return (
            <li key={c.role} className="grid gap-1.5 rounded bg-surface-2 p-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="role-label w-16 shrink-0 text-gold">{roleLabel(c.role)}</span>
                <ChampionIcon id={c.id} size={28} />
                <span className={`text-xs ${state.className}`}>{state.label}</span>
              </div>
              <div className="grid gap-0.5 text-xs text-muted sm:pl-[4.75rem]">
                {SOLOQ && (
                  <span>
                    SoloQ :{' '}
                    {solo
                      ? `${tierLabel(solo.tier)} · ${pct(solo.winRate)} de victoires · pické dans ${pct(solo.pickRate)} des games`
                      : 'presque pas joué à ce poste'}
                  </span>
                )}
                {PRO && (
                  <span>
                    Pro :{' '}
                    {!pro
                      ? 'ni pické ni banni'
                      : pro.pickRate > 0
                        ? `pické à ce poste dans ${pct(pro.pickRate)} des games, présent (pick ou ban) dans ${pct(pro.presence)}`
                        : `pas pické à ce poste, présent (pick ou ban) dans ${pct(pro.presence)} des games`}
                  </span>
                )}
              </div>
              {alternatives.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 sm:pl-[4.75rem]">
                  <span className="text-xs text-muted">Plus fort en ce moment, même fonction :</span>
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
