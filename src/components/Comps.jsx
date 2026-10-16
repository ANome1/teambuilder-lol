import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES } from '../lib/roles'
import { ChampionIcon, ChampionSearch, useChamps } from './Champion'
<<<<<<< HEAD
import CompSuggestions from './CompSuggestions'
import DraftAnalysis from './DraftAnalysis'
import Modal from './Modal'
=======
import { Icon, RoleIcon } from './Icon'
import Modal, { ModalFooter } from './Modal'
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)

export default function Comps({ comps, players, reload }) {
  const [editing, setEditing] = useState(null) // null | 'new' | comp
  const { byId } = useChamps()
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
          <article key={c.id} className="card">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
              <h2 className="text-lg font-bold">{c.name}</h2>
              <div className="flex gap-1">
                <button className="btn-icon" onClick={() => setEditing(c)} aria-label={`Modifier ${c.name}`}>
                  <Icon name="edit" />
                </button>
                <button className="btn-icon" onClick={() => duplicate(c)} aria-label={`Dupliquer ${c.name}`}>
                  <Icon name="copy" />
                </button>
                <button className="btn-icon hover:text-danger" onClick={() => remove(c)} aria-label={`Supprimer ${c.name}`}>
                  <Icon name="trash" />
                </button>
              </div>
            </header>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px bg-line-soft">
              {ROLES.map((r) => {
                const pick = c.picks[r.key] ?? {}
                return (
                  <div key={r.key} className="flex min-w-0 flex-col gap-3 bg-surface px-4 pt-[18px] pb-5">
                    <span className="role-label flex items-center gap-1.5 text-muted">
                      <RoleIcon role={r.key} />
                      {r.label}
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      {pick.champion ? (
                        <ChampionIcon id={pick.champion} size={56} />
                      ) : (
                        <div className="size-14 shrink-0 rounded-lg border border-dashed border-field-line" />
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
<<<<<<< HEAD
            <div className="mt-3 border-t border-line pt-3">
              <DraftAnalysis picks={c.picks} compact />
            </div>
            {c.notes &&<p className="mt-3 border-t border-line pt-3 whitespace-pre-wrap text-muted">{c.notes}</p>}
=======

            {c.notes && (
              <div className="border-t border-line-soft bg-panel px-5 py-4">
                <p className="role-label mb-1.5 text-muted">Notes</p>
                <p className="leading-relaxed whitespace-pre-wrap text-[#d2d6e0]">{c.notes}</p>
              </div>
            )}
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)
          </article>
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
<<<<<<< HEAD
    <Modal title={comp ? `Modifier ${comp.name}` : 'Nouvelle compo'} onClose={onClose} wide>
      {/* Sur grand écran : la compo à gauche, les idées et l'analyse à droite, qui restent visibles pendant qu'on remplit les postes.
          Sur mobile, les colonnes s'effacent (contents) et l'ordre suit les classes order-* : nom, idées, postes, analyse, notes. */}
      <form onSubmit={submit} className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="contents lg:grid lg:gap-4">
          <label className="label order-1">
            Nom de la compo
            <input
              className="field mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Dive early / Réception / Poke"
=======
    <Modal eyebrow="Compo" title={comp ? `Modifier ${comp.name}` : 'Nouvelle compo'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="grid gap-5 px-6 py-5">
          <label className="grid gap-2">
            <span className="label">Nom</span>
            <input
              className="field text-[15px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Teamfight / Poke / Early"
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)
              required
              autoFocus
            />
          </label>

<<<<<<< HEAD
          <div className="order-3 grid gap-4">
            {ROLES.map((r) => {
=======
          <div className="overflow-hidden rounded-xl border border-line">
            {ROLES.map((r, i) => {
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)
              const pick = picks[r.key] ?? {}
              const player = players.find((p) => p.id === pick.player_id)
              // Les joueurs qui jouent ce rôle d'abord, les autres ensuite.
              const sorted = [...players].sort((a, b) => rank(a, r.key) - rank(b, r.key))
              return (
<<<<<<< HEAD
                <div key={r.key} className="grid gap-2 rounded bg-surface-2 p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="role-label w-16 shrink-0 text-gold">{r.label}</span>
                    <select
                      className="field flex-1"
=======
                <div key={r.key} className={`grid gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-line-soft' : ''}`}>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex w-24 shrink-0 items-center gap-2 font-bold">
                      <RoleIcon role={r.key} size={16} className="text-accent-light" />
                      {r.label}
                    </span>
                    <select
                      className="field min-w-40 flex-1"
                      aria-label={`Joueur ${r.label}`}
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)
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
<<<<<<< HEAD
                    {pick.champion && (
                      <ChampionIcon id={pick.champion} size={40} title="Cliquer pour retirer" onClick={() => setPick(r.key, { champion: null })} />
=======
                    {pick.champion ? (
                      <ChampionIcon id={pick.champion} size={44} title="Cliquer pour retirer" onClick={() => setPick(r.key, { champion: null })} />
                    ) : (
                      <div className="size-11 shrink-0 rounded-lg border border-dashed border-field-line" />
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)
                    )}
                  </div>
                  <ChampionSearch
                    onPick={(id) => setPick(r.key, { champion: id })}
                    exclude={taken}
                    suggestions={player?.champions[r.key] ?? []}
                    placeholder={player ? `Pool de ${player.name} ci-dessous, ou chercher…` : 'Chercher un champion…'}
                  />
                </div>
              )
            })}
          </div>
<<<<<<< HEAD

          <div className="order-5 grid gap-4">
            <label className="label">
              Notes (win condition, bans, plan de jeu…)
              <textarea className="field mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </label>

            {error && <p className="text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn" disabled={saving || !name.trim()}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>

        <div className="contents lg:sticky lg:top-4 lg:grid lg:max-h-[calc(100vh-2rem)] lg:gap-4 lg:overflow-y-auto">
          <div className="order-2">
            <CompSuggestions pools={pools} picked={picked} onUse={applySuggestion} defaultOpen={!comp} />
          </div>

          <div className="order-4 grid gap-3 rounded border border-line p-3">
            <h4 className="font-semibold text-gold-light">Analyse de la draft</h4>
            <DraftAnalysis picks={picks} pools={pools} onPick={(role, id) => setPick(role, { champion: id })} />
          </div>
=======

          <label className="grid gap-2">
            <span className="label">Notes (win condition, bans, plan de jeu…)</span>
            <textarea className="field resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </label>
>>>>>>> 622c22d (feat: enhance UI with new icons, improved layout, and updated styles)
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
