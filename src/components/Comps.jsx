import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES } from '../lib/roles'
import { ChampionIcon, ChampionSearch, useChamps } from './Champion'
import CompSuggestions from './CompSuggestions'
import DraftAnalysis, { Points, StyleBadges, mainAlerts, useDraftAnalysis } from './DraftAnalysis'
import { Icon, RoleIcon } from './Icon'
import Modal, { ModalFooter } from './Modal'

export default function Comps({ comps, players, reload }) {
  const [editing, setEditing] = useState(null) // null | 'new' | comp
  const playerName = (id) => players.find((p) => p.id === id)?.name

  const remove = async (comp) => {
    if (!confirm(`Supprimer la compo "${comp.name}" ?`)) return
    await supabase.from('comps').delete().eq('id', comp.id)
    reload()
  }

  const duplicate = async (comp) => {
    await supabase.from('comps').insert({ name: `${comp.name} (copie)`, picks: comp.picks, notes: comp.notes })
    reload()
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-1.5">Préparation tournoi</p>
          <h1 className="text-[34px] font-bold tracking-tight">
            Compos <span className="font-mono text-[22px] font-medium text-muted">{comps.length}</span>
          </h1>
        </div>
        <button className="btn" onClick={() => setEditing('new')}>
          <Icon name="plus" size={16} strokeWidth={2.6} />
          Nouvelle compo
        </button>
      </div>

      {comps.length === 0 && <p className="text-muted">Aucune compo pour l'instant.</p>}

      <div className="grid gap-4">
        {comps.map((c) => (
          <CompCard
            key={c.id}
            comp={c}
            playerName={playerName}
            onEdit={() => setEditing(c)}
            onDuplicate={() => duplicate(c)}
            onRemove={() => remove(c)}
          />
        ))}
      </div>

      {editing && (
        <CompEditor
          comp={editing === 'new' ? null : editing}
          players={players}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </section>
  )
}

// Une compo de la liste : nom et style en en-tête, les 5 postes, puis les alertes principales et les notes (repliées si longues).
function CompCard({ comp, playerName, onEdit, onDuplicate, onRemove }) {
  const { byId } = useChamps()
  const { a, refs } = useDraftAnalysis(comp.picks)
  const alerts = a.champs.length ? mainAlerts(a) : []

  return (
    <article className="card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-soft px-5 py-3">
        <h2 className="text-lg font-bold">{comp.name}</h2>
        {a.champs.length > 0 && <StyleBadges a={a} reference={refs[0]} />}
        <div className="ml-auto flex gap-1">
          <button className="btn-icon" onClick={onEdit} aria-label={`Modifier ${comp.name}`}>
            <Icon name="edit" />
          </button>
          <button className="btn-icon" onClick={onDuplicate} aria-label={`Dupliquer ${comp.name}`}>
            <Icon name="copy" />
          </button>
          <button className="btn-icon hover:text-danger" onClick={onRemove} aria-label={`Supprimer ${comp.name}`}>
            <Icon name="trash" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px bg-line-soft">
        {ROLES.map((r) => {
          const pick = comp.picks[r.key] ?? {}
          return (
            <div key={r.key} className="flex min-w-0 flex-col gap-2 bg-surface px-4 py-3">
              <span className="role-label flex items-center gap-1.5 text-muted">
                <RoleIcon role={r.key} />
                {r.label}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                {pick.champion ? (
                  <ChampionIcon id={pick.champion} size={48} />
                ) : (
                  <div className="size-12 shrink-0 rounded-lg border border-dashed border-field-line" />
                )}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-bold">{byId[pick.champion]?.name ?? '—'}</span>
                  <span className="truncate text-[13px] text-soft">{playerName(pick.player_id) ?? '—'}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {(alerts.length > 0 || comp.notes) && (
        <div className="grid gap-2.5 border-t border-line-soft bg-panel px-5 py-3">
          <Points items={alerts} kind="warn" />
          {comp.notes && <Notes text={comp.notes} />}
        </div>
      )}
    </article>
  )
}

// Notes d'une compo, repliées sur 2 lignes quand elles sont longues.
function Notes({ text }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 160 || text.split('\n').length > 2
  return (
    <div className="flex items-start gap-3">
      <span className="role-label mt-[3px] shrink-0 text-muted">Notes</span>
      <p className={`min-w-0 flex-1 leading-relaxed whitespace-pre-wrap text-[#d2d6e0] ${long && !open ? 'line-clamp-2' : ''}`}>{text}</p>
      {long && (
        <button type="button" className="btn-link shrink-0" onClick={() => setOpen((v) => !v)}>
          {open ? 'Réduire' : 'Voir tout'}
        </button>
      )}
    </div>
  )
}

function CompEditor({ comp, players, onClose, onSaved }) {
  const [name, setName] = useState(comp?.name ?? '')
  const [picks, setPicks] = useState(() => comp?.picks ?? defaultPicks(players))
  const [notes, setNotes] = useState(comp?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const setPick = (role, patch) => setPicks((p) => ({ ...p, [role]: { ...p[role], ...patch } }))
  const taken = Object.values(picks).map((p) => p?.champion).filter(Boolean)
  // Une idée de compo remplace les champions, chaque joueur reste à son poste.
  const applySuggestion = (ids) =>
    setPicks((p) => Object.fromEntries(ROLES.map((r) => [r.key, { ...p[r.key], champion: ids[r.key] }])))

  // Pool du joueur placé à chaque poste, recalculé seulement quand un joueur change de poste
  // (les idées de compos se recalculent avec).
  const assigned = ROLES.map((r) => picks[r.key]?.player_id ?? '').join()
  const pools = useMemo(() => {
    const ids = assigned.split(',')
    return Object.fromEntries(ROLES.map((r, i) => [r.key, players.find((p) => p.id === ids[i])?.champions[r.key] ?? []]))
  }, [players, assigned])
  const picked = Object.fromEntries(ROLES.map((r) => [r.key, picks[r.key]?.champion ?? null]))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const row = { name: name.trim(), picks, notes }
    const { error } = comp
      ? await supabase.from('comps').update(row).eq('id', comp.id)
      : await supabase.from('comps').insert(row)
    setSaving(false)
    if (error) setError(error.message)
    else onSaved()
  }

  return (
    <Modal
      eyebrow="Compo"
      title={comp ? `Modifier ${comp.name}` : 'Nouvelle compo'}
      onClose={onClose}
      wide
      headerContent={
        // Dans l'en-tête pour gagner de la hauteur ; rattaché au formulaire par l'attribut form.
        <input
          form="comp-form"
          className="field h-10 text-[15px]"
          aria-label="Nom de la compo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la compo, ex : Dive early / Réception / Poke"
          required
          autoFocus
        />
      }
    >
      <form id="comp-form" onSubmit={submit} className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        {/* Sur grand écran : deux volets qui défilent chacun de leur côté (la compo à gauche, les idées et l'analyse à droite),
            le pied (Enregistrer) reste visible. Sur mobile, les volets s'effacent (contents) et l'ordre suit les classes order-* :
            idées, postes, analyse, notes. */}
        <div className="flex flex-col gap-5 px-6 py-5 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-1 lg:gap-0 lg:p-0">
          {/* Lignes à la hauteur de leur contenu (auto-rows-max) : aucun bloc n'est écrasé, c'est le volet qui défile. */}
          <div className="contents lg:grid lg:auto-rows-max lg:gap-4 lg:overflow-y-auto lg:px-6 lg:py-5">
            <div className="order-3 overflow-hidden rounded-xl border border-line">
              {ROLES.map((r, i) => {
                const pick = picks[r.key] ?? {}
                const player = players.find((p) => p.id === pick.player_id)
                // Les joueurs qui jouent ce rôle d'abord, les autres ensuite.
                const sorted = [...players].sort((a, b) => rank(a, r.key) - rank(b, r.key))
                // Ligne 1 : poste, joueur, recherche, champion choisi. Ligne 2 : le pool du joueur.
                // Sur mobile, la recherche passe sous le joueur.
                return (
                  <div
                    key={r.key}
                    className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-2.5 sm:grid-cols-[5.5rem_9.5rem_minmax(0,1fr)_auto] ${
                      i > 0 ? 'border-t border-line-soft' : ''
                    }`}
                  >
                    <span className="col-start-1 row-start-1 flex items-center gap-2 font-bold">
                      <RoleIcon role={r.key} size={16} className="text-accent-light" />
                      {r.label}
                    </span>
                    <select
                      className="field col-start-2 row-start-1 h-10"
                      aria-label={`Joueur ${r.label}`}
                      value={pick.player_id ?? ''}
                      onChange={(e) => setPick(r.key, { player_id: e.target.value || null })}
                    >
                      <option value="">— Joueur —</option>
                      {sorted.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.roles.includes(r.key) ? '' : ' (hors rôle)'}
                        </option>
                      ))}
                    </select>
                    <ChampionSearch
                      onPick={(id) => setPick(r.key, { champion: id })}
                      exclude={taken}
                      suggestions={player?.champions[r.key] ?? []}
                      placeholder={player ? 'Autre champion…' : 'Chercher un champion…'}
                      iconSize={30}
                      className="contents"
                      inputClassName="col-span-3 row-start-2 h-10 sm:col-span-1 sm:col-start-3 sm:row-start-1"
                      resultsClassName="col-span-3 row-start-3 sm:col-start-2 sm:row-start-2"
                    />
                    <span className="col-start-3 row-start-1 sm:col-start-4">
                      {pick.champion ? (
                        <ChampionIcon id={pick.champion} size={40} title="Cliquer pour retirer" onClick={() => setPick(r.key, { champion: null })} />
                      ) : (
                        <span className="block size-10 rounded-lg border border-dashed border-field-line" />
                      )}
                    </span>
                  </div>
                )
              })}
            </div>

            <label className="order-5 grid gap-2">
              <span className="label">Notes (win condition, bans, plan de jeu…)</span>
              <textarea className="field resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </label>
          </div>

          <div className="contents lg:grid lg:auto-rows-max lg:gap-4 lg:overflow-y-auto lg:border-l lg:border-line-soft lg:bg-panel lg:px-6 lg:py-5">
            <div className="order-2">
              <CompSuggestions pools={pools} picked={picked} onUse={applySuggestion} defaultOpen={!comp} />
            </div>

            <section className="order-4 grid gap-4 rounded-xl border border-line bg-surface p-4">
              <h3 className="text-base font-bold">Analyse de la draft</h3>
              <DraftAnalysis picks={picks} pools={pools} onPick={(role, id) => setPick(role, { champion: id })} />
            </section>
          </div>
        </div>

        <ModalFooter error={error} onCancel={onClose} saving={saving} disabled={!name.trim()} />
      </form>
    </Modal>
  )
}

// Position du rôle dans les préférences du joueur (99 = ne le joue pas).
function rank(player, role) {
  const i = player.roles.indexOf(role)
  return i === -1 ? 99 : i
}

// Pré-remplit chaque rôle avec le joueur qui l'a en main, sans réutiliser un joueur deux fois.
function defaultPicks(players) {
  const used = new Set()
  const picks = {}
  for (const r of ROLES) {
    const candidate = players
      .filter((p) => !used.has(p.id) && p.roles.includes(r.key))
      .sort((a, b) => rank(a, r.key) - rank(b, r.key))[0]
    if (candidate) used.add(candidate.id)
    picks[r.key] = { player_id: candidate?.id ?? null, champion: null }
  }
  return picks
}
