import { useMemo, useState } from 'react'
import { ARCHETYPE_LABELS, analyzeComp } from '../lib/draft'
import { ROLES, roleLabel } from '../lib/roles'
import { suggestComps } from '../lib/suggest'
import { ChampionIcon, useChamps } from './Champion'

const STYLES = Object.entries(ARCHETYPE_LABELS)
const metaLabel = (v) => (v >= 0.6 ? 'forte' : v >= 0.4 ? 'correcte' : 'faible')

// Idées de compos complètes, construites avec les pools des joueurs placés à chaque poste et la méta du moment.
// - pools : { role: [ids] } pool du joueur placé à chaque poste
// - picked : { role: id | null } champions déjà choisis, gardés si l'option est cochée
// - onUse : (picks: { role: id }) => void ; le panneau se replie ensuite pour laisser la place à l'analyse.
export default function CompSuggestions({ pools, picked, onUse, defaultOpen = false }) {
  const { byId } = useChamps()
  const [open, setOpen] = useState(defaultOpen)
  const [style, setStyle] = useState(null)
  const [keepPicked, setKeepPicked] = useState(true)

  const hasPicked = ROLES.some((r) => picked[r.key])
  const allPicked = ROLES.every((r) => picked[r.key])
  // Chaîne plutôt qu'objet : la recherche ne se relance que si un pick gardé change vraiment.
  const lockedKey = keepPicked ? ROLES.map((r) => picked[r.key] ?? '').join() : ''
  const suggestions = useMemo(() => {
    if (!open) return []
    const locked = lockedKey.split(',')
    const slots = Object.fromEntries(ROLES.map((r, i) => [r.key, { pool: pools[r.key] ?? [], locked: locked[i] || null }]))
    return suggestComps(slots, byId, { style, limit: style ? 3 : 4 }).map((s) => ({
      ...s,
      analysis: analyzeComp(Object.fromEntries(ROLES.map((r) => [r.key, { champion: s.picks[r.key] }])), byId),
    }))
  }, [open, pools, lockedKey, byId, style])

  const withoutPool = ROLES.filter((r) => !pools[r.key]?.length && !(keepPicked && picked[r.key]))
  const take = (picks) => {
    onUse(picks)
    setOpen(false)
  }

  return (
    <section className="grid gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-base font-bold">
          Idées de compos <span className="text-[13px] font-normal text-soft">avec vos pools et la méta du moment</span>
        </h3>
        <button type="button" className="btn-link" onClick={() => setOpen((v) => !v)}>
          {open ? 'Masquer' : 'Voir des idées'}
        </button>
      </div>

      {open && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {[[null, 'Les meilleures'], ...STYLES].map(([key, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={style === key}
                onClick={() => setStyle(key)}
                className={`chip ${style === key ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {hasPicked && (
            <label className="flex items-center gap-2 text-[13px] text-soft">
              <input type="checkbox" className="size-4 accent-accent" checked={keepPicked} onChange={(e) => setKeepPicked(e.target.checked)} />
              Garder les champions déjà choisis et compléter autour
            </label>
          )}

          {withoutPool.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="size-2 shrink-0 rounded-full bg-accent-light" />
              Pas de pool pour {withoutPool.map((r) => r.label).join(', ')} : champions forts de la méta, marqués d'un point.
            </p>
          )}

          {keepPicked && allPicked ? (
            <p className="text-[13px] text-muted">Les 5 postes sont choisis : décochez l'option ci-dessus pour d'autres idées.</p>
          ) : suggestions.length === 0 ? (
            <p className="text-[13px] text-muted">Aucune compo cohérente pour ce style avec ces pools.</p>
          ) : (
            <ul className="grid gap-2">
              {suggestions.map((s) => (
                <li key={ROLES.map((r) => s.picks[r.key]).join()} className="grid gap-1.5 rounded-xl border border-line bg-panel px-3.5 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 sm:w-40">
                      <p className="truncate font-bold">{s.style.label}</p>
                      <p className="text-xs text-soft">
                        Méta {metaLabel(s.meta)} · pic {s.analysis.tempo.label.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {ROLES.map((r) => {
                        const outOfPool = s.origins[r.key] === 'meta'
                        return (
                          <span key={r.key} className="relative">
                            <ChampionIcon
                              id={s.picks[r.key]}
                              size={36}
                              title={`${roleLabel(r.key)} : ${byId[s.picks[r.key]]?.name}${outOfPool ? ' (hors pool, fort dans la méta)' : ''}`}
                            />
                            {outOfPool && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent-light ring-2 ring-panel" />}
                          </span>
                        )
                      })}
                    </div>
                    <button type="button" className="btn-secondary ml-auto h-9 px-3.5 text-[13px]" onClick={() => take(s.picks)}>
                      Prendre
                    </button>
                  </div>
                  {s.analysis.plan && (
                    <p className="truncate text-xs text-muted" title={s.analysis.plan.win}>
                      {s.analysis.plan.win}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
