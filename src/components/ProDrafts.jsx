import { useState } from 'react'
import { adaptToProDraft } from '../lib/proDrafts'
import { roleLabel } from '../lib/roles'
import { ARCHETYPE_LABELS } from '../lib/draft'
import { ChampionIcon, useChamps } from './Champion'

const STATUS = {
  match: { label: 'Comme la référence', className: 'text-ok' },
  close: { label: 'Même fonction', className: 'text-ok' },
  off: { label: 'À adapter', className: 'text-warn' },
  empty: { label: 'À choisir', className: 'text-muted' },
}

const pct = (v) => `${Math.round(v * 100)} %`

// Références pro les plus proches de la compo, et comment s'en rapprocher rôle par rôle.
export default function ProDrafts({ refs, analysis, pools, onPick }) {
  const { byId } = useChamps()
  const [selectedKey, setSelectedKey] = useState(null)
  if (!refs.length) return null

  const shown = refs.slice(0, 3)
  const ref = shown.find((r) => r.key === selectedKey) ?? shown[0]
  const taken = analysis.champs.map((c) => c.id)
  const rows = adaptToProDraft(ref, analysis, pools, taken)

  return (
    <div className="grid gap-3 rounded border border-line p-4 text-sm">
      <h4 className="font-semibold text-gold-light">Références de la scène pro</h4>

      <div className="flex flex-wrap gap-2">
        {shown.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setSelectedKey(r.key)}
            className={`rounded border px-2.5 py-1 text-xs ${
              r.key === ref.key ? 'border-gold bg-surface-2 text-gold-light' : 'border-line text-muted hover:text-gold-light'
            }`}
          >
            {r.name} · {pct(r.similarity)}
          </button>
        ))}
      </div>

      <p className="text-muted">
        <span className="text-gold-light">{ARCHETYPE_LABELS[ref.archetype]}</span> — {ref.origin}
      </p>

      <ul className="grid gap-2">
        {rows.map((row) => (
          <li key={row.role} className="grid gap-1.5 rounded bg-surface-2 p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="role-label w-16 shrink-0 text-gold">{roleLabel(row.role)}</span>
              {row.current ? <ChampionIcon id={row.current.id} size={28} /> : <span className="text-muted">—</span>}
              <span className={`text-xs ${STATUS[row.status].className}`}>{STATUS[row.status].label}</span>
              <span className="ml-auto flex items-center gap-1">
                <span className="text-xs text-muted">Pro :</span>
                {row.refPool.map((id) => (
                  <span key={id} className={id === row.current?.id ? '' : 'opacity-60'}>
                    <ChampionIcon id={id} size={22} />
                  </span>
                ))}
              </span>
            </div>

            {row.status === 'off' && row.missing.length > 0 && (
              <p className="text-xs text-muted">
                La référence attend ici : {row.missing.map((t) => t.label).join(', ')}.
              </p>
            )}

            {row.suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted">{onPick ? 'Remplacer par :' : 'Options :'}</span>
                {row.suggestions.map((s) => (
                  <span key={s.id} className="flex items-center gap-1 text-xs">
                    <ChampionIcon
                      id={s.id}
                      size={28}
                      title={`${byId[s.id]?.name ?? s.id}${s.inPool ? ' — dans le pool du joueur' : ''}`}
                      onClick={onPick ? () => onPick(row.role, s.id) : undefined}
                    />
                    {s.inPool && <span className="text-hextech">pool</span>}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <ul className="list-disc space-y-1 pl-5 text-[#e8e6e1]/90">
        {ref.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  )
}
