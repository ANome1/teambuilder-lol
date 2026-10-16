import { useMemo } from 'react'
import { analyzeComp, FAMILIES, TRAITS } from '../lib/draft'
import { isOffMeta } from '../lib/meta'
import { matchProDrafts } from '../lib/proDrafts'
import { roleLabel } from '../lib/roles'
import { useChamps } from './Champion'
import MetaCheck from './MetaCheck'
import ProDrafts from './ProDrafts'

// `pools` et `onPick` (optionnels) activent les suggestions cliquables (références pro et méta).
export default function DraftAnalysis({ picks, compact = false, pools, onPick }) {
  const { byId } = useChamps()
  const a = useMemo(() => analyzeComp(picks, byId), [picks, byId])
  const refs = useMemo(() => matchProDrafts(a), [a])

  if (a.champs.length === 0) return <p className="text-sm text-muted">Choisis des champions pour voir l'analyse.</p>

  const offMeta = a.champs.filter((c) => isOffMeta(c.id, c.role))

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-gold bg-surface-2 px-2.5 py-1 text-sm font-semibold text-gold-light">
          {a.archetype ? `${a.archetype.label} · ${pct(a.archetype.value)}` : 'Style pas encore défini'}
        </span>
        {a.secondary && <span className="text-sm text-muted">tendance {a.secondary.label}</span>}
        <span className="ml-auto rounded border border-line px-2.5 py-1 text-xs text-muted">Pic : {a.tempo.label}</span>
      </div>

      {compact && refs[0] && (
        <p className="text-xs text-muted">
          Proche de la référence pro <span className="text-gold-light">{refs[0].name}</span> ({pct(refs[0].similarity)})
        </p>
      )}

      {compact && offMeta.length > 0 && (
        <p className="flex gap-2 text-xs">
          <span className="text-warn">⚠</span>
          En retrait dans la méta du moment : {offMeta.map((c) => `${c.name} (${roleLabel(c.role)})`).join(', ')}.
        </p>
      )}

      <DamageBar physicalShare={a.physicalShare} />

      {!compact && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-5">
          {TRAITS.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted">{t.label}</span>
              <Dots value={a.traits[t.key]} />
            </div>
          ))}
        </div>
      )}

      {!compact && <ArchetypeScores archetypes={a.archetypes} main={a.archetype} />}

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
          {a.plan ? (
            <p>
              <span className="role-label mr-2 text-gold">Win condition</span>
              {a.plan.win}
            </p>
          ) : (
            <p className="text-muted">Ajoutez des champions pour dégager une win condition.</p>
          )}
          <Phase title="Early" items={a.tempo.text} />
          <Phase title="Mid game" items={a.plan?.mid} />
          <Phase title="Late game" items={a.plan?.late} />
        </div>
      )}

      {!compact && <MetaCheck analysis={a} pools={pools} onPick={onPick} />}

      {!compact && <ProDrafts refs={refs} analysis={a} pools={pools} onPick={onPick} />}

      {!compact && a.estimated.length > 0 && (
        <p className="text-xs text-muted">
          Profil estimé automatiquement pour : {a.estimated.map((c) => c.name).join(', ')} (à compléter dans src/lib/profiles.js).
        </p>
      )}
    </div>
  )
}

const pct = (v) => `${Math.round(v * 100)} %`
// Les traits partiels comptent pour moitié : 2,5 plutôt que 2.5.
const num = (v) => String(v).replace('.', ',')

// Adéquation de la compo à chaque archétype, par famille, + ce qui manque à l'archétype principal.
function ArchetypeScores({ archetypes, main }) {
  const gaps = main?.gaps ?? []
  return (
    <div className="grid gap-3">
      {FAMILIES.map((family) => (
        <div key={family.key} className="grid gap-1">
          <span className="role-label text-gold">{family.label}</span>
          {archetypes
            .filter((arch) => arch.family === family.key)
            .map((arch) => (
              <div key={arch.key} className="grid grid-cols-[11rem_1fr_3rem] items-center gap-2 text-xs">
                <span className={arch.key === main?.key ? 'text-gold-light' : 'text-muted'}>{arch.label}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div className={arch.key === main?.key ? 'h-full bg-gold' : 'h-full bg-muted'} style={{ width: pct(arch.value) }} />
                </div>
                <span className="text-right text-muted">{pct(arch.value)}</span>
              </div>
            ))}
        </div>
      ))}
      {gaps.length > 0 && (
        <p className="text-xs text-muted">
          Pour renforcer le style {main.label} :{' '}
          {gaps.map((g) => `${g.label} ${num(g.have)}/${g.need}${g.core ? ' (essentiel)' : ''}`).join(', ')}.
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

// Un point par champion qui apporte le trait, un demi-point pour un apport secondaire.
function Dots({ value, max = 5 }) {
  return (
    <span className="flex gap-0.5" title={`${num(value)}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${i + 1 <= value ? 'bg-gold' : i < value ? 'bg-linear-to-r from-gold from-50% to-line to-50%' : 'bg-line'}`}
        />
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
