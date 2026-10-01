import { createContext, useContext, useMemo, useState } from 'react'
import { championIcon } from '../lib/champions'

export const ChampionsContext = createContext(null)
export const useChamps = () => useContext(ChampionsContext)

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

export function ChampionIcon({ id, size = 40, onClick, title }) {
  const { version, byId } = useChamps()
  const champ = byId[id]
  if (!champ) return null
  const img = (
    <img
      className="block rounded border border-gold"
      src={championIcon(version, id)}
      alt={champ.name}
      title={title ?? champ.name}
      width={size}
      height={size}
      loading="lazy"
    />
  )
  return onClick ? (
    <button type="button" className="rounded hover:brightness-125 [&>img]:hover:border-hextech" onClick={onClick}>
      {img}
    </button>
  ) : (
    img
  )
}

// Recherche de champion. `suggestions` s'affichent quand le champ de recherche est vide.
export function ChampionSearch({ onPick, exclude = [], suggestions = [], placeholder = 'Ajouter un champion…' }) {
  const { list } = useChamps()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = normalize(query)
    if (!q) return suggestions.filter((id) => !exclude.includes(id))
    return list
      .filter((c) => !exclude.includes(c.id) && normalize(c.name).includes(q))
      .slice(0, 24)
      .map((c) => c.id)
  }, [query, list, exclude, suggestions])

  const pick = (id) => {
    onPick(id)
    setQuery('')
  }

  return (
    <div className="grid gap-2">
      <input
        className="field"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) {
            e.preventDefault()
            pick(results[0])
          }
        }}
        placeholder={placeholder}
      />
      {results.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {results.map((id) => (
            <ChampionIcon key={id} id={id} size={36} onClick={() => pick(id)} />
          ))}
        </div>
      )}
    </div>
  )
}
