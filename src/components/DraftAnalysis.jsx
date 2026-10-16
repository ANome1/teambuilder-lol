import { useMemo, useState } from 'react'
import { analyzeComp, FAMILIES, TRAITS } from '../lib/draft'
import { isOffMeta } from '../lib/meta'
import { matchProDrafts } from '../lib/proDrafts'
import { roleLabel } from '../lib/roles'
import { useChamps } from './Champion'
import MetaCheck from './MetaCheck'
import ProDrafts from './ProDrafts'

const pct = (v) => `${Math.round(v * 100)} %`
// Les traits partiels comptent pour moitié : 2,5 plutôt que 2.5.
const num = (v) => String(v).replace('.', ',')

// `pools` et `onPick` (optionnels) activent les suggestions cliquables (méta et références pro).
// `compact` : version courte pour les cartes de la liste des compos.
export default function DraftAnalysis({ picks, compact = false, pools, onPick }) {
  const { byId } = useChamps()
  const a = useMemo(() => analyzeComp(picks, byId), [picks, byId])
  const refs = useMemo(() => matchProDrafts(a), [a])
  const [tab, setTab] = useState('summary')

  if (a.champs.length === 0) return <p className="text-sm text-muted">Choisis des champions pour voir l'analyse.</p>

  const offMeta = a.champs.filter((c) => isOffMeta(c.id, c.role))
  if (compact) return <CompactAnalysis a={a} reference={refs[0]} offMeta={offMeta} />

  const tabs = [
    { key: 'summary', label: 'Résumé' },
    { key: 'plan', label: 'Plan de jeu' },
    { key: 'meta', label: 'Méta', alert: offMeta.length > 0 },
    { key: 'pro', label: 'Références pro' },
  ]

  return (
    <div className="grid gap-4">
      <StyleHeader a={a} />
      {a.plan && <p className="leading-relaxed">{a.plan.win}</p>}

      <nav className="flex flex-wrap gap-1 border-b border-line pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded border px-2.5 py-1.5 text-sm sm:px-3 ${
              tab === t.key ? 'border-gold bg-surface-2 text-gold-light' : 'border-transparent text-muted hover:text-gold-light'
            }`}
          >
            {t.label}
            {t.alert && <span className="ml-1.5 text-warn">⚠</span>}
          </button>
        ))}
      </nav>

      {tab === 'summary' && <Summary a={a} />}
      {tab === 'plan' && <Plan a={a} />}
      {tab === 'meta' && <MetaCheck analysis={a} pools={pools} onPick={onPick} />}
      {tab === 'pro' && <ProDrafts refs={refs} analysis={a} pools={pools} onPick={onPick} />}
    </div>
  )
}

function StyleHeader({ a }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded border border-gold bg-surface-2 px-2.5 py-1 text-sm font-semibold text-gold-light">
        {a.archetype ? `${a.archetype.label} · ${pct(a.archetype.value)}` : 'Style pas encore défini'}
      </span>
      {a.secondary && <span className="text-sm text-muted">tendance {a.secondary.label}</span>}
      <span className="ml-auto rounded border border-line px-2.5 py-1 text-xs text-muted">Pic : {a.tempo.label}</span>
    </div>
  )
}

// Carte de la liste des compos : le style, la référence pro la plus proche et les 2 alertes principales.
function CompactAnalysis({ a, reference, offMeta }) {
  const alerts = [
    ...(offMeta.length ? [`En retrait dans la méta : ${offMeta.map((c) => `${c.name} (${roleLabel(c.role)})`).join(', ')}.`] : []),
    ...a.warnings,
  ].slice(0, 2)
  return (
    <div className="grid gap-2">
      <StyleHeader a={a} />
      {reference && (
        <p className="text-xs text-muted">
          Proche de la référence pro <span className="text-gold-light">{reference.name}</span> ({pct(reference.similarity)})
        </p>
      )}
      <Points items={alerts} kind="warn" />
    </div>
  )
}

function Summary({ a }) {
  return (
    <div className="grid gap-5">
      <DamageBar physicalShare={a.physicalShare} />
      {a.warnings.length > 0 && (
        <div className="grid gap-2">
          <span className="role-label text-gold">À surveiller</span>
          <Points items={a.warnings} kind="warn" />
        </div>
      )}
      {a.strengths.length > 0 && (
        <div className="grid gap-2">
          <span className="role-label text-gold">Points forts</span>
          <Points items={a.strengths.slice(0, 3)} kind="ok" />
        </div>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted hover:text-gold-light">Détail des traits et des styles</summary>
        <div className="mt-3 grid gap-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
            {TRAITS.map((t) => (
              <div key={t.key} className="flex items-center justify-between gap-2">
                <span className="text-muted">{t.label}</span>
                <Dots value={a.traits[t.key]} />
              </div>
            ))}
          </div>
          <StyleScores archetypes={a.archetypes} main={a.archetype} />
          {a.estimated.length > 0 && (
            <p className="text-xs text-muted">
              Profil estimé automatiquement pour : {a.estimated.map((c) => c.name).join(', ')} (à compléter dans src/lib/profiles.js).
            </p>
          )}
        </div>
      </details>
    </div>
  )
}

function Plan({ a }) {
  return (
    <div className="grid gap-4 text-sm">
      <Phase title="Early" items={a.tempo.text} />
      <Phase title="Mid game" items={a.plan?.mid} />
      <Phase title="Late game" items={a.plan?.late} />
      {!a.plan && <p className="text-muted">Ajoutez des champions pour dégager un plan de jeu.</p>}
    </div>
  )
}

function Points({ items, kind }) {
  if (!items.length) return null
  const [icon, className] = kind === 'ok' ? ['✓', 'text-ok'] : ['⚠', 'text-warn']
  return (
    <ul className="grid gap-1.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className={className}>{icon}</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

// Adéquation de la compo à chaque style, par famille, + ce qui manque au style principal.
function StyleScores({ archetypes, main }) {
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
      <ul className="mt-1.5 list-disc space-y-1.5 pl-5 leading-relaxed text-[#e8e6e1]/90">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}
