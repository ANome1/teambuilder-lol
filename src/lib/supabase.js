import { createClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)
export const supabase = isConfigured ? createClient(url, key) : null

// Charge une table et la garde à jour en temps réel.
export function useTable(table) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('*').order('created_at')
    if (error) setError(error.message)
    else {
      setRows(data)
      setError(null)
    }
    setLoading(false)
  }, [table])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`realtime-${table}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, load])

  return { rows, loading, error, reload: load }
}
