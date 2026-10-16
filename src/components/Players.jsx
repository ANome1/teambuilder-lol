import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES, roleLabel } from '../lib/roles'
import { ChampionIcon, ChampionSearch } from './Champion'
import { Icon, RoleIcon } from './Icon'
import Modal, { ModalFooter } from './Modal'

const pillClass = (active) =>
  `pill ${active ? 'border-[#3a4766] bg-accent-soft font-semibold text-white' : 'border-[#262c3a] bg-surface font-medium text-[#c2c7d3] hover:text-white'}`

export default function Players({ players, reload }) {
  const [editing, setEditing] = useState(null) // null | 'new' | player
  const [filter, setFilter] = useState(null) // null = tous, sinon clé de rôle

  const remove = async (player) => {
    if (!confirm(`Supprimer ${player.name} ?`)) return
    await supabase.from('players').delete().eq('id', player.id)
    reload()
  }

  const shown = filter ? players.filter((p) => p.roles.includes(filter)) : players

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-1.5">Roster</p>
          <h1 className="text-[34px] font-bold tracking-tight">
            Joueurs <span className="font-mono text-[22px] font-medium text-muted">{players.length}</span>
          </h1>
        </div>
        <button className="btn" onClick={() => setEditing('new')}>
          <Icon name="plus" size={16} strokeWidth={2.6} />
          Ajouter un joueur
        </button>
      </div>

      <div role="group" aria-label="Filtrer par rôle" className="mb-6 flex flex-wrap gap-2">
        <button type="button" aria-pressed={!filter} className={pillClass(!filter)} onClick={() => setFilter(null)}>
          Tous
        </button>
        {ROLES.map((r) => (
          <button key={r.key} type="button" aria-pressed={filter === r.key} className={pillClass(filter === r.key)} onClick={() => setFilter(r.key)}>
            <RoleIcon role={r.key} />
            {r.label}
          </button>
        ))}
      </div>

      {players.length === 0 && <p className="text-muted">Aucun joueur. Ajoute-toi en premier !</p>}
      {players.length > 0 && shown.length === 0 && <p className="text-muted">Aucun joueur ne joue {roleLabel(filter)}.</p>}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-4">
        {shown.map((p) => (
          <article key={p.id} className="card flex flex-col">
            <header className="flex items-center gap-3.5 border-b border-line-soft px-[18px] pt-[18px] pb-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1f2533] text-base font-bold uppercase ring-2 ring-accent ring-inset">
                {p.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="mb-1 truncate text-[17px] font-bold">{p.name}</h2>
                {p.roles[0] && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-light">
                    <RoleIcon role={p.roles[0]} size={13} />
                    Main {roleLabel(p.roles[0])}
                  </span>
                )}
              </div>
              <div className="flex">
                <button className="btn-icon" onClick={() => setEditing(p)} aria-label={`Modifier ${p.name}`}>
                  <Icon name="edit" />
                </button>
                <button className="btn-icon hover:text-danger" onClick={() => remove(p)} aria-label={`Supprimer ${p.name}`}>
                  <Icon name="trash" />
                </button>
              </div>
            </header>
            <div className="flex flex-col gap-0.5 px-2.5 pt-2.5 pb-3">
              {p.roles.map((role, i) => (
                <div key={role} className="flex items-center gap-3 rounded-[10px] p-2">
                  <span className="flex w-[92px] shrink-0 flex-col gap-0.5">
                    <span className={`flex items-center gap-1.5 text-[13px] font-bold ${i === 0 ? 'text-text' : 'text-soft'}`}>
                      <RoleIcon role={role} />
                      {roleLabel(role)}
                    </span>
                    <span className="font-mono text-[11px] text-muted">#{i + 1}</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.champions[role] ?? []).map((id) => (
                      <ChampionIcon key={id} id={id} size={40} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <PlayerForm
          player={editing === 'new' ? null : editing}
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

function PlayerForm({ player, onClose, onSaved }) {
  const [name, setName] = useState(player?.name ?? '')
  const [roles, setRoles] = useState(player?.roles ?? [])
  const [champions, setChampions] = useState(player?.champions ?? {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // L'ordre de sélection définit la priorité : le premier rôle cliqué est le main.
  const toggleRole = (key) =>
    setRoles((rs) => (rs.includes(key) ? rs.filter((r) => r !== key) : [...rs, key]))

  const addChamp = (role, id) =>
    setChampions((c) => ({ ...c, [role]: [...(c[role] ?? []), id] }))

  const removeChamp = (role, id) =>
    setChampions((c) => ({ ...c, [role]: c[role].filter((x) => x !== id) }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    // On ne garde que les pools des rôles encore sélectionnés.
    const pools = Object.fromEntries(roles.map((r) => [r, champions[r] ?? []]))
    const row = { name: name.trim(), roles, champions: pools }
    const { error } = player
      ? await supabase.from('players').update(row).eq('id', player.id)
      : await supabase.from('players').insert(row)
    setSaving(false)
    if (error) setError(error.message)
    else onSaved()
  }

  return (
    <Modal eyebrow="Joueur" title={player ? `Modifier ${player.name}` : 'Nouveau joueur'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="grid gap-5 px-6 py-5">
          <label className="grid gap-2">
            <span className="label">Pseudo</span>
            <input className="field text-[15px]" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>

          <div className="grid gap-2">
            <span className="label">Rôles (dans l'ordre de préférence)</span>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const index = roles.indexOf(r.key)
                const active = index >= 0
                return (
                  <button type="button" key={r.key} aria-pressed={active} className={pillClass(active)} onClick={() => toggleRole(r.key)}>
                    {active ? (
                      <span className="grid size-[18px] place-items-center rounded-full bg-accent font-mono text-[11px] font-bold text-bg">
                        {index + 1}
                      </span>
                    ) : (
                      <RoleIcon role={r.key} />
                    )}
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {roles.map((role) => (
            <div key={role} className="grid gap-2.5 rounded-xl border border-line bg-panel p-4">
              <span className="flex items-center gap-2 font-bold">
                <RoleIcon role={role} size={16} className="text-accent-light" />
                Champions {roleLabel(role)}
              </span>
              {champions[role]?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {champions[role].map((id) => (
                    <ChampionIcon key={id} id={id} size={40} title="Cliquer pour retirer" onClick={() => removeChamp(role, id)} />
                  ))}
                </div>
              )}
              <ChampionSearch onPick={(id) => addChamp(role, id)} exclude={champions[role] ?? []} />
            </div>
          ))}
        </div>

        <ModalFooter error={error} onCancel={onClose} saving={saving} disabled={!name.trim() || roles.length === 0} />
      </form>
    </Modal>
  )
}
