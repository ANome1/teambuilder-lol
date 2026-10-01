import { useEffect, useState } from 'react'

// Data Dragon : CDN public de Riot, pas besoin de clé API.
const DDRAGON = 'https://ddragon.leagueoflegends.com'

let cache = null

function fetchChampions() {
  if (!cache) {
    cache = (async () => {
      const versions = await fetch(`${DDRAGON}/api/versions.json`).then((r) => r.json())
      const version = versions[0]
      const json = await fetch(`${DDRAGON}/cdn/${version}/data/fr_FR/champion.json`).then((r) => r.json())
      const list = Object.values(json.data)
        .map((c) => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      const byId = Object.fromEntries(list.map((c) => [c.id, c]))
      return { version, list, byId }
    })()
    cache.catch(() => (cache = null))
  }
  return cache
}

export function useChampions() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchChampions().then(setData, (e) => setError(e.message))
  }, [])

  return { data, error }
}

export function championIcon(version, id) {
  return `${DDRAGON}/cdn/${version}/img/champion/${id}.png`
}
