import { useMemo } from 'react'
import { analyzeComp, TRAITS } from '../lib/draft'
import { useChamps } from './Champion'

export default function DraftAnalysis({ picks, compact = false }) {
  const { byId } = useChamps()
  const a = useMemo(() => analyzeComp(picks, byId), [picks, byId])

  if (a.champs.length === 0) return <p className="text-sm text-muted">Choisis des champions pour voir l'analyse.</p>

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-gold bg-surface-2 px-2.5 py-1 text-sm font-semibold text-gold-light">
          {a.archetype.label}
        </span>
        {a.secondary && <span className="text-sm text-muted">tendance {a.secondary.label}</span>}
        <span className="ml-auto rounded border border-line px-2.5 py-1 text-xs text-muted">Pic : {a.tempo.label}</span>
      </div>

      <DamageBar physicalShare={a.physicalShare} />

      {!compact && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
          {TRAITS.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted">{t.label}</span>
              <Dots value={a.traits[t.key]} />
            </div>
          ))}
        </div>
      )}

      {(a.strengths.length > 0 || a.warnings.length > 0) && (
        <ul className="grid gap-1.5 text-sm">
          {!compact && a.strengths.map((s) => (
            <li key={s} className="flex gap-2"><span className="text-ok">✓</span>{s}</li>
          ))}
          {a.warnings.map((w) => (
            <li key={w} className="flex gap-2"><span className="text-warn">⚠</span>{w}</li>
          ))}
        </ul>
      )}

      {!compact && (
        <div className="grid gap-3 rounded bg-surface-2 p-4 text-sm">
          <h4 className="font-semibold text-gold-light">Plan de jeu</h4>
          <p>
            <span className="role-label mr-2 text-gold">Win condition</span>
            {a.plan.win}
          </p>
          <Phase title="Early" items={a.tempo.text} />
          <Phase title="Mid game" items={a.plan.mid} />
          <Phase title="Late game" items={a.plan.late} />
        </div>
      )}

      {!compact && a.estimated.length > 0 && (
        <p className="text-xs text-muted">
          Profil estimé automatiquement pour : {a.estimated.map((c) => c.name).join(', ')} (à compléter dans src/lib/profiles.js).
        </p>
      )}
    </div>
  )
}

function DamageBar({ physicalShare }) {
  const physical = Math.round(physicalShare * 100)
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-physical">Physique {physical}%</span>
        <span className="text-magic">Magique {100 - physical}%</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-line">
        <div className="bg-physical" style={{ width: `${physical}%` }} />
        <div className="bg-magic" style={{ width: `${100 - physical}%` }} />
      </div>
    </div>
  )
}

function Dots({ value, max = 5 }) {
  return (
    <span className="flex gap-0.5" title={`${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`size-2 rounded-full ${i < value ? 'bg-gold' : 'bg-line'}`} />
      ))}
    </span>
  )
}

// Une phase sans conseils (ex : pas de `late` dans le plan) n'est pas affichée.
function Phase({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <span className="role-label text-gold">{title}</span>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-[#e8e6e1]/90">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}
