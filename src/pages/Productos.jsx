

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState("")

  // 👉 Cargar productos
  const fetchProductos = async () => {
    let query = supabase.from("productos").select("*").order("nombre", { ascending: true })
    if (busqueda) {
      query = query.ilike("codigo_barra", `%${busqueda}%`).or(`nombre.ilike.%${busqueda}%`)
    }
    const { data, error } = await query
    if (error) console.error(error)
    else setProductos(data)
  }

  useEffect(() => {
    fetchProductos()
  }, [busqueda])

  // 👉 Hook para escuchar escaneos desde móvil y colocarlos en búsqueda
  useEffect(() => {
    const channel = supabase
      .channel("realtime:escaneos_productos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "escaneos" },
        async (payload) => {
          const code = payload.new.codigo_barra
          setBusqueda(code) // coloca el código en el input de búsqueda
          await supabase.from("escaneos").delete().eq("id", payload.new.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📦 Productos</h1>

      <input
        type="text"
        placeholder="Buscar por código o nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border px-4 py-2 rounded w-full max-w-md"
      />

      <div className="overflow-x-auto w-full max-w-6xl shadow rounded bg-white mx-auto">
        <table className="w-full border-collapse text-center">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Precio Unit.</th>
              <th className="px-3 py-2">Precio Caja</th>
              <th className="px-3 py-2">Factor Caja</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="px-3 py-2">{p.codigo_barra}</td>
                <td className="px-3 py-2">{p.nombre}</td>
                <td className="px-3 py-2">${Number(p.precio_unit).toFixed(2)}</td>
                <td className="px-3 py-2">${Number(p.precio_caja).toFixed(2)}</td>
                <td className="px-3 py-2">{p.factor_caja}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


