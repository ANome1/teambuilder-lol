import { useMemo, useState } from 'react'
import { ARCHETYPE_LABELS, analyzeComp } from '../lib/draft'
import { ROLES } from '../lib/roles'
import { suggestComps } from '../lib/suggest'
import { ChampionIcon, useChamps } from './Champion'

const STYLES = Object.entries(ARCHETYPE_LABELS)
const metaLabel = (v) => (v >= 0.6 ? 'forte' : v >= 0.4 ? 'correcte' : 'faible')

// Idées de compos complètes, construites avec les pools des joueurs placés à chaque poste et la méta du moment.
// - pools : { role: [ids] } pool du joueur placé à chaque poste
// - picked : { role: id | null } champions déjà choisis, gardés si l'option est cochée
// - onUse : (picks: { role: id }) => void
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

  return (
    <section className="grid gap-4 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <h3 className="text-base font-bold">Idées de compos</h3>
          <p className="text-[13px] text-soft">Avec les champions de vos pools et la méta du moment.</p>
        </div>
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
            <p className="text-xs text-muted">
              Pas de pool pour {withoutPool.map((r) => r.label).join(', ')} : on propose les champions forts de la méta à la place.
            </p>
          )}

          {keepPicked && allPicked ? (
            <p className="text-[13px] text-muted">Les 5 postes sont choisis : décochez l'option ci-dessus pour d'autres idées.</p>
          ) : suggestions.length === 0 ? (
            <p className="text-[13px] text-muted">Aucune compo cohérente pour ce style avec ces pools.</p>
          ) : (
            <ul className="grid gap-3">
              {suggestions.map((s) => (
                <li key={ROLES.map((r) => s.picks[r.key]).join()} className="grid gap-3 rounded-xl border border-line bg-panel p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="font-bold">{s.style.label}</span>
                    <span className="text-xs text-soft">
                      Méta {metaLabel(s.meta)} · pic {s.analysis.tempo.label.toLowerCase()}
                    </span>
                    <button type="button" className="btn-secondary ml-auto h-9 px-3.5 text-[13px]" onClick={() => onUse(s.picks)}>
                      Prendre cette compo
                    </button>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    {ROLES.map((r) => (
                      <div key={r.key} className="flex w-12 flex-col items-center gap-1 text-center sm:w-14">
                        <ChampionIcon id={s.picks[r.key]} size={40} />
                        <span className="role-label text-[10px] text-muted">{r.label}</span>
                        {s.origins[r.key] === 'meta' && <span className="text-[10px] leading-tight font-semibold text-accent-light">hors pool</span>}
                      </div>
                    ))}
                  </div>
                  {s.analysis.plan && <p className="text-[13px] leading-relaxed text-[#d2d6e0]">{s.analysis.plan.win}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
