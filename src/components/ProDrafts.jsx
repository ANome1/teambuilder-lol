import { useMemo, useState } from 'react'
import { ARCHETYPE_LABELS } from '../lib/draft'
import { PRO, strongPicks } from '../lib/meta'
import { adaptToProDraft, classifyProDrafts, proExamples } from '../lib/proDrafts'
import { ROLES, roleLabel } from '../lib/roles'
import { ChampionIcon, useChamps } from './Champion'
import { RoleIcon } from './Icon'

const STATUS = {
  match: { label: 'Comme la référence', className: 'text-ok' },
  close: { label: 'Même fonction', className: 'text-ok' },
  off: { label: 'À adapter', className: 'text-warn' },
  empty: { label: 'À choisir', className: 'text-muted' },
}

const pct = (v) => `${Math.round(v * 100)} %`
const date = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

// Références pro les plus proches de la compo, comment s'en rapprocher rôle par rôle,
// et des drafts pro récentes qui jouent le même style.
export default function ProDrafts({ refs, analysis, pools, onPick }) {
  const { byId } = useChamps()
  const [selectedKey, setSelectedKey] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [allRoles, setAllRoles] = useState(false)
  // Les drafts pro des derniers patchs, analysées une fois pour toutes.
  const classified = useMemo(() => classifyProDrafts(PRO?.drafts ?? [], byId), [byId])
  if (!refs.length) return null

  const shown = showAll ? refs : refs.slice(0, 3)
  const ref = refs.find((r) => r.key === selectedKey) ?? shown[0]
  const taken = analysis.champs.map((c) => c.id)
  const meta = Object.fromEntries(ROLES.map((r) => [r.key, strongPicks(r.key)]))
  const rows = adaptToProDraft(ref, analysis, { pools, taken, meta, byId })
  const examples = proExamples(ref, classified, 2)
  // Par défaut, seuls les postes à adapter ou à choisir : ceux qui collent déjà à la référence sont résumés en une ligne.
  const fitting = rows.filter((row) => row.status === 'match' || row.status === 'close')
  const visibleRows = allRoles ? rows : rows.filter((row) => !fitting.includes(row))

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {[...shown, ...(shown.includes(ref) ? [] : [ref])].map((r) => (
          <button
            key={r.key}
            type="button"
            aria-pressed={r.key === ref.key}
            onClick={() => setSelectedKey(r.key)}
            className={`chip ${r.key === ref.key ? 'chip-active' : ''}`}
          >
            {r.name} <span className="font-mono">{pct(r.similarity)}</span>
          </button>
        ))}
        <button type="button" className="btn-link ml-1" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Moins de références' : `Toutes les références (${refs.length})`}
        </button>
      </div>

      <p className="leading-relaxed text-soft">
        <span className="font-semibold text-text">{ARCHETYPE_LABELS[ref.archetype]}</span> — {ref.origin}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className={fitting.length === rows.length ? 'font-semibold text-ok' : 'text-soft'}>
          {fitting.length === rows.length
            ? '✓ Les 5 postes collent déjà à la référence.'
            : fitting.length
              ? `✓ ${fitting.map((row) => roleLabel(row.role)).join(', ')} : déjà comme la référence.`
              : 'Aucun poste ne colle encore à la référence.'}
        </span>
        {fitting.length > 0 && (
          <button type="button" className="btn-link" onClick={() => setAllRoles((v) => !v)}>
            {allRoles ? 'Seulement les postes à adapter' : 'Voir les 5 postes'}
          </button>
        )}
      </div>

      {visibleRows.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-line">
          {visibleRows.map((row, i) => (
            <li key={row.role} className={`grid gap-2 px-4 py-3 ${i > 0 ? 'border-t border-line-soft' : ''}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="role-label flex w-20 shrink-0 items-center gap-1.5 text-muted">
                  <RoleIcon role={row.role} />
                  {roleLabel(row.role)}
                </span>
                {row.current ? (
                  <ChampionIcon id={row.current.id} size={32} />
                ) : (
                  <div className="size-8 shrink-0 rounded-lg border border-dashed border-field-line" />
                )}
                <span className={`text-xs font-semibold ${STATUS[row.status].className}`}>{STATUS[row.status].label}</span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="text-xs text-muted">Pro :</span>
                  {row.refPool.map((id) => (
                    <span key={id} className={id === row.current?.id ? '' : 'opacity-60'}>
                      <ChampionIcon id={id} size={24} />
                    </span>
                  ))}
                </span>
              </div>

              {row.status === 'off' && row.missing.length > 0 && (
                <p className="text-[13px] text-soft">La référence attend ici : {row.missing.map((t) => t.label).join(', ')}.</p>
              )}

              {row.suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-soft">{onPick ? 'Remplacer par :' : 'Options :'}</span>
                  {row.suggestions.map((s) => (
                    <span key={s.id} className="flex items-center gap-1 text-xs font-semibold">
                      <ChampionIcon
                        id={s.id}
                        size={28}
                        title={`${byId[s.id]?.name ?? s.id}${s.inPool ? ' — dans le pool du joueur' : ''}${s.inMeta ? ' — fort en ce moment' : ''}`}
                        onClick={onPick ? () => onPick(row.role, s.id) : undefined}
                      />
                      {s.inPool && <span className="text-accent-light">pool</span>}
                      {s.inMeta && <span className="text-ok">méta</span>}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ul className="list-disc space-y-1.5 pl-5 leading-relaxed text-[#d2d6e0]">
        {ref.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>

      {examples.length > 0 && (
        <div className="grid gap-3 border-t border-line-soft pt-4">
          <span className="role-label text-muted">Joué en pro récemment</span>
          {examples.map((d) => (
            <div key={`${d.date}-${d.team}-${d.opponent}-${d.picks.join()}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="flex gap-1">
                {d.picks.map((id, i) => (
                  <ChampionIcon
                    key={id}
                    id={id}
                    size={28}
                    title={`${byId[id]?.name ?? id} (${roleLabel(ROLES[i].key)})`}
                    onClick={onPick ? () => onPick(ROLES[i].key, id) : undefined}
                  />
                ))}
              </span>
              <span className="text-xs text-soft">
                <span className={`font-semibold ${d.win ? 'text-ok' : 'text-warn'}`}>{d.win ? 'Victoire' : 'Défaite'}</span> de {d.team} contre{' '}
                {d.opponent} · {d.tournament} · patch {d.patch} · {date(d.date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
