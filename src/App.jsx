import { useState } from 'react'
import { isConfigured, useTable } from './lib/supabase'
import { patchOf, useChampions } from './lib/champions'
import { SOLOQ } from './lib/meta'
import { ChampionsContext } from './components/Champion'
import { Icon } from './components/Icon'
import Players from './components/Players'
import Comps from './components/Comps'

const Logo = () => (
  <span className="flex items-center gap-2.5">
    <span className="grid size-[30px] place-items-center rounded-lg bg-accent text-bg">
      <Icon name="logo" strokeWidth={2.4} />
    </span>
    <span className="text-[15px] font-extrabold tracking-[0.06em]">TEAMBUILDER</span>
  </span>
)

export default function App() {
  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-[1240px] px-6 py-10">
        <Logo />
        <p className="mt-6 text-danger">
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
    `rounded-lg px-3.5 py-2 ${tab === key ? 'bg-surface-2 font-semibold text-white' : 'font-medium text-soft hover:text-text'}`
  const patch = champions.data && patchOf(champions.data.version)
  // Juste après un nouveau patch, la méta soloQ a un temps de retard jusqu'à la prochaine mise à jour automatique.
  const staleMeta = patch && SOLOQ && SOLOQ.patch !== patch

  return (
    <>
      <header className="border-b border-line bg-header">
        <div className="mx-auto flex min-h-16 max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-4 px-6 py-3">
          <Logo />
          <nav aria-label="Navigation principale" className="flex gap-1">
            <button className={tabClass('comps')} aria-current={tab === 'comps' ? 'page' : undefined} onClick={() => setTab('comps')}>
              Compos
            </button>
            <button className={tabClass('players')} aria-current={tab === 'players' ? 'page' : undefined} onClick={() => setTab('players')}>
              Joueurs
            </button>
          </nav>
          <span className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] whitespace-nowrap text-soft">
            {patch && (
              <span title={staleMeta ? `La méta soloQ date du patch ${SOLOQ.patch} : elle sera mise à jour à la prochaine passe automatique.` : undefined}>
                Patch <span className="font-mono text-text">{patch}</span>
                {staleMeta && <span className="text-warn"> · méta du {SOLOQ.patch}</span>}
              </span>
            )}
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-live" />
              Synchro en direct
            </span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-6 pt-10 pb-20">
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
    </>
  )
}
