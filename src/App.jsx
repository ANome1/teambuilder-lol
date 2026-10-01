import { useState } from 'react'
import { isConfigured, useTable } from './lib/supabase'
import { useChampions } from './lib/champions'
import { ChampionsContext } from './components/Champion'
import Players from './components/Players'
import Comps from './components/Comps'

const Title = () => <h1 className="text-2xl font-semibold tracking-wider text-gold uppercase">Teambuilder LoL</h1>

export default function App() {
  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Title />
        <p className="mt-4 text-danger">
          Supabase n'est pas configuré : copie <code>.env.example</code> en <code>.env</code> et remplis les clés (voir le README).
        </p>
      </main>
    )
  }
  return <Teambuilder />
}

function Teambuilder() {
  const [tab, setTab] = useState('comps')
  const champions = useChampions()
  const players = useTable('players')
  const comps = useTable('comps')

  const error =
    (champions.error && `champions (Data Dragon) : ${champions.error}`) ||
    (players.error && `Supabase (players) : ${players.error}`) ||
    (comps.error && `Supabase (comps) : ${comps.error}`)
  const loading = !champions.data || players.loading || comps.loading

  const tabClass = (key) =>
    `rounded border px-3.5 py-2 ${tab === key ? 'border-gold bg-surface-2 text-gold-light' : 'border-line text-muted hover:text-gold-light'}`

  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-16">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <Title />
        <nav className="flex gap-1">
          <button className={tabClass('comps')} onClick={() => setTab('comps')}>Compos</button>
          <button className={tabClass('players')} onClick={() => setTab('players')}>Joueurs</button>
        </nav>
      </header>

      {error ? (
        <p className="text-danger">Erreur : {error}</p>
      ) : loading ? (
        <p className="text-muted">Chargement…</p>
      ) : (
        <ChampionsContext.Provider value={champions.data}>
          {tab === 'comps' ? (
            <Comps comps={comps.rows} players={players.rows} reload={comps.reload} />
          ) : (
            <Players players={players.rows} reload={players.reload} />
          )}
        </ChampionsContext.Provider>
      )}
    </main>
  )
}
