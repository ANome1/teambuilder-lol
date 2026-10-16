import { useMemo, useState } from 'react'
import { FAMILIES, TRAITS, analyzeComp } from '../lib/draft'
import { isOffMeta } from '../lib/meta'
import { matchProDrafts } from '../lib/proDrafts'
import { roleLabel } from '../lib/roles'
import { useChamps } from './Champion'
import MetaCheck from './MetaCheck'
import ProDrafts from './ProDrafts'

const pct = (v) => `${Math.round(v * 100)} %`
// Les traits partiels comptent pour moitié : 2,5 plutôt que 2.5.
const num = (v) => String(v).replace('.', ',')

// Analyse d'une compo et références pro classées de la plus proche à la moins proche.
export function useDraftAnalysis(picks) {
  const { byId } = useChamps()
  const a = useMemo(() => analyzeComp(picks, byId), [picks, byId])
  const refs = useMemo(() => matchProDrafts(a), [a])
  return { a, refs }
}

const offMetaOf = (a) => a.champs.filter((c) => isOffMeta(c.id, c.role))

// Les 2 alertes principales d'une compo (pick en retrait dans la méta d'abord), pour les vues courtes.
export function mainAlerts(a) {
  const offMeta = offMetaOf(a)
  return [
    ...(offMeta.length ? [`En retrait dans la méta : ${offMeta.map((c) => `${c.name} (${roleLabel(c.role)})`).join(', ')}.`] : []),
    ...a.warnings,
  ].slice(0, 2)
}

// `pools` et `onPick` (optionnels) activent les suggestions cliquables (méta et références pro).
export default function DraftAnalysis({ picks, pools, onPick }) {
  const { a, refs } = useDraftAnalysis(picks)
  const [tab, setTab] = useState('summary')

  if (a.champs.length === 0) return <p className="text-[13px] text-muted">Choisis des champions pour voir l'analyse.</p>

  const tabs = [
    { key: 'summary', label: 'Résumé' },
    { key: 'plan', label: 'Plan de jeu' },
    { key: 'meta', label: 'Méta', alert: offMetaOf(a).length > 0 },
    { key: 'pro', label: 'Références pro' },
  ]

  return (
    <div className="grid gap-4">
      <StyleBadges a={a} reference={refs[0]} />
      {a.plan && <p className="text-[15px] leading-relaxed">{a.plan.win}</p>}

      <nav aria-label="Analyse" className="flex flex-wrap gap-1 border-b border-line-soft pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-current={tab === t.key ? 'page' : undefined}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-[13px] ${
              tab === t.key ? 'bg-surface-2 font-semibold text-white' : 'font-medium text-soft hover:text-text'
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

// Style principal, tendance et moment fort ; la référence pro la plus proche s'affiche au survol du style.
export function StyleBadges({ a, reference }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="rounded-full border border-[#3a4766] bg-accent-soft px-3 py-1 text-[13px] font-semibold text-white"
        title={reference ? `Proche de la référence pro ${reference.name} (${pct(reference.similarity)})` : undefined}
      >
        {a.archetype ? `${a.archetype.label} · ${pct(a.archetype.value)}` : 'Style pas encore défini'}
      </span>
      {a.secondary && <span className="text-[13px] text-soft">tendance {a.secondary.label}</span>}
      <span className="rounded-full border border-line px-3 py-1 text-xs text-soft">Pic : {a.tempo.label}</span>
    </div>
  )
}

function Summary({ a }) {
  return (
    <div className="grid gap-5">
      <DamageBar physicalShare={a.physicalShare} />
      {a.warnings.length > 0 && (
        <div className="grid gap-2">
          <span className="role-label text-muted">À surveiller</span>
          <Points items={a.warnings} kind="warn" />
        </div>
      )}
      {a.strengths.length > 0 && (
        <div className="grid gap-2">
          <span className="role-label text-muted">Points forts</span>
          <Points items={a.strengths.slice(0, 3)} kind="ok" />
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-[13px] font-semibold text-soft hover:text-text">Détail des traits et des styles</summary>
        <div className="mt-4 grid gap-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
            {TRAITS.map((t) => (
              <div key={t.key} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="text-soft">{t.label}</span>
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
    <div className="grid gap-5">
      <Phase title="Early" items={a.tempo.text} />
      <Phase title="Mid game" items={a.plan?.mid} />
      <Phase title="Late game" items={a.plan?.late} />
      {!a.plan && <p className="text-muted">Ajoutez des champions pour dégager un plan de jeu.</p>}
    </div>
  )
}

export function Points({ items, kind }) {
  if (!items.length) return null
  const [icon, className] = kind === 'ok' ? ['✓', 'text-ok'] : ['⚠', 'text-warn']
  return (
    <ul className="grid gap-1.5 text-[#d2d6e0]">
      {items.map((item) => (
        <li key={item} className="flex gap-2 leading-relaxed">
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
    <div className="grid gap-4">
      {FAMILIES.map((family) => (
        <div key={family.key} className="grid gap-1.5">
          <span className="role-label text-muted">{family.label}</span>
          {archetypes
            .filter((arch) => arch.family === family.key)
            .map((arch) => (
              <div key={arch.key} className="grid grid-cols-[11rem_1fr_3rem] items-center gap-2 text-xs">
                <span className={arch.key === main?.key ? 'font-semibold text-white' : 'text-soft'}>{arch.label}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div className={arch.key === main?.key ? 'h-full bg-accent' : 'h-full bg-[#3a4152]'} style={{ width: pct(arch.value) }} />
                </div>
                <span className="text-right font-mono text-muted">{pct(arch.value)}</span>
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
    <div className="grid gap-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-physical">Physique {physical} %</span>
        <span className="text-magic">Magique {100 - physical} %</span>
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
          className={`size-2 rounded-full ${i + 1 <= value ? 'bg-accent' : i < value ? 'bg-linear-to-r from-accent from-50% to-line to-50%' : 'bg-line'}`}
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
      <span className="role-label text-muted">{title}</span>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed text-[#d2d6e0]">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}
