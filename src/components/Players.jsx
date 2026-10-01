import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES, roleLabel } from '../lib/roles'
import { ChampionIcon, ChampionSearch } from './Champion'
import Modal from './Modal'

export default function Players({ players, reload }) {
  const [editing, setEditing] = useState(null) // null | 'new' | player

  const remove = async (player) => {
    if (!confirm(`Supprimer ${player.name} ?`)) return
    await supabase.from('players').delete().eq('id', player.id)
    reload()
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gold-light">Joueurs ({players.length})</h2>
        <button className="btn" onClick={() => setEditing('new')}>+ Ajouter un joueur</button>
      </div>

      {players.length === 0 && <p className="text-muted">Aucun joueur. Ajoute-toi en premier !</p>}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {players.map((p) => (
          <article key={p.id} className="card">
            <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-gold-light">{p.name}</h3>
              <div className="flex gap-0.5">
                <button className="btn-ghost" onClick={() => setEditing(p)}>Modifier</button>
                <button className="btn-ghost hover:text-danger" onClick={() => remove(p)}>Supprimer</button>
              </div>
            </header>
            {p.roles.map((role, i) => (
              <div key={role} className="mt-2 flex items-center gap-2.5">
                <span className={`role-label w-16 shrink-0 ${i === 0 ? 'text-gold' : 'text-muted'}`}>{roleLabel(role)}</span>
                <div className="flex flex-wrap gap-1">
                  {(p.champions[role] ?? []).map((id) => (
                    <ChampionIcon key={id} id={id} size={32} />
                  ))}
                </div>
              </div>
            ))}
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
    <Modal title={player ? `Modifier ${player.name}` : 'Nouveau joueur'} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <label className="label">
          Pseudo
          <input className="field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>

        <div>
          <span className="label">Rôles (dans l'ordre de préférence)</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ROLES.map((r) => {
              const index = roles.indexOf(r.key)
              const active = index >= 0
              return (
                <button
                  type="button"
                  key={r.key}
                  className={`flex items-center gap-1.5 rounded border px-3.5 py-2 ${
                    active ? 'border-gold bg-surface-2 text-gold-light' : 'border-line text-muted hover:text-gold-light'
                  }`}
                  onClick={() => toggleRole(r.key)}
                >
                  {active && (
                    <span className="grid size-[18px] place-items-center rounded-full bg-gold text-[0.7rem] font-bold text-bg">
                      {index + 1}
                    </span>
                  )}
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        {roles.map((role) => (
          <div key={role} className="grid gap-2">
            <span className="label">Champions {roleLabel(role)}</span>
            {champions[role]?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {champions[role].map((id) => (
                  <ChampionIcon key={id} id={id} size={36} title="Cliquer pour retirer" onClick={() => removeChamp(role, id)} />
                ))}
              </div>
            )}
            <ChampionSearch onPick={(id) => addChamp(role, id)} exclude={champions[role] ?? []} />
          </div>
        ))}

        {error && <p className="text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn" disabled={saving || !name.trim() || roles.length === 0}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
