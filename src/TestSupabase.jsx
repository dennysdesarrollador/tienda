
// web/src/TestSupabase.jsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function TestSupabase() {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('auth.users')  // 👈 usa una tabla que tengas (ej: productos, profiles, etc.)
        .select('*')
        .limit(5)

      if (error) {
        setError(error.message)
      } else {
        setData(data)
      }
    }

    loadData()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Prueba de Supabase</h1>
      {error && <p style={{ color: 'red' }}>❌ Error: {error}</p>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
